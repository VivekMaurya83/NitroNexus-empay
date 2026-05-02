from sqlalchemy import Column, Integer, Date, DateTime, Time, Numeric, String, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import AttendanceStatus

class Attendance(Base):
    __tablename__ = "attendances"

    id            = Column(Integer, primary_key=True, index=True)
    company_id    = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    employee_id   = Column(Integer, ForeignKey("employees.id"), nullable=False)
    date          = Column(Date, nullable=False)
    check_in      = Column(DateTime(timezone=True), nullable=True)
    check_out     = Column(DateTime(timezone=True), nullable=True)
    working_hours = Column(Numeric(5, 2), nullable=True)
    status        = Column(SAEnum(AttendanceStatus), default=AttendanceStatus.PRESENT)
    is_manual     = Column(String(5), default="false")
    remarks       = Column(String(500), nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())

    employee = relationship("Employee", back_populates="attendances")