from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.payroll import Payrun, Payslip
from app.models.enums import UserRole
from app.schemas.payroll import PayrunCreate, PayrunOut, PayslipOut, AmendmentCreate
from app.schemas.common import ResponseModel
from app.api.v1.deps import get_current_user, require_payroll, require_hr_or_payroll
from app.services import payroll_service
from app.services.pdf_service import generate_payslip_pdf
from app.services.audit_service import log_action

router = APIRouter(prefix="/payroll", tags=["Payroll"])


@router.post("/run", response_model=ResponseModel, status_code=201)
def run_payroll(p: PayrunCreate, db: Session = Depends(get_db),
                cu: User = Depends(require_payroll)):
    try:
        payrun = payroll_service.generate_payrun(db, p.month, p.year, cu.id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    log_action(db, cu.id, "generate_payrun", "Payrun", payrun.id,
               f"Payrun {p.month:02d}/{p.year} — {payrun.employee_count} employees")
    return ResponseModel(data=PayrunOut.model_validate(payrun))


@router.get("/runs", response_model=ResponseModel)
def list_payruns(db: Session = Depends(get_db), _: User = Depends(require_hr_or_payroll)):
    runs = db.query(Payrun).order_by(Payrun.year.desc(), Payrun.month.desc()).all()
    return ResponseModel(data=[PayrunOut.model_validate(r) for r in runs])


@router.get("/runs/{payrun_id}", response_model=ResponseModel)
def get_payrun(payrun_id: int, db: Session = Depends(get_db),
               _: User = Depends(require_hr_or_payroll)):
    pr = db.query(Payrun).filter(Payrun.id == payrun_id).first()
    if not pr:
        raise HTTPException(404, "Payrun not found")
    return ResponseModel(data=PayrunOut.model_validate(pr))


@router.get("/runs/{payrun_id}/payslips", response_model=ResponseModel)
def list_payslips(payrun_id: int, db: Session = Depends(get_db),
                  cu: User = Depends(get_current_user)):
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee:
            raise HTTPException(400, "No employee profile")
        slips = db.query(Payslip).filter(
            Payslip.payrun_id == payrun_id,
            Payslip.employee_id == cu.employee.id,
        ).all()
    else:
        slips = db.query(Payslip).filter(Payslip.payrun_id == payrun_id).all()
    return ResponseModel(data=[PayslipOut.model_validate(s) for s in slips])


@router.get("/payslips/{payslip_id}", response_model=ResponseModel)
def get_payslip(payslip_id: int, db: Session = Depends(get_db),
                cu: User = Depends(get_current_user)):
    ps = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not ps:
        raise HTTPException(404, "Payslip not found")
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee or cu.employee.id != ps.employee_id:
            raise HTTPException(403, "Access denied")
    return ResponseModel(data=PayslipOut.model_validate(ps))


@router.get("/payslips/{payslip_id}/download")
def download_payslip(payslip_id: int, db: Session = Depends(get_db),
                     cu: User = Depends(get_current_user)):
    ps = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not ps:
        raise HTTPException(404, "Payslip not found")
    if cu.role == UserRole.EMPLOYEE:
        if not cu.employee or cu.employee.id != ps.employee_id:
            raise HTTPException(403, "Access denied")
    try:
        pdf_bytes = generate_payslip_pdf(db, payslip_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=payslip_{payslip_id}.pdf"},
    )


@router.post("/runs/{payrun_id}/amend", response_model=ResponseModel)
def amend_payrun(payrun_id: int, p: AmendmentCreate,
                 db: Session = Depends(get_db), cu: User = Depends(require_payroll)):
    try:
        new_ps = payroll_service.amend_payslip(db, payrun_id, p.leave_application_id,
                                               p.reason, cu.id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    log_action(db, cu.id, "amend_payrun", "Payslip", new_ps.id,
               f"Amendment for payrun {payrun_id}: {p.reason}")
    return ResponseModel(data=PayslipOut.model_validate(new_ps))


@router.get("/pending-amendments", response_model=ResponseModel)
def pending_amendments(db: Session = Depends(get_db), _: User = Depends(require_payroll)):
    from app.models.leave import LeaveApplication
    apps = db.query(LeaveApplication).filter(
        LeaveApplication.requires_payrun_amendment == True
    ).all()
    from app.schemas.leave import LeaveApplicationOut
    return ResponseModel(data=[LeaveApplicationOut.model_validate(a) for a in apps])