from sqlalchemy import Column, Integer, Numeric, Boolean, String, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import WageType


class SalaryStructure(Base):
    __tablename__ = "salary_structures"

    id                      = Column(Integer, primary_key=True, index=True)
    company_id              = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    employee_id             = Column(Integer, ForeignKey("employees.id"), nullable=False)
    # Wage type determines how the payroll engine calculates gross pay
    wage_type               = Column(SAEnum(WageType), default=WageType.MONTHLY_FIXED, nullable=False)
    basic                   = Column(Numeric(12, 2), nullable=False, default=0)
    hra                     = Column(Numeric(12, 2), nullable=False, default=0)
    conveyance              = Column(Numeric(12, 2), nullable=False, default=0)
    medical                 = Column(Numeric(12, 2), nullable=False, default=0)
    special_allowance       = Column(Numeric(12, 2), nullable=False, default=0)
    lta                     = Column(Numeric(12, 2), nullable=False, default=0)
    bonus                   = Column(Numeric(12, 2), nullable=False, default=0)
    # For DAILY_WAGE employees — rate per calendar day present
    daily_rate              = Column(Numeric(10, 2), nullable=True, default=0)
    # For HOURLY_WAGE employees — rate per hour logged in attendance
    hourly_rate             = Column(Numeric(10, 2), nullable=True, default=0)
    pf_applicable           = Column(Boolean, default=True)
    professional_tax_state  = Column(String(100), default="Maharashtra")
    is_active               = Column(Boolean, default=True)
    created_at              = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("Employee", back_populates="salary")