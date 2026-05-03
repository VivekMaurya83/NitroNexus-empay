from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.user import User
from app.models.company import Company
from app.models.employee import Employee, Department, Designation
from app.models.enums import UserRole, EmploymentStatus
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate, EmployeeOut,
    DepartmentCreate, DepartmentOut,
    DesignationCreate, DesignationOut,
)
from pydantic import BaseModel
from app.schemas.common import ResponseModel
from app.api.v1.deps import get_current_user, require_hr, require_admin
from app.services.audit_service import log_action
from app.utils.login_id import generate_login_id, company_short_code

router = APIRouter(prefix="/employees", tags=["Employees"])


# ── Departments ───────────────────────────────────────────────────────────────

@router.post("/departments", response_model=ResponseModel, status_code=201)
def create_department(p: DepartmentCreate, db: Session = Depends(get_db),
                      cu: User = Depends(require_hr)):
    if db.query(Department).filter(
        Department.company_id == cu.company_id,
        Department.name == p.name,
    ).first():
        raise HTTPException(400, "Department already exists")
    dept = Department(
        company_id=cu.company_id,
        name=p.name,
        description=p.description,
        manager_name=p.manager_name,
        headcount=p.headcount,
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    log_action(db, cu.id, "create_department", "Department", dept.id, dept.name,
               company_id=cu.company_id)
    return ResponseModel(data=DepartmentOut.model_validate(dept), status_code=201)


@router.get("/departments", response_model=ResponseModel)
def list_departments(db: Session = Depends(get_db),
                     cu: User = Depends(get_current_user)):
    depts = (db.query(Department)
               .filter(Department.company_id == cu.company_id)
               .order_by(Department.name).all())
    
    # Simple count for each department
    results = []
    for d in depts:
        d_out = DepartmentOut.model_validate(d)
        d_out.headcount_actual = db.query(Employee).filter(Employee.department_id == d.id).count()
        results.append(d_out)
        
    return ResponseModel(data=results)


@router.delete("/departments/{dept_id}", response_model=ResponseModel)
def delete_department(dept_id: int, db: Session = Depends(get_db),
                      cu: User = Depends(require_hr)):
    dept = db.query(Department).filter(
        Department.id == dept_id,
        Department.company_id == cu.company_id,
    ).first()
    if not dept:
        raise HTTPException(404, "Department not found")
    # Check if employees are assigned to this department
    if db.query(Employee).filter(Employee.department_id == dept_id).first():
        raise HTTPException(400, "Cannot delete department with active employees")
    db.delete(dept)
    db.commit()
    log_action(db, cu.id, "delete_department", "Department", dept_id,
               f"Deleted: {dept.name}", company_id=cu.company_id)
    return ResponseModel(message="Department deleted")


# ── Designations ──────────────────────────────────────────────────────────────

@router.post("/designations", response_model=ResponseModel, status_code=201)
def create_designation(p: DesignationCreate, db: Session = Depends(get_db),
                       cu: User = Depends(require_hr)):
    des = Designation(company_id=cu.company_id, title=p.title,
                      department_id=p.department_id)
    db.add(des)
    db.commit()
    db.refresh(des)
    log_action(db, cu.id, "create_designation", "Designation", des.id, des.title,
               company_id=cu.company_id)
    return ResponseModel(data=DesignationOut.model_validate(des))


@router.get("/designations", response_model=ResponseModel)
def list_designations(db: Session = Depends(get_db),
                      cu: User = Depends(get_current_user)):
    desigs = (db.query(Designation)
                .filter(Designation.company_id == cu.company_id)
                .order_by(Designation.title).all())
    return ResponseModel(data=[DesignationOut.model_validate(d) for d in desigs])


@router.delete("/designations/{desig_id}", response_model=ResponseModel)
def delete_designation(desig_id: int, db: Session = Depends(get_db),
                       cu: User = Depends(require_hr)):
    des = db.query(Designation).filter(
        Designation.id == desig_id,
        Designation.company_id == cu.company_id,
    ).first()
    if not des:
        raise HTTPException(404, "Designation not found")
    # Check if employees are assigned
    if db.query(Employee).filter(Employee.designation_id == desig_id).first():
        raise HTTPException(400, "Cannot delete designation with active employees")
    db.delete(des)
    db.commit()
    log_action(db, cu.id, "delete_designation", "Designation", desig_id,
               f"Deleted: {des.title}", company_id=cu.company_id)
    return ResponseModel(message="Designation deleted")


# ── Employees ─────────────────────────────────────────────────────────────────

@router.post("/", response_model=ResponseModel, status_code=201)
def create_employee(p: EmployeeCreate, db: Session = Depends(get_db),
                    cu: User = Depends(require_hr)):
    if db.query(Employee).filter(Employee.user_id == p.user_id).first():
        raise HTTPException(400, "Employee profile already exists for this user")

    # Auto-generate employee code scoped to company
    count = db.query(Employee).filter(Employee.company_id == cu.company_id).count()
    code  = f"EMP{str(1001 + count).zfill(6)}"
    while db.query(Employee).filter(Employee.employee_code == code).first():
        count += 1
        code = f"EMP{str(1001 + count).zfill(6)}"

    # Generate smart Login ID
    company = db.query(Company).filter(Company.id == cu.company_id).first()
    co_code = company.short_code if company and company.short_code else \
              (company_short_code(company.name) if company else "XX")
    lid = generate_login_id(co_code, p.first_name, p.last_name,
                            p.date_of_joining.year, db)

    emp = Employee(
        company_id=cu.company_id,
        user_id=p.user_id, employee_code=code,
        login_id=lid,
        first_name=p.first_name, last_name=p.last_name,
        date_of_joining=p.date_of_joining, date_of_birth=p.date_of_birth,
        department_id=p.department_id, designation_id=p.designation_id,
        employment_type=p.employment_type, employment_status=p.employment_status,
        phone=p.phone, address=p.address, pan_number=p.pan_number,
        bank_name=p.bank_name, account_number=p.account_number,
        ifsc_code=p.ifsc_code,
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    log_action(db, cu.id, "create_employee", "Employee", emp.id,
               f"{emp.first_name} {emp.last_name} ({emp.employee_code}) login:{lid}",
               company_id=cu.company_id)
    return ResponseModel(data=EmployeeOut.model_validate(emp))


@router.get("/", response_model=ResponseModel)
def list_employees(
    department_id: Optional[int] = Query(None),
    status: Optional[EmploymentStatus] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    cu: User = Depends(get_current_user),
):
    # Employees can only see themselves
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee:
            raise HTTPException(400, "No employee profile found")
        return ResponseModel(data=[EmployeeOut.model_validate(cu.employee)])

    q = db.query(Employee).filter(Employee.company_id == cu.company_id)
    if department_id:
        q = q.filter(Employee.department_id == department_id)
    if status:
        q = q.filter(Employee.employment_status == status)
    if search:
        term = f"%{search}%"
        q = q.filter(
            Employee.first_name.ilike(term)
            | Employee.last_name.ilike(term)
            | Employee.employee_code.ilike(term)
        )
    total = q.count()
    emps  = q.offset(skip).limit(limit).all()
    return ResponseModel(data={
        "total": total, "skip": skip, "limit": limit,
        "employees": [EmployeeOut.model_validate(e) for e in emps],
    })


@router.get("/{employee_id}", response_model=ResponseModel)
def get_employee(employee_id: int, db: Session = Depends(get_db),
                 cu: User = Depends(get_current_user)):
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == cu.company_id,
    ).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee or cu.employee.id != employee_id:
            raise HTTPException(403, "Access denied")
    return ResponseModel(data=EmployeeOut.model_validate(emp))


@router.patch("/{employee_id}", response_model=ResponseModel)
def update_employee(employee_id: int, p: EmployeeUpdate,
                    db: Session = Depends(get_db),
                    cu: User = Depends(get_current_user)):
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == cu.company_id,
    ).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    # Employees can update only their own basic contact info
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee or cu.employee.id != employee_id:
            raise HTTPException(403, "Access denied")
        allowed = {"phone", "address", "bank_name", "account_number", "ifsc_code"}
        updates = {k: v for k, v in p.model_dump(exclude_none=True).items()
                   if k in allowed}
    # Payroll officers can only update salary/bank related info
    elif cu.role == UserRole.PAYROLL_OFFICER:
        allowed = {"pan_number", "bank_name", "account_number", "ifsc_code"}
        updates = {k: v for k, v in p.model_dump(exclude_none=True).items()
                   if k in allowed}
    else:
        updates = p.model_dump(exclude_none=True)

    for field, value in updates.items():
        setattr(emp, field, value)
    db.commit()
    db.refresh(emp)
    log_action(db, cu.id, "update_employee", "Employee", emp.id,
               f"Updated: {list(updates.keys())}", company_id=cu.company_id)
    return ResponseModel(data=EmployeeOut.model_validate(emp))


