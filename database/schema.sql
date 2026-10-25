-- =====================================================================
-- SMART BLOOD BANK MANAGEMENT SYSTEM (SBBMS)
-- Database: MySQL / PostgreSQL / SQLite Standard Schema
-- Version: 1.0
-- =====================================================================

-- 1. Users Table (Staff & Administrators)
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff', 'technician') NOT NULL DEFAULT 'staff',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Donors Table
CREATE TABLE IF NOT EXISTS donors (
  donor_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  dob DATE NOT NULL,
  gender VARCHAR(20) NOT NULL,
  blood_group VARCHAR(5) NOT NULL,
  phone VARCHAR(25) NOT NULL,
  email VARCHAR(100),
  address TEXT,
  weight_kg DECIMAL(5, 2) NOT NULL,
  last_donation_date DATE,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Donations (Collection) Table
CREATE TABLE IF NOT EXISTS donations (
  donation_id INT AUTO_INCREMENT PRIMARY KEY,
  donor_id INT NOT NULL,
  staff_id INT NOT NULL,
  donation_date DATE NOT NULL,
  component_type VARCHAR(50) NOT NULL,
  volume_ml INT NOT NULL,
  hemoglobin DECIMAL(4, 1) NOT NULL,
  bp VARCHAR(20) NOT NULL,
  test_status ENUM('Pending', 'Passed', 'Failed') NOT NULL DEFAULT 'Passed',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES users(user_id)
);

-- 4. Blood Units Inventory Table
CREATE TABLE IF NOT EXISTS blood_units (
  unit_id VARCHAR(50) PRIMARY KEY,
  donation_id INT,
  blood_group VARCHAR(5) NOT NULL,
  component_type VARCHAR(50) NOT NULL,
  collected_on DATE NOT NULL,
  expires_on DATE NOT NULL,
  status ENUM('Quarantine', 'Available', 'Reserved', 'Issued', 'Expired', 'Discarded') NOT NULL DEFAULT 'Available',
  discard_reason TEXT,
  discarded_at DATETIME,
  discarded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donation_id) REFERENCES donations(donation_id) ON DELETE SET NULL,
  FOREIGN KEY (discarded_by) REFERENCES users(user_id)
);

-- 5. Hospitals Table
CREATE TABLE IF NOT EXISTS hospitals (
  hospital_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(25) NOT NULL,
  email VARCHAR(100),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Blood Requests Table
CREATE TABLE IF NOT EXISTS blood_requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NOT NULL,
  patient_ref VARCHAR(100) NOT NULL,
  blood_group VARCHAR(5) NOT NULL,
  component_type VARCHAR(50) NOT NULL,
  units_required INT NOT NULL,
  urgency ENUM('Normal', 'Urgent', 'Emergency') NOT NULL DEFAULT 'Normal',
  required_by DATETIME NOT NULL,
  status ENUM('Pending', 'Partially Fulfilled', 'Fulfilled', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
  created_by INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- 7. Request Allocations Table
CREATE TABLE IF NOT EXISTS request_allocations (
  allocation_id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  unit_id VARCHAR(50) NOT NULL,
  issued_by INT NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES blood_requests(request_id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES blood_units(unit_id),
  FOREIGN KEY (issued_by) REFERENCES users(user_id)
);

-- 8. Alerts & Notifications Table
CREATE TABLE IF NOT EXISTS alerts (
  alert_id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('EXPIRY_WARNING', 'EXPIRED', 'LOW_STOCK', 'EMERGENCY_REQUEST', 'SYSTEM') NOT NULL,
  message TEXT NOT NULL,
  related_unit_or_group VARCHAR(50),
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. System Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50),
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 10. System Settings & Thresholds Table
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description TEXT
);
