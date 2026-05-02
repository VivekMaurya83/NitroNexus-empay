from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from typing import List
from app.models.attendance import Attendance
from app.models.employee import Employee, Department
from app.models.leave import LeaveAllocation, LeavePolicy
from app.models.payroll import Payslip, Payrun
from app.models.enums import AttendanceStatus, PayrunStatus, EmploymentStatus


def get_attendance_heatmap(db: Session, employee_id: int,
                           month: int, year: int) -> dict:
    records = db.query(Attendance).filter(
        Attendance.employee_id == employee_id,
        extract("month", Attendance.date) == month,
        extract("year",  Attendance.date) == year,
    ).order_by(Attendance.date).all()
    return {
        "employee_id": employee_id, "month": month, "year": year,
        "heatmap": [
            {"date": str(r.date), "status": r.status.value,
             "working_hours": float(r.working_hours) if r.working_hours else 0}
            for r in records
        ],
    }


def get_department_payroll_breakdown(db: Session, month: int, year: int,
                                     company_id: int) -> List[dict]:
    payrun = db.query(Payrun).filter(
        Payrun.company_id == company_id,
        Payrun.month == month, Payrun.year == year,
        Payrun.status.in_([PayrunStatus.COMPLETED, PayrunStatus.AMENDED]),
    ).first()
    if not payrun:
        return []
    rows = (db.query(
                Department.name,
                func.count(Payslip.id).label("emp_count"),
                func.sum(Payslip.gross_earnings).label("total_gross"),
                func.sum(Payslip.total_deductions).label("total_ded"),
                func.sum(Payslip.net_pay).label("total_net"),
            )
            .join(Employee, Employee.id == Payslip.employee_id)
            .join(Department, Department.id == Employee.department_id)
            .filter(Payslip.payrun_id == payrun.id)
            .group_by(Department.id, Department.name)
            .all())
    return [{"department": r.name, "employee_count": r.emp_count,
             "total_gross": float(r.total_gross or 0),
             "total_deductions": float(r.total_ded or 0),
             "total_net": float(r.total_net or 0)} for r in rows]


def get_leave_utilization(db: Session, year: int, company_id: int) -> List[dict]:
    allocs = (db.query(
                  LeavePolicy.leave_type,
                  func.sum(LeaveAllocation.total_days).label("total_alloc"),
                  func.sum(LeaveAllocation.used_days).label("total_used"),
              )
              .join(LeaveAllocation, LeaveAllocation.policy_id == LeavePolicy.id)
              .filter(
                  LeaveAllocation.company_id == company_id,
                  LeaveAllocation.year == year,
              )
              .group_by(LeavePolicy.id, LeavePolicy.leave_type)
              .all())
    result = []
    for a in allocs:
        total = float(a.total_alloc or 0)
        used  = float(a.total_used  or 0)
        result.append({"leave_type": a.leave_type.value, "total_allocated": total,
                        "total_used": used,
                        "utilization_pct": round((used/total*100) if total else 0, 1)})
    return result


def get_payroll_trend(db: Session, months: int = 6,
                      company_id: int = 0) -> List[dict]:
    payruns = (db.query(Payrun)
               .filter(
                   Payrun.company_id == company_id,
                   Payrun.status.in_([PayrunStatus.COMPLETED, PayrunStatus.AMENDED]),
               )
               .order_by(Payrun.year.desc(), Payrun.month.desc())
               .limit(months).all())
    return [{"month": p.month, "year": p.year,
             "label": f"{p.month:02d}/{p.year}",
             "total_gross": float(p.total_gross),
             "total_net": float(p.total_net),
             "total_deductions": float(p.total_deductions),
             "employee_count": p.employee_count}
            for p in reversed(payruns)]


def get_headcount_by_department(db: Session, company_id: int) -> List[dict]:
    rows = (db.query(Department.name, func.count(Employee.id).label("count"))
            .join(Employee, Employee.department_id == Department.id, isouter=True)
            .filter(
                Department.company_id == company_id,
                Employee.employment_status == EmploymentStatus.ACTIVE,
            )
            .group_by(Department.id, Department.name).all())
    return [{"department": r.name, "count": r.count} for r in rows]