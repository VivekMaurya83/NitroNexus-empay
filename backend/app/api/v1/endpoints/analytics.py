from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import ResponseModel
from app.api.v1.deps import get_current_user, require_hr_or_payroll
from app.services.analytics_service import (
    get_attendance_heatmap,
    get_department_payroll_breakdown,
    get_leave_utilization,
    get_payroll_trend,
    get_headcount_by_department,
)
from app.models.enums import UserRole
from fastapi import HTTPException

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/attendance-heatmap/{employee_id}", response_model=ResponseModel)
def attendance_heatmap(
    employee_id: int,
    month: int = Query(..., ge=1, le=12),
    year:  int = Query(..., ge=2020),
    db: Session = Depends(get_db),
    cu: User = Depends(get_current_user),
):
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee or cu.employee.id != employee_id:
            raise HTTPException(403, "Access denied")
    return ResponseModel(data=get_attendance_heatmap(db, employee_id, month, year))


@router.get("/payroll-breakdown", response_model=ResponseModel)
def payroll_breakdown(
    month: int = Query(..., ge=1, le=12),
    year:  int = Query(..., ge=2020),
    db: Session = Depends(get_db),
    cu: User = Depends(require_hr_or_payroll),
):
    return ResponseModel(
        data=get_department_payroll_breakdown(db, month, year, cu.company_id)
    )


@router.get("/leave-utilization", response_model=ResponseModel)
def leave_utilization(
    year: int = Query(..., ge=2020),
    db: Session = Depends(get_db),
    cu: User = Depends(require_hr_or_payroll),
):
    return ResponseModel(data=get_leave_utilization(db, year, cu.company_id))


@router.get("/payroll-trend", response_model=ResponseModel)
def payroll_trend(
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
    cu: User = Depends(require_hr_or_payroll),
):
    return ResponseModel(data=get_payroll_trend(db, months, cu.company_id))


@router.get("/headcount", response_model=ResponseModel)
def headcount(db: Session = Depends(get_db),
              cu: User = Depends(get_current_user)):
    return ResponseModel(data=get_headcount_by_department(db, cu.company_id))


@router.get("/audit-logs", response_model=ResponseModel)
def audit_logs(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    cu: User = Depends(get_current_user),
):
    from app.models.audit import AuditLog
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.company_id == cu.company_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return ResponseModel(data=[
        {
            "id": l.id,
            "action": l.action,
            "entity_type": l.resource_type,
            "entity_id": l.resource_id,
            "detail": l.description,
            "user_id": l.user_id,
            "created_at": str(l.created_at),
        }
        for l in logs
    ])