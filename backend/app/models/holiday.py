from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import HolidayType


class Holiday(Base):
    __tablename__ = "holidays"

    id          = Column(Integer, primary_key=True, index=True)
    company_id  = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name        = Column(String(100), nullable=False)
    date        = Column(Date, nullable=False)
    holiday_type = Column(SAEnum(HolidayType), nullable=False,
                          default=HolidayType.NATIONAL)
    description = Column(String(255), nullable=True)
    is_optional = Column(Boolean, default=False)   # optional = employee can choose
    year        = Column(Integer, nullable=False)

    company = relationship("Company", backref="holidays")