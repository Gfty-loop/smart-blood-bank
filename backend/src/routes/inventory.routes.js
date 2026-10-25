import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken, requireStaffOrAdmin } from '../middleware/auth.js';
import { runExpiryAndStockChecks } from '../services/alertService.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();
router.use(authenticateToken);

// List inventory units with filters and expiry analysis
router.get('/', (req, res) => {
  const { blood_group, component_type, status, search, expiring_within_days } = req.query;
  const today = new Date().toISOString().split('T')[0];

  let sql = `
    SELECT u.*, d.donor_id, dn.name as donor_name, dn.phone as donor_phone,
           dis.name as discarded_by_name
    FROM blood_units u
    LEFT JOIN donations d ON u.donation_id = d.donation_id
    LEFT JOIN donors dn ON d.donor_id = dn.donor_id
    LEFT JOIN users dis ON u.discarded_by = dis.user_id
    WHERE 1=1
  `;
  const params = [];

  if (blood_group) {
    sql += ' AND u.blood_group = ?';
    params.push(blood_group);
  }

  if (component_type) {
    sql += ' AND u.component_type = ?';
    params.push(component_type);
  }

  if (status) {
    sql += ' AND u.status = ?';
    params.push(status);
  }

  if (search) {
    sql += ' AND (u.unit_id LIKE ? OR dn.name LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  if (expiring_within_days) {
    const days = parseInt(expiring_within_days, 10);
    const targetDateObj = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const targetDate = targetDateObj.toISOString().split('T')[0];
    sql += " AND u.status = 'Available' AND u.expires_on <= ? AND u.expires_on >= ?";
    params.push(targetDate, today);
  }

  sql += ' ORDER BY u.expires_on ASC, u.created_at DESC';

  const rows = db.query(sql, params);
  const todayDate = new Date(today);

  // Annotate with days until expiry
  const units = rows.map(u => {
    const expDate = new Date(u.expires_on);
    const daysRemaining = Math.ceil((expDate - todayDate) / (1000 * 60 * 60 * 24));
    return {
      ...u,
      days_until_expiry: daysRemaining,
      is_expired: daysRemaining < 0,
      is_expiring_soon: daysRemaining >= 0 && daysRemaining <= 5
    };
  });

  res.json({ units });
});

// Live stock summary by blood group & component
router.get('/summary', (req, res) => {
  const bloodGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
  const components = ['Whole Blood', 'Red Blood Cells', 'Platelets', 'Plasma'];
  const today = new Date().toISOString().split('T')[0];

  // Stock by Blood Group (Available only)
  const groupStock = {};
  for (const bg of bloodGroups) {
    const row = db.get(
      "SELECT COUNT(*) as count FROM blood_units WHERE blood_group = ? AND status = 'Available' AND expires_on >= ?",
      [bg, today]
    );
    groupStock[bg] = row ? row.count : 0;
  }

  // Stock by Component (Available only)
  const componentStock = {};
  for (const comp of components) {
    const row = db.get(
      "SELECT COUNT(*) as count FROM blood_units WHERE component_type = ? AND status = 'Available' AND expires_on >= ?",
      [comp, today]
    );
    componentStock[comp] = row ? row.count : 0;
  }

  // Counts by Status
  const statusCounts = db.query('SELECT status, COUNT(*) as count FROM blood_units GROUP BY status');
  const statusMap = {};
  statusCounts.forEach(s => {
    statusMap[s.status] = s.count;
  });

  // Expiring within 5 days
  const fiveDaysDateObj = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const fiveDaysDate = fiveDaysDateObj.toISOString().split('T')[0];
  const expiringSoonRow = db.get(
    "SELECT COUNT(*) as count FROM blood_units WHERE status = 'Available' AND expires_on >= ? AND expires_on <= ?",
    [today, fiveDaysDate]
  );

  res.json({
    groupStock,
    componentStock,
    statusCounts: statusMap,
    totalAvailable: Object.values(groupStock).reduce((a, b) => a + b, 0),
    expiringSoonCount: expiringSoonRow ? expiringSoonRow.count : 0
  });
});

// Manually discard a unit with reason
router.post('/:unit_id/discard', requireStaffOrAdmin, (req, res) => {
  const { unit_id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'A clear discard reason must be documented.' });
  }

  const unit = db.get('SELECT * FROM blood_units WHERE unit_id = ?', [unit_id]);
  if (!unit) {
    return res.status(404).json({ error: 'Blood unit not found.' });
  }

  if (unit.status === 'Issued') {
    return res.status(400).json({ error: 'Cannot discard an already issued unit.' });
  }

  const now = new Date().toISOString();
  db.run(
    `UPDATE blood_units
     SET status = 'Discarded',
         discard_reason = ?,
         discarded_at = ?,
         discarded_by = ?
     WHERE unit_id = ?`,
    [reason.trim(), now, req.user.user_id, unit_id]
  );

  logAudit(
    req.user.user_id,
    'UNIT_DISCARD',
    'BloodUnit',
    unit_id,
    `Discarded unit ${unit_id} (${unit.blood_group} ${unit.component_type}). Reason: ${reason}`
  );

  runExpiryAndStockChecks();
  res.json({ message: `Unit ${unit_id} has been recorded as Discarded.` });
});

// Release a unit from Quarantine to Available
router.put('/:unit_id/release-quarantine', requireStaffOrAdmin, (req, res) => {
  const { unit_id } = req.params;
  const unit = db.get('SELECT * FROM blood_units WHERE unit_id = ?', [unit_id]);

  if (!unit) {
    return res.status(404).json({ error: 'Blood unit not found.' });
  }

  if (unit.status !== 'Quarantine') {
    return res.status(400).json({ error: 'Only units in Quarantine status can be released.' });
  }

  db.run("UPDATE blood_units SET status = 'Available' WHERE unit_id = ?", [unit_id]);

  logAudit(
    req.user.user_id,
    'QUARANTINE_RELEASE',
    'BloodUnit',
    unit_id,
    `Tested and approved unit ${unit_id} (${unit.blood_group} ${unit.component_type}). Status set to Available.`
  );

  runExpiryAndStockChecks();
  res.json({ message: `Unit ${unit_id} cleared from quarantine and marked Available.` });
});

export default router;
