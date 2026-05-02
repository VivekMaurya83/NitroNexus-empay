from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date
from app.models.enums import HolidayType


class HolidayCreate(BaseModel):
    name:         str
    date:         date
    holiday_type: HolidayType = HolidayType.NATIONAL
    description:  Optional[str] = None
    is_optional:  bool = False

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Holiday name cannot be empty")
        return v.strip()


class HolidayUpdate(BaseModel):
    name:         Optional[str] = None
    date:         Optional[date] = None
    holiday_type: Optional[HolidayType] = None
    description:  Optional[str] = None
    is_optional:  Optional[bool] = None


class HolidayOut(BaseModel):
    id:           int
    name:         str
    date:         date
    holiday_type: HolidayType
    description:  Optional[str]
    is_optional:  bool
    year:         int

    model_config = {"from_attributes": True}


class HolidayBulkCreate(BaseModel):
    holidays: list[HolidayCreate]