<h1 align="center">✨ EmPay - Smart HR & Payroll Management System</h1>

<p align="center">
<strong>A modern, production-grade Human Resources and Payroll Management platform</strong><br>
Built for the end-to-end employee lifecycle with a focus on atomic transactions, role-based security, and seamless UX.
</p>

<div align="center">

[![Made with React](https://img.shields.io/badge/Frontend-React%2FVite-61DAFB?logo=react)](https://react.dev)
[![Made with FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-316192?logo=postgresql)](https://postgresql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

</div>

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" alt="EmPay Dashboard Demo">
</div>

## 🎯 What Makes EmPay Unique?

Unlike standard HRMS templates, EmPay takes a fundamentally robust architectural approach to both design and backend engineering:

- **True Transactional Atomicity** — Payroll generation isn't just a math operation; it's a critical financial snapshot. EmPay's backend payroll engine utilizes staged `db.flush()` mechanisms to ensure that if a single payslip fails to generate during a massive payrun, the *entire* transaction safely rolls back to prevent orphaned or corrupted financial records.

- **Deeply Integrated Role Architecture** — Rather than relying solely on frontend hiding, EmPay enforces extreme security directly at the API dependency level. For instance, Payroll Officers are programmatically blocked from updating an employee's personal metadata, accepting strictly salary-related fields.

- **Dynamic Policy Engine** — The leave and attendance engines compute pro-rata salaries dynamically based on dynamically tracked "Loss of Pay" (LOP) days, eliminating the need for rigid manual deductions.

- **Glassmorphism Design System** — Vanilla CSS purity combined with scalable token system. No Tailwind bloat—just absolute control over design with incredibly fast rendering and beautiful micro-animations via Framer Motion.

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" alt="Feature Showcase">
</div>

## 🏗️ System Architecture

### High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (React + Vite)                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ • Glassmorphism UI Components                              │  │
│  │ • Framer Motion Animations & Transitions                   │  │
│  │ • Role-Based Route Guards                                  │  │
│  │ • Context API (Auth, Role Management)                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ JWT Bearer Token
                             │ REST API Calls
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   API LAYER (FastAPI - Port 8000)                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Authentication & JWT Validation                            │  │
│  │ CORS Middleware & Security Headers                         │  │
│  │ Role-Based Dependency Injection                            │  │
│  │ Request Validation (Pydantic Schemas)                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    ↓                 ↓
        ┌─────────────────────┐ ┌──────────────┐
        │  BUSINESS LOGIC     │ │ EXTERNAL API │
        │  LAYER (Services)   │ │ INTEGRATION  │
        │                     │ │              │
        │ • Payroll Engine    │ │ • AI Service │
        │ • Leave Engine      │ │ • PDF Render │
        │ • Attendance Engine │ │ • WhatsApp   │
        │ • Analytics Engine  │ │ • Email Svc  │
        │ • Audit Logging     │ │ • Odoo Sync  │
        └──────────┬──────────┘ └──────────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │  PERSISTENCE LAYER   │
        │  (SQLAlchemy ORM)    │
        │                      │
        │ • Models Definition  │
        │ • Query Builders     │
        │ • Transaction Mgmt   │
        └──────────┬───────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │  DATABASE (PostgreSQL)│
        │                      │
        │ • Employees          │
        │ • Attendance         │
        │ • Leaves & Holidays  │
        │ • Payroll Records    │
        │ • Audit Trail        │
        │ • Company Data       │
        └──────────────────────┘
```

<div align="center">
  <em>EmPay — Layered Architecture for Security, Scalability, and Performance</em>
</div>

---

## 📱 Screenshots & UI Components

### Dashboard Screens

#### Admin Dashboard
- **System Overview** - Comprehensive company metrics and statistics
- **Employee Management** - Directory with search and filtering
- **Payroll Control Panel** - Monthly payroll oversight and status
- **Audit Trail** - Complete activity logs and compliance records

#### Employee Portal
- **Personal Dashboard** - Attendance stats and leave balance
- **Attendance Calendar** - Heat map of present/absent days
- **Leave Management** - Request submission and tracking
- **Payslip Downloads** - Access to past and current payslips

#### HR Dashboard
- **Employee Directory** - Full employee records management
- **Attendance Board** - Live status of who's working
- **Leave Approvals** - Multi-stage approval workflow
- **Holiday Management** - Company and regional holiday calendars

#### Payroll Dashboard
- **Salary Structure** - Earnings and deduction configuration
- **Payroll Generation** - Monthly cycle execution and validation
- **Payslip Preview** - Before finalizing payroll run
- **Compliance Reports** - Tax and statutory deduction reports

*Screenshot placeholders - Add PNG files for each dashboard section*

---

## 🚀 Core Features

### 👥 Role-Based Access Control (RBAC)

EmPay enforces strict role-based access at **multiple layers**:

1. **Frontend Route Guards** - Prevent unauthorized page navigation
2. **API Dependency Injection** - Block requests at the endpoint level
3. **Database Query Filters** - Ensure data isolation per tenant

| Role | Permissions | Scope |
|------|-----------|-------|
| **Admin** | Full system access, configuration, company-wide insights | All data across all companies |
| **HR Officer** | Onboarding, directory, attendance, leaves, holidays, approvals | Company-specific data |
| **Payroll Officer** | Salary structure, payroll generation, leave deductions, compliance | Company-specific + financial constraints |
| **Employee** | Self-service portal, attendance view, leave apply, payslip download | Own data only |

### 📋 HR Management Module

#### Employee Directory
- Centralized management of employee records with rich profile data
- Department and designation hierarchy
- Job history tracking and role transitions
- Multi-field search and filtering
- Bulk import capabilities

#### Attendance Tracking
```
Daily Workflow:
  Employee Clock-In
    ↓
  [Log Entry + Timestamp]
    ↓
  [Real-time Dashboard Update] (Live "Status Board")
    ↓
  Employee Clock-Out
    ↓
  [Calculate Working Hours]
    ↓
  [Update Monthly Attendance]
```

- ⏱️ Clock-in/Clock-out functionality with precise timestamps
- 📊 Live "Status Board" showing who's currently working
- 📈 Daily logs with duration calculations
- 📅 Monthly and period-wise summaries
- 🔄 Manual adjustment support for system discrepancies

#### Leave Management Workflow
```
Multi-Stage Approval Pipeline:

  Employee Submits Request
        ↓
  [HR Officer Reviews] ← Can reject or approve
        ↓
  [Payroll Officer Reviews] ← Final approval with LOP calculation
        ↓
  [Auto-deduct from Balance] ← Pro-rata if applicable
        ↓
  [Update Attendance Records]
        ↓
  [Send Notifications]
```

- Custom policy limits per leave type (PTO, Sick, Casual, etc.)
- Paid/Unpaid flag support
- Automated carry-forward tracking (e.g., unused PTO rollover)
- Year-end reset with rules
- Pro-rata calculations for mid-month joins

#### Holiday Calendar
- Track company and regional holidays
- Multi-state holiday support (India regional holidays)
- One-click seed national holidays for the year
- Exclude holidays from attendance calculations
- Custom holiday addition for special occasions

---

## 📂 Project Structure

```text
NitroNexus-empay/
├── backend/                  # FastAPI Backend
│   ├── alembic/              # Database schema migrations
│   ├── app/
│   │   ├── api/v1/           # API Endpoints (holidays, payroll, employees, etc.)
│   │   │   ├── endpoints/    # Individual endpoint modules
│   │   │   ├── router.py     # Central router configuration
│   │   │   └── deps.py       # Dependency injection setup
│   │   ├── core/             # Configuration & Security (JWT, DB connect)
│   │   ├── models/           # SQLAlchemy DB Models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── services/         # Core business logic & computations
│   │   └── utils/            # Helper utilities
│   ├── scripts/              # Data seeding & utility scripts
│   ├── requirements.txt      # Python dependencies
│   └── alembic.ini           # Migration configuration
│
├── frontend/                 # React.js Frontend (Vite)
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/       # Layout components (Sidebar, TopBar)
│   │   │   └── ui/           # Reusable UI components
│   │   ├── context/          # React Context (Auth, Role management)
│   │   ├── pages/            # Page components by domain
│   │   │   ├── admin/        # Admin dashboards & config
│   │   │   ├── auth/         # Login & Registration
│   │   │   ├── employee/     # Employee portal
│   │   │   ├── hr/           # HR management
│   │   │   ├── payroll/      # Payroll operations
│   │   │   └── shared/       # Attendance board, Analytics
│   │   ├── services/         # API integration layers
│   │   ├── styles/           # Global styles & tokens
│   │   ├── utils/            # Helper functions
│   │   ├── App.jsx           # Main router
│   │   └── main.jsx          # App entry point
│   ├── vite.config.js        # Vite configuration
│   ├── package.json          # Node dependencies
│   ├── eslint.config.js      # ESLint configuration
│   └── index.html            # HTML template
│
├── UI_Design/                # Design mockups & assets
├── LICENSE                   # MIT License
└── README.md                 # This file
```

---

## 🛠️ Tech Stack

### Frontend Stack
| Technology | Purpose | Version |
|-----------|---------|---------|
| **React.js** | UI framework with hooks & context | Latest |
| **Vite** | Lightning-fast build tool | Latest |
| **Framer Motion** | Animation & transition orchestration | Latest |
| **Lucide React** | Beautiful, consistent iconography | Latest |
| **Vanilla CSS** | Custom token-based styling system | CSS3 |

**Why Vanilla CSS?**
- ✅ Zero-dependency styling (no Tailwind overhead)
- ✅ Microsecond-level performance
- ✅ Complete design control
- ✅ Glassmorphism effects are native CSS
- ✅ Dynamic theming via CSS variables

### Backend Stack
| Technology | Purpose | Feature |
|-----------|---------|---------|
| **Python 3.10+** | Primary language | Fast, readable |
| **FastAPI** | Web framework | Auto-docs, async support |
| **SQLAlchemy** | ORM | Powerful query builder |
| **PostgreSQL** | Database | ACID, JSON support |
| **Alembic** | Migrations | Version control for schema |
| **Pydantic** | Validation | Type-safe schemas |
| **Uvicorn** | ASGI server | High-performance serving |

### External Integrations
- 📧 **Email Service** (Nodemailer/SendGrid ready)
- 📱 **WhatsApp API** (Notification delivery)
- 🤖 **AI Service** (NLP assistance)
- 🧮 **PDF Generation** (Pixel-perfect payslips)
- 🔗 **Odoo Integration** (ERP sync)

---

---

##  API Documentation

### Authentication Flow

```
1. User submits credentials (email, password)
   ↓
2. Backend validates credentials
   ↓
3. Generate JWT tokens:
   - Access Token (short-lived, 30 min)
   - Refresh Token (long-lived, 7 days)
   ↓
4. Return tokens to frontend
   ↓
5. Frontend stores tokens in:
   - AccessToken: Memory (cleared on logout)
   - RefreshToken: Secure HttpOnly Cookie
   ↓
6. All API requests include:
   Authorization: Bearer <access_token>
   ↓
7. Token expiry check:
   - Valid? Continue request
   - Expired? Use refresh token to get new access token
```

### Core API Endpoints

#### Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/auth/login` | User login with email & password |
| `POST` | `/api/v1/auth/register` | User registration & account creation |
| `POST` | `/api/v1/auth/refresh` | Refresh expired access token |
| `POST` | `/api/v1/auth/logout` | User logout & session cleanup |

#### Employees
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/employees` | List all employees (paginated) |
| `POST` | `/api/v1/employees` | Create new employee record |
| `GET` | `/api/v1/employees/{id}` | Fetch specific employee details |
| `PUT` | `/api/v1/employees/{id}` | Update employee information |
| `DELETE` | `/api/v1/employees/{id}` | Deactivate employee |
| `GET` | `/api/v1/employees/search` | Search employees by multiple fields |

#### Attendance
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/attendance/clock-in` | Record employee clock-in |
| `POST` | `/api/v1/attendance/clock-out` | Record employee clock-out |
| `GET` | `/api/v1/attendance/{emp_id}` | Fetch attendance records for employee |
| `GET` | `/api/v1/attendance/summary` | Get monthly attendance summary |
| `POST` | `/api/v1/attendance/adjust` | Manual attendance adjustment |

#### Leave Management
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/leaves/apply` | Submit leave request |
| `GET` | `/api/v1/leaves/balance/{emp_id}` | Get leave balance for employee |
| `GET` | `/api/v1/leaves/pending` | Fetch pending approval requests |
| `PUT` | `/api/v1/leaves/{id}/approve` | HR/Payroll officer approval |
| `PUT` | `/api/v1/leaves/{id}/reject` | Reject leave request |

#### Payroll
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/payroll/generate` | Initiate monthly payroll cycle |
| `GET` | `/api/v1/payroll/status` | Check payroll generation status |
| `GET` | `/api/v1/payroll/payslips` | List all generated payslips |
| `GET` | `/api/v1/payroll/payslips/{id}` | Fetch specific payslip |
| `POST` | `/api/v1/payroll/payslips/{id}/pdf` | Download payslip as PDF |
| `POST` | `/api/v1/payroll/validate` | Pre-generate payroll validation |

#### Holidays
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/holidays` | List company holidays |
| `POST` | `/api/v1/holidays` | Add new holiday |
| `PUT` | `/api/v1/holidays/{id}` | Update holiday details |
| `DELETE` | `/api/v1/holidays/{id}` | Remove holiday |
| `POST` | `/api/v1/holidays/seed` | Auto-seed national holidays |

### Response Format

All API responses follow a standard structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": 1,
    "email": "john@example.com",
    "role": "employee",
    "created_at": "2026-05-01T10:30:00Z"
  },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 256,
    "total_pages": 13
  }
}
```

### Error Responses

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 🚀 Future Scope & Enhancements

### Planned Features
- **Advanced Analytics Dashboard** — Predictive workforce analytics with trend analysis
- **Mobile Application** — Native iOS/Android apps for employee self-service
- **Biometric Integration** — Fingerprint & face recognition for attendance
- **AI-Powered Leave Prediction** — Machine learning for optimal leave scheduling
- **Real-time Notifications** — WebSocket-based live alerts for approvals
- **Multi-language Support** — Localization for regional markets
- **Custom Workflows** — User-defined approval chains and business rules
- **Expense Management** — Integration with company expense tracking
- **Performance Management** — KPI tracking and appraisal workflows
- **Employee Self-Service Portal** — Document uploads, policy access, benefits enrollment

### Integration Roadmap
- 🔗 **Odoo ERP Integration** — Sync employee data, inventory, and financials
- 🏦 **Banking APIs** — Salary reconciliation and payment automation
- 📊 **BI Tools** — Power BI, Tableau, Looker integration for advanced reporting
- 🔐 **Identity Providers** — SSO with Active Directory, Okta, Google Workspace
- 💬 **Communication Platforms** — Slack, Microsoft Teams notifications
- 🏗️ **Infrastructure APIs** — AWS, Azure, GCP resource management

---



## 🎓 Learning Resources

### FastAPI
- [FastAPI Official Docs](https://fastapi.tiangolo.com)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)

### React & Frontend
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Framer Motion Docs](https://www.framer.com/motion/)

### Database
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Alembic Docs](https://alembic.sqlalchemy.org/)

---

<div align="center">

**Made with ❤️ for modern HR management**

*Give us a ⭐ if EmPay helps your organization!*

</div>

*Give us a ⭐ if EmPay helps your organization!*

</div>
