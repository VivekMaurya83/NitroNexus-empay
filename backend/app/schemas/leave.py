from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.enums import LeaveType, LeaveStatus

class LeavePolicyCreate(BaseModel):
    leave_type: LeaveType
    max_days_per_year: int = 0
    is_paid: bool = True
    carry_forward: bool = False
    max_carry_forward: int = 0

class LeavePolicyOut(BaseModel):
    id: int
    leave_type: LeaveType
    max_days_per_year: int
    is_paid: bool
    carry_forward: bool
    model_config = {"from_attributes": True}

class LeaveAllocationCreate(BaseModel):
    employee_id: int
    policy_id: int
    year: int
    total_days: float

class LeaveAllocationOut(BaseModel):
    id: int
    employee_id: int
    policy_id: int
    leave_type: Optional[LeaveType] = None
    year: int
    total_days: float
    used_days: float
    remaining_days: float
    model_config = {"from_attributes": True}

class LeaveApplicationCreate(BaseModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: Optional[str] = None

class LeaveReviewAction(BaseModel):
    action: str        # "approve" or "reject"
    remarks: Optional[str] = None

class LeaveApplicationOut(BaseModel):
    id: int
    employee_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    total_days: float
    reason: Optional[str] = None
    status: LeaveStatus
    hr_remarks: Optional[str] = None
    payroll_remarks: Optional[str] = None
    requires_payrun_amendment: bool
    affects_payrun_id: Optional[int] = None
    created_at: datetime
    model_config = {"from_attributes": True}