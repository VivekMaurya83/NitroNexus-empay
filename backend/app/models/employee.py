from sqlalchemy import Column, Integer, String, Date, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import EmploymentType, EmploymentStatus

class Department(Base):
    __tablename__ = "departments"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(100), unique=True, nullable=False)
    description = Column(String(500), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    employees    = relationship("Employee", back_populates="department")
    designations = relationship("Designation", back_populates="department")


class Designation(Base):
    __tablename__ = "designations"

    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String(150), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    department = relationship("Department", back_populates="designations")
    employees  = relationship("Employee", back_populates="designation")


class Employee(Base):
    __tablename__ = "employees"

    id                 = Column(Integer, primary_key=True, index=True)
    user_id            = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    employee_code      = Column(String(20), unique=True, nullable=False, index=True)
    first_name         = Column(String(100), nullable=False)
    last_name          = Column(String(100), nullable=False)
    date_of_birth      = Column(Date, nullable=True)
    date_of_joining    = Column(Date, nullable=False)
    date_of_leaving    = Column(Date, nullable=True)
    department_id      = Column(Integer, ForeignKey("departments.id"), nullable=True)
    designation_id     = Column(Integer, ForeignKey("designations.id"), nullable=True)
    employment_type    = Column(SAEnum(EmploymentType), default=EmploymentType.FULL_TIME)
    employment_status  = Column(SAEnum(EmploymentStatus), default=EmploymentStatus.ACTIVE)
    phone              = Column(String(20), nullable=True)
    address            = Column(String(500), nullable=True)
    pan_number         = Column(String(20), nullable=True)
    bank_name          = Column(String(150), nullable=True)
    account_number     = Column(String(50), nullable=True)
    ifsc_code          = Column(String(20), nullable=True)
    created_at         = Column(DateTime(timezone=True), server_default=func.now())
    updated_at         = Column(DateTime(timezone=True), onupdate=func.now())

    user         = relationship("User", back_populates="employee")
    department   = relationship("Department", back_populates="employees")
    designation  = relationship("Designation", back_populates="employees")
    salary       = relationship("SalaryStructure", back_populates="employee")
    attendances  = relationship("Attendance", back_populates="employee")
    leave_apps   = relationship("LeaveApplication", back_populates="employee")
    allocations  = relationship("LeaveAllocation", back_populates="employee")
    payslips     = relationship("Payslip", back_populates="employee")