from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id            = Column(Integer, primary_key=True, index=True)
    company_id    = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=True)
    action        = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=True)
    resource_id   = Column(Integer, nullable=True)
    description   = Column(Text, nullable=True)
    old_values    = Column(JSON, nullable=True)
    new_values    = Column(JSON, nullable=True)
    ip_address    = Column(String(60), nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="audit_logs")