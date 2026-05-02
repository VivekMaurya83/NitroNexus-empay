from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.user import User
from app.models.leave import LeaveApplication, LeavePolicy, LeaveAllocation
from app.models.enums import UserRole, LeaveStatus
from app.schemas.leave import (
    LeavePolicyCreate, LeavePolicyOut,
    LeaveAllocationCreate, LeaveAllocationOut,
    LeaveApplicationCreate, LeaveReviewAction,
    LeaveApplicationOut,
)
from app.schemas.common import ResponseModel
from app.api.v1.deps import get_current_user, require_hr, require_hr_or_payroll
from app.services import leave_service
from app.services.audit_service import log_action

router = APIRouter(prefix="/leaves", tags=["Leaves"])


# ── Policies ──────────────────────────────────────────────────────────────────

@router.post("/policies", response_model=ResponseModel, status_code=201)
def create_policy(p: LeavePolicyCreate, db: Session = Depends(get_db),
                  cu: User = Depends(require_hr_or_payroll)):
    existing = db.query(LeavePolicy).filter(
        LeavePolicy.company_id == cu.company_id,
        LeavePolicy.leave_type == p.leave_type,
    ).first()
    if existing:
        raise HTTPException(400, f"Policy for {p.leave_type.value} already exists")
    policy = LeavePolicy(company_id=cu.company_id, **p.model_dump())
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return ResponseModel(data=LeavePolicyOut.model_validate(policy))


@router.get("/policies", response_model=ResponseModel)
def list_policies(db: Session = Depends(get_db),
                  cu: User = Depends(get_current_user)):
    policies = db.query(LeavePolicy).filter(
        LeavePolicy.company_id == cu.company_id,
    ).all()
    return ResponseModel(data=[LeavePolicyOut.model_validate(p) for p in policies])


# ── Allocations ───────────────────────────────────────────────────────────────

@router.post("/allocations", response_model=ResponseModel, status_code=201)
def create_allocation(p: LeaveAllocationCreate, db: Session = Depends(get_db),
                      cu: User = Depends(require_hr_or_payroll)):
    existing = db.query(LeaveAllocation).filter(
        LeaveAllocation.company_id == cu.company_id,
        LeaveAllocation.employee_id == p.employee_id,
        LeaveAllocation.policy_id  == p.policy_id,
        LeaveAllocation.year       == p.year,
    ).first()
    if existing:
        raise HTTPException(400, "Allocation already exists for this employee/policy/year")
    alloc = LeaveAllocation(
        company_id=cu.company_id,
        employee_id=p.employee_id, policy_id=p.policy_id,
        year=p.year, total_days=p.total_days,
        used_days=0, remaining_days=p.total_days,
    )
    db.add(alloc)
    db.commit()
    db.refresh(alloc)
    log_action(db, cu.id, "create_allocation", "LeaveAllocation", alloc.id,
               f"Allocated {p.total_days} days for emp {p.employee_id}",
               company_id=cu.company_id)
    return ResponseModel(data=LeaveAllocationOut.model_validate(alloc))


@router.get("/allocations/{employee_id}", response_model=ResponseModel)
def get_allocations(employee_id: int, year: Optional[int] = Query(None),
                    db: Session = Depends(get_db),
                    cu: User = Depends(get_current_user)):
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee or cu.employee.id != employee_id:
            raise HTTPException(403, "Access denied")
    q = db.query(LeaveAllocation).filter(
        LeaveAllocation.company_id == cu.company_id,
        LeaveAllocation.employee_id == employee_id,
    )
    if year:
        q = q.filter(LeaveAllocation.year == year)
    allocs = q.all()
    return ResponseModel(data=[LeaveAllocationOut.model_validate(a) for a in allocs])


# ── Applications ──────────────────────────────────────────────────────────────

