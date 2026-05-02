from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import date, timedelta
from typing import Optional, Set

from app.models.holiday import Holiday
from app.models.enums import HolidayType
from app.schemas.holiday import HolidayCreate, HolidayBulkCreate


def create_holiday(db: Session, company_id: int,
                   p: HolidayCreate) -> Holiday:
    existing = db.query(Holiday).filter(
        Holiday.company_id == company_id,
        Holiday.date == p.date,
        Holiday.name == p.name,
    ).first()
    if existing:
        raise ValueError(f"Holiday '{p.name}' on {p.date} already exists")

    holiday = Holiday(
        company_id=company_id,
        name=p.name,
        date=p.date,
        holiday_type=p.holiday_type,
        description=p.description,
        is_optional=p.is_optional,
        year=p.date.year,
    )
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    return holiday


def bulk_create_holidays(db: Session, company_id: int,
                         p: HolidayBulkCreate) -> dict:
    created, skipped = [], []
    for item in p.holidays:
        existing = db.query(Holiday).filter(
            Holiday.company_id == company_id,
            Holiday.date == item.date,
            Holiday.name == item.name,
        ).first()
        if existing:
            skipped.append(f"{item.name} ({item.date})")
            continue
        h = Holiday(
            company_id=company_id,
            name=item.name,
            date=item.date,
            holiday_type=item.holiday_type,
            description=item.description,
            is_optional=item.is_optional,
            year=item.date.year,
        )
        db.add(h)
        created.append(h)

    db.commit()
    for h in created:
        db.refresh(h)
    return {"created": created, "skipped": skipped}


def get_holidays(db: Session, company_id: int,
                 year: Optional[int] = None,
                 holiday_type: Optional[HolidayType] = None) -> list[Holiday]:
    q = db.query(Holiday).filter(Holiday.company_id == company_id)
    if year:
        q = q.filter(Holiday.year == year)
    if holiday_type:
        q = q.filter(Holiday.holiday_type == holiday_type)
    return q.order_by(Holiday.date).all()


def get_holiday_dates(db: Session, company_id: int,
                      month: int, year: int) -> set[date]:
    """Returns a set of non-optional holiday dates for a given month/year.
    Used by payroll_service to calculate working days accurately."""
    holidays = db.query(Holiday).filter(
        Holiday.company_id == company_id,
        Holiday.year == year,
        Holiday.is_optional == False,
        extract("month", Holiday.date) == month,
    ).all()
    return {h.date for h in holidays}


def get_holiday_dates_in_range(db: Session, company_id: int,
                               start: date, end: date) -> Set[date]:
    """Returns a set of non-optional holiday dates falling within [start, end].
    Works across month and year boundaries — suitable for cross-month leaves."""
    holidays = db.query(Holiday).filter(
        Holiday.company_id == company_id,
        Holiday.is_optional == False,
        Holiday.date >= start,
        Holiday.date <= end,
    ).all()
    return {h.date for h in holidays}


def get_weekend_weekdays(db: Session, company_id: int) -> Set[int]:
    """Returns the set of Python weekday numbers (Mon=0 … Sun=6) that are
    treated as weekly-off days for this company.

    The determination is fully dynamic — it reads PayrollConfig:
      - working_days_per_month >= 25  →  6-day week  →  Sunday only  {6}
      - working_days_per_month <= 23  →  5-day week  →  Sat + Sun    {5, 6}

    Falls back to Sunday-only if no PayrollConfig exists yet (safe default
    that matches the existing hardcoded behaviour).
    """
    try:
        from app.models.payroll import PayrollConfig
        config = db.query(PayrollConfig).filter(
            PayrollConfig.company_id == company_id
        ).first()
        if config and int(config.working_days_per_month) <= 23:
            return {5, 6}  # Saturday and Sunday
    except Exception:
        pass
    return {6}  # Sunday only (6-day work week default)


def count_working_days_in_range(db: Session, company_id: int,
                                start: date, end: date) -> float:
    """Counts actual working days between start and end (inclusive).

    Excludes:
      - Weekend days as determined dynamically by get_weekend_weekdays()
      - Non-optional company/national holidays registered in the Holiday table

    Returns a float to stay compatible with the rest of the payroll maths
    (half-days are handled at a higher layer).
    """
    if start > end:
        return 0.0
    weekends = get_weekend_weekdays(db, company_id)
    holidays = get_holiday_dates_in_range(db, company_id, start, end)
    count = 0
    current = start
    while current <= end:
        if current.weekday() not in weekends and current not in holidays:
            count += 1
        current += timedelta(days=1)
    return float(count)


def delete_holiday(db: Session, holiday_id: int,
                   company_id: int) -> bool:
    h = db.query(Holiday).filter(
        Holiday.id == holiday_id,
        Holiday.company_id == company_id,
    ).first()
    if not h:
        return False
    db.delete(h)
    db.commit()
    return True


def seed_indian_holidays(db: Session, company_id: int, year: int) -> list[Holiday]:
    """Seeds standard Indian national holidays for a given year."""
    national = [
        ("New Year's Day",       date(year, 1, 1)),
        ("Republic Day",         date(year, 1, 26)),
        ("Holi",                 date(year, 3, 14)),
        ("Good Friday",          date(year, 4, 18)),
        ("Ambedkar Jayanti",     date(year, 4, 14)),
        ("Labour Day",           date(year, 5, 1)),
        ("Independence Day",     date(year, 8, 15)),
        ("Gandhi Jayanti",       date(year, 10, 2)),
        ("Dussehra",             date(year, 10, 2)),
        ("Diwali",               date(year, 10, 20)),
        ("Christmas Day",        date(year, 12, 25)),
    ]
    created = []
    for name, d in national:
        existing = db.query(Holiday).filter(
            Holiday.company_id == company_id,
            Holiday.date == d,
            Holiday.name == name,
        ).first()
        if existing:
            continue
        h = Holiday(
            company_id=company_id,
            name=name, date=d,
            holiday_type=HolidayType.NATIONAL,
            year=year, is_optional=False,
        )
        db.add(h)
        created.append(h)
    db.commit()
    return created