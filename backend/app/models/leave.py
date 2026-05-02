from sqlalchemy import (Column, Integer, Numeric, String, Boolean,
                         Date, DateTime, ForeignKey, Enum as SAEnum,
                         Text, UniqueConstraint)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import LeaveType, LeaveStatus


class LeavePolicy(Base):
    __tablename__ = "leave_policies"
    __table_args__ = (
        # Leave type must be unique per company (different orgs may define it differently)
        UniqueConstraint("company_id", "leave_type", name="uq_leave_policies_company_type"),
    )

    id                  = Column(Integer, primary_key=True, index=True)
    company_id          = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    leave_type          = Column(SAEnum(LeaveType), nullable=False)
    max_days_per_year   = Column(Integer, default=0)
    is_paid             = Column(Boolean, default=True)
    carry_forward       = Column(Boolean, default=False)
    max_carry_forward   = Column(Integer, default=0)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    allocations = relationship("LeaveAllocation", back_populates="policy")


class LeaveAllocation(Base):
    __tablename__ = "leave_allocations"

    id            = Column(Integer, primary_key=True, index=True)
    company_id    = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    employee_id   = Column(Integer, ForeignKey("employees.id"), nullable=False)
    policy_id     = Column(Integer, ForeignKey("leave_policies.id"), nullable=False)
    year          = Column(Integer, nullable=False)
    total_days    = Column(Numeric(5, 1), default=0)
    used_days     = Column(Numeric(5, 1), default=0)
    remaining_days= Column(Numeric(5, 1), default=0)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("Employee", back_populates="allocations")
    policy   = relationship("LeavePolicy", back_populates="allocations")

    @property
    def leave_type(self):
        return self.policy.leave_type if self.policy else None


class LeaveApplication(Base):
    __tablename__ = "leave_applications"

    id                        = Column(Integer, primary_key=True, index=True)
    company_id                = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    employee_id               = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type                = Column(SAEnum(LeaveType), nullable=False)
    start_date                = Column(Date, nullable=False)
    end_date                  = Column(Date, nullable=False)
    total_days                = Column(Numeric(5, 1), nullable=False)
    reason                    = Column(Text, nullable=True)
    status                    = Column(SAEnum(LeaveStatus), default=LeaveStatus.PENDING)
    hr_reviewer_id            = Column(Integer, ForeignKey("users.id"), nullable=True)
    hr_reviewed_at            = Column(DateTime(timezone=True), nullable=True)
    hr_remarks                = Column(String(500), nullable=True)
    payroll_reviewer_id       = Column(Integer, ForeignKey("users.id"), nullable=True)
    payroll_reviewed_at       = Column(DateTime(timezone=True), nullable=True)
    payroll_remarks           = Column(String(500), nullable=True)
    requires_payrun_amendment = Column(Boolean, default=False)
    affects_payrun_id         = Column(Integer, ForeignKey("payruns.id"), nullable=True)
    created_at                = Column(DateTime(timezone=True), server_default=func.now())
    updated_at                = Column(DateTime(timezone=True), onupdate=func.now())

    employee = relationship("Employee", back_populates="leave_apps")