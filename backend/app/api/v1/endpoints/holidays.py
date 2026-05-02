from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.user import User
from app.models.enums import HolidayType
from app.schemas.holiday import (HolidayCreate, HolidayUpdate,
                                  HolidayOut, HolidayBulkCreate)
from app.schemas.common import ResponseModel
from app.api.v1.deps import get_current_user, require_hr
from app.services import holiday_service
from app.services.audit_service import log_action

router = APIRouter(prefix="/holidays", tags=["Holidays"])


@router.post("/", response_model=ResponseModel, status_code=201)
def create_holiday(p: HolidayCreate, db: Session = Depends(get_db),
                   cu: User = Depends(require_hr)):
    try:
        h = holiday_service.create_holiday(db, cu.company_id, p)
    except ValueError as e:
        raise HTTPException(400, str(e))
    log_action(db, cu.id, "create_holiday", "Holiday", h.id,
               f"{h.name} on {h.date}")
    return ResponseModel(data=HolidayOut.model_validate(h), status_code=201)


@router.post("/bulk", response_model=ResponseModel, status_code=201)
def bulk_create_holidays(p: HolidayBulkCreate, db: Session = Depends(get_db),
                          cu: User = Depends(require_hr)):
    result = holiday_service.bulk_create_holidays(db, cu.company_id, p)
    log_action(db, cu.id, "bulk_create_holidays", "Holiday", 0,
               f"Created {len(result['created'])}, skipped {len(result['skipped'])}")
    return ResponseModel(data={
        "created": [HolidayOut.model_validate(h) for h in result["created"]],
        "skipped": result["skipped"],
        "total_created": len(result["created"]),
        "total_skipped": len(result["skipped"]),
    })


@router.post("/seed-indian/{year}", response_model=ResponseModel)
def seed_indian_holidays(year: int, db: Session = Depends(get_db),
                          cu: User = Depends(require_hr)):
    if year < 2020 or year > 2030:
        raise HTTPException(400, "Year must be between 2020 and 2030")
    created = holiday_service.seed_indian_holidays(db, cu.company_id, year)
    log_action(db, cu.id, "seed_indian_holidays", "Holiday", 0,
               f"Seeded {len(created)} Indian holidays for {year}")
    return ResponseModel(data={
        "seeded": [HolidayOut.model_validate(h) for h in created],
        "total": len(created),
        "year": year,
    })


@router.get("/", response_model=ResponseModel)
def list_holidays(
    year: Optional[int] = Query(None),
    holiday_type: Optional[HolidayType] = Query(None),
    db: Session = Depends(get_db),
    cu: User = Depends(get_current_user),
):
    holidays = holiday_service.get_holidays(
        db, cu.company_id, year, holiday_type)
    return ResponseModel(data=[HolidayOut.model_validate(h) for h in holidays])


@router.patch("/{holiday_id}", response_model=ResponseModel)
def update_holiday(holiday_id: int, p: HolidayUpdate,
                   db: Session = Depends(get_db),
                   cu: User = Depends(require_hr)):
    from app.models.holiday import Holiday
    h = db.query(Holiday).filter(
        Holiday.id == holiday_id,
        Holiday.company_id == cu.company_id,
    ).first()
    if not h:
        raise HTTPException(404, "Holiday not found")
    for field, val in p.model_dump(exclude_none=True).items():
        setattr(h, field, val)
    if p.date:
        h.year = p.date.year
    db.commit()
    db.refresh(h)
    log_action(db, cu.id, "update_holiday", "Holiday", h.id, h.name)
    return ResponseModel(data=HolidayOut.model_validate(h))


@router.delete("/{holiday_id}", response_model=ResponseModel)
def delete_holiday(holiday_id: int, db: Session = Depends(get_db),
                   cu: User = Depends(require_hr)):
    deleted = holiday_service.delete_holiday(
        db, holiday_id, cu.company_id)
    if not deleted:
        raise HTTPException(404, "Holiday not found")
    log_action(db, cu.id, "delete_holiday", "Holiday", holiday_id, "Deleted")
    return ResponseModel(message="Holiday deleted successfully")