from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import datetime, timezone, date
from typing import Optional
from app.models.leave import LeaveApplication, LeaveAllocation, LeavePolicy
from app.models.payroll import Payrun
from app.models.enums import LeaveStatus, PayrunStatus
from app.schemas.leave import LeaveApplicationCreate, LeaveReviewAction


def _count_days(start: date, end: date) -> float:
    return float((end - start).days + 1)


def apply_leave(db: Session, employee_id: int,
                p: LeaveApplicationCreate, company_id: int) -> LeaveApplication:
    if p.end_date < p.start_date:
        raise ValueError("end_date cannot be before start_date")
    total = _count_days(p.start_date, p.end_date)
    policy = db.query(LeavePolicy).filter(
        LeavePolicy.company_id == company_id,
        LeavePolicy.leave_type == p.leave_type,
    ).first()
    if policy and policy.is_paid:
        alloc = db.query(LeaveAllocation).filter(
            LeaveAllocation.company_id == company_id,
            LeaveAllocation.employee_id == employee_id,
            LeaveAllocation.policy_id == policy.id,
            LeaveAllocation.year == p.start_date.year,
        ).first()
        if alloc and float(alloc.remaining_days) < total:
            raise ValueError(
                f"Insufficient {p.leave_type.value} balance. "
                f"Requested: {total}, Available: {float(alloc.remaining_days)}"
            )
    app = LeaveApplication(
        company_id=company_id,
        employee_id=employee_id, leave_type=p.leave_type,
        start_date=p.start_date, end_date=p.end_date,
        total_days=total, reason=p.reason, status=LeaveStatus.PENDING,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


def cancel_leave(db: Session, application_id: int,
                 employee_id: int, company_id: int) -> LeaveApplication:
    app = db.query(LeaveApplication).filter(
        LeaveApplication.id == application_id,
        LeaveApplication.company_id == company_id,
    ).first()
    if not app:
        raise ValueError("Leave application not found")
    if app.employee_id != employee_id:
        raise ValueError("Access denied")
    if app.status not in (LeaveStatus.PENDING, LeaveStatus.HR_APPROVED):
        raise ValueError(f"Cannot cancel a leave in '{app.status.value}' state")
    app.status = LeaveStatus.CANCELLED
    db.commit()
    db.refresh(app)
    return app


def hr_review_leave(db: Session, application_id: int, reviewer_id: int,
                    p: LeaveReviewAction, company_id: int) -> LeaveApplication:
    app = db.query(LeaveApplication).filter(
        LeaveApplication.id == application_id,
        LeaveApplication.company_id == company_id,
    ).first()
    if not app:
        raise ValueError("Leave application not found")
    if app.status != LeaveStatus.PENDING:
        raise ValueError(f"Cannot review a leave in '{app.status.value}' state")
    if p.action.lower() == "approve":
        app.status = LeaveStatus.HR_APPROVED
    elif p.action.lower() == "reject":
        app.status = LeaveStatus.REJECTED
    else:
        raise ValueError("action must be 'approve' or 'reject'")
    app.hr_reviewer_id = reviewer_id
    app.hr_reviewed_at = datetime.now(timezone.utc)
    app.hr_remarks = p.remarks
    db.commit()
    db.refresh(app)
    return app


def payroll_review_leave(db: Session, application_id: int, reviewer_id: int,
                         p: LeaveReviewAction, company_id: int) -> LeaveApplication:
    app = db.query(LeaveApplication).filter(
        LeaveApplication.id == application_id,
        LeaveApplication.company_id == company_id,
    ).first()
    if not app:
        raise ValueError("Leave application not found")
    if app.status != LeaveStatus.HR_APPROVED:
        raise ValueError(f"Cannot payroll-review a leave in '{app.status.value}' state")
    if p.action.lower() == "approve":
        app.status = LeaveStatus.APPROVED
        _deduct_balance(db, app, company_id)
        _check_amendment_needed(db, app, company_id)
    elif p.action.lower() == "reject":
        app.status = LeaveStatus.REJECTED
    else:
        raise ValueError("action must be 'approve' or 'reject'")
    app.payroll_reviewer_id = reviewer_id
    app.payroll_reviewed_at = datetime.now(timezone.utc)
    app.payroll_remarks = p.remarks
    db.commit()
    db.refresh(app)
    return app


def _deduct_balance(db: Session, app: LeaveApplication, company_id: int):
    policy = db.query(LeavePolicy).filter(
        LeavePolicy.company_id == company_id,
        LeavePolicy.leave_type == app.leave_type,
    ).first()
    if not policy or not policy.is_paid:
        return
    alloc = db.query(LeaveAllocation).filter(
        LeaveAllocation.company_id == company_id,
        LeaveAllocation.employee_id == app.employee_id,
        LeaveAllocation.policy_id == policy.id,
        LeaveAllocation.year == app.start_date.year,
    ).first()
    if alloc:
        alloc.used_days      = float(alloc.used_days) + float(app.total_days)
        alloc.remaining_days = float(alloc.remaining_days) - float(app.total_days)


def _check_amendment_needed(db: Session, app: LeaveApplication, company_id: int):
    """Flag leave if a payrun was already completed for the affected month."""
    completed_payrun = db.query(Payrun).filter(
        Payrun.company_id == company_id,
        Payrun.month == app.start_date.month,
        Payrun.year  == app.start_date.year,
        Payrun.status.in_([PayrunStatus.COMPLETED, PayrunStatus.AMENDED]),
    ).first()
    if completed_payrun:
        app.requires_payrun_amendment = True
        app.affects_payrun_id = completed_payrun.id