from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(200), nullable=False, index=True)
    short_code = Column(String(4), nullable=True)   # 2-letter abbreviation for Login IDs
    strength   = Column(String(50), nullable=True) # Organization size range
    onboarding_completed = Column(Boolean, default=False, nullable=False)
    is_active  = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships (back-populated from child tables)
    users       = relationship("User", back_populates="company")
    departments = relationship("Department", back_populates="company")
