from pydantic import BaseModel, EmailStr
from app.models.enums import UserRole
from typing import Optional

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.EMPLOYEE

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
    employee_id: Optional[int] = None