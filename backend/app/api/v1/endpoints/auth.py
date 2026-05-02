import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, date, timezone

from app.core.database import get_db
from app.core.security import (hash_password, verify_password,
                                create_access_token, create_refresh_token,
                                decode_token)
from app.models.company import Company
from app.models.user import User
from app.models.employee import Employee, Department
from app.models.enums import UserRole, EmploymentType, EmploymentStatus
from app.schemas.auth import (
    RegisterRequest, LoginRequest, RefreshRequest, TokenResponse,
    InviteStaffRequest, InviteEmployeeRequest,
)
from app.schemas.common import ResponseModel
from app.api.v1.deps import get_current_user, require_admin, require_hr_or_payroll
from app.services.audit_service import log_action
from app.services.email_service import send_temp_password, send_admin_welcome, send_whatsapp_setup_email
from app.utils.login_id import generate_login_id, company_short_code

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Helpers ──────────────────────────────────────────────────────────────────

def _gen_temp_password(length: int = 12) -> str:
    """Generate a secure random temporary password."""
    alphabet = string.ascii_letters + string.digits + "!@#$"
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        # Ensure at least one of each required class
        if (any(c.isupper() for c in pwd) and
                any(c.islower() for c in pwd) and
                any(c.isdigit() for c in pwd)):
            return pwd


def _build_token_response(user: User, db: Session) -> TokenResponse:
    employee_id = user.employee.id if user.employee else None
    login_id    = user.employee.login_id if user.employee else None
    return TokenResponse(
        access_token=create_access_token(user.id, {"role": user.role.value}),
        refresh_token=create_refresh_token(user.id),
        role=user.role,
        user_id=user.id,
        company_id=user.company_id,
        employee_id=employee_id,
        login_id=login_id,
    )


# ── Register (Admin only — auto-creates company) ──────────────────────────────

