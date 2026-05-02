from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.enums import PayrunStatus

class SalaryStructureCreate(BaseModel):
    employee_id: int
    basic: float
    hra: float = 0
    conveyance: float = 0
    medical: float = 0
    special_allowance: float = 0
    lta: float = 0
    bonus: float = 0
    pf_applicable: bool = True
    professional_tax_state: str = "Maharashtra"

class SalaryStructureOut(BaseModel):
    id: int
    employee_id: int
    basic: float
    hra: float
    conveyance: float
    medical: float
    special_allowance: float
    lta: float
    bonus: float
    pf_applicable: bool
    professional_tax_state: str
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class PayrunCreate(BaseModel):
    month: int
    year: int

class PayrunOut(BaseModel):
    id: int
    month: int
    year: int
    status: PayrunStatus
    total_gross: float
    total_deductions: float
    total_net: float
    employee_count: int
    is_amended: bool
    notes: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class PayslipOut(BaseModel):
    id: int
    payrun_id: int
    employee_id: int
    total_working_days: int
    days_present: float
    days_absent: float
    paid_leave_days: float
    unpaid_leave_days: float
    effective_paid_days: float
    basic: float
    hra: float
    conveyance: float
    medical: float
    special_allowance: float
    lta: float
    bonus: float
    gross_earnings: float
    pf_employee: float
    pf_employer: float
    professional_tax: float
    tds: float
    other_deductions: float
    total_deductions: float
    net_pay: float
    is_anomalous: bool
    anomaly_flags: Optional[str] = None
    is_amended: bool
    amendment_reason: Optional[str] = None
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    model_config = {"from_attributes": True}

class PayslipUpdate(BaseModel):
    total_working_days: Optional[int] = None
    days_present: Optional[float] = None
    days_absent: Optional[float] = None
    basic: Optional[float] = None
    hra: Optional[float] = None
    conveyance: Optional[float] = None
    medical: Optional[float] = None
    special_allowance: Optional[float] = None
    lta: Optional[float] = None
    bonus: Optional[float] = None
    pf_employee: Optional[float] = None
    professional_tax: Optional[float] = None
    tds: Optional[float] = None
    other_deductions: Optional[float] = None
    is_anomalous: Optional[bool] = None
    anomaly_flags: Optional[str] = None

class AmendmentCreate(BaseModel):
    leave_application_id: int
    reason: str