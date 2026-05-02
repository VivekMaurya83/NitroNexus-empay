from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.enums import UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme),
                     db: Session = Depends(get_db)) -> User:
    exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Could not validate credentials",
                        headers={"WWW-Authenticate": "Bearer"})
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise exc
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise exc
    return user

def require_roles(*roles: UserRole):
    def checker(cu: User = Depends(get_current_user)) -> User:
        if cu.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN,
                                detail=f"Required: {[r.value for r in roles]}")
        return cu
    return checker

require_admin         = require_roles(UserRole.ADMIN)
require_hr            = require_roles(UserRole.ADMIN, UserRole.HR_OFFICER)
require_payroll       = require_roles(UserRole.ADMIN, UserRole.PAYROLL_OFFICER)
require_hr_or_payroll = require_roles(UserRole.ADMIN, UserRole.HR_OFFICER,
                                      UserRole.PAYROLL_OFFICER)