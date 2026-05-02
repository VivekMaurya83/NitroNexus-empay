from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.enums import AttendanceStatus

class AttendanceCheckIn(BaseModel):
    employee_id: int
    check_in: datetime
    remarks: Optional[str] = None

class AttendanceCheckOut(BaseModel):
    check_out: datetime
    remarks: Optional[str] = None

class AttendanceManualEntry(BaseModel):
    employee_id: int
    date: date
    status: AttendanceStatus
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    working_hours: Optional[float] = None
    remarks: Optional[str] = None

class AttendanceOut(BaseModel):
    id: int
    employee_id: int
    date: date
    status: AttendanceStatus
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    working_hours: Optional[float] = None
    remarks: Optional[str] = None
    model_config = {"from_attributes": True}