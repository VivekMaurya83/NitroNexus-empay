<h1 align="center">EmPay - Smart HR & Payroll Management System</h1>

<p align="center">
EmPay is a modern, full-stack Human Resources and Payroll Management platform built to handle the end-to-end employee lifecycle. Designed with a focus on usability, reliability, and automated workflows, EmPay allows organizations to effortlessly manage employee data, attendance, leaves, and complex payroll processes.
</p>


<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%">
</div>

## What Makes EmPay Unique?

Unlike standard HRMS templates, EmPay takes a fundamentally robust architectural approach to both design and backend engineering:

- **True Transactional Atomicity**: Payroll generation isn't just a math operation; it's a critical financial snapshot. EmPay's backend payroll engine utilizes staged `db.flush()` mechanisms to ensure that if a single payslip fails to generate during a massive payrun, the *entire* transaction safely rolls back to prevent orphaned or corrupted financial records.
- **Deeply Integrated Role Architecture**: Rather than relying solely on frontend hiding, EmPay enforces extreme security directly at the API dependency level. For instance, Payroll Officers are programmatically blocked from updating an employee's personal metadata, accepting strictly salary-related fields.
- **Dynamic Policy Engine**: The leave and attendance engines compute pro-rata salaries dynamically based on dynamically tracked "Loss of Pay" (LOP) days, eliminating the need for rigid manual deductions.
- **Vanilla CSS Purity**: Instead of relying on heavy utility frameworks like Tailwind or bulky component libraries, EmPay utilizes a strictly maintained, scalable Vanilla CSS token system. This results in incredibly fast rendering, absolute control over micro-animations via Framer Motion, and a beautifully unique glassmorphism aesthetic.

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%">
</div>

## Key Features

### Role-Based Access Control
- **Admin**: Full system access, configuration, and company-wide insights.
- **HR Officer**: Manage employee onboarding, directory, attendance, leaves, and holiday calendars.
- **Payroll Officer**: Execute atomic payroll generation, manage salary structures, and review leave deductions.
- **Employee**: Self-service portal to view attendance, apply for leaves, and download payslips.

### HR Management
- **Employee Directory**: Centralized management of all employee records, departments, and designations.
- **Attendance Tracking**: Clock-in/Clock-out functionality with daily logs and a live "Status Board" to see who's currently working.
- **Leave Workflows**: Multi-stage leave approval system (HR Review ➔ Payroll Review) with custom policy limits, paid/unpaid flagging, and automated carry-forward tracking.
- **Holiday Calendar**: Track company and regional holidays with a one-click integration to seed standard national holidays.

### Advanced Payroll Engine
- **Automated Pro-Rata**: Automatically adjusts salaries based on mid-month join dates or unpaid leave (Loss of Pay) deductions calculated directly from the attendance and leave engine.
- **Dynamic Salary Structures**: Configurable Earnings (Basic, HRA, LTA, Bonus, etc.) and Deductions (PF, Professional Tax, TDS).
- **PDF Generation**: Instantly generates downloadable, pixel-perfect PDF payslips for employees.

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%">
</div>

## 📂 Project Structure

```text
NitroNexus-empay/
├── backend/                  # FastAPI Backend
│   ├── alembic/              # Database schema migrations
│   ├── app/
│   │   ├── api/v1/           # API Endpoints (holidays, payroll, employees, etc.)
│   │   ├── core/             # Configuration & Security (JWT, DB connect)
│   │   ├── models/           # SQLAlchemy DB Models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── services/         # Core business logic & computations
│   ├── scripts/              # Data seeding & utility scripts
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # React.js Frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable React UI components & layout
│   │   ├── context/          # React Context (Auth & Role management)
│   │   ├── pages/            # Page components grouped by domain (HR, Payroll, Admin, Employee)
│   │   ├── services/         # API integration layers
│   │   ├── utils/            # Helper functions & mock data fallback
│   │   └── App.jsx           # Main router & role-based routing wrapper
│   └── package.json          # Node dependencies
│
└── README.md                 # You are here
```

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%">
</div>

## Tech Stack

### Frontend
- **React.js** (Vite for fast builds)
- **Framer Motion** (For smooth micro-animations and page transitions)
- **Lucide React** (Clean, modern iconography)
- **Vanilla CSS** (Custom, scalable CSS variables and design tokens)

### Backend
- **Python / FastAPI** (High-performance API routing and data validation)
- **SQLAlchemy** (Robust ORM for database interactions)
- **PostgreSQL** (Relational database for ACID compliance)
- **Alembic** (Database migration management)
- **Pydantic** (Strict schema validation)

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%">
</div>

## Local Development Setup

### 1. Backend Setup

Ensure you have Python 3.10+ and PostgreSQL installed.

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure Environment Variables
# Create a .env file based on standard variables:
# DATABASE_URL=postgresql://user:password@localhost/empay
# SECRET_KEY=your_secret_key

# Run Migrations
alembic upgrade head

# Seed Initial Data (Optional)
python scripts/seed.py

# Start the Server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

### 2. Frontend Setup

Ensure you have Node.js 18+ installed.

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%">
</div>

## Security Highlights

- JWT-based authentication with auto-refresh mechanism.
- Strict backend API dependency injection restricting routes by user role.
- Targeted payload validation (e.g., Payroll Officers are tightly restricted from editing non-salary employee metadata).
- Standardized error handling and rollback mechanisms.

---
