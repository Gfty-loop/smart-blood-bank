-- =====================================================================
-- SMART BLOOD BANK MANAGEMENT SYSTEM (SBBMS)
-- Database: Seed Records (Universal SQL)
-- Version: 1.0
-- =====================================================================

-- 1. Users (Passwords: admin123, staff123, tech123 encrypted with bcrypt)
INSERT INTO users (name, email, password_hash, role, is_active) VALUES
('Dr. Robert Vance (Admin)', 'admin@bloodbank.org', '$2a$10$7Z2v8Z5Q1uN2QnF1aI2zO.aN3A6E4p8R0kK4cZ7bT8vJ5kR7wM9n2', 'admin', 1),
('Sarah Jenkins (Staff)', 'staff@bloodbank.org', '$2a$10$7Z2v8Z5Q1uN2QnF1aI2zO.aN3A6E4p8R0kK4cZ7bT8vJ5kR7wM9n2', 'staff', 1),
('David Kim (Technician)', 'tech@bloodbank.org', '$2a$10$7Z2v8Z5Q1uN2QnF1aI2zO.aN3A6E4p8R0kK4cZ7bT8vJ5kR7wM9n2', 'technician', 1);

-- 2. System Settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('low_stock_threshold', '5', 'Minimum units before triggering low-stock alert'),
('expiry_alert_days_rbc', '5', 'Days before expiry to raise alert for Whole Blood & RBC'),
('expiry_alert_days_platelets', '2', 'Days before expiry to raise alert for Platelets'),
('min_donation_gap_days', '90', 'Minimum required gap in days between whole blood donations'),
('min_donor_age', '18', 'Minimum eligible donor age'),
('max_donor_age', '65', 'Maximum eligible donor age'),
('min_donor_weight', '50', 'Minimum eligible donor weight in kg'),
('min_hemoglobin', '12.5', 'Minimum eligible haemoglobin level in g/dL');

-- 3. Hospitals
INSERT INTO hospitals (name, contact_person, phone, email, address) VALUES
('City Memorial General Hospital', 'Dr. Aris Thorne', '+1-555-0101', 'bloodbank@citymemorial.org', '742 Evergreen Terrace, Medical District'),
('Metro Trauma & Surgical Center', 'Nurse Supervisor Elena Cruz', '+1-555-0102', 'er-orders@metrotrauma.org', '100 Health Way, West End'),
('St. Jude Children & Family Clinic', 'Dr. Michael Chang', '+1-555-0103', 'procurement@stjudefamily.org', '55 St. Jude Blvd, Suite 200'),
('Highland Community Hospital', 'Sarah Al-Mansoor', '+1-555-0104', 'supplies@highlandhealth.org', '89 Valley Road, North Hills');

-- 4. Donors
INSERT INTO donors (name, dob, gender, blood_group, phone, email, address, weight_kg, last_donation_date, is_active) VALUES
('Alexander Wright', '1990-04-12', 'Male', 'O-', '+1-555-1101', 'alex.wright@example.com', '12 Maple St, Apt 4', 78.5, '2026-06-15', 1),
('Brenda Lawson', '1995-08-23', 'Female', 'O+', '+1-555-1102', 'brenda.l@example.com', '45 Pine Ridge', 62.0, '2026-07-01', 1),
('Carlos Santana', '1988-11-05', 'Male', 'A+', '+1-555-1103', 'carlos.s@example.com', '88 Oak Ave', 82.0, '2026-10-01', 1),
('Diana Prince', '1992-03-14', 'Female', 'A-', '+1-555-1104', 'diana.p@example.com', '33 Amazon Way', 59.0, '2026-05-10', 1),
('Ethan Hunt', '1985-09-30', 'Male', 'B+', '+1-555-1105', 'ethan.h@example.com', '9 Mission Lane', 75.0, '2026-06-20', 1),
('Fiona Gallagher', '1998-01-19', 'Female', 'B-', '+1-555-1106', 'fiona.g@example.com', '21 South Side Blvd', 54.0, '2026-04-10', 1),
('George Miller', '1975-12-01', 'Male', 'AB+', '+1-555-1107', 'george.m@example.com', '15 Fury Road', 85.0, '2026-07-12', 1),
('Hannah Abbott', '2001-07-07', 'Female', 'AB-', '+1-555-1108', 'hannah.a@example.com', '7 Hufflepuff Hall', 56.0, '2026-05-25', 1),
('Marcus Vance', '2000-02-14', 'Male', 'O+', '+1-555-1109', 'marcus.v@example.com', '104 Cedar Lane', 71.0, NULL, 1),
('Rachel Green', '1996-05-05', 'Female', 'A+', '+1-555-1110', 'rachel.g@example.com', '90 Bedford St', 48.0, NULL, 1);

