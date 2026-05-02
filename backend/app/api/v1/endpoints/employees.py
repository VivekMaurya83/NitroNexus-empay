from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.user import User
from app.models.employee import Employee, Department, Designation
from app.models.enums import UserRole, EmploymentStatus
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate, EmployeeOut,
    DepartmentCreate, DepartmentOut,
    DesignationCreate, DesignationOut,
)
from app.schemas.common import ResponseModel
from app.api.v1.deps import get_current_user, require_hr, require_admin
from app.services.audit_service import log_action

router = APIRouter(prefix="/employees", tags=["Employees"])


# ── Departments ───────────────────────────────────────────────────────────────

@router.post("/departments", response_model=ResponseModel, status_code=201)
def create_department(p: DepartmentCreate, db: Session = Depends(get_db),
                      cu: User = Depends(require_hr)):
    if db.query(Department).filter(Department.name == p.name).first():
        raise HTTPException(400, "Department already exists")
    dept = Department(name=p.name, description=p.description)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    log_action(db, cu.id, "create_department", "Department", dept.id, dept.name)
    return ResponseModel(data=DepartmentOut.model_validate(dept), status_code=201)


@router.get("/departments", response_model=ResponseModel)
def list_departments(db: Session = Depends(get_db),
                     _: User = Depends(get_current_user)):
    depts = db.query(Department).order_by(Department.name).all()
    return ResponseModel(data=[DepartmentOut.model_validate(d) for d in depts])


# ── Designations ──────────────────────────────────────────────────────────────

@router.post("/designations", response_model=ResponseModel, status_code=201)
def create_designation(p: DesignationCreate, db: Session = Depends(get_db),
                       cu: User = Depends(require_hr)):
    des = Designation(title=p.title, department_id=p.department_id)
    db.add(des)
    db.commit()
    db.refresh(des)
    log_action(db, cu.id, "create_designation", "Designation", des.id, des.title)
    return ResponseModel(data=DesignationOut.model_validate(des))


@router.get("/designations", response_model=ResponseModel)
def list_designations(db: Session = Depends(get_db),
                      _: User = Depends(get_current_user)):
    desigs = db.query(Designation).order_by(Designation.title).all()
    return ResponseModel(data=[DesignationOut.model_validate(d) for d in desigs])


# ── Employees ─────────────────────────────────────────────────────────────────

@router.post("/", response_model=ResponseModel, status_code=201)
def create_employee(p: EmployeeCreate, db: Session = Depends(get_db),
                    cu: User = Depends(require_hr)):
    if db.query(Employee).filter(Employee.user_id == p.user_id).first():
        raise HTTPException(400, "Employee profile already exists for this user")

    # auto-generate employee code
    count = db.query(Employee).count()
    code  = f"EMP{str(1001 + count).zfill(6)}"
    while db.query(Employee).filter(Employee.employee_code == code).first():
        count += 1
        code = f"EMP{str(1001 + count).zfill(6)}"

    emp = Employee(
        user_id=p.user_id, employee_code=code,
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
               f"{emp.first_name} {emp.last_name} ({emp.employee_code})")
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

    q = db.query(Employee)
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
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
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
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    # Employees can update only their own basic contact info
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee or cu.employee.id != employee_id:
            raise HTTPException(403, "Access denied")
        allowed = {"phone", "address", "bank_name", "account_number", "ifsc_code"}
        updates = {k: v for k, v in p.model_dump(exclude_none=True).items()
                   if k in allowed}
    else:
        updates = p.model_dump(exclude_none=True)

    for field, value in updates.items():
        setattr(emp, field, value)
    db.commit()
    db.refresh(emp)
    log_action(db, cu.id, "update_employee", "Employee", emp.id,
               f"Updated: {list(updates.keys())}")
    return ResponseModel(data=EmployeeOut.model_validate(emp))


@router.delete("/{employee_id}", response_model=ResponseModel)
def terminate_employee(employee_id: int, db: Session = Depends(get_db),
                       cu: User = Depends(require_hr)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    emp.employment_status = EmploymentStatus.TERMINATED
    db.commit()
    log_action(db, cu.id, "terminate_employee", "Employee",
               employee_id, f"Terminated: {emp.employee_code}")
    return ResponseModel(message=f"Employee {emp.employee_code} terminated")