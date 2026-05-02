import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import date
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.company import Company
from app.models.user import User
from app.models.employee import Employee, Department, Designation
from app.models.salary import SalaryStructure
from app.models.leave import LeavePolicy, LeaveAllocation
from app.models.enums import (UserRole, LeaveType, EmploymentType, EmploymentStatus)

db = SessionLocal()


def seed():
    # ── Company (must be first — everything FKs to this) ─────────────────────
    company = db.query(Company).filter(Company.name == "NitroNexus Technologies").first()
    if not company:
        company = Company(
            name="NitroNexus Technologies",
            short_code="NN",
            is_active=True,
        )
        db.add(company)
        db.flush()
    print(f"Company: {company.name} (id={company.id})")

    # ── Departments ───────────────────────────────────────────────────────────
    depts = {}
    for name in ["Engineering", "Human Resources", "Finance", "Operations"]:
        d = db.query(Department).filter(Department.name == name).first()
        if not d:
            d = Department(name=name, company_id=company.id)
            db.add(d); db.flush()
        depts[name] = d

    # ── Designations ──────────────────────────────────────────────────────────
    desigs = {}
    for title, dept in [
        ("Software Engineer",  "Engineering"),
        ("HR Manager",         "Human Resources"),
        ("Payroll Specialist", "Finance"),
        ("Operations Lead",    "Operations"),
    ]:
        des = db.query(Designation).filter(Designation.title == title).first()
        if not des:
            des = Designation(title=title, department_id=depts[dept].id)
            db.add(des); db.flush()
        desigs[title] = des

    # ── Users (with company_id) ───────────────────────────────────────────────
    users = {}
    for email, role in [
        ("admin@empay.com",   UserRole.ADMIN),
        ("hr@empay.com",      UserRole.HR_OFFICER),
        ("payroll@empay.com", UserRole.PAYROLL_OFFICER),
        ("alice@empay.com",   UserRole.EMPLOYEE),
        ("bob@empay.com",     UserRole.EMPLOYEE),
        ("carol@empay.com",   UserRole.EMPLOYEE),
    ]:
        u = db.query(User).filter(User.email == email).first()
        if not u:
            u = User(
                email=email,
                hashed_password=hash_password("Empay@123"),
                role=role,
                is_active=True,
                company_id=company.id,      # ← FIXED
            )
            db.add(u); db.flush()
        elif u.company_id is None:
            # Fix existing users that were seeded without company_id
            u.company_id = company.id
            db.flush()
        users[email] = u

    # ── Employees ─────────────────────────────────────────────────────────────
    emps = {}
    for i, (email, first, last, doj, dept, desig) in enumerate([
        ("alice@empay.com", "Alice", "Fernandez", date(2023, 3, 1),  "Engineering",     "Software Engineer"),
        ("bob@empay.com",   "Bob",   "Patel",     date(2022, 6, 15), "Finance",         "Payroll Specialist"),
        ("carol@empay.com", "Carol", "Mehta",     date(2023, 7, 1),  "Operations",      "Operations Lead"),
        ("hr@empay.com",    "Priya", "Sharma",    date(2022, 1, 10), "Human Resources", "HR Manager"),
    ], start=1):
        emp = db.query(Employee).filter(Employee.user_id == users[email].id).first()
        if not emp:
            emp = Employee(
                user_id=users[email].id,
                company_id=company.id,                  # ← FIXED
                employee_code=f"EMP{str(1000+i).zfill(6)}",
                first_name=first, last_name=last,
                date_of_joining=doj,
                department_id=depts[dept].id,
                designation_id=desigs[desig].id,
                employment_type=EmploymentType.FULL_TIME,
                employment_status=EmploymentStatus.ACTIVE,
            )
            db.add(emp); db.flush()
        elif emp.company_id is None:
            emp.company_id = company.id
            db.flush()
        emps[email] = emp

    # ── Salary Structures ─────────────────────────────────────────────────────
    for email, basic, hra, conv, med, spl, lta, bonus in [
        ("alice@empay.com", 45000, 18000, 1600, 1250, 4500, 1250, 3000),
        ("bob@empay.com",   40000, 16000, 1600, 1250, 3500, 1250, 2000),
        ("carol@empay.com", 38000, 15200, 1600, 1250, 3000, 1250, 1500),
        ("hr@empay.com",    50000, 20000, 1600, 1250, 5000, 1250, 5000),
    ]:
        sal = db.query(SalaryStructure).filter(
            SalaryStructure.employee_id == emps[email].id,
            SalaryStructure.is_active == True,
        ).first()
        if not sal:
            db.add(SalaryStructure(
                employee_id=emps[email].id,
                company_id=company.id,                  # ← FIXED
                basic=basic, hra=hra, conveyance=conv,
                medical=med, special_allowance=spl,
                lta=lta, bonus=bonus,
                pf_applicable=True,
                professional_tax_state="Maharashtra",
                is_active=True,
            ))

    # ── Leave Policies ────────────────────────────────────────────────────────
    policies = {}
    for ltype, days, paid, carry in [
        (LeaveType.CASUAL, 12, True,  False),
        (LeaveType.SICK,   12, True,  False),
        (LeaveType.EARNED, 15, True,  True),
        (LeaveType.UNPAID,  0, False, False),
    ]:
        p = db.query(LeavePolicy).filter(LeavePolicy.leave_type == ltype).first()
        if not p:
            p = LeavePolicy(
                leave_type=ltype,
                max_days_per_year=days,
                is_paid=paid,
                carry_forward=carry,
                company_id=company.id,                  # ← FIXED
            )
            db.add(p); db.flush()
        policies[ltype] = p

    # ── Leave Allocations ─────────────────────────────────────────────────────
    for email in emps:
        for ltype, days in [
            (LeaveType.CASUAL, 12),
            (LeaveType.SICK,   12),
            (LeaveType.EARNED, 15),
        ]:
            alloc = db.query(LeaveAllocation).filter(
                LeaveAllocation.employee_id == emps[email].id,
                LeaveAllocation.policy_id == policies[ltype].id,
                LeaveAllocation.year == 2026,
            ).first()
            if not alloc:
                db.add(LeaveAllocation(
                    employee_id=emps[email].id,
                    policy_id=policies[ltype].id,
                    company_id=company.id,              # ← FIXED
                    year=2026, total_days=days,
                    used_days=0, remaining_days=days,
                ))

    db.commit()
    print("\nSeed complete!")
    print(f"  Company ID : {company.id}")
    print("  admin@empay.com   / Empay@123")
    print("  hr@empay.com      / Empay@123")
    print("  payroll@empay.com / Empay@123")
    print("  alice@empay.com   / Empay@123")


if __name__ == "__main__":
    try:
        seed()
    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()