from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import datetime, timezone, date
from typing import Optional
from app.models.leave import LeaveApplication, LeaveAllocation, LeavePolicy
from app.models.payroll import Payrun
from app.models.enums import LeaveStatus, PayrunStatus
from app.schemas.leave import LeaveApplicationCreate, LeaveReviewAction
from app.services.whatsapp_service import send_whatsapp_message
from app.services.email_service import send_leave_status_email
from app.models.employee import Employee
from app.services import email_service
from app.services.holiday_service import count_working_days_in_range


def _count_working_days(db: Session, company_id: int, start: date, end: date) -> float:
    """Returns working days between start and end (inclusive), excluding weekends
    and non-optional company holidays.  Weekend structure is derived dynamically
    from PayrollConfig so a 5-day or 6-day week is handled automatically."""
    return count_working_days_in_range(db, company_id, start, end)


def apply_leave(db: Session, employee_id: int,
                p: LeaveApplicationCreate, company_id: int) -> LeaveApplication:
    if p.end_date < p.start_date:
        raise ValueError("end_date cannot be before start_date")

    # Count only genuine working days (weekends + holidays excluded)
    total = _count_working_days(db, company_id, p.start_date, p.end_date)
    if total == 0:
        raise ValueError(
            "The selected date range contains no working days "
            "(all days fall on weekends or public holidays)."
        )

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
                f"Requested: {total} working day(s), Available: {float(alloc.remaining_days)}"
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
    if app.employee and app.employee.phone:
        leave_name = app.leave_type.value.replace('_', ' ').title()
        msg = (
            f"✅ *Leave Submitted*\n\n"
            f"Hello {app.employee.first_name},\n"
            f"Your leave request has been submitted successfully.\n\n"
            f"*Details:*\n"
            f"• Type: {leave_name}\n"
            f"• Duration: {app.total_days} day(s)\n"
            f"• Start Date: {app.start_date}"
        )
        send_whatsapp_message(app.employee.phone, msg)
        
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if emp and emp.user:
        try:
            email_service.send_leave_application_email(
                to=emp.user.email,
                name=f"{emp.first_name} {emp.last_name}",
                leave_type=p.leave_type.value.replace("_", " ").title(),
                from_date=str(p.start_date),
                to_date=str(p.end_date),
                days=float(total),
            )
        except Exception:
            pass
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

    if app.employee and app.employee.phone:
        leave_name = app.leave_type.value.replace('_', ' ').title()
        msg = (
            f"🚫 *Leave Cancelled*\n\n"
            f"Hello {app.employee.first_name},\n"
            f"Your leave request has been cancelled.\n\n"
            f"*Details:*\n"
            f"• Type: {leave_name}\n"
            f"• Start Date: {app.start_date}"
        )
        send_whatsapp_message(app.employee.phone, msg)

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

    if app.employee:
        status_str = "APPROVED by HR" if app.status == LeaveStatus.HR_APPROVED else "REJECTED by HR"
        leave_name = app.leave_type.value.replace('_', ' ').title()
        
        if app.employee.phone:
            icon = "✅" if app.status == LeaveStatus.HR_APPROVED else "❌"
            action = "APPROVED" if app.status == LeaveStatus.HR_APPROVED else "REJECTED"
            msg = (
                f"{icon} *HR Review Update*\n\n"
                f"Hello {app.employee.first_name},\n"
                f"Your leave request has been *{action}* by HR.\n\n"
                f"*Details:*\n"
                f"• Type: {leave_name}\n"
                f"• Start Date: {app.start_date}"
            )
            if app.hr_remarks:
                msg += f"\n\n*Remarks:* {app.hr_remarks}"
            send_whatsapp_message(app.employee.phone, msg)
            
        if app.employee.user and app.employee.user.email:
            send_leave_status_email(
                to=app.employee.user.email,
                name=f"{app.employee.first_name} {app.employee.last_name}",
                leave_type=leave_name,
                start_date=str(app.start_date),
                status_str=status_str,
                remarks=app.hr_remarks
            )

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

    if app.employee:
        status_str = "FINAL APPROVED" if app.status == LeaveStatus.APPROVED else "REJECTED by Payroll"
        leave_name = app.leave_type.value.replace('_', ' ').title()
        
        if app.employee.phone:
            icon = "🎉" if app.status == LeaveStatus.APPROVED else "❌"
            action = "APPROVED" if app.status == LeaveStatus.APPROVED else "REJECTED"
            msg = (
                f"{icon} *Payroll Review Update*\n\n"
                f"Hello {app.employee.first_name},\n"
                f"Your leave request has been *{action}* by Payroll.\n\n"
                f"*Details:*\n"
                f"• Type: {leave_name}\n"
                f"• Start Date: {app.start_date}"
            )
            if app.payroll_remarks:
                msg += f"\n\n*Remarks:* {app.payroll_remarks}"
            send_whatsapp_message(app.employee.phone, msg)
            
        if app.employee.user and app.employee.user.email:
            send_leave_status_email(
                to=app.employee.user.email,
                name=f"{app.employee.first_name} {app.employee.last_name}",
                leave_type=leave_name,
                start_date=str(app.start_date),
                status_str=status_str,
                remarks=app.payroll_remarks
            )

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
    """Flag leave if a completed payrun already exists for ANY month that this
    leave spans.  A leave from Jan 28 – Feb 3 must flag both January's and
    February's payruns, not just January's.

    The primary (first chronological) affected payrun id is stored on the
    leave application to preserve backward-compatibility with the amendment
    endpoint.  All other affected payruns are logged as a warning.
    """
    import logging
    logger = logging.getLogger(__name__)

    # Collect every (month, year) pair spanned by this leave
    spanned: list[tuple[int, int]] = []
    cur = date(app.start_date.year, app.start_date.month, 1)
    end_ym = (app.end_date.year, app.end_date.month)
    while (cur.year, cur.month) <= end_ym:
        spanned.append((cur.month, cur.year))
        # Advance to first day of next month
        if cur.month == 12:
            cur = date(cur.year + 1, 1, 1)
        else:
            cur = date(cur.year, cur.month + 1, 1)

    primary_payrun = None
    for month, year in spanned:
        pr = db.query(Payrun).filter(
            Payrun.company_id == company_id,
            Payrun.month == month,
            Payrun.year  == year,
            Payrun.status.in_([PayrunStatus.COMPLETED, PayrunStatus.AMENDED]),
        ).first()
        if pr:
            if primary_payrun is None:
                primary_payrun = pr
            else:
                # Secondary month — cannot store multiple ids in the current
                # schema, so log a warning so payroll officers are aware.
                logger.warning(
                    f"[LEAVE AMENDMENT] Leave application {app.id} spans into "
                    f"{month:02d}/{year} which also has a completed payrun "
                    f"(id={pr.id}). A separate amendment must be raised manually."
                )

    if primary_payrun:
        app.requires_payrun_amendment = True
        app.affects_payrun_id = primary_payrun.id