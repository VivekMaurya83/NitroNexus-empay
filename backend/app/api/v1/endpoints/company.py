from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.company import Company
from app.models.user import User
from app.models.payroll import PayrollConfig
from app.models.enums import UserRole
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyOut
from app.schemas.common import ResponseModel
from app.api.v1.deps import get_current_user, require_admin
from app.services.audit_service import log_action

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post("/", response_model=ResponseModel, status_code=201)
def create_company(p: CompanyCreate, db: Session = Depends(get_db),
                   cu: User = Depends(require_admin)):
    company = Company(name=p.name, is_active=True)
    db.add(company)
    db.commit()
    db.refresh(company)
    log_action(db, cu.id, "create_company", "Company", company.id,
               f"Created company: {company.name}", company_id=company.id)
    return ResponseModel(data=CompanyOut.model_validate(company), status_code=201)


@router.get("/", response_model=ResponseModel)
def list_companies(db: Session = Depends(get_db),
                   _: User = Depends(require_admin)):
    companies = db.query(Company).order_by(Company.name).all()
    return ResponseModel(data=[CompanyOut.model_validate(c) for c in companies])


@router.get("/me", response_model=ResponseModel)
def my_company(db: Session = Depends(get_db),
               cu: User = Depends(get_current_user)):
    if not cu.company_id:
        raise HTTPException(404, "No company associated with your account")
    company = db.query(Company).filter(Company.id == cu.company_id).first()
    if not company:
        raise HTTPException(404, "Company not found")
    return ResponseModel(data=CompanyOut.model_validate(company))


@router.patch("/me", response_model=ResponseModel)
def update_my_company(p: CompanyUpdate,
                      db: Session = Depends(get_db),
                      cu: User = Depends(require_admin)):
    print(f"DEBUG: update_my_company payload: {p.model_dump()}")
    if not cu.company_id:
        raise HTTPException(404, "No company associated with your account")
    company = db.query(Company).filter(Company.id == cu.company_id).first()
    if not company:
        raise HTTPException(404, "Company not found")
    updates = p.model_dump(exclude_none=True)
    for field, value in updates.items():
        setattr(company, field, value)
    db.commit()
    db.refresh(company)
    log_action(db, cu.id, "update_company", "Company", company.id,
               f"Updated: {list(updates.keys())}", company_id=company.id)
    return ResponseModel(data=CompanyOut.model_validate(company))


@router.post("/me/complete-onboarding", response_model=ResponseModel)
def complete_onboarding(db: Session = Depends(get_db),
                        cu: User = Depends(require_admin)):
    if not cu.company_id:
        raise HTTPException(404, "No company associated with your account")
    company = db.query(Company).filter(Company.id == cu.company_id).first()
    if not company:
        raise HTTPException(404, "Company not found")
    company.onboarding_completed = True
    db.commit()
    log_action(db, cu.id, "complete_onboarding", "Company", company.id,
               "Onboarding marked as complete", company_id=company.id)
    return ResponseModel(message="Onboarding completed")


@router.patch("/{company_id}", response_model=ResponseModel)
def update_company(company_id: int, p: CompanyUpdate,
                   db: Session = Depends(get_db),
                   cu: User = Depends(require_admin)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(404, "Company not found")
    updates = p.model_dump(exclude_none=True)
    for field, value in updates.items():
        setattr(company, field, value)
    db.commit()
    db.refresh(company)
    log_action(db, cu.id, "update_company", "Company", company_id,
               f"Updated: {list(updates.keys())}", company_id=company_id)
    return ResponseModel(data=CompanyOut.model_validate(company))


@router.get("/me/onboarding-status", response_model=ResponseModel)
def onboarding_status(
    db: Session = Depends(get_db),
    cu: User = Depends(require_admin),
):
    """Returns what the Admin has completed in the first-time setup wizard."""
    company = db.query(Company).filter(Company.id == cu.company_id).first()
    if not company:
        raise HTTPException(404, "Company not found")
    from app.models.enums import UserRole

    has_hr = db.query(User).filter(
        User.company_id == cu.company_id,
        User.role == UserRole.HR_OFFICER,
        User.is_active == True,
    ).first() is not None

    has_payroll = db.query(User).filter(
        User.company_id == cu.company_id,
        User.role == UserRole.PAYROLL_OFFICER,
        User.is_active == True,
    ).first() is not None

    # Check if default payroll config / rules exist for this company
    has_payroll_rules = False
    try:
        from app.models.payroll import PayrollConfig
        has_payroll_rules = db.query(PayrollConfig).filter(
            PayrollConfig.company_id == cu.company_id
        ).first() is not None
    except Exception:
        has_payroll_rules = False  # table may not exist yet

    complete = company.onboarding_completed or (has_hr and has_payroll and has_payroll_rules)

    return ResponseModel(data={
        "has_hr": has_hr,
        "has_payroll": has_payroll,
        "has_payroll_rules": has_payroll_rules,
        "complete": complete,
    })


@router.get("/me/users", response_model=ResponseModel)
def list_company_users(db: Session = Depends(get_db),
                       cu: User = Depends(require_admin)):
    users = db.query(User).filter(User.company_id == cu.company_id).all()
    res = []
    for u in users:
        emp = u.employee
        res.append({
            "user_id": u.id,
            "email": u.email,
            "role": u.role.value,
            "is_active": u.is_active,
            "name": f"{emp.first_name} {emp.last_name}" if emp else u.email.split('@')[0],
            "employee_id": emp.id if emp else None,
            "employee_code": emp.employee_code if emp else None,
            "department": emp.department.name if emp and emp.department else "Staff",
            "last_login": str(u.last_login) if u.last_login else None
        })
    return ResponseModel(data=res)
