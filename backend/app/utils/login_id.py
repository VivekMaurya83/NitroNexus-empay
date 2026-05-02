"""
login_id.py — Generates the branded Employee Login ID.

Format: <CO><FN><LN><YEAR><SERIAL>
Example: OIJODO20220001
  OI   → first 2 chars of company name (e.g. "Odoo India" → "OI")
  JO   → first 2 chars of first_name   (e.g. "John"  → "JO")
  DO   → first 2 chars of last_name    (e.g. "Doe"   → "DO")
  2022 → 4-digit joining year
  0001 → zero-padded serial for that company+year (resets per year)
"""
import re
from sqlalchemy.orm import Session


def _abbrev(text: str, length: int = 2) -> str:
    """Take the first `length` alpha characters from text, uppercased."""
    cleaned = re.sub(r"[^A-Za-z]", "", text)
    return cleaned[:length].upper().ljust(length, "X")


def company_short_code(company_name: str) -> str:
    """
    Derive a 2-letter abbreviation from company name.
    • Multi-word  → first letter of each of the first 2 words
    • Single-word → first 2 letters of that word
    """
    words = [w for w in company_name.split() if re.search(r"[A-Za-z]", w)]
    if len(words) >= 2:
        return (words[0][0] + words[1][0]).upper()
    elif words:
        return _abbrev(words[0], 2)
    return "XX"


def generate_login_id(
    co_code: str,
    first_name: str,
    last_name: str,
    joining_year: int,
    db: Session,
) -> str:
    """
    Thread-safe sequential login-ID generator scoped to (company, year).
    Imports Employee here to avoid circular imports.
    """
    from app.models.employee import Employee

    prefix = (
        _abbrev(co_code, 2)
        + _abbrev(first_name, 2)
        + _abbrev(last_name, 2)
    )

    year_str = str(joining_year)

    # Count how many employees already have an ID starting with the year segment
    # e.g. login_id LIKE 'OIJO%2022%'
    pattern = f"%{year_str}%"
    existing = (
        db.query(Employee)
        .filter(Employee.login_id.like(f"{prefix[:2]}%{year_str}%"))
        .count()
    )
    serial = existing + 1

    # Ensure uniqueness by bumping serial if collision
    while True:
        candidate = f"{prefix}{year_str}{str(serial).zfill(4)}"
        clash = db.query(Employee).filter(Employee.login_id == candidate).first()
        if not clash:
            return candidate
        serial += 1
