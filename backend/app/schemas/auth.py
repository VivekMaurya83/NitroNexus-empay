from pydantic import BaseModel, EmailStr
from app.models.enums import UserRole
from typing import Optional


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.EMPLOYEE
    company_name: Optional[str] = None   # Admin registration: provide company name
    # Omit company_id only when registering as Admin to auto-create a new company.
    # All other roles must supply a valid company_id.
    company_id: Optional[int] = None
    strength: Optional[str] = None


class LoginRequest(BaseModel):
    # Accept email OR login_id in the `email` field — backend resolves either
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: int
    company_id: Optional[int] = None
    employee_id: Optional[int] = None
    login_id: Optional[str] = None


# ── Invite payloads (Admin creates HR / Payroll / Employee) ──────────────────

class InviteStaffRequest(BaseModel):
    name: str
    email: EmailStr


class InviteEmployeeRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    date_of_joining: str          # ISO date string YYYY-MM-DD
    date_of_birth: Optional[str] = None
    department_id: Optional[int] = None
    designation_id: Optional[int] = None
    employment_type: str = "full_time"
    phone: Optional[str] = None