@router.post("/register", response_model=ResponseModel, status_code=201)
def register(p: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == p.email).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            detail="Email already registered")

    company_id = p.company_id

    if p.role == UserRole.ADMIN and company_id is None:
        # Use provided company_name or derive from email
        raw_name = (p.company_name or "").strip() or f"{p.email.split('@')[0]}'s Organisation"
        co_code  = company_short_code(raw_name)
        new_company = Company(name=raw_name, short_code=co_code, strength=p.strength)
        db.add(new_company)
        db.flush()
        company_id = new_company.id
    elif company_id is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="company_id is required for non-Admin registrations",
        )
    else:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company or not company.is_active:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="Invalid or inactive company_id",
            )

    user = User(
        company_id=company_id,
        email=p.email,
        hashed_password=hash_password(p.password),
        role=p.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Send welcome email for admin
    if p.role == UserRole.ADMIN:
        company_obj = db.query(Company).filter(Company.id == company_id).first()
        send_admin_welcome(p.email, company_obj.name if company_obj else raw_name)
        send_whatsapp_setup_email(to=p.email, name="Admin")

    log_action(db, user.id, "register", "User", user.id,
               f"New user registered: {user.email} as {user.role.value}",
               company_id=company_id)
    return ResponseModel(
        message="User registered successfully",
        data={"user_id": user.id, "email": user.email,
              "role": user.role.value, "company_id": user.company_id},
    )


# ── Login (email OR login_id) ─────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
def login(p: LoginRequest, db: Session = Depends(get_db)):
    # Try email first, then employee login_id
    user = db.query(User).filter(User.email == p.email).first()
    if not user:
        # Try login_id lookup via Employee table
        emp = db.query(Employee).filter(Employee.login_id == p.email.upper()).first()
        if emp:
            user = emp.user
    if not user or not verify_password(p.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN,
                            detail="Account is deactivated")
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    log_action(db, user.id, "login", "User", user.id, f"Login: {user.email}",
               company_id=user.company_id)
    return _build_token_response(user, db)


# ── OAuth2 form-based login (Swagger UI) ──────────────────────────────────────

@router.post("/token", response_model=TokenResponse, include_in_schema=False)
def login_form(form: OAuth2PasswordRequestForm = Depends(),
               db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user:
        emp = db.query(Employee).filter(Employee.login_id == form.username.upper()).first()
        if emp:
            user = emp.user
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return _build_token_response(user, db)


# ── Refresh ───────────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
def refresh(p: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(p.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid or expired refresh token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED,
                            detail="User not found or inactive")
    return _build_token_response(user, db)


# ── /me ───────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=ResponseModel)
def me(current_user: User = Depends(get_current_user)):
    employee_id = current_user.employee.id       if current_user.employee else None
    login_id    = current_user.employee.login_id if current_user.employee else None
    return ResponseModel(data={
        "user_id":     current_user.id,
        "email":       current_user.email,
        "role":        current_user.role.value,
        "company_id":  current_user.company_id,
        "is_active":   current_user.is_active,
        "last_login":  str(current_user.last_login) if current_user.last_login else None,
        "employee_id": employee_id,
        "login_id":    login_id,
    })


# ── Change password ───────────────────────────────────────────────────────────

@router.patch("/me/change-password", response_model=ResponseModel)
def change_password(
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    old_pw = body.get("old_password", "")
    new_pw = body.get("new_password", "")
    if not verify_password(old_pw, current_user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            detail="Current password is incorrect")
    if len(new_pw) < 8:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            detail="New password must be at least 8 characters")
    current_user.hashed_password = hash_password(new_pw)
    db.commit()
    log_action(db, current_user.id, "change_password", "User",
               current_user.id, "Password changed",
               company_id=current_user.company_id)
    return ResponseModel(message="Password changed successfully")


# ── Deactivate user ───────────────────────────────────────────────────────────

@router.delete("/users/{user_id}/deactivate", response_model=ResponseModel)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Admin only")
    user = db.query(User).filter(
        User.id == user_id,
        User.company_id == current_user.company_id,
    ).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = False
    db.commit()
    log_action(db, current_user.id, "deactivate_user", "User",
               user_id, f"Deactivated: {user.email}",
               company_id=current_user.company_id)
    return ResponseModel(message=f"User {user.email} deactivated")


# ── Invite HR Officer (Admin only) ────────────────────────────────────────────

@router.post("/invite-hr", response_model=ResponseModel, status_code=201)
def invite_hr(
    p: InviteStaffRequest,
    db: Session = Depends(get_db),
    cu: User = Depends(require_admin),
):
    if db.query(User).filter(User.email == p.email).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            detail="Email already registered")
    temp_pw = _gen_temp_password()
    hr_user = User(
        company_id=cu.company_id,
        email=p.email,
        hashed_password=hash_password(temp_pw),
        role=UserRole.HR_OFFICER,
        is_active=True,
    )
    db.add(hr_user)
    db.commit()
    db.refresh(hr_user)

    company = db.query(Company).filter(Company.id == cu.company_id).first()
    send_temp_password(
        to=p.email,
        name=p.name,
        temp_password=temp_pw,
        role="hr_officer",
        company_name=company.name if company else "",
    )
    send_whatsapp_setup_email(to=p.email, name=p.name)
    log_action(db, cu.id, "invite_hr", "User", hr_user.id,
               f"HR Officer invited: {p.email}", company_id=cu.company_id)
    return ResponseModel(
        message=f"HR Officer {p.email} invited successfully. Temporary password sent by email.",
        data={"user_id": hr_user.id, "email": hr_user.email},
    )


# ── Invite Payroll Officer (Admin only) ───────────────────────────────────────

@router.post("/invite-payroll", response_model=ResponseModel, status_code=201)
def invite_payroll(
    p: InviteStaffRequest,
    db: Session = Depends(get_db),
    cu: User = Depends(require_admin),
):
    # Only one Payroll officer per company
    existing = db.query(User).filter(
        User.company_id == cu.company_id,
        User.role == UserRole.PAYROLL_OFFICER,
        User.is_active == True,
    ).first()
    if existing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            detail="A Payroll Officer already exists for this company")
    if db.query(User).filter(User.email == p.email).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            detail="Email already registered")
    temp_pw = _gen_temp_password()
    po_user = User(
        company_id=cu.company_id,
        email=p.email,
        hashed_password=hash_password(temp_pw),
        role=UserRole.PAYROLL_OFFICER,
        is_active=True,
    )
    db.add(po_user)
    db.commit()
    db.refresh(po_user)

    company = db.query(Company).filter(Company.id == cu.company_id).first()
    send_temp_password(
        to=p.email,
        name=p.name,
        temp_password=temp_pw,
        role="payroll_officer",
        company_name=company.name if company else "",
    )
    send_whatsapp_setup_email(to=p.email, name=p.name)
    log_action(db, cu.id, "invite_payroll", "User", po_user.id,
               f"Payroll Officer invited: {p.email}", company_id=cu.company_id)
    return ResponseModel(
        message=f"Payroll Officer {p.email} invited. Temporary password sent by email.",
        data={"user_id": po_user.id, "email": po_user.email},
    )


