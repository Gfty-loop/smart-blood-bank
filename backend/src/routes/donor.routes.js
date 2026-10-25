import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken, requireStaffOrAdmin } from '../middleware/auth.js';
import { checkEligibility } from '../services/eligibilityService.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();

router.use(authenticateToken);

// List donors with search and filtering
router.get('/', (req, res) => {
  const { search, blood_group, is_active } = req.query;

  let sql = 'SELECT * FROM donors WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  if (blood_group) {
    sql += ' AND blood_group = ?';
    params.push(blood_group);
  }

  if (is_active !== undefined) {
    sql += ' AND is_active = ?';
    params.push(parseInt(is_active, 10));
  }

  sql += ' ORDER BY created_at DESC';

  const donors = db.query(sql, params);

  // Annotate each donor with quick eligibility check
  const enhanced = donors.map(d => {
    const el = checkEligibility({
      dob: d.dob,
      weight_kg: d.weight_kg,
      last_donation_date: d.last_donation_date
    });
    return {
      ...d,
      is_eligible: el.is_eligible,
      eligibility_reasons: el.reasons,
      next_eligible_date: el.next_eligible_date,
      age: el.age
    };
  });

  res.json({ donors: enhanced });
});

// Live check eligibility without saving
router.post('/check-eligibility', (req, res) => {
  const result = checkEligibility(req.body);
  res.json(result);
});

// Single donor with donation history and detailed eligibility
router.get('/:id', (req, res) => {
  const donor = db.get('SELECT * FROM donors WHERE donor_id = ?', [req.params.id]);
  if (!donor) {
    return res.status(404).json({ error: 'Donor not found.' });
  }

  const donations = db.query(
    `SELECT d.*, u.name as staff_name, b.unit_id, b.status as unit_status, b.expires_on
     FROM donations d
     LEFT JOIN users u ON d.staff_id = u.user_id
     LEFT JOIN blood_units b ON d.donation_id = b.donation_id
     WHERE d.donor_id = ?
     ORDER BY d.donation_date DESC`,
    [donor.donor_id]
  );

  const eligibility = checkEligibility({
    dob: donor.dob,
    weight_kg: donor.weight_kg,
    last_donation_date: donor.last_donation_date
  });

  res.json({
    donor,
    donations,
    eligibility
  });
});

// Create new donor
router.post('/', requireStaffOrAdmin, (req, res) => {
  const { name, dob, gender, blood_group, phone, email, address, weight_kg } = req.body;

  if (!name || !dob || !gender || !blood_group || !phone || !weight_kg) {
    return res.status(400).json({ error: 'Missing required donor registration fields.' });
  }

  const validGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
  if (!validGroups.includes(blood_group)) {
    return res.status(400).json({ error: `Invalid blood group: ${blood_group}` });
  }

  const result = db.run(
    `INSERT INTO donors (name, dob, gender, blood_group, phone, email, address, weight_kg, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [name.trim(), dob, gender, blood_group, phone.trim(), email ? email.trim() : null, address || null, parseFloat(weight_kg)]
  );

  const newId = result.lastInsertRowid;
  logAudit(req.user.user_id, 'DONOR_CREATE', 'Donor', newId, `Registered donor ${name} (${blood_group})`);

  const createdDonor = db.get('SELECT * FROM donors WHERE donor_id = ?', [newId]);
  const el = checkEligibility({
    dob: createdDonor.dob,
    weight_kg: createdDonor.weight_kg,
    last_donation_date: null
  });

  res.status(201).json({
    message: 'Donor registered successfully.',
    donor: {
      ...createdDonor,
      is_eligible: el.is_eligible,
      eligibility_reasons: el.reasons,
      next_eligible_date: el.next_eligible_date
    }
  });
});

// Update donor
router.put('/:id', requireStaffOrAdmin, (req, res) => {
  const { name, dob, gender, blood_group, phone, email, address, weight_kg, is_active } = req.body;
  const donorId = req.params.id;

  const donor = db.get('SELECT * FROM donors WHERE donor_id = ?', [donorId]);
  if (!donor) {
    return res.status(404).json({ error: 'Donor not found.' });
  }

  db.run(
    `UPDATE donors SET
       name = COALESCE(?, name),
       dob = COALESCE(?, dob),
       gender = COALESCE(?, gender),
       blood_group = COALESCE(?, blood_group),
       phone = COALESCE(?, phone),
       email = COALESCE(?, email),
       address = COALESCE(?, address),
       weight_kg = COALESCE(?, weight_kg),
       is_active = COALESCE(?, is_active)
     WHERE donor_id = ?`,
    [
      name ? name.trim() : null,
      dob || null,
      gender || null,
      blood_group || null,
      phone ? phone.trim() : null,
      email !== undefined ? email : null,
      address !== undefined ? address : null,
      weight_kg ? parseFloat(weight_kg) : null,
      is_active !== undefined ? parseInt(is_active, 10) : null,
      donorId
    ]
  );

  logAudit(req.user.user_id, 'DONOR_UPDATE', 'Donor', donorId, `Updated donor record for ${donor.name}`);

  const updated = db.get('SELECT * FROM donors WHERE donor_id = ?', [donorId]);
  res.json({ message: 'Donor profile updated successfully.', donor: updated });
});

// Deactivate donor
router.delete('/:id', requireStaffOrAdmin, (req, res) => {
  const donorId = req.params.id;
  const donor = db.get('SELECT * FROM donors WHERE donor_id = ?', [donorId]);
  if (!donor) {
    return res.status(404).json({ error: 'Donor not found.' });
  }

  db.run('UPDATE donors SET is_active = 0 WHERE donor_id = ?', [donorId]);
  logAudit(req.user.user_id, 'DONOR_DEACTIVATE', 'Donor', donorId, `Deactivated donor ${donor.name}`);

  res.json({ message: `Donor ${donor.name} marked inactive.` });
});

export default router;