@router.delete("/{employee_id}", response_model=ResponseModel)
def delete_employee(employee_id: int, db: Session = Depends(get_db),
                       cu: User = Depends(require_hr)):
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == cu.company_id,
    ).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
        
    user_to_delete = db.query(User).filter(User.id == emp.user_id).first()
    db.delete(emp)
    if user_to_delete:
        db.delete(user_to_delete)
        
    db.commit()
    log_action(db, cu.id, "delete_employee", "Employee",
               employee_id, f"Deleted: {emp.employee_code}",
               company_id=cu.company_id)
    return ResponseModel(message=f"Employee {emp.employee_code} deleted")


class NudgeRequest(BaseModel):
    type: str

@router.post("/{employee_id}/nudge", response_model=ResponseModel)
def send_employee_nudge(
    employee_id: int,
    payload: NudgeRequest,
    db: Session = Depends(get_db),
    cu: User = Depends(require_hr)
):
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == cu.company_id,
    ).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
        
    from app.services.whatsapp_service import send_whatsapp_message
    from app.services.email_service import send_nudge_email
    
    message = "Please log into EmPay to update your missing Bank Details."
    if payload.type == "no_bank_details":
        message = "Action Required: Your Bank Details are missing. Your salary cannot be processed until you update them in the EmPay portal."
    
    if emp.phone:
        wa_msg = f"⚠️ *EmPay Alert*\n\nHello {emp.first_name},\n{message}"
        send_whatsapp_message(emp.phone, wa_msg)
        
    if emp.user and emp.user.email:
        send_nudge_email(
            to=emp.user.email,
            name=f"{emp.first_name} {emp.last_name}",
            message=message
        )
        
    log_action(db, cu.id, "nudge_employee", "Employee", emp.id,
               f"Sent nudge ({payload.type})", company_id=cu.company_id)
    return ResponseModel(message="Nudge sent successfully")