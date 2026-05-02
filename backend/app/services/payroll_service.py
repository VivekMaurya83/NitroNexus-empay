from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import date, datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
from calendar import monthrange
from typing import Optional, Tuple

from app.models.employee import Employee
from app.models.salary import SalaryStructure
from app.models.attendance import Attendance
from app.models.leave import LeaveApplication, LeavePolicy
from app.models.payroll import Payrun, Payslip, PayrunAmendment
from app.models.enums import (AttendanceStatus, LeaveStatus, PayrunStatus, EmploymentStatus)
from app.core.config import settings

_PT_SLABS = {
    "Maharashtra": [(0, 7500, 0), (7501, 10000, 175), (10001, None, 200)],
    "Karnataka":   [(0, 15000, 0), (15001, None, 200)],
    "Tamil Nadu":  [(0, None, 208)],
    "West Bengal": [(0, 10000, 0), (10001, 15000, 110), (15001, 25000, 130),
                    (25001, 40000, 150), (40001, None, 200)],
}

def get_professional_tax(gross: Decimal, state: str) -> Decimal:
    slabs = _PT_SLABS.get(state, [(0, None, 200)])
    g = float(gross)
    for lower, upper, tax in slabs:
        if upper is None:
            if g >= lower:
                return Decimal(str(tax))
        elif lower <= g <= upper:
            return Decimal(str(tax))
    return Decimal("200")

def get_working_days(month: int, year: int, join_date: date,
                     leave_date: Optional[date]) -> int:
    first = date(year, month, 1)
    last  = date(year, month, monthrange(year, month)[1])
    start = max(first, join_date)
    end   = min(last, leave_date) if leave_date else last
    if start > end:
        return 0
    count, current = 0, start
    while current <= end:
        if current.weekday() != 6:   # exclude Sundays
            count += 1
        current += timedelta(days=1)
    return count

def _r2(val: Decimal) -> Decimal:
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def detect_anomalies(data: dict, prev: Optional[Payslip]) -> Tuple[Optional[str], bool]:
    flags = []
    if float(data["effective_paid_days"]) == 0:
        flags.append("Zero effective paid days")
    if float(data["pf_employee"]) == 0 and float(data["basic"]) > 0:
        flags.append("PF not deducted despite positive basic salary")
    if prev and float(prev.net_pay) > 0:
        ratio = float(data["net_pay"]) / float(prev.net_pay)
        if ratio > 1.40:
            flags.append(f"Net pay {round((ratio-1)*100)}% higher than last month")
        elif ratio < 0.50:
            flags.append(f"Net pay {round((1-ratio)*100)}% lower than last month")
    return ("; ".join(flags) if flags else None), len(flags) > 0

def _build_payslip(db: Session, employee: Employee,
                   payrun: Payrun, salary: SalaryStructure) -> Payslip:
    month, year = payrun.month, payrun.year
    total_wd = get_working_days(month, year, employee.date_of_joining,
                                employee.date_of_leaving)

    att = db.query(Attendance).filter(
        Attendance.employee_id == employee.id,
        extract("month", Attendance.date) == month,
        extract("year",  Attendance.date) == year,
    ).all()

    days_present = Decimal("0")
    for r in att:
        if r.status in (AttendanceStatus.PRESENT, AttendanceStatus.LATE,
                        AttendanceStatus.WORK_FROM_HOME):
            days_present += Decimal("1")
        elif r.status == AttendanceStatus.HALF_DAY:
            days_present += Decimal("0.5")

    approved_leaves = db.query(LeaveApplication).filter(
        LeaveApplication.employee_id == employee.id,
        LeaveApplication.status == LeaveStatus.APPROVED,
        extract("month", LeaveApplication.start_date) == month,
        extract("year",  LeaveApplication.start_date) == year,
    ).all()

    paid_days, unpaid_days = Decimal("0"), Decimal("0")
    for lv in approved_leaves:
        policy = db.query(LeavePolicy).filter(
            LeavePolicy.leave_type == lv.leave_type).first()
        if policy and policy.is_paid:
            paid_days += Decimal(str(lv.total_days))
        else:
            unpaid_days += Decimal(str(lv.total_days))

    eff_paid   = min(days_present + paid_days, Decimal(str(total_wd)))
    days_absent = max(Decimal("0"),
                      Decimal(str(total_wd)) - eff_paid - unpaid_days)
    ratio = (eff_paid / Decimal(str(total_wd))) if total_wd > 0 else Decimal("0")

    basic = _r2(Decimal(str(salary.basic)) * ratio)
    hra   = _r2(Decimal(str(salary.hra))   * ratio)
    conv  = _r2(Decimal(str(salary.conveyance)) * ratio)
    med   = _r2(Decimal(str(salary.medical)) * ratio)
    spl   = _r2(Decimal(str(salary.special_allowance)) * ratio)
    lta   = _r2(Decimal(str(salary.lta)) * ratio)
    bonus = _r2(Decimal(str(salary.bonus)))  # not prorated

    gross = basic + hra + conv + med + spl + lta + bonus
    pf_e  = (_r2(basic * Decimal(str(settings.PF_RATE)))
             if salary.pf_applicable and basic > 0 else Decimal("0"))
    pt    = get_professional_tax(gross, salary.professional_tax_state)
    total_ded = pf_e + pt
    net   = max(Decimal("0"), _r2(gross - total_ded))

    prev_m, prev_y = (month-1, year) if month > 1 else (12, year-1)
    prev_ps = (db.query(Payslip).join(Payrun)
               .filter(Payslip.employee_id == employee.id,
                       Payrun.month == prev_m, Payrun.year == prev_y,
                       Payrun.status == PayrunStatus.COMPLETED)
               .first())

    anomaly_str, is_anom = detect_anomalies({
        "effective_paid_days": eff_paid, "basic": basic,
        "pf_employee": pf_e, "net_pay": net,
    }, prev_ps)

    return Payslip(
        payrun_id=payrun.id, employee_id=employee.id,
        total_working_days=total_wd, days_present=days_present,
        days_absent=days_absent, paid_leave_days=paid_days,
        unpaid_leave_days=unpaid_days, effective_paid_days=eff_paid,
        basic=basic, hra=hra, conveyance=conv, medical=med,
        special_allowance=spl, lta=lta, bonus=bonus,
        gross_earnings=gross, pf_employee=pf_e, pf_employer=pf_e,
        professional_tax=pt, tds=Decimal("0"), other_deductions=Decimal("0"),
        total_deductions=total_ded, net_pay=net,
        anomaly_flags=anomaly_str, is_anomalous=is_anom,
    )