-- 5. Donations
INSERT INTO donations (donor_id, staff_id, donation_date, component_type, volume_ml, hemoglobin, bp, test_status, notes) VALUES
(1, 2, '2026-09-20', 'Whole Blood', 450, 14.2, '120/80', 'Passed', 'Smooth collection, universal donor O-'),
(2, 2, '2026-09-22', 'Red Blood Cells', 350, 13.5, '118/75', 'Passed', 'Donor tolerated well'),
(3, 2, '2026-10-01', 'Platelets', 300, 14.8, '125/82', 'Passed', 'Apheresis collection'),
(4, 2, '2026-09-28', 'Whole Blood', 450, 13.1, '115/76', 'Passed', 'Screening normal'),
(5, 3, '2026-10-15', 'Plasma', 500, 15.0, '122/80', 'Passed', 'Plasma collection frozen immediately'),
(6, 3, '2026-10-18', 'Whole Blood', 450, 12.8, '119/78', 'Passed', 'Routine collection'),
(7, 2, '2026-10-18', 'Whole Blood', 450, 15.2, '124/80', 'Passed', 'AB+ collection'),
(8, 3, '2026-10-12', 'Whole Blood', 450, 13.0, '120/78', 'Passed', 'AB- rare unit collection');

-- 6. Blood Units
INSERT INTO blood_units (unit_id, donation_id, blood_group, component_type, collected_on, expires_on, status, discard_reason) VALUES
('WB-20261015-01', 1, 'O-', 'Whole Blood', '2026-10-15', '2026-11-26', 'Available', NULL),
('WB-20261020-02', 1, 'O-', 'Whole Blood', '2026-10-20', '2026-12-01', 'Available', NULL),
('RBC-20261010-03', 2, 'O+', 'Red Blood Cells', '2026-10-10', '2026-11-21', 'Available', NULL),
('RBC-20261012-04', 2, 'O+', 'Red Blood Cells', '2026-10-12', '2026-11-23', 'Available', NULL),
('RBC-20261018-05', 2, 'O+', 'Red Blood Cells', '2026-10-18', '2026-11-29', 'Available', NULL),
('WB-20261005-06', 4, 'A-', 'Whole Blood', '2026-10-05', '2026-11-16', 'Available', NULL),
('RBC-20261014-07', 3, 'A+', 'Red Blood Cells', '2026-10-14', '2026-11-25', 'Available', NULL),
('RBC-20261016-08', 3, 'A+', 'Red Blood Cells', '2026-10-16', '2026-11-27', 'Available', NULL),
('WB-20261010-09', 5, 'B+', 'Whole Blood', '2026-10-10', '2026-11-21', 'Available', NULL),
('RBC-20261011-10', 5, 'B+', 'Red Blood Cells', '2026-10-11', '2026-11-22', 'Available', NULL),
('WB-20261008-11', 6, 'B-', 'Whole Blood', '2026-10-08', '2026-11-19', 'Available', NULL),
('WB-20261018-12', 7, 'AB+', 'Whole Blood', '2026-10-18', '2026-11-29', 'Available', NULL),
('PLT-20261024-13', 3, 'A+', 'Platelets', '2026-10-24', '2026-10-29', 'Available', NULL),
('FFP-20260901-14', 5, 'B+', 'Plasma', '2026-09-01', '2027-09-01', 'Available', NULL),
('FFP-20260815-15', 1, 'O-', 'Plasma', '2026-08-15', '2027-08-15', 'Available', NULL),
('WB-20260916-16', 1, 'O-', 'Whole Blood', '2026-09-16', '2026-10-28', 'Available', NULL),
('RBC-20260915-17', 2, 'O+', 'Red Blood Cells', '2026-09-15', '2026-10-27', 'Available', NULL),
('PLT-20261022-18', 3, 'O+', 'Platelets', '2026-10-22', '2026-10-27', 'Available', NULL),
('WB-20260917-19', 4, 'A-', 'Whole Blood', '2026-09-17', '2026-10-29', 'Available', NULL),
('WB-20261012-20', 8, 'AB-', 'Whole Blood', '2026-10-12', '2026-11-23', 'Available', NULL),
('WB-20260901-21', 1, 'B+', 'Whole Blood', '2026-09-01', '2026-10-13', 'Expired', NULL),
('WB-20261025-22', 1, 'O-', 'Whole Blood', '2026-10-25', '2026-12-06', 'Quarantine', NULL),
('PLT-20261025-23', 2, 'A+', 'Platelets', '2026-10-25', '2026-10-30', 'Quarantine', NULL),
('RBC-20261002-24', 3, 'B-', 'Red Blood Cells', '2026-10-02', '2026-11-13', 'Discarded', 'Hemolysis observed during visual quality inspection');

