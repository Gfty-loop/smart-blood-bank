import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken, requireStaffOrAdmin } from '../middleware/auth.js';
import { findCompatibleUnits } from '../services/compatibilityService.js';
import { runExpiryAndStockChecks } from '../services/alertService.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();
router.use(authenticateToken);

// List requests with prioritisation (Emergency > Urgent > Normal)
router.get('/', (req, res) => {
  const { status, urgency, hospital_id } = req.query;

  let sql = `
    SELECT r.*, h.name as hospital_name, h.phone as hospital_phone,
           u.name as created_by_name,
           (SELECT COUNT(*) FROM request_allocations a WHERE a.request_id = r.request_id) as allocated_count
    FROM blood_requests r
    JOIN hospitals h ON r.hospital_id = h.hospital_id
    JOIN users u ON r.created_by = u.user_id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }

  if (urgency) {
    sql += ' AND r.urgency = ?';
    params.push(urgency);
  }

  if (hospital_id) {
    sql += ' AND r.hospital_id = ?';
    params.push(hospital_id);
  }

  // Priority ordering: Emergency (1), Urgent (2), Normal (3), then by required_by date ASC
  sql += `
    ORDER BY 
      CASE r.urgency 
        WHEN 'Emergency' THEN 1 
        WHEN 'Urgent' THEN 2 
        ELSE 3 
      END ASC,
      r.required_by ASC,
      r.created_at DESC
  `;

  const requests = db.query(sql, params);
  res.json({ requests });
});

// Single request detail with allocations and compatible units
router.get('/:id', (req, res) => {
  const requestId = req.params.id;

  const request = db.get(
    `SELECT r.*, h.name as hospital_name, h.phone as hospital_phone, h.contact_person,
            u.name as created_by_name
     FROM blood_requests r
     JOIN hospitals h ON r.hospital_id = h.hospital_id
     JOIN users u ON r.created_by = u.user_id
     WHERE r.request_id = ?`,
    [requestId]
  );

  if (!request) {
    return res.status(404).json({ error: 'Blood request not found.' });
  }

  // Current allocations
  const allocations = db.query(
    `SELECT a.*, bu.blood_group, bu.component_type, bu.expires_on, u.name as issued_by_name
     FROM request_allocations a
     JOIN blood_units bu ON a.unit_id = bu.unit_id
     JOIN users u ON a.issued_by = u.user_id
     WHERE a.request_id = ?`,
    [requestId]
  );

  // Compatible units recommendation
  const remainingNeeded = Math.max(0, request.units_required - allocations.length);
  const compatibility = findCompatibleUnits(request.blood_group, request.component_type, remainingNeeded);

  res.json({
    request: {
      ...request,
      allocated_count: allocations.length,
      remaining_needed: remainingNeeded
    },
    allocations,
    compatibility
  });
});

// Log a new blood request
router.post('/', requireStaffOrAdmin, (req, res) => {
  const {
    hospital_id,
    patient_ref,
    blood_group,
    component_type = 'Red Blood Cells',
    units_required = 1,
    urgency = 'Normal',
    required_by,
    notes
  } = req.body;

  if (!hospital_id || !patient_ref || !blood_group || !units_required || !required_by) {
    return res.status(400).json({ error: 'Hospital, patient reference, blood group, required units, and required-by date are required.' });
  }

  const validUrgencies = ['Normal', 'Urgent', 'Emergency'];
  if (!validUrgencies.includes(urgency)) {
    return res.status(400).json({ error: 'Urgency must be Normal, Urgent, or Emergency.' });
  }

  const result = db.run(
    `INSERT INTO blood_requests (hospital_id, patient_ref, blood_group, component_type, units_required, urgency, required_by, status, created_by, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
    [
      hospital_id,
      patient_ref.trim(),
      blood_group,
      component_type,
      parseInt(units_required, 10),
      urgency,
      required_by,
      req.user.user_id,
      notes || null
    ]
  );

  const newRequestId = result.lastInsertRowid;

  // If Emergency, raise high-priority alert immediately
  if (urgency === 'Emergency') {
    const hosp = db.get('SELECT name FROM hospitals WHERE hospital_id = ?', [hospital_id]);
    const hospName = hosp ? hosp.name : 'Hospital';
    db.run(
      `INSERT INTO alerts (type, message, related_unit_or_group, is_read)
       VALUES (?, ?, ?, 0)`,
      [
        'EMERGENCY_REQUEST',
        `EMERGENCY: ${hospName} requested ${units_required} unit(s) of ${blood_group} ${component_type} for patient ${patient_ref}. Fast dispatch required!`,
        patient_ref
      ]
    );
  }

  logAudit(
    req.user.user_id,
    'REQUEST_CREATE',
    'BloodRequest',
    newRequestId,
    `Logged ${urgency} request for ${units_required} unit(s) of ${blood_group} ${component_type} (Patient: ${patient_ref})`
  );

  res.status(201).json({
    message: 'Blood request registered successfully.',
    request_id: newRequestId
  });
});

