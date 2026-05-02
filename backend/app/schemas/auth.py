from pydantic import BaseModel, EmailStr
from app.models.enums import UserRole
from typing import Optional


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.EMPLOYEE
    # Omit company_id only when registering as Admin to auto-create a new company.
    # All other roles must supply a valid company_id.
    company_id: Optional[int] = None


class LoginRequest(BaseModel):
    email: EmailStr
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