# ── Invite Employee (Admin / HR / Payroll) ────────────────────────────────────

@router.post("/invite-employee", response_model=ResponseModel, status_code=201)
def invite_employee(
    p: InviteEmployeeRequest,
    db: Session = Depends(get_db),
    cu: User = Depends(require_hr_or_payroll),
):
    if db.query(User).filter(User.email == p.email).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            detail="Email already registered")

    # Parse date
    try:
        doj = date.fromisoformat(p.date_of_joining)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            detail="Invalid date_of_joining format. Use YYYY-MM-DD")

    dob = None
    if p.date_of_birth:
        try:
            dob = date.fromisoformat(p.date_of_birth)
        except ValueError:
            pass

    # Create user with temp password
    temp_pw = _gen_temp_password()
    emp_user = User(
        company_id=cu.company_id,
        email=p.email,
        hashed_password=hash_password(temp_pw),
        role=UserRole.EMPLOYEE,
        is_active=True,
    )
    db.add(emp_user)
    db.flush()

    # Generate employee code (legacy)
    count = db.query(Employee).filter(Employee.company_id == cu.company_id).count()
    code  = f"EMP{str(1001 + count).zfill(6)}"
    while db.query(Employee).filter(Employee.employee_code == code).first():
        count += 1
        code = f"EMP{str(1001 + count).zfill(6)}"

    # Generate smart login ID
    company = db.query(Company).filter(Company.id == cu.company_id).first()
    co_code = company.short_code if company and company.short_code else \
              (company_short_code(company.name) if company else "XX")
    lid = generate_login_id(co_code, p.first_name, p.last_name, doj.year, db)

    # Parse employment type
    try:
        emp_type = EmploymentType(p.employment_type)
    except ValueError:
        emp_type = EmploymentType.FULL_TIME

    employee = Employee(
        company_id=cu.company_id,
        user_id=emp_user.id,
        employee_code=code,
        login_id=lid,
        first_name=p.first_name,
        last_name=p.last_name,
        date_of_joining=doj,
        date_of_birth=dob,
        department_id=p.department_id,
        designation_id=p.designation_id,
        employment_type=emp_type,
        employment_status=EmploymentStatus.ACTIVE,
        phone=p.phone,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)

    # Send welcome email with login ID
    company_name = company.name if company else ""
    send_temp_password(
        to=p.email,
        name=f"{p.first_name} {p.last_name}",
        temp_password=temp_pw,
        role="employee",
        login_id=lid,
        company_name=company_name,
    )
    send_whatsapp_setup_email(to=p.email, name=f"{p.first_name} {p.last_name}")
    log_action(db, cu.id, "invite_employee", "Employee", employee.id,
               f"Employee invited: {p.email} → {lid}", company_id=cu.company_id)
    return ResponseModel(
        message=f"Employee {p.first_name} {p.last_name} created. Login ID: {lid}. Credentials sent by email.",
        data={"employee_id": employee.id, "login_id": lid, "employee_code": code},
    )