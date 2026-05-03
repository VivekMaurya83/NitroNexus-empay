# EmPay - Smart HR & Payroll Management System

EmPay is a modern, full-stack Human Resources and Payroll Management platform built to handle the end-to-end employee lifecycle. Designed with a focus on usability, reliability, and automated workflows, EmPay allows organizations to effortlessly manage employee data, attendance, leaves, and complex payroll processes.


## Features

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
- **Transactional Atomicity**: EmPay's backend payroll engine safely processes hundreds of employees per payrun with full rollback support on failure, preventing orphaned records.
- **Dynamic Salary Structures**: Configurable Earnings (Basic, HRA, LTA, Bonus, etc.) and Deductions (PF, Professional Tax, TDS).
- **Automated Pro-Rata**: Automatically adjusts salaries based on mid-month join dates or unpaid leave (Loss of Pay) deductions calculated directly from the attendance and leave engine.
- **PDF Generation**: Instantly generates downloadable, pixel-perfect PDF payslips for employees.

## Tech Stack

### Frontend
- **React.js** (Vite for fast builds)
- **Framer Motion** (For smooth micro-animations and page transitions)
- **Lucide React** (Clean, modern iconography)
- **Vanilla CSS** (Custom, scalable CSS variables and design tokens—no heavy utility frameworks)

### Backend
- **Python / FastAPI** (High-performance API routing and data validation)
- **SQLAlchemy** (Robust ORM for database interactions)
- **PostgreSQL** (Relational database for ACID compliance)
- **Alembic** (Database migration management)
- **Pydantic** (Strict schema validation)

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

## Security Highlights

- JWT-based authentication with auto-refresh mechanism.
- Strict backend API dependency injection restricting routes by user role.
- Targeted payload validation (e.g., Payroll Officers are tightly restricted from editing non-salary employee metadata).
- Standardized error handling and rollback mechanisms.

## License

This project is proprietary and confidential. Unauthorized copying of files, via any medium, is strictly prohibited.
