from sqlalchemy import Column, Integer, Numeric, Boolean, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class SalaryStructure(Base):
    __tablename__ = "salary_structures"

    id                      = Column(Integer, primary_key=True, index=True)
    employee_id             = Column(Integer, ForeignKey("employees.id"), nullable=False)
    basic                   = Column(Numeric(12, 2), nullable=False, default=0)
    hra                     = Column(Numeric(12, 2), nullable=False, default=0)
    conveyance              = Column(Numeric(12, 2), nullable=False, default=0)
    medical                 = Column(Numeric(12, 2), nullable=False, default=0)
    special_allowance       = Column(Numeric(12, 2), nullable=False, default=0)
    lta                     = Column(Numeric(12, 2), nullable=False, default=0)
    bonus                   = Column(Numeric(12, 2), nullable=False, default=0)
    pf_applicable           = Column(Boolean, default=True)
    professional_tax_state  = Column(String(100), default="Maharashtra")
    is_active               = Column(Boolean, default=True)
    created_at              = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("Employee", back_populates="salary")