def generate_payrun(db: Session, month: int, year: int,
                    generated_by_id: int, company_id: int) -> Payrun:
    if db.query(Payrun).filter(
        Payrun.company_id == company_id,
        Payrun.month == month, Payrun.year == year,
    ).first():
        raise ValueError(f"Payrun for {month:02d}/{year} already exists.")

    first = date(year, month, 1)
    last  = date(year, month, monthrange(year, month)[1])
    payrun = Payrun(
        company_id=company_id,
        month=month, year=year,
        period_start=datetime.combine(first, datetime.min.time()).replace(tzinfo=timezone.utc),
        period_end=datetime.combine(last, datetime.max.time()).replace(tzinfo=timezone.utc),
        status=PayrunStatus.PROCESSING,
        generated_by=generated_by_id,
    )
    db.add(payrun)
    db.commit()
    db.refresh(payrun)

    active = db.query(Employee).filter(
        Employee.company_id == company_id,
        Employee.employment_status == EmploymentStatus.ACTIVE,
    ).all()
    skipped = []
    total_g = total_d = total_n = Decimal("0")
    count = 0

    for emp in active:
        sal = db.query(SalaryStructure).filter(
            SalaryStructure.employee_id == emp.id,
            SalaryStructure.is_active == True,
        ).first()
        if not sal:
            skipped.append(f"{emp.employee_code}: no salary structure")
            continue
        ps = _build_payslip(db, emp, payrun, sal)
        ps.company_id = company_id
        db.add(ps)
        total_g += ps.gross_earnings
        total_d += ps.total_deductions
        total_n += ps.net_pay
        count += 1

    payrun.total_gross      = _r2(total_g)
    payrun.total_deductions = _r2(total_d)
    payrun.total_net        = _r2(total_n)
    payrun.employee_count   = count
    payrun.status           = PayrunStatus.COMPLETED
    payrun.notes            = ("Skipped: " + "; ".join(skipped)) if skipped else None
    db.commit()
    db.refresh(payrun)
    return payrun

def amend_payslip(db: Session, payrun_id: int, leave_application_id: int,
                  reason: str, amended_by_id: int, company_id: int) -> Payslip:
    from app.models.leave import LeaveApplication
    leave_app = db.query(LeaveApplication).filter(
        LeaveApplication.id == leave_application_id,
        LeaveApplication.company_id == company_id,
    ).first()
    if not leave_app:
        raise ValueError("Leave application not found")
    if not leave_app.requires_payrun_amendment or leave_app.affects_payrun_id != payrun_id:
        raise ValueError("This leave does not require amendment for the specified payrun")

    payrun = db.query(Payrun).filter(
        Payrun.id == payrun_id,
        Payrun.company_id == company_id,
    ).first()
    if not payrun:
        raise ValueError("Payrun not found")

    employee = db.query(Employee).filter(Employee.id == leave_app.employee_id).first()
    sal = db.query(SalaryStructure).filter(
        SalaryStructure.employee_id == employee.id,
        SalaryStructure.is_active == True,
    ).first()
    if not sal:
        raise ValueError("No active salary structure")

    old_ps = db.query(Payslip).filter(
        Payslip.payrun_id == payrun_id,
        Payslip.employee_id == employee.id,
        Payslip.is_amended == False,
    ).first()
    if not old_ps:
        raise ValueError("Original payslip not found")

    old_net = old_ps.net_pay
    old_ps.is_amended = True
    old_ps.amendment_reason = reason

    new_ps = _build_payslip(db, employee, payrun, sal)
    new_ps.company_id = company_id
    new_ps.is_amended = True
    new_ps.amendment_reason = f"Amendment: {reason}"
    db.add(new_ps)

    db.add(PayrunAmendment(
        company_id=company_id,
        original_payrun_id=payrun_id,
        leave_application_id=leave_application_id,
        reason=reason, amended_by=amended_by_id,
        affected_employee_id=employee.id,
        old_net_pay=old_net, new_net_pay=new_ps.net_pay,
    ))

    leave_app.requires_payrun_amendment = False
    payrun.is_amended = True
    payrun.status = PayrunStatus.AMENDED
    db.commit()
    db.refresh(new_ps)
    return new_ps