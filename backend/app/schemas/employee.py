from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.enums import EmploymentType, EmploymentStatus

class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None

class DepartmentOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    model_config = {"from_attributes": True}

class DesignationCreate(BaseModel):
    title: str
    department_id: Optional[int] = None

class DesignationOut(BaseModel):
    id: int
    title: str
    department_id: Optional[int] = None
    model_config = {"from_attributes": True}

class EmployeeCreate(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    date_of_joining: date
    date_of_birth: Optional[date] = None
    department_id: Optional[int] = None
    designation_id: Optional[int] = None
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    employment_status: EmploymentStatus = EmploymentStatus.ACTIVE
    phone: Optional[str] = None
    address: Optional[str] = None
    pan_number: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department_id: Optional[int] = None
    designation_id: Optional[int] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    pan_number: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    employment_status: Optional[EmploymentStatus] = None
    date_of_leaving: Optional[date] = None

class EmployeeOut(BaseModel):
    id: int
    employee_code: str
    first_name: str
    last_name: str
    date_of_joining: date
    date_of_birth: Optional[date] = None
    department_id: Optional[int] = None
    designation_id: Optional[int] = None
    employment_type: EmploymentType
    employment_status: EmploymentStatus
    phone: Optional[str] = None
    pan_number: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    model_config = {"from_attributes": True}