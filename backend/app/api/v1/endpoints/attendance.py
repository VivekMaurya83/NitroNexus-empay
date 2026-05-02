from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.models.user import User
from app.models.attendance import Attendance
from app.models.enums import UserRole
from app.schemas.attendance import (AttendanceCheckIn, AttendanceCheckOut,
                                     AttendanceManualEntry, AttendanceOut)
from app.schemas.common import ResponseModel
from app.api.v1.deps import get_current_user, require_hr_or_payroll
from app.services import attendance_service
from app.services.audit_service import log_action

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/check-in", response_model=ResponseModel, status_code=201)
def check_in(p: AttendanceCheckIn, db: Session = Depends(get_db),
             cu: User = Depends(get_current_user)):
    # Employees can only check in for themselves
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee or cu.employee.id != p.employee_id:
            raise HTTPException(403, "You can only check in for yourself")
    try:
        record = attendance_service.check_in(db, p)
    except ValueError as e:
        raise HTTPException(400, str(e))
    log_action(db, cu.id, "check_in", "Attendance", record.id,
               f"Check-in: emp {p.employee_id} at {p.check_in}")
    return ResponseModel(data=AttendanceOut.model_validate(record))


@router.patch("/{attendance_id}/check-out", response_model=ResponseModel)
def check_out(attendance_id: int, p: AttendanceCheckOut,
              db: Session = Depends(get_db),
              cu: User = Depends(get_current_user)):
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(404, "Attendance record not found")
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee or cu.employee.id != record.employee_id:
            raise HTTPException(403, "You can only check out for yourself")
    try:
        updated = attendance_service.check_out(db, attendance_id, p)
    except ValueError as e:
        raise HTTPException(400, str(e))
    log_action(db, cu.id, "check_out", "Attendance", attendance_id,
               f"Check-out at {p.check_out}")
    return ResponseModel(data=AttendanceOut.model_validate(updated))


@router.post("/manual", response_model=ResponseModel, status_code=201)
def manual_entry(p: AttendanceManualEntry, db: Session = Depends(get_db),
                 cu: User = Depends(require_hr_or_payroll)):
    try:
        record = attendance_service.manual_entry(db, p)
    except ValueError as e:
        raise HTTPException(400, str(e))
    log_action(db, cu.id, "manual_attendance", "Attendance", record.id,
               f"Manual entry for emp {p.employee_id} on {p.date}")
    return ResponseModel(data=AttendanceOut.model_validate(record))


@router.get("/summary/{employee_id}", response_model=ResponseModel)
def get_monthly_summary(
    employee_id: int,
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    db: Session = Depends(get_db),
    cu: User = Depends(get_current_user),
):
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee or cu.employee.id != employee_id:
            raise HTTPException(403, "Access denied")
    summary = attendance_service.get_monthly_summary(db, employee_id, month, year)
    # serialize records
    summary["records"] = [AttendanceOut.model_validate(r)
                          for r in summary["records"]]
    return ResponseModel(data=summary)


@router.get("/employee/{employee_id}", response_model=ResponseModel)
def get_attendance_by_date_range(
    employee_id: int,
    from_date: date = Query(...),
    to_date: date   = Query(...),
    db: Session = Depends(get_db),
    cu: User = Depends(get_current_user),
):
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee or cu.employee.id != employee_id:
            raise HTTPException(403, "Access denied")
    records = (db.query(Attendance)
               .filter(Attendance.employee_id == employee_id,
                       Attendance.date >= from_date,
                       Attendance.date <= to_date)
               .order_by(Attendance.date).all())
    return ResponseModel(data=[AttendanceOut.model_validate(r) for r in records])


@router.get("/today", response_model=ResponseModel)
def today_attendance(db: Session = Depends(get_db),
                     cu: User = Depends(get_current_user)):
    today = date.today()
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee:
            raise HTTPException(400, "No employee profile")
        record = db.query(Attendance).filter(
            Attendance.employee_id == cu.employee.id,
            Attendance.date == today,
        ).first()
        return ResponseModel(data=AttendanceOut.model_validate(record) if record else None)
    # HR/Payroll/Admin — all employees today
    records = db.query(Attendance).filter(Attendance.date == today).all()
    return ResponseModel(data=[AttendanceOut.model_validate(r) for r in records])