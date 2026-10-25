import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { runExpiryAndStockChecks } from '../services/alertService.js';

const router = express.Router();
router.use(authenticateToken);

// Get all alerts (sorted unread first, then newest)
router.get('/', (req, res) => {
  const { type, is_read } = req.query;

  let sql = 'SELECT * FROM alerts WHERE 1=1';
  const params = [];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  if (is_read !== undefined) {
    sql += ' AND is_read = ?';
    params.push(parseInt(is_read, 10));
  }

  sql += ' ORDER BY is_read ASC, created_at DESC LIMIT 100';

  const alerts = db.query(sql, params);
  const unreadCountRow = db.get('SELECT COUNT(*) as count FROM alerts WHERE is_read = 0');

  res.json({
    alerts,
    unread_count: unreadCountRow ? unreadCountRow.count : 0
  });
});

// Mark single alert as read
router.put('/:id/read', (req, res) => {
  db.run('UPDATE alerts SET is_read = 1 WHERE alert_id = ?', [req.params.id]);
  res.json({ message: 'Alert marked as read.' });
});

// Mark all alerts as read
router.put('/mark-all-read', (req, res) => {
  db.run('UPDATE alerts SET is_read = 1 WHERE is_read = 0');
  res.json({ message: 'All alerts marked as read.' });
});

// Manually trigger expiry and low-stock checks
router.post('/trigger-check', (req, res) => {
  const result = runExpiryAndStockChecks();
  res.json({
    message: 'System inventory and alert scan completed.',
    result
  });
});

export default router;
