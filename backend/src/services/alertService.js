import { db } from '../db/database.js';
import { logAudit } from './auditService.js';

function getSettingNumber(key, defaultValue) {
  const row = db.get('SELECT setting_value FROM system_settings WHERE setting_key = ?', [key]);
  return row ? parseFloat(row.setting_value) : defaultValue;
}

export function runExpiryAndStockChecks() {
  const today = new Date().toISOString().split('T')[0];
  const lowStockThreshold = getSettingNumber('low_stock_threshold', 5);
  const rbcAlertDays = getSettingNumber('expiry_alert_days_rbc', 5);
  const pltAlertDays = getSettingNumber('expiry_alert_days_platelets', 2);

  const results = {
    expired_units_updated: 0,
    new_expiry_alerts: 0,
    new_low_stock_alerts: 0
  };

  // 1. Mark units past expiry as 'Expired'
  const expiredUnits = db.query(
    "SELECT unit_id, blood_group, component_type, expires_on FROM blood_units WHERE status = 'Available' AND expires_on < ?",
    [today]
  );

  for (const unit of expiredUnits) {
    db.run("UPDATE blood_units SET status = 'Expired' WHERE unit_id = ?", [unit.unit_id]);
    results.expired_units_updated++;

    // Insert alert if not already present
    const existingAlert = db.get(
      "SELECT alert_id FROM alerts WHERE related_unit_or_group = ? AND type = 'EXPIRED'",
      [unit.unit_id]
    );
    if (!existingAlert) {
      db.run(
        "INSERT INTO alerts (type, message, related_unit_or_group, is_read) VALUES (?, ?, ?, 0)",
        [
          'EXPIRED',
          `Unit ${unit.unit_id} (${unit.blood_group} ${unit.component_type}) expired on ${unit.expires_on} and was automatically marked Expired.`,
          unit.unit_id
        ]
      );
    }

    logAudit(null, 'AUTO_EXPIRE', 'BloodUnit', unit.unit_id, `Unit marked expired automatically on ${today}`);
  }

  // 2. Check for units expiring soon (Expiry warnings)
  const availableUnits = db.query(
    "SELECT unit_id, blood_group, component_type, expires_on FROM blood_units WHERE status = 'Available' AND expires_on >= ?",
    [today]
  );

  const todayDate = new Date(today);

  for (const unit of availableUnits) {
    const expDate = new Date(unit.expires_on);
    const diffDays = Math.ceil((expDate - todayDate) / (1000 * 60 * 60 * 24));
    const compLower = unit.component_type.toLowerCase();

    let thresholdDays = rbcAlertDays;
    if (compLower.includes('platelet')) {
      thresholdDays = pltAlertDays;
    } else if (compLower.includes('plasma')) {
      thresholdDays = 14;
    }

    if (diffDays <= thresholdDays) {
      // Check if alert already logged for this unit
      const existingAlert = db.get(
        "SELECT alert_id FROM alerts WHERE related_unit_or_group = ? AND type = 'EXPIRY_WARNING' AND is_read = 0",
        [unit.unit_id]
      );

      if (!existingAlert) {
        db.run(
          "INSERT INTO alerts (type, message, related_unit_or_group, is_read) VALUES (?, ?, ?, 0)",
          [
            'EXPIRY_WARNING',
            `Unit ${unit.unit_id} (${unit.blood_group} ${unit.component_type}) expires in ${diffDays} day(s) on ${unit.expires_on}. FEFO dispatch recommended.`,
            unit.unit_id
          ]
        );
        results.new_expiry_alerts++;
      }
    }
  }

  // 3. Check for low-stock groups
  const bloodGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
  for (const bg of bloodGroups) {
    const row = db.get(
      "SELECT COUNT(*) as count FROM blood_units WHERE blood_group = ? AND status = 'Available'",
      [bg]
    );
    const currentStock = row ? row.count : 0;

    if (currentStock < lowStockThreshold) {
      const existingAlert = db.get(
        "SELECT alert_id FROM alerts WHERE related_unit_or_group = ? AND type = 'LOW_STOCK' AND is_read = 0",
        [bg]
      );

      if (!existingAlert) {
        db.run(
          "INSERT INTO alerts (type, message, related_unit_or_group, is_read) VALUES (?, ?, ?, 0)",
          [
            'LOW_STOCK',
            `Blood group ${bg} has low inventory: only ${currentStock} available unit(s) remaining (threshold: ${lowStockThreshold}).`,
            bg
          ]
        );
        results.new_low_stock_alerts++;
      }
    }
  }

  return results;
}
