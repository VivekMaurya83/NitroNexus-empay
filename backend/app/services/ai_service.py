from groq import Groq
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from typing import Optional
from datetime import date
from app.core.config import settings
from app.models.employee import Employee, Department
from app.models.attendance import Attendance
from app.models.leave import LeaveApplication, LeaveAllocation
from app.models.payroll import Payslip, Payrun
from app.models.enums import (AttendanceStatus, LeaveStatus,
                               PayrunStatus, EmploymentStatus)

SYSTEM_PROMPT = """You are EmPay AI, a smart HR assistant for EmPay HRMS.
Answer HR questions using ONLY the CONTEXT DATA provided.
If the data does not contain what is asked, say 'I don\'t have that data available.'
Be concise. Use bullet points for lists. Use ₹ for money."""

def _gather_context(db: Session, company_id: int,
                    employee_id: Optional[int] = None) -> str:
    today = date.today()
    lines = [f"Today: {today.strftime('%d %b %Y')}"]

    total_emp  = db.query(Employee).filter(
        Employee.company_id == company_id,
        Employee.employment_status == EmploymentStatus.ACTIVE).count()
    total_dept = db.query(Department).filter(
        Department.company_id == company_id).count()
    lines.append(f"Company: {total_emp} active employees, {total_dept} departments")

    pending = db.query(LeaveApplication).filter(
        LeaveApplication.status == LeaveStatus.PENDING).count()
    lines.append(f"Pending leave applications: {pending}")

    latest = (db.query(Payrun)
              .filter(
                  Payrun.company_id == company_id,
                  Payrun.status == PayrunStatus.COMPLETED,
              )
              .order_by(Payrun.year.desc(), Payrun.month.desc()).first())
    if latest:
        lines.append(
            f"Latest payrun: {latest.month:02d}/{latest.year} | "
            f"Gross=₹{float(latest.total_gross):,.0f} | "
            f"Net=₹{float(latest.total_net):,.0f} | "
            f"Count={latest.employee_count}"
        )

    if employee_id:
        emp = db.query(Employee).filter(Employee.id == employee_id).first()
        if emp:
            lines.append(f"\nEmployee: {emp.first_name} {emp.last_name} "
                         f"({emp.employee_code})")
            lines.append(f"Department: {emp.department.name if emp.department else 'N/A'}")
            lines.append(f"Joined: {emp.date_of_joining}")

            allocs = db.query(LeaveAllocation).filter(
                LeaveAllocation.employee_id == employee_id,
                LeaveAllocation.year == today.year,
            ).all()
            for a in allocs:
                lines.append(
                    f"Leave ({a.policy.leave_type.value}, {today.year}): "
                    f"Total={float(a.total_days)} | "
                    f"Used={float(a.used_days)} | "
                    f"Remaining={float(a.remaining_days)}"
                )

            att = db.query(Attendance).filter(
                Attendance.employee_id == employee_id,
                extract("month", Attendance.date) == today.month,
                extract("year",  Attendance.date) == today.year,
            ).all()
            present = sum(1 for r in att if r.status in (
                AttendanceStatus.PRESENT, AttendanceStatus.LATE,
                AttendanceStatus.WORK_FROM_HOME))
            lines.append(f"Attendance this month: {present}/{len(att)} days present")

            last_ps = (db.query(Payslip).join(Payrun)
                       .filter(Payslip.employee_id == employee_id,
                               Payrun.status == PayrunStatus.COMPLETED)
                       .order_by(Payrun.year.desc(), Payrun.month.desc()).first())
            if last_ps:
                lines.append(
                    f"Last payslip ({last_ps.payrun.month:02d}/{last_ps.payrun.year}): "
                    f"Gross=₹{float(last_ps.gross_earnings):,.2f} | "
                    f"Net=₹{float(last_ps.net_pay):,.2f}"
                )

    dept_stats = (db.query(Department.name, func.count(Employee.id))
                  .join(Employee, Employee.department_id == Department.id, isouter=True)
                  .filter(Department.company_id == company_id)
                  .group_by(Department.id, Department.name).all())
    if dept_stats:
        lines.append("Dept headcount: " +
                     " | ".join(f"{n}={c}" for n, c in dept_stats))

    return "\n".join(lines)

def ask_ai(db: Session, question: str, company_id: int,
           employee_id: Optional[int] = None) -> str:
    if not settings.GROQ_API_KEY:
        return "AI assistant not configured. Set GROQ_API_KEY in .env"
    try:
        context = _gather_context(db, company_id, employee_id)
        client  = Groq(api_key=settings.GROQ_API_KEY)
        resp = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",
                 "content": f"CONTEXT DATA:\n{context}\n\nQUESTION: {question}"},
            ],
            temperature=0.2,
            max_tokens=512,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"AI service temporarily unavailable: {str(e)}"