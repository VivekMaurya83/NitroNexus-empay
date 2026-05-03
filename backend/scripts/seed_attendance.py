import sys, os, random
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import date, datetime, timedelta, timezone

from app.core.database import SessionLocal
from app.models.company import Company
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.enums import AttendanceStatus

# Config
COMPANY_NAME = "Odoo India"
DAYS_BACK    = 30
ABSENT_RATE  = 0.08
LATE_RATE    = 0.15
WFH_RATE     = 0.10
SEED_RANDOM  = 42
IST          = timezone(timedelta(hours=5, minutes=30))

random.seed(SEED_RANDOM)


def rand_time(day, hour_start, hour_end):
    h = random.randint(hour_start, hour_end - 1)
    m = random.randint(0, 59)
    s = random.randint(0, 59)
    return datetime(day.year, day.month, day.day, h, m, s, tzinfo=IST)


def working_days(start, end):
    cur = start
    while cur <= end:
        yield cur
        cur += timedelta(days=1)


def seed_attendance():
    db = SessionLocal()
    try:
        company = db.query(Company).filter(Company.name == COMPANY_NAME).first()
        if not company:
            print("[ERROR] Company not found: " + COMPANY_NAME)
            return

        employees = db.query(Employee).filter(Employee.company_id == company.id).all()
        if not employees:
            print("[ERROR] No employees found.")
            return

        print("[OK] Company : " + company.name + "  id=" + str(company.id))
        print("[OK] Employees : " + str(len(employees)))

        today      = date.today()
        start_date = today - timedelta(days=DAYS_BACK)
        created    = 0
        skipped    = 0

        for emp in employees:
            name = emp.first_name + " " + emp.last_name
            print("\n  -> " + name + " (id=" + str(emp.id) + ")")

            for day in working_days(start_date, today):
                existing = db.query(Attendance).filter(
                    Attendance.employee_id == emp.id,
                    Attendance.date == day,
                ).first()
                if existing:
                    skipped += 1
                    continue

                is_today = (day == today)

                # Absent
                if not is_today and random.random() < ABSENT_RATE:
                    db.add(Attendance(
                        company_id  = company.id,
                        employee_id = emp.id,
                        date        = day,
                        status      = AttendanceStatus.ABSENT,
                    ))
                    created += 1
                    continue

                r = random.random()
                if r < LATE_RATE:
                    status = AttendanceStatus.LATE
                    h_s, h_e = 10, 12
                elif r < LATE_RATE + WFH_RATE:
                    status = AttendanceStatus.WORK_FROM_HOME
                    h_s, h_e = 9, 10
                else:
                    status = AttendanceStatus.PRESENT
                    h_s, h_e = 8, 10

                check_in = rand_time(day, h_s, h_e)

                if is_today:
                    db.add(Attendance(
                        company_id  = company.id,
                        employee_id = emp.id,
                        date        = day,
                        check_in    = check_in,
                        status      = status,
                    ))
                    created += 1
                    print("     " + str(day) + "  CHECK-IN " + check_in.strftime("%H:%M") + "  [" + status.value + "]  (no checkout)")
                    continue

                work_hours = round(random.uniform(7.5, 9.5), 2)
                check_out  = check_in + timedelta(hours=work_hours)

                db.add(Attendance(
                    company_id    = company.id,
                    employee_id   = emp.id,
                    date          = day,
                    check_in      = check_in,
                    check_out     = check_out,
                    working_hours = work_hours,
                    status        = status,
                ))
                created += 1

            db.flush()

        db.commit()
        print("\n" + ("=" * 50))
        print("[DONE] Created " + str(created) + " records, skipped " + str(skipped))
        print("       Live dashboard now populated for " + str(len(employees)) + " employees.")

    except Exception as e:
        db.rollback()
        print("[FAILED] " + str(e))
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_attendance()