-- 7. Blood Requests
INSERT INTO blood_requests (hospital_id, patient_ref, blood_group, component_type, units_required, urgency, required_by, status, created_by, notes) VALUES
(2, 'EMERGENCY-TR-9941', 'A+', 'Red Blood Cells', 2, 'Emergency', '2026-10-25 18:00:00', 'Pending', 2, 'Multi-vehicle trauma collision. Massive blood loss. Fast-track issue required.'),
(1, 'SURG-CARD-4402', 'O-', 'Whole Blood', 1, 'Urgent', '2026-10-26 09:00:00', 'Pending', 2, 'Scheduled coronary artery bypass grafting with low platelet count'),
(3, 'PED-HEM-1092', 'B+', 'Platelets', 1, 'Normal', '2026-10-27 12:00:00', 'Pending', 3, 'Chemotherapy supportive platelet transfusion'),
(4, 'GEN-MED-8812', 'O+', 'Red Blood Cells', 2, 'Normal', '2026-10-22 10:00:00', 'Fulfilled', 2, 'Severe anemia supportive transfusion');

-- 8. Dispatched Units and Allocations
INSERT INTO blood_units (unit_id, donation_id, blood_group, component_type, collected_on, expires_on, status) VALUES
('RBC-20260920-91', 2, 'O+', 'Red Blood Cells', '2026-09-20', '2026-11-01', 'Issued'),
('RBC-20260921-92', 2, 'O+', 'Red Blood Cells', '2026-09-21', '2026-11-02', 'Issued');

INSERT INTO request_allocations (request_id, unit_id, issued_by, issued_at) VALUES
(4, 'RBC-20260920-91', 2, '2026-10-22 11:15:00'),
(4, 'RBC-20260921-92', 2, '2026-10-22 11:15:00');

-- 9. Active Alerts
INSERT INTO alerts (type, message, related_unit_or_group, is_read) VALUES
('LOW_STOCK', 'AB- stock is critically low (1 unit remaining, threshold is 5 units).', 'AB-', 0),
('EXPIRY_WARNING', 'Unit RBC-20260915-17 (O+ Red Blood Cells) expires in 2 days (2026-10-27).', 'RBC-20260915-17', 0),
('EXPIRY_WARNING', 'Platelet unit PLT-20261022-18 (O+) expires in 2 days (2026-10-27). Prioritize dispatch.', 'PLT-20261022-18', 0),
('EMERGENCY_REQUEST', 'Emergency request logged by Metro Trauma for patient EMERGENCY-TR-9941 (2 units A+ RBC).', 'EMERGENCY-TR-9941', 0);