// Fulfill request (Issue / Dispatch blood units)
router.post('/:id/fulfill', requireStaffOrAdmin, (req, res) => {
  const requestId = req.params.id;
  const { unit_ids } = req.body;

  if (!unit_ids || !Array.isArray(unit_ids) || unit_ids.length === 0) {
    return res.status(400).json({ error: 'Please select at least one unit to allocate.' });
  }

  const request = db.get('SELECT * FROM blood_requests WHERE request_id = ?', [requestId]);
  if (!request) {
    return res.status(404).json({ error: 'Blood request not found.' });
  }

  if (['Fulfilled', 'Cancelled', 'Rejected'].includes(request.status)) {
    return res.status(400).json({ error: `Cannot fulfill request with status '${request.status}'.` });
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    db.transaction(() => {
      // Validate every unit is Available and not expired
      for (const uId of unit_ids) {
        const unit = db.get('SELECT * FROM blood_units WHERE unit_id = ?', [uId]);
        if (!unit) {
          throw new Error(`Unit ${uId} does not exist in inventory.`);
        }
        if (unit.status !== 'Available') {
          throw new Error(`Unit ${uId} cannot be issued because its status is ${unit.status}.`);
        }
        if (unit.expires_on < today) {
          throw new Error(`Unit ${uId} has expired (${unit.expires_on}) and cannot be issued.`);
        }

        // Mark as Issued
        db.run("UPDATE blood_units SET status = 'Issued' WHERE unit_id = ?", [uId]);

        // Record allocation
        db.run(
          'INSERT INTO request_allocations (request_id, unit_id, issued_by) VALUES (?, ?, ?)',
          [requestId, uId, req.user.user_id]
        );
      }

      // Check total allocations for this request
      const countRow = db.get(
        'SELECT COUNT(*) as count FROM request_allocations WHERE request_id = ?',
        [requestId]
      );
      const totalAllocated = countRow ? countRow.count : 0;

      const newStatus = totalAllocated >= request.units_required ? 'Fulfilled' : 'Partially Fulfilled';
      db.run('UPDATE blood_requests SET status = ? WHERE request_id = ?', [newStatus, requestId]);

      logAudit(
        req.user.user_id,
        'BLOOD_ISSUE',
        'BloodRequest',
        requestId,
        `Issued ${unit_ids.length} unit(s) [${unit_ids.join(', ')}] for Request #${requestId}. Status: ${newStatus}`
      );
    });

    // Check low-stock alerts
    runExpiryAndStockChecks();

    res.json({
      message: `Successfully issued ${unit_ids.length} blood unit(s).`,
      units_issued: unit_ids
    });
  } catch (err) {
    console.error('Error fulfilling blood request:', err);
    res.status(400).json({ error: err.message || 'Failed to issue units.' });
  }
});

// Reject request
router.post('/:id/reject', requireStaffOrAdmin, (req, res) => {
  const requestId = req.params.id;
  const { reason } = req.body;

  const request = db.get('SELECT * FROM blood_requests WHERE request_id = ?', [requestId]);
  if (!request) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  db.run(
    "UPDATE blood_requests SET status = 'Rejected', notes = COALESCE(notes || ' | ', '') || 'Rejection reason: ' || ? WHERE request_id = ?",
    [reason || 'Unfulfillable stock', requestId]
  );

  logAudit(
    req.user.user_id,
    'REQUEST_REJECT',
    'BloodRequest',
    requestId,
    `Rejected request #${requestId}. Reason: ${reason || 'Unfulfillable stock'}`
  );

  res.json({ message: `Request #${requestId} has been marked Rejected.` });
});

export default router;
