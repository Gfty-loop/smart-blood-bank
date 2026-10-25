import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken, requireStaffOrAdmin } from '../middleware/auth.js';
import { checkEligibility } from '../services/eligibilityService.js';
import { runExpiryAndStockChecks } from '../services/alertService.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();
router.use(authenticateToken);

// Shelf life mapping in days
function getShelfLifeDays(componentType) {
  const norm = (componentType || '').toLowerCase();
  if (norm.includes('platelet')) return 5;
  if (norm.includes('plasma')) return 365;
  if (norm.includes('red blood') || norm.includes('rbc')) return 42;
  return 42; // default whole blood
}

function getComponentPrefix(componentType) {
  const norm = (componentType || '').toLowerCase();
  if (norm.includes('platelet')) return 'PLT';
  if (norm.includes('plasma')) return 'FFP';
  if (norm.includes('red blood') || norm.includes('rbc')) return 'RBC';
  return 'WB';
}

// List all donations
router.get('/', (req, res) => {
  const { donor_id, test_status, limit } = req.query;

  let sql = `
    SELECT d.*, dn.name as donor_name, dn.blood_group, dn.phone as donor_phone,
           u.name as staff_name, bu.unit_id, bu.status as unit_status, bu.expires_on
    FROM donations d
    JOIN donors dn ON d.donor_id = dn.donor_id
    JOIN users u ON d.staff_id = u.user_id
    LEFT JOIN blood_units bu ON d.donation_id = bu.donation_id
    WHERE 1=1
  `;
  const params = [];

  if (donor_id) {
    sql += ' AND d.donor_id = ?';
    params.push(donor_id);
  }

  if (test_status) {
    sql += ' AND d.test_status = ?';
    params.push(test_status);
  }

  sql += ' ORDER BY d.donation_date DESC, d.created_at DESC';

  if (limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit, 10));
  }

  const donations = db.query(sql, params);
  res.json({ donations });
});

// Record a new donation
router.post('/', requireStaffOrAdmin, (req, res) => {
  const {
    donor_id,
    donation_date = new Date().toISOString().split('T')[0],
    component_type = 'Whole Blood',
    volume_ml = 450,
    hemoglobin,
    bp,
    test_status = 'Passed',
    notes,
    override_eligibility = false
  } = req.body;

  if (!donor_id || !hemoglobin || !bp) {
    return res.status(400).json({ error: 'Donor ID, haemoglobin, and blood pressure are required.' });
  }

  const donor = db.get('SELECT * FROM donors WHERE donor_id = ?', [donor_id]);
  if (!donor) {
    return res.status(404).json({ error: 'Selected donor does not exist.' });
  }

  // Verify eligibility rules unless explicitly acknowledged with override
  const el = checkEligibility({
    dob: donor.dob,
    weight_kg: donor.weight_kg,
    hemoglobin,
    last_donation_date: donor.last_donation_date
  });

  if (!el.is_eligible && !override_eligibility) {
    return res.status(422).json({
      error: 'Donor does not meet strict eligibility requirements.',
      reasons: el.reasons,
      eligibility: el
    });
  }

  // Calculate shelf life & expiry date
  const shelfLife = getShelfLifeDays(component_type);
  const colDate = new Date(donation_date);
  const expDateObj = new Date(colDate.getTime() + shelfLife * 24 * 60 * 60 * 1000);
  const expiresOn = expDateObj.toISOString().split('T')[0];

  // Execute in DB Transaction
  let createdDonationId = null;
  let unitId = null;
  let unitStatus = 'Available';

  if (test_status === 'Pending') {
    unitStatus = 'Quarantine';
  } else if (test_status === 'Failed') {
    unitStatus = 'Discarded';
  }

  try {
    db.transaction(() => {
      // 1. Insert donation record
      const donRes = db.run(
        `INSERT INTO donations (donor_id, staff_id, donation_date, component_type, volume_ml, hemoglobin, bp, test_status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          donor_id,
          req.user.user_id,
          donation_date,
          component_type,
          parseInt(volume_ml, 10),
          parseFloat(hemoglobin),
          bp.trim(),
          test_status,
          notes || null
        ]
      );
      createdDonationId = donRes.lastInsertRowid;

      // 2. Generate Unit ID (Format: PREFIX-YYYYMMDD-ID)
      const dateCompact = donation_date.replace(/-/g, '');
      const prefix = getComponentPrefix(component_type);
      unitId = `${prefix}-${dateCompact}-${String(createdDonationId).padStart(3, '0')}`;

      // 3. Insert unit into blood_units
      db.run(
        `INSERT INTO blood_units (unit_id, donation_id, blood_group, component_type, collected_on, expires_on, status, discard_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          unitId,
          createdDonationId,
          donor.blood_group,
          component_type,
          donation_date,
          expiresOn,
          unitStatus,
          test_status === 'Failed' ? 'Infectious / screening test failed' : null
        ]
      );

      // 4. Update donor's last donation date
      db.run('UPDATE donors SET last_donation_date = ? WHERE donor_id = ?', [donation_date, donor_id]);

      // 5. Audit log
      logAudit(
        req.user.user_id,
        'DONATION_RECORDED',
        'Donation',
        createdDonationId,
        `Recorded ${volume_ml}ml ${component_type} from ${donor.name} (${donor.blood_group}). Unit ${unitId} status: ${unitStatus}`
      );
    });

    // Check alerts in background
    runExpiryAndStockChecks();

    res.status(201).json({
      message: 'Donation recorded and blood unit cataloged.',
      donation_id: createdDonationId,
      unit: {
        unit_id: unitId,
        blood_group: donor.blood_group,
        component_type,
        collected_on: donation_date,
        expires_on: expiresOn,
        status: unitStatus
      }
    });
  } catch (err) {
    console.error('Failed to record donation transaction:', err);
    res.status(500).json({ error: 'Database transaction failed while recording donation.' });
  }
});

// Update test status for quarantine / pending donations
router.put('/:id/test-status', requireStaffOrAdmin, (req, res) => {
  const donationId = req.params.id;
  const { test_status, notes } = req.body;

  if (!['Passed', 'Failed'].includes(test_status)) {
    return res.status(400).json({ error: 'Test status must be Passed or Failed.' });
  }

  const donation = db.get('SELECT * FROM donations WHERE donation_id = ?', [donationId]);
  if (!donation) {
    return res.status(404).json({ error: 'Donation not found.' });
  }

  const newUnitStatus = test_status === 'Passed' ? 'Available' : 'Discarded';

  db.transaction(() => {
    db.run(
      'UPDATE donations SET test_status = ?, notes = COALESCE(?, notes) WHERE donation_id = ?',
      [test_status, notes || null, donationId]
    );

    db.run(
      `UPDATE blood_units
       SET status = ?,
           discard_reason = ?
       WHERE donation_id = ?`,
      [
        newUnitStatus,
        test_status === 'Failed' ? (notes || 'Screening test failed') : null,
        donationId
      ]
    );

    logAudit(
      req.user.user_id,
      'TEST_STATUS_UPDATE',
      'Donation',
      donationId,
      `Updated test status to ${test_status}. Unit status set to ${newUnitStatus}.`
    );
  });

  runExpiryAndStockChecks();
  res.json({ message: `Donation test status updated to ${test_status}. Unit is now ${newUnitStatus}.` });
});

export default router;
