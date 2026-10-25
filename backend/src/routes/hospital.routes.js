import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken, requireStaffOrAdmin } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();
router.use(authenticateToken);

// List hospitals
router.get('/', (req, res) => {
  const sql = `
    SELECT h.*,
      (SELECT COUNT(*) FROM blood_requests r WHERE r.hospital_id = h.hospital_id) as total_requests,
      (SELECT COUNT(*) FROM blood_requests r WHERE r.hospital_id = h.hospital_id AND r.status IN ('Pending', 'Partially Fulfilled')) as pending_requests
    FROM hospitals h
    ORDER BY h.name ASC
  `;
  const hospitals = db.query(sql);
  res.json({ hospitals });
});

// Add new hospital
router.post('/', requireStaffOrAdmin, (req, res) => {
  const { name, contact_person, phone, email, address } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Hospital name and phone number are required.' });
  }

  const result = db.run(
    'INSERT INTO hospitals (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), contact_person ? contact_person.trim() : null, phone.trim(), email ? email.trim() : null, address || null]
  );

  const newId = result.lastInsertRowid;
  logAudit(req.user.user_id, 'HOSPITAL_CREATE', 'Hospital', newId, `Added hospital ${name}`);

  const created = db.get('SELECT * FROM hospitals WHERE hospital_id = ?', [newId]);
  res.status(201).json({ message: 'Hospital registered successfully.', hospital: created });
});

// Update hospital
router.put('/:id', requireStaffOrAdmin, (req, res) => {
  const { name, contact_person, phone, email, address } = req.body;
  const hospitalId = req.params.id;

  const hospital = db.get('SELECT * FROM hospitals WHERE hospital_id = ?', [hospitalId]);
  if (!hospital) {
    return res.status(404).json({ error: 'Hospital not found.' });
  }

  db.run(
    `UPDATE hospitals SET
       name = COALESCE(?, name),
       contact_person = COALESCE(?, contact_person),
       phone = COALESCE(?, phone),
       email = COALESCE(?, email),
       address = COALESCE(?, address)
     WHERE hospital_id = ?`,
    [
      name ? name.trim() : null,
      contact_person !== undefined ? contact_person : null,
      phone ? phone.trim() : null,
      email !== undefined ? email : null,
      address !== undefined ? address : null,
      hospitalId
    ]
  );

  logAudit(req.user.user_id, 'HOSPITAL_UPDATE', 'Hospital', hospitalId, `Updated hospital ${name || hospital.name}`);

  const updated = db.get('SELECT * FROM hospitals WHERE hospital_id = ?', [hospitalId]);
  res.json({ message: 'Hospital details updated.', hospital: updated });
});

// Request history for hospital
router.get('/:id/history', (req, res) => {
  const hospitalId = req.params.id;
  const hospital = db.get('SELECT * FROM hospitals WHERE hospital_id = ?', [hospitalId]);
  if (!hospital) {
    return res.status(404).json({ error: 'Hospital not found.' });
  }

  const requests = db.query(
    `SELECT r.*,
            (SELECT COUNT(*) FROM request_allocations a WHERE a.request_id = r.request_id) as allocated_count
     FROM blood_requests r
     WHERE r.hospital_id = ?
     ORDER BY r.created_at DESC`,
    [hospitalId]
  );

  res.json({ hospital, requests });
});

export default router;
