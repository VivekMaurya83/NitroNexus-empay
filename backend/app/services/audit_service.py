from sqlalchemy.orm import Session
from typing import Optional, Dict
from app.models.audit import AuditLog

def log_action(
    db: Session,
    user_id: Optional[int],
    action: str,
    resource_type: str = "",
    resource_id: Optional[int] = None,
    description: str = "",
    old_values: Optional[Dict] = None,
    new_values: Optional[Dict] = None,
    ip_address: Optional[str] = None,
):
    log = AuditLog(
        user_id=user_id, action=action, resource_type=resource_type,
        resource_id=resource_id, description=description,
        old_values=old_values, new_values=new_values, ip_address=ip_address,
    )
    db.add(log)
    db.commit()