@router.post("/apply", response_model=ResponseModel, status_code=201)
def apply_leave(p: LeaveApplicationCreate, db: Session = Depends(get_db),
                cu: User = Depends(get_current_user)):
    if not cu.employee:
        raise HTTPException(400, "No employee profile found for your account")
    try:
        app = leave_service.apply_leave(db, cu.employee.id, p, cu.company_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    log_action(db, cu.id, "apply_leave", "LeaveApplication", app.id,
               f"{p.leave_type.value} from {p.start_date} to {p.end_date}",
               company_id=cu.company_id)
    return ResponseModel(data=LeaveApplicationOut.model_validate(app))


@router.get("/", response_model=ResponseModel)
def list_leave_applications(
    status: Optional[LeaveStatus] = Query(None),
    employee_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    cu: User = Depends(get_current_user),
):
    q = db.query(LeaveApplication).filter(
        LeaveApplication.company_id == cu.company_id,
    )
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee:
            raise HTTPException(400, "No employee profile")
        q = q.filter(LeaveApplication.employee_id == cu.employee.id)
    else:
        if employee_id:
            q = q.filter(LeaveApplication.employee_id == employee_id)
    if status:
        q = q.filter(LeaveApplication.status == status)
    total = q.count()
    apps  = q.order_by(LeaveApplication.created_at.desc()).offset(skip).limit(limit).all()
    return ResponseModel(data={
        "total": total,
        "applications": [LeaveApplicationOut.model_validate(a) for a in apps],
    })


@router.get("/types", response_model=ResponseModel)
def get_leave_types(db: Session = Depends(get_db),
                    cu: User = Depends(get_current_user)):
    # Return both the enum values and the existing policies
    from app.models.enums import LeaveType
    types = [t.value for t in LeaveType]
    policies = db.query(LeavePolicy).filter(
        LeavePolicy.company_id == cu.company_id
    ).all()
    return ResponseModel(data={
        "available_types": types,
        "policies": [LeavePolicyOut.model_validate(p) for p in policies]
    })


@router.get("/{application_id}", response_model=ResponseModel)
def get_leave_application(application_id: int, db: Session = Depends(get_db),
                           cu: User = Depends(get_current_user)):
    app = db.query(LeaveApplication).filter(
        LeaveApplication.id == application_id,
        LeaveApplication.company_id == cu.company_id,
    ).first()
    if not app:
        raise HTTPException(404, "Leave application not found")
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee or cu.employee.id != app.employee_id:
            raise HTTPException(403, "Access denied")
    return ResponseModel(data=LeaveApplicationOut.model_validate(app))


@router.patch("/{application_id}/cancel", response_model=ResponseModel)
def cancel_leave(application_id: int, db: Session = Depends(get_db),
                 cu: User = Depends(get_current_user)):
    if not cu.employee:
        raise HTTPException(400, "No employee profile")
    try:
        app = leave_service.cancel_leave(db, application_id, cu.employee.id,
                                         cu.company_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    log_action(db, cu.id, "cancel_leave", "LeaveApplication", application_id,
               "Cancelled", company_id=cu.company_id)
    return ResponseModel(data=LeaveApplicationOut.model_validate(app))


@router.patch("/{application_id}/hr-review", response_model=ResponseModel)
def hr_review(application_id: int, p: LeaveReviewAction,
              db: Session = Depends(get_db), cu: User = Depends(require_hr)):
    try:
        app = leave_service.hr_review_leave(db, application_id, cu.id, p,
                                            cu.company_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    log_action(db, cu.id, f"hr_{p.action}_leave", "LeaveApplication",
               application_id, p.remarks or "", company_id=cu.company_id)
    return ResponseModel(data=LeaveApplicationOut.model_validate(app))


@router.patch("/{application_id}/payroll-review", response_model=ResponseModel)
def payroll_review(application_id: int, p: LeaveReviewAction,
                   db: Session = Depends(get_db),
                   cu: User = Depends(require_hr_or_payroll)):
    try:
        app = leave_service.payroll_review_leave(db, application_id, cu.id, p,
                                                  cu.company_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    log_action(db, cu.id, f"payroll_{p.action}_leave", "LeaveApplication",
               application_id, p.remarks or "", company_id=cu.company_id)
    return ResponseModel(data=LeaveApplicationOut.model_validate(app))