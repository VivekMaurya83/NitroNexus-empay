from sqlalchemy import (Column, Integer, Numeric, Boolean, String,
                         DateTime, ForeignKey, Enum as SAEnum, Text)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import PayrunStatus


class Payrun(Base):
    __tablename__ = "payruns"

    id                = Column(Integer, primary_key=True, index=True)
    company_id        = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    month             = Column(Integer, nullable=False)
    year              = Column(Integer, nullable=False)
    period_start      = Column(DateTime(timezone=True), nullable=False)
    period_end        = Column(DateTime(timezone=True), nullable=False)
    status            = Column(SAEnum(PayrunStatus), default=PayrunStatus.PROCESSING)
    total_gross       = Column(Numeric(14, 2), default=0)
    total_deductions  = Column(Numeric(14, 2), default=0)
    total_net         = Column(Numeric(14, 2), default=0)
    employee_count    = Column(Integer, default=0)
    generated_by      = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_amended        = Column(Boolean, default=False)
    notes             = Column(Text, nullable=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())

    payslips   = relationship("Payslip", back_populates="payrun")
    amendments = relationship("PayrunAmendment", back_populates="original_payrun",
                              foreign_keys="[PayrunAmendment.original_payrun_id]")


class Payslip(Base):
    __tablename__ = "payslips"

    id                   = Column(Integer, primary_key=True, index=True)
    company_id           = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    payrun_id            = Column(Integer, ForeignKey("payruns.id"), nullable=False)
    employee_id          = Column(Integer, ForeignKey("employees.id"), nullable=False)
    total_working_days   = Column(Integer, default=0)
    days_present         = Column(Numeric(5, 1), default=0)
    days_absent          = Column(Numeric(5, 1), default=0)
    paid_leave_days      = Column(Numeric(5, 1), default=0)
    unpaid_leave_days    = Column(Numeric(5, 1), default=0)
    effective_paid_days  = Column(Numeric(5, 1), default=0)
    basic                = Column(Numeric(12, 2), default=0)
    hra                  = Column(Numeric(12, 2), default=0)
    conveyance           = Column(Numeric(12, 2), default=0)
    medical              = Column(Numeric(12, 2), default=0)
    special_allowance    = Column(Numeric(12, 2), default=0)
    lta                  = Column(Numeric(12, 2), default=0)
    bonus                = Column(Numeric(12, 2), default=0)
    gross_earnings       = Column(Numeric(12, 2), default=0)
    pf_employee          = Column(Numeric(12, 2), default=0)
    pf_employer          = Column(Numeric(12, 2), default=0)
    professional_tax     = Column(Numeric(12, 2), default=0)
    tds                  = Column(Numeric(12, 2), default=0)
    other_deductions     = Column(Numeric(12, 2), default=0)
    total_deductions     = Column(Numeric(12, 2), default=0)
    net_pay              = Column(Numeric(12, 2), default=0)
    is_anomalous         = Column(Boolean, default=False)
    anomaly_flags        = Column(Text, nullable=True)
    is_amended           = Column(Boolean, default=False)
    amendment_reason     = Column(Text, nullable=True)
    created_at           = Column(DateTime(timezone=True), server_default=func.now())

    payrun   = relationship("Payrun", back_populates="payslips")
    employee = relationship("Employee", back_populates="payslips")


class PayrunAmendment(Base):
    __tablename__ = "payrun_amendments"

    id                    = Column(Integer, primary_key=True, index=True)
    company_id            = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    original_payrun_id    = Column(Integer, ForeignKey("payruns.id"), nullable=False)
    leave_application_id  = Column(Integer, ForeignKey("leave_applications.id"), nullable=False)
    affected_employee_id  = Column(Integer, ForeignKey("employees.id"), nullable=False)
    amended_by            = Column(Integer, ForeignKey("users.id"), nullable=False)
    old_net_pay           = Column(Numeric(12, 2), nullable=False)
    new_net_pay           = Column(Numeric(12, 2), nullable=False)
    reason                = Column(Text, nullable=True)
    created_at            = Column(DateTime(timezone=True), server_default=func.now())

    original_payrun = relationship("Payrun", back_populates="amendments",
                                   foreign_keys=[original_payrun_id])


class PayrollConfig(Base):
    """Default payroll rules set by Admin during onboarding (editable later)."""
    __tablename__ = "payroll_configs"

    id                    = Column(Integer, primary_key=True, index=True)
    company_id            = Column(Integer, ForeignKey("companies.id"), unique=True, nullable=False, index=True)
    # PF
    pf_rate               = Column(Numeric(5, 4), default=0.12)   # 12%
    pf_ceiling            = Column(Numeric(10, 2), default=15000)  # PF on max ₹15,000 basic
    # HRA
    hra_percent           = Column(Numeric(5, 4), default=0.40)   # 40% of basic
    # Conveyance & medical
    conveyance_fixed      = Column(Numeric(10, 2), default=1600)
    medical_fixed         = Column(Numeric(10, 2), default=1250)
    # Professional tax (monthly ₹)
    professional_tax      = Column(Numeric(8, 2), default=200)
    # TDS (simplified flat rate; detailed computation outside scope)
    tds_rate              = Column(Numeric(5, 4), default=0.0)
    # LTA
    lta_annual            = Column(Numeric(10, 2), default=0)
    # Overtime
    overtime_rate_multiplier = Column(Numeric(4, 2), default=1.5)
    # Working days per month
    working_days_per_month   = Column(Integer, default=26)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())