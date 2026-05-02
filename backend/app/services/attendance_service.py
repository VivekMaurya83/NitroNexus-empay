from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import datetime, timezone, timedelta
from typing import Dict
from app.models.attendance import Attendance
from app.models.enums import AttendanceStatus
from app.schemas.attendance import AttendanceCheckIn, AttendanceCheckOut, AttendanceManualEntry

STANDARD_HOURS = 8.0
LATE_CUTOFF_HOUR = 10

def check_in(db: Session, p: AttendanceCheckIn, company_id: int) -> Attendance:
    existing = db.query(Attendance).filter(
        Attendance.employee_id == p.employee_id,
        Attendance.date == p.check_in.date(),
    ).first()
    if existing:
        raise ValueError("Attendance already recorded for today")
    hour = p.check_in.hour
    status = AttendanceStatus.LATE if hour >= LATE_CUTOFF_HOUR else AttendanceStatus.PRESENT
    record = Attendance(
        company_id=company_id,
        employee_id=p.employee_id, date=p.check_in.date(),
        check_in=p.check_in, status=status, remarks=p.remarks,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def check_out(db: Session, attendance_id: int, p: AttendanceCheckOut) -> Attendance:
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise ValueError("Attendance record not found")
    if record.check_out:
        raise ValueError("Already checked out")
    record.check_out = p.check_out
    if record.check_in:
        diff = (p.check_out - record.check_in).total_seconds() / 3600
        record.working_hours = round(diff, 2)
        if diff < STANDARD_HOURS / 2:
            record.status = AttendanceStatus.HALF_DAY
    if p.remarks:
        record.remarks = p.remarks
    db.commit()
    db.refresh(record)
    return record

def manual_entry(db: Session, p: AttendanceManualEntry,
                 company_id: int) -> Attendance:
    existing = db.query(Attendance).filter(
        Attendance.employee_id == p.employee_id,
        Attendance.date == p.date,
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
    record = Attendance(
        company_id=company_id,
        employee_id=p.employee_id, date=p.date, status=p.status,
        check_in=p.check_in, check_out=p.check_out,
        working_hours=p.working_hours, is_manual="true", remarks=p.remarks,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def get_monthly_summary(db: Session, employee_id: int, month: int, year: int) -> Dict:
    records = db.query(Attendance).filter(
        Attendance.employee_id == employee_id,
        extract("month", Attendance.date) == month,
        extract("year", Attendance.date) == year,
    ).order_by(Attendance.date).all()
    present = sum(1 for r in records if r.status in (
        AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.WORK_FROM_HOME))
    absent  = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
    late    = sum(1 for r in records if r.status == AttendanceStatus.LATE)
    half    = sum(1 for r in records if r.status == AttendanceStatus.HALF_DAY)
    return {
        "employee_id": employee_id, "month": month, "year": year,
        "total_present": present, "total_absent": absent,
        "total_late": late, "total_half_day": half,
        "records": records,
    }