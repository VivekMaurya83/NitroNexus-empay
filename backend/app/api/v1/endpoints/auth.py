from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import (hash_password, verify_password,
                                create_access_token, create_refresh_token,
                                decode_token)
from app.models.company import Company
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.auth import (RegisterRequest, LoginRequest,
                               RefreshRequest, TokenResponse)
from app.schemas.common import ResponseModel
from app.api.v1.deps import get_current_user
from app.services.audit_service import log_action

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=ResponseModel, status_code=201)
def register(p: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == p.email).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            detail="Email already registered")

    company_id = p.company_id

    # Admin registering without a company_id → auto-create a new company
    if p.role == UserRole.ADMIN and company_id is None:
        new_company = Company(name=f"{p.email.split('@')[0]}'s Organisation")
        db.add(new_company)
        db.flush()          # get the id without committing yet
        company_id = new_company.id
    elif company_id is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="company_id is required for non-Admin registrations",
        )
    else:
        # Validate the company exists and is active
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
    log_action(db, user.id, "register", "User", user.id,
               f"New user registered: {user.email} as {user.role.value}",
               company_id=company_id)
    return ResponseModel(message="User registered successfully",
                         data={"user_id": user.id, "email": user.email,
                               "role": user.role.value,
                               "company_id": user.company_id})


@router.post("/login", response_model=TokenResponse)
def login(p: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == p.email).first()
    if not user or not verify_password(p.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN,
                            detail="Account is deactivated")
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    log_action(db, user.id, "login", "User", user.id, f"Login: {user.email}",
               company_id=user.company_id)
    employee_id = user.employee.id if user.employee else None
    return TokenResponse(
        access_token=create_access_token(user.id, {"role": user.role.value}),
        refresh_token=create_refresh_token(user.id),
        role=user.role,
        user_id=user.id,
        company_id=user.company_id,
        employee_id=employee_id,
    )


# OAuth2 form-based login (for Swagger UI "Authorize" button)
@router.post("/token", response_model=TokenResponse, include_in_schema=False)
def login_form(form: OAuth2PasswordRequestForm = Depends(),
               db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid credentials")
    employee_id = user.employee.id if user.employee else None
    return TokenResponse(
        access_token=create_access_token(user.id, {"role": user.role.value}),
        refresh_token=create_refresh_token(user.id),
        role=user.role,
        user_id=user.id,
        company_id=user.company_id,
        employee_id=employee_id,
    )


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
    employee_id = user.employee.id if user.employee else None
    return TokenResponse(
        access_token=create_access_token(user.id, {"role": user.role.value}),
        refresh_token=create_refresh_token(user.id),
        role=user.role,
        user_id=user.id,
        company_id=user.company_id,
        employee_id=employee_id,
    )


@router.get("/me", response_model=ResponseModel)
def me(current_user: User = Depends(get_current_user)):
    employee_id = current_user.employee.id if current_user.employee else None
    return ResponseModel(data={
        "user_id":     current_user.id,
        "email":       current_user.email,
        "role":        current_user.role.value,
        "company_id":  current_user.company_id,
        "is_active":   current_user.is_active,
        "last_login":  str(current_user.last_login) if current_user.last_login else None,
        "employee_id": employee_id,
    })


@router.patch("/me/change-password", response_model=ResponseModel)
def change_password(
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    old_pw  = body.get("old_password", "")
    new_pw  = body.get("new_password", "")
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


@router.delete("/users/{user_id}/deactivate", response_model=ResponseModel)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.enums import UserRole
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Admin only")
    user = db.query(User).filter(
        User.id == user_id,
        User.company_id == current_user.company_id,   # admins can only deactivate own-company users
    ).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = False
    db.commit()
    log_action(db, current_user.id, "deactivate_user", "User",
               user_id, f"Deactivated: {user.email}",
               company_id=current_user.company_id)
    return ResponseModel(message=f"User {user.email} deactivated")