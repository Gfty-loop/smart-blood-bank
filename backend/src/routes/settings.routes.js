import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';
import { runExpiryAndStockChecks } from '../services/alertService.js';

const router = express.Router();
router.use(authenticateToken);

// Get system settings
router.get('/', (req, res) => {
  const rows = db.query('SELECT * FROM system_settings');
  const settingsObj = {};
  rows.forEach(r => {
    settingsObj[r.setting_key] = r.setting_value;
  });
  res.json({ settings: settingsObj, details: rows });
});

// Update system settings (Admin only)
router.put('/', requireAdmin, (req, res) => {
  const settings = req.body; // e.g. { low_stock_threshold: '6', min_donation_gap_days: '90' }

  for (const [key, val] of Object.entries(settings)) {
    db.run(
      'UPDATE system_settings SET setting_value = ? WHERE setting_key = ?',
      [String(val), key]
    );
  }

  logAudit(req.user.user_id, 'SETTINGS_UPDATE', 'SystemSettings', 'CONFIG', JSON.stringify(settings));

  // Trigger alert check with new thresholds
  runExpiryAndStockChecks();

  res.json({ message: 'System settings and thresholds updated successfully.' });
});

// List users (Admin only)
router.get('/users', requireAdmin, (req, res) => {
  const users = db.query('SELECT user_id, name, email, role, is_active, created_at FROM users ORDER BY created_at ASC');
  res.json({ users });
});

// Create new user (Admin only)
router.post('/users', requireAdmin, (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }

  const existing = db.get('SELECT user_id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (existing) {
    return res.status(400).json({ error: 'A user with this email address already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  const result = db.run(
    'INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)',
    [name.trim(), email.trim().toLowerCase(), hash, role]
  );

  logAudit(req.user.user_id, 'USER_CREATE', 'User', result.lastInsertRowid, `Created ${role} account for ${email}`);

  res.status(201).json({ message: 'User account created successfully.' });
});

// Toggle user active status (Admin only)
router.put('/users/:id/toggle', requireAdmin, (req, res) => {
  const targetId = req.params.id;

  if (parseInt(targetId, 10) === req.user.user_id) {
    return res.status(400).json({ error: 'You cannot deactivate your own administrative account.' });
  }

  const user = db.get('SELECT * FROM users WHERE user_id = ?', [targetId]);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const newStatus = user.is_active ? 0 : 1;
  db.run('UPDATE users SET is_active = ? WHERE user_id = ?', [newStatus, targetId]);

  logAudit(
    req.user.user_id,
    'USER_TOGGLE_STATUS',
    'User',
    targetId,
    `Set user ${user.email} active status to ${newStatus}`
  );

  res.json({ message: `User status changed to ${newStatus === 1 ? 'Active' : 'Inactive'}.` });
});

// View audit logs (Admin only)
router.get('/audit-logs', requireAdmin, (req, res) => {
  const { action, entity, limit = 100 } = req.query;

  let sql = `
    SELECT l.*, u.name as user_name, u.email as user_email
    FROM audit_log l
    LEFT JOIN users u ON l.user_id = u.user_id
    WHERE 1=1
  `;
  const params = [];

  if (action) {
    sql += ' AND l.action = ?';
    params.push(action);
  }

  if (entity) {
    sql += ' AND l.entity = ?';
    params.push(entity);
  }

  sql += ' ORDER BY l.timestamp DESC LIMIT ?';
  params.push(parseInt(limit, 10));

  const logs = db.query(sql, params);
  res.json({ logs });
});

export default router;
