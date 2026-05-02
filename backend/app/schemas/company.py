from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CompanyCreate(BaseModel):
    name: str


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    strength: Optional[str] = None
    onboarding_completed: Optional[bool] = None


class CompanyOut(BaseModel):
    id: int
    name: str
    short_code: Optional[str] = None
    strength: Optional[str] = None
    onboarding_completed: bool = False
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
