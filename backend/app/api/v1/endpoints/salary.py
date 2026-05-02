from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.salary import SalaryStructure
from app.models.enums import UserRole
from app.schemas.payroll import SalaryStructureCreate, SalaryStructureOut
from app.schemas.common import ResponseModel
from app.api.v1.deps import get_current_user, require_hr_or_payroll
from app.services.audit_service import log_action

router = APIRouter(prefix="/salary", tags=["Salary"])


@router.post("/", response_model=ResponseModel, status_code=201)
def create_salary_structure(p: SalaryStructureCreate,
                             db: Session = Depends(get_db),
                             cu: User = Depends(require_hr_or_payroll)):
    # deactivate existing active structures for this employee
    existing = db.query(SalaryStructure).filter(
        SalaryStructure.employee_id == p.employee_id,
        SalaryStructure.is_active == True,
    ).all()
    for e in existing:
        e.is_active = False

    sal = SalaryStructure(
        company_id=cu.company_id,
        employee_id=p.employee_id,
        basic=p.basic, hra=p.hra,
        conveyance=p.conveyance, medical=p.medical,
        special_allowance=p.special_allowance, lta=p.lta, bonus=p.bonus,
        pf_applicable=p.pf_applicable,
        professional_tax_state=p.professional_tax_state,
        is_active=True,
    )
    db.add(sal)
    db.commit()
    db.refresh(sal)
    log_action(db, cu.id, "create_salary_structure", "SalaryStructure", sal.id,
               f"Salary set for emp {p.employee_id}: basic={p.basic}")
    return ResponseModel(data=SalaryStructureOut.model_validate(sal))


@router.get("/{employee_id}", response_model=ResponseModel)
def get_salary_structure(employee_id: int, db: Session = Depends(get_db),
                          cu: User = Depends(get_current_user)):
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee or cu.employee.id != employee_id:
            raise HTTPException(403, "Access denied")
    sal = db.query(SalaryStructure).filter(
        SalaryStructure.employee_id == employee_id,
        SalaryStructure.is_active == True,
    ).first()
    if not sal:
        raise HTTPException(404, "No active salary structure found")
    return ResponseModel(data=SalaryStructureOut.model_validate(sal))


@router.get("/{employee_id}/history", response_model=ResponseModel)
def get_salary_history(employee_id: int, db: Session = Depends(get_db),
                        cu: User = Depends(require_hr_or_payroll)):
    history = (db.query(SalaryStructure)
               .filter(SalaryStructure.employee_id == employee_id)
               .order_by(SalaryStructure.created_at.desc()).all())
    return ResponseModel(data=[SalaryStructureOut.model_validate(s) for s in history])


@router.patch("/{employee_id}/deactivate", response_model=ResponseModel)
def deactivate_salary(employee_id: int, db: Session = Depends(get_db),
                       cu: User = Depends(require_hr_or_payroll)):
    sal = db.query(SalaryStructure).filter(
        SalaryStructure.employee_id == employee_id,
        SalaryStructure.is_active == True,
    ).first()
    if not sal:
        raise HTTPException(404, "No active salary structure to deactivate")
    sal.is_active = False
    db.commit()
    log_action(db, cu.id, "deactivate_salary", "SalaryStructure",
               sal.id, f"Deactivated for emp {employee_id}")
    return ResponseModel(message="Salary structure deactivated")