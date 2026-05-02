from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.company import Company
from app.models.user import User
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
