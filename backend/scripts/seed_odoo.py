import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import date
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.company import Company
from app.models.user import User
from app.models.employee import Employee, Department, Designation
from app.models.salary import SalaryStructure
from app.models.enums import UserRole, EmploymentType, EmploymentStatus
from app.services.payroll_service import generate_payrun

db = SessionLocal()

def seed_odoo():
    company = db.query(Company).filter(Company.name == "Odoo India").first()
    if not company:
        print("Company Odoo India not found.")
        return

    # Create Departments & Designations if needed
    depts = {}
    for name in ["Sales", "Engineering", "Marketing", "Support"]:
        d = db.query(Department).filter(Department.name == name, Department.company_id == company.id).first()
        if not d:
            d = Department(name=name, company_id=company.id)
            db.add(d)
            db.flush()
        depts[name] = d

    desigs = {}
    for title, dept in [
        ("Account Executive", "Sales"),
        ("Frontend Dev", "Engineering"),
        ("Backend Dev", "Engineering"),
        ("SEO Expert", "Marketing"),
        ("Support Agent", "Support"),
        ("Senior Support Agent", "Support"),
    ]:
        des = db.query(Designation).filter(Designation.title == title, Designation.department_id == depts[dept].id).first()
        if not des:
            des = Designation(title=title, department_id=depts[dept].id)
            db.add(des)
            db.flush()
        desigs[title] = des

    admin_user = db.query(User).filter(User.email.ilike('%vivekmaurya8311%')).first()
    if not admin_user:
        print("Could not find admin user.")
        return

    emps_data = [
        ("mark.sales@odoo.com", "Mark", "Johnson", date(2023, 1, 15), "Sales", "Account Executive", 35000, 14000),
        ("lucy.frontend@odoo.com", "Lucy", "Liu", date(2024, 2, 10), "Engineering", "Frontend Dev", 60000, 24000),
        ("kevin.backend@odoo.com", "Kevin", "Smith", date(2022, 11, 5), "Engineering", "Backend Dev", 75000, 30000),
        ("sara.marketing@odoo.com", "Sara", "Connor", date(2023, 6, 20), "Marketing", "SEO Expert", 45000, 18000),
        ("tim.support@odoo.com", "Tim", "Drake", date(2025, 1, 5), "Support", "Support Agent", 25000, 10000),
        ("jane.support@odoo.com", "Jane", "Doe", date(2021, 8, 12), "Support", "Senior Support Agent", 35000, 14000),
    ]

    for i, (email, first, last, doj, dept, desig, basic, hra) in enumerate(emps_data):
        u = db.query(User).filter(User.email == email).first()
        if not u:
            u = User(
                email=email,
                hashed_password=hash_password("Odoo@123"),
                role=UserRole.EMPLOYEE,
                is_active=True,
                company_id=company.id,
            )
            db.add(u)
            db.flush()

        emp = db.query(Employee).filter(Employee.user_id == u.id).first()
        if not emp:
            emp = Employee(
                user_id=u.id,
                company_id=company.id,
                employee_code=f"OD{str(2000+i).zfill(4)}",
                first_name=first, last_name=last,
                date_of_joining=doj,
                department_id=depts[dept].id,
                designation_id=desigs[desig].id,
                employment_type=EmploymentType.FULL_TIME,
                employment_status=EmploymentStatus.ACTIVE,
            )
            db.add(emp)
            db.flush()

        sal = db.query(SalaryStructure).filter(
            SalaryStructure.employee_id == emp.id,
            SalaryStructure.is_active == True,
        ).first()
        if not sal:
            db.add(SalaryStructure(
                employee_id=emp.id,
                company_id=company.id,
                basic=basic, hra=hra, conveyance=2000,
                medical=1500, special_allowance=5000,
                lta=2000, bonus=3000,
                pf_applicable=True,
                professional_tax_state="Maharashtra",
                is_active=True,
            ))
            db.flush()

    db.commit()
    print("Seed data users created.")

    print("Generating Payrun for April 2026...")
    try:
        pr = generate_payrun(db, month=4, year=2026, generated_by_id=admin_user.id, company_id=company.id)
        db.commit()
        print(f"Payrun generated! ID: {pr.id}, Total Gross: {pr.total_gross}, Employees: {pr.employee_count}")
    except Exception as e:
        db.rollback()
        print("Error generating payrun:", e)

if __name__ == "__main__":
    try:
        seed_odoo()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
