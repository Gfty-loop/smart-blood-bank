import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const bloodGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
  const components = ['Whole Blood', 'Red Blood Cells', 'Platelets', 'Plasma'];

  // 1. Get threshold settings
  const thresholdRow = db.get("SELECT setting_value FROM system_settings WHERE setting_key = 'low_stock_threshold'");
  const lowStockThreshold = thresholdRow ? parseInt(thresholdRow.setting_value, 10) : 5;

  // 2. Stock by Blood Group
  const groupStock = bloodGroups.map(bg => {
    const row = db.get(
      "SELECT COUNT(*) as count FROM blood_units WHERE blood_group = ? AND status = 'Available' AND expires_on >= ?",
      [bg, today]
    );
    const count = row ? row.count : 0;
    return {
      blood_group: bg,
      count,
      is_low_stock: count < lowStockThreshold,
      threshold: lowStockThreshold
    };
  });

  // 3. Stock by Component
  const componentStock = components.map(comp => {
    const row = db.get(
      "SELECT COUNT(*) as count FROM blood_units WHERE component_type = ? AND status = 'Available' AND expires_on >= ?",
      [comp, today]
    );
    return {
      component_type: comp,
      count: row ? row.count : 0
    };
  });

  // 4. Metric Totals
  const totalAvailable = groupStock.reduce((acc, curr) => acc + curr.count, 0);

  // Expiring soon (< 5 days)
  const fiveDaysDateObj = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const fiveDaysDate = fiveDaysDateObj.toISOString().split('T')[0];
  const expiringSoonRow = db.get(
    "SELECT COUNT(*) as count FROM blood_units WHERE status = 'Available' AND expires_on >= ? AND expires_on <= ?",
    [today, fiveDaysDate]
  );
  const expiringSoonCount = expiringSoonRow ? expiringSoonRow.count : 0;

  // Pending requests and Emergency requests
  const pendingRequestsRow = db.get(
    "SELECT COUNT(*) as count FROM blood_requests WHERE status IN ('Pending', 'Partially Fulfilled')"
  );
  const emergencyRequestsRow = db.get(
    "SELECT COUNT(*) as count FROM blood_requests WHERE status IN ('Pending', 'Partially Fulfilled') AND urgency = 'Emergency'"
  );

  // Today's donations
  const todayDonationsRow = db.get(
    "SELECT COUNT(*) as count FROM donations WHERE donation_date = ?",
    [today]
  );

  // Total registered donors
  const totalDonorsRow = db.get("SELECT COUNT(*) as count FROM donors WHERE is_active = 1");

  // 5. 7-Day Trend (Donations and Blood Issued)
  const trendData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const displayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const donCount = db.get("SELECT COUNT(*) as count FROM donations WHERE donation_date = ?", [dateStr]);
    const issueCount = db.get(
      "SELECT COUNT(*) as count FROM request_allocations WHERE substr(issued_at, 1, 10) = ?",
      [dateStr]
    );

    trendData.push({
      date: dateStr,
      label: displayLabel,
      donations: donCount ? donCount.count : 0,
      issues: issueCount ? issueCount.count : 0
    });
  }

  // 6. Active Emergency Requests (for urgent banner)
  const activeEmergencies = db.query(
    `SELECT r.*, h.name as hospital_name, h.phone as hospital_phone
     FROM blood_requests r
     JOIN hospitals h ON r.hospital_id = h.hospital_id
     WHERE r.status IN ('Pending', 'Partially Fulfilled') AND r.urgency = 'Emergency'
     ORDER BY r.required_by ASC`
  );

  // 7. Recent Alerts
  const recentAlerts = db.query(
    "SELECT * FROM alerts WHERE is_read = 0 ORDER BY created_at DESC LIMIT 5"
  );

  // 8. Recent Activity (Recent donations & allocations)
  const recentDonations = db.query(
    `SELECT d.donation_id, d.donation_date, d.component_type, dn.name as donor_name, dn.blood_group
     FROM donations d
     JOIN donors dn ON d.donor_id = dn.donor_id
     ORDER BY d.created_at DESC LIMIT 4`
  );

  const recentIssues = db.query(
    `SELECT a.allocation_id, a.issued_at, bu.blood_group, bu.component_type, h.name as hospital_name, r.patient_ref
     FROM request_allocations a
     JOIN blood_units bu ON a.unit_id = bu.unit_id
     JOIN blood_requests r ON a.request_id = r.request_id
     JOIN hospitals h ON r.hospital_id = h.hospital_id
     ORDER BY a.issued_at DESC LIMIT 4`
  );

  res.json({
    metrics: {
      total_available_units: totalAvailable,
      expiring_soon_count: expiringSoonCount,
      pending_requests: pendingRequestsRow ? pendingRequestsRow.count : 0,
      emergency_requests_count: emergencyRequestsRow ? emergencyRequestsRow.count : 0,
      today_donations: todayDonationsRow ? todayDonationsRow.count : 0,
      total_active_donors: totalDonorsRow ? totalDonorsRow.count : 0
    },
    groupStock,
    componentStock,
    trendData,
    activeEmergencies,
    recentAlerts,
    recentActivity: {
      donations: recentDonations,
      issues: recentIssues
    }
  });
});

export default router;
