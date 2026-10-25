-- Smart Blood Bank Management System (SBBMS) Database Schema
-- Compatible with SQLite and MySQL / PostgreSQL

CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'staff', 'technician')),
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donors (
  donor_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  dob TEXT NOT NULL,
  gender TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  weight_kg REAL NOT NULL,
  last_donation_date TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donations (
  donation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  donor_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  donation_date TEXT NOT NULL,
  component_type TEXT NOT NULL,
  volume_ml INTEGER NOT NULL,
  hemoglobin REAL NOT NULL,
  bp TEXT NOT NULL,
  test_status TEXT NOT NULL DEFAULT 'Passed' CHECK(test_status IN ('Pending', 'Passed', 'Failed')),
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donor_id) REFERENCES donors(donor_id),
  FOREIGN KEY (staff_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS blood_units (
  unit_id TEXT PRIMARY KEY,
  donation_id INTEGER,
  blood_group TEXT NOT NULL,
  component_type TEXT NOT NULL,
  collected_on TEXT NOT NULL,
  expires_on TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Available' CHECK(status IN ('Quarantine', 'Available', 'Reserved', 'Issued', 'Expired', 'Discarded')),
  discard_reason TEXT,
  discarded_at TEXT,
  discarded_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donation_id) REFERENCES donations(donation_id),
  FOREIGN KEY (discarded_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS hospitals (
  hospital_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_requests (
  request_id INTEGER PRIMARY KEY AUTOINCREMENT,
  hospital_id INTEGER NOT NULL,
  patient_ref TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  component_type TEXT NOT NULL,
  units_required INTEGER NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'Normal' CHECK(urgency IN ('Normal', 'Urgent', 'Emergency')),
  required_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Partially Fulfilled', 'Fulfilled', 'Rejected', 'Cancelled')),
  created_by INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS request_allocations (
  allocation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  unit_id TEXT NOT NULL,
  issued_by INTEGER NOT NULL,
  issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES blood_requests(request_id),
  FOREIGN KEY (unit_id) REFERENCES blood_units(unit_id),
  FOREIGN KEY (issued_by) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS alerts (
  alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('EXPIRY_WARNING', 'EXPIRED', 'LOW_STOCK', 'EMERGENCY_REQUEST', 'SYSTEM')),
  message TEXT NOT NULL,
  related_unit_or_group TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS system_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description TEXT
);
