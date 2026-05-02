from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    HR_OFFICER = "hr_officer"
    PAYROLL_OFFICER = "payroll_officer"
    EMPLOYEE = "employee"

class EmploymentType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERN = "intern"

class EmploymentStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TERMINATED = "terminated"
    ON_NOTICE = "on_notice"

class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    HALF_DAY = "half_day"
    LATE = "late"
    WORK_FROM_HOME = "work_from_home"
    ON_LEAVE = "on_leave"
    HOLIDAY = "holiday"
    WEEKEND = "weekend"

class LeaveType(str, Enum):
    CASUAL = "casual"
    SICK = "sick"
    EARNED = "earned"
    MATERNITY = "maternity"
    PATERNITY = "paternity"
    UNPAID = "unpaid"
    COMP_OFF = "comp_off"

class LeaveStatus(str, Enum):
    PENDING = "pending"
    HR_APPROVED = "hr_approved"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class PayrunStatus(str, Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    AMENDED = "amended"
    FAILED = "failed"

class HolidayType(str, Enum):
    NATIONAL  = "national"    # Republic Day, Independence Day etc.
    REGIONAL  = "regional"    # State-specific holidays
    COMPANY   = "company"     # Company declared holidays
    RESTRICTED = "restricted" # Optional/restricted holidays