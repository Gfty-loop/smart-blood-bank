# Smart Blood Bank Management System (SBBMS)

> **Version 1.0** · Full-Stack Clinical Microproject  
> **Stack**: React 18 + Tailwind CSS + Node.js / Express REST API + SQL (SQLite / MySQL)

---

## 1. Overview & System Purpose

The **Smart Blood Bank Management System (SBBMS)** replaces error-prone spreadsheets and paper registers with an automated, real-time, audit-logged transfusion platform. It enforces strict clinical business logic, automated donor eligibility calculations, low-stock and expiry notifications, and intelligent FEFO (First Expiry, First Out) blood-group compatibility matching.

### Key Highlights
- **100% PRD Coverage**: Implements all **Must** (F1–F9) and **Should** (F10, F11) features.
- **Smart Donor Eligibility Engine**: Enforces donor age (18–65), weight ($\ge 50$ kg), haemoglobin ($\ge 12.5$ g/dL), 90-day donation interval, and medical questionnaires.
- **FEFO Compatibility Matching**: Transfusion matrix matching for Red Blood Cells, Whole Blood, and Plasma. Automatically ranks compatible units by earliest expiration first.
- **$\le 3$-Click Emergency Dispatch**: Fast-tracks urgent trauma and massive hemorrhage requests directly from the queue to physical dispatch in 3 clicks or fewer.
- **Automated Expiry & Low-Stock Alerts**: Daily midnight scheduled cron job and on-demand inventory scanner to mark expired units and raise badges.
- **Cryptographic Audit Trail**: Every donation, quarantine release, discard, and dispatch is immutably logged with user, action, and timestamp.
- **One-Click CSV Export**: Donations log, stock snapshot, hospital dispatches, and discarded/expired units exportable to real CSV files.

---

## 2. Default Demo Credentials

The system operates in a secure **Staff-Only** model (donors and hospitals do not have logins). Pre-seeded accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@bloodbank.org` | `admin123` | Manager access, thresholds configuration, user management, audit logs, reports |
| **Staff** | `staff@bloodbank.org` | `staff123` | Donor registration, donation collection, hospital requests, blood issue/dispatch |
| **Technician** | `tech@bloodbank.org` | `tech123` | Phlebotomy testing, quarantine approval/release, quality discards |

*(One-click demo buttons are available directly on the login screen for instant access).*

---

## 3. Architecture & Project Structure

```text
smart-blood-bank/
├── backend/
│   ├── src/
│   │   ├── cron/
│   │   │   └── expiryJob.js           # Daily cron job for expiry status & alerts
│   │   ├── db/
│   │   │   ├── database.js            # Node SQL driver with transactions & WAL mode
│   │   │   ├── schema.sql             # SQL schema (users, donors, units, requests, etc.)
│   │   │   └── seed.js                # Seed script with realistic clinical test data
│   │   ├── middleware/
│   │   │   └── auth.js                # JWT verification & role authorization (Admin/Staff)
│   │   ├── routes/
│   │   │   ├── auth.routes.js         # Sign-in, sign-out, session verification
│   │   │   ├── donor.routes.js        # Donor CRUD, search, live eligibility calculations
│   │   │   ├── donation.routes.js     # Phlebotomy recording & unit generation
│   │   │   ├── inventory.routes.js    # Unit status, filters, manual discard with reason
│   │   │   ├── request.routes.js      # Prioritised request queue & FEFO issue
│   │   │   ├── hospital.routes.js     # Hospital accounts & procurement history
│   │   │   ├── alert.routes.js        # Notification center & manual scan trigger
│   │   │   ├── report.routes.js       # Reports & CSV export streams
│   │   │   ├── settings.routes.js     # Admin threshold management & audit log
│   │   │   └── dashboard.routes.js    # Consolidated KPI metrics, charts, & alerts
│   │   └── server.js                  # Express application & static bundle serving
│   ├── blood_bank.db                  # Local SQL database
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Top bar, alert badge dropdown, user menu
│   │   │   ├── Sidebar.jsx            # Navigation links with active route highlighting
│   │   │   └── CompatibilityMatrixModal.jsx # Visual reference for Red Cell & Plasma rules
│   │   ├── context/
│   │   │   ├── AuthContext.jsx        # Authentication and role state management
│   │   │   └── AlertContext.jsx       # Real-time alert polling and notifications
│   │   ├── pages/
│   │   │   ├── Login.jsx              # Healthcare login with 1-click test role pills
│   │   │   ├── Dashboard.jsx          # 8-blood group cards, 7-day trend chart, KPIs
│   │   │   ├── Donors.jsx             # Searchable registry, profile modals, next dates
│   │   │   ├── DonationScreening.jsx  # Interactive donor screening & collection form
│   │   │   ├── Inventory.jsx          # Storage table, quarantine release, discard modal
│   │   │   ├── Requests.jsx           # Emergency prioritised queue & FEFO issue modal
│   │   │   ├── Hospitals.jsx          # Partner hospitals directory & request history
│   │   │   ├── Alerts.jsx             # Notification center with manual audit scan
│   │   │   ├── Reports.jsx            # 4 compliance reports with real CSV export
│   │   │   └── Settings.jsx           # Admin configurable thresholds & audit viewer
│   │   ├── services/
│   │   │   └── api.js                 # Axios client with JWT interceptor
│   │   ├── App.jsx                    # React Router configuration
│   │   └── main.jsx
│   ├── dist/                          # Production-compiled frontend bundle
│   └── package.json
│
├── database/
│   ├── schema.sql                     # Standalone universal SQL schema (MySQL/PostgreSQL)
│   └── seed.sql                       # Standalone SQL seed script
├── package.json                       # Root orchestration package
└── README.md
```

---

## 4. Running the Application

### Option A: Unified Server (Recommended)
The backend server is configured to serve both the REST API on `/api/*` and the compiled React production frontend on `http://localhost:5000`:

```bash
# From smart-blood-bank/
npm start
```
Then open your browser to **`http://localhost:5000`**.

### Option B: Separate Development Servers
If you wish to make live hot-reloading frontend changes:

1. **Start Backend API (Port 5000)**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend Vite Dev Server (Port 3000)**:
   ```bash
   cd frontend
   npm run dev
   ```
   Open **`http://localhost:3000`** in your browser. (API requests are automatically proxied to port 5000).

---

## 5. Clinical Business Rules Implemented

### 5.1 Donor Eligibility (PRD Section 9.1)
- **Age**: 18 to 65 years (calculated dynamically from `dob`).
- **Body Weight**: Minimum 50.0 kg.
- **Haemoglobin**: Minimum 12.5 g/dL.
- **Interval Gap**: Minimum 90 days between donations (configurable). Calculates exact `next_eligible_date`.
- **Screening Questionnaire**: Must confirm feeling well today, no recent fever/infection in last 14 days, no major surgery/dental in last 6 months, and not on deferred antibiotic medications.

### 5.2 Component Shelf-Life (PRD Section 9.2)
- **Whole Blood & Red Blood Cells (RBC)**: 42 days.
- **Platelets (PLT)**: 5 days.
- **Fresh Frozen Plasma (FFP)**: 365 days (1 year).

### 5.3 Transfusion Compatibility & FEFO (PRD Section 9.3 & 9.4)
- **Red Cell & Whole Blood**:
  - $O^-$ is the Universal Donor (can be given to any patient in emergency trauma).
  - $AB^+$ is the Universal Recipient.
- **Plasma Transfusion (Reverse Pattern)**:
  - $AB$ is the Universal Plasma Donor.
  - $O$ is the Universal Plasma Recipient.
- **Allocation Ranking**:
  1. Exact blood group match prioritized first.
  2. Compatible groups secondary ($O^-$ universal donor fallback).
  3. **FEFO (First Expiry, First Out)**: Units expiring earliest are ranked first to minimize wastage.

---

## 6. Acceptance Criteria Verification

| Requirement | Acceptance Test | Status |
| :--- | :--- | :---: |
| **F1: Authentication & RBAC** | Login with bcrypt hash + JWT. Role-gated admin routes. | ✅ Passed |
| **F2, F3: Donor Management & Eligibility** | Rejects donor who donated 30 days ago with next eligible date. | ✅ Passed |
| **F4: Donation Recording** | Recording donation automatically creates blood unit with calculated expiry. | ✅ Passed |
| **F5: Inventory Management** | Tracks Quarantine, Available, Reserved, Issued, Expired, Discarded. Discard requires reason. | ✅ Passed |
| **F6, F7: Hospital Requests & Issue** | Prioritised queue (Emergency first). FEFO suggestions. Issue updates units to Issued in DB transaction. | ✅ Passed |
| **Emergency Fulfillment** | **$\le 3$ clicks** from queue to dispatch confirmation. | ✅ Passed |
| **F8: Expiry & Stock Alerts** | Alerts triggered when stock $< 5$ units or expiring $\le 5$ days. Expired units auto-flagged. | ✅ Passed |
| **F9: Live Dashboard** | 8 blood group cards, component breakdown, 7-day trend chart, emergency banner. | ✅ Passed |
| **F11: Reports & CSV Export** | Donations, stock snapshot, hospital dispatches, and discards downloadable as CSV. | ✅ Passed |
