import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Helper to convert array of objects into CSV string
function convertToCSV(data, headers) {
  if (!data || data.length === 0) {
    return headers.join(',') + '\n';
  }

  const lines = [];
  lines.push(headers.map(h => `"${h}"`).join(','));

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

// 1. Donations Report
router.get('/donations', (req, res) => {
  const { start_date, end_date, format } = req.query;

  let sql = `
    SELECT d.donation_id, d.donation_date, dn.name as donor_name, dn.blood_group,
           d.component_type, d.volume_ml, d.hemoglobin, d.bp, d.test_status,
           u.name as staff_name, bu.unit_id
    FROM donations d
    JOIN donors dn ON d.donor_id = dn.donor_id
    JOIN users u ON d.staff_id = u.user_id
    LEFT JOIN blood_units bu ON d.donation_id = bu.donation_id
    WHERE 1=1
  `;
  const params = [];

  if (start_date) {
    sql += ' AND d.donation_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND d.donation_date <= ?';
    params.push(end_date);
  }

  sql += ' ORDER BY d.donation_date DESC';
  const rows = db.query(sql, params);

  if (format === 'csv') {
    const headers = ['donation_id', 'donation_date', 'donor_name', 'blood_group', 'component_type', 'volume_ml', 'hemoglobin', 'bp', 'test_status', 'staff_name', 'unit_id'];
    const csv = convertToCSV(rows, headers);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="donations_report.csv"');
    return res.send(csv);
  }

  res.json({ data: rows });
});

// 2. Stock Snapshot Report
router.get('/inventory', (req, res) => {
  const { format } = req.query;

  const sql = `
    SELECT unit_id, blood_group, component_type, collected_on, expires_on, status, discard_reason
    FROM blood_units
    ORDER BY blood_group ASC, expires_on ASC
  `;
  const rows = db.query(sql);

  if (format === 'csv') {
    const headers = ['unit_id', 'blood_group', 'component_type', 'collected_on', 'expires_on', 'status', 'discard_reason'];
    const csv = convertToCSV(rows, headers);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory_snapshot_report.csv"');
    return res.send(csv);
  }

  res.json({ data: rows });
});

// 3. Issues by Hospital Report
router.get('/issues', (req, res) => {
  const { hospital_id, start_date, end_date, format } = req.query;

  let sql = `
    SELECT a.allocation_id, a.issued_at, h.name as hospital_name, r.patient_ref,
           r.blood_group as requested_group, bu.unit_id, bu.blood_group as unit_group,
           bu.component_type, u.name as issued_by_name
    FROM request_allocations a
    JOIN blood_requests r ON a.request_id = r.request_id
    JOIN hospitals h ON r.hospital_id = h.hospital_id
    JOIN blood_units bu ON a.unit_id = bu.unit_id
    JOIN users u ON a.issued_by = u.user_id
    WHERE 1=1
  `;
  const params = [];

  if (hospital_id) {
    sql += ' AND h.hospital_id = ?';
    params.push(hospital_id);
  }
  if (start_date) {
    sql += ' AND a.issued_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND a.issued_at <= ?';
    params.push(end_date);
  }

  sql += ' ORDER BY a.issued_at DESC';
  const rows = db.query(sql, params);

  if (format === 'csv') {
    const headers = ['allocation_id', 'issued_at', 'hospital_name', 'patient_ref', 'requested_group', 'unit_id', 'unit_group', 'component_type', 'issued_by_name'];
    const csv = convertToCSV(rows, headers);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="blood_issues_report.csv"');
    return res.send(csv);
  }

  res.json({ data: rows });
});

// 4. Expired and Discarded Units Report
router.get('/discards', (req, res) => {
  const { format } = req.query;

  const sql = `
    SELECT u.unit_id, u.blood_group, u.component_type, u.collected_on, u.expires_on,
           u.status, u.discard_reason, u.discarded_at, dis.name as discarded_by_name
    FROM blood_units u
    LEFT JOIN users dis ON u.discarded_by = dis.user_id
    WHERE u.status IN ('Expired', 'Discarded')
    ORDER BY u.expires_on DESC
  `;
  const rows = db.query(sql);

  if (format === 'csv') {
    const headers = ['unit_id', 'blood_group', 'component_type', 'collected_on', 'expires_on', 'status', 'discard_reason', 'discarded_at', 'discarded_by_name'];
    const csv = convertToCSV(rows, headers);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expired_discarded_units_report.csv"');
    return res.send(csv);
  }

  res.json({ data: rows });
});

export default router;
