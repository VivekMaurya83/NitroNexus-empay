import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (SimpleDocTemplate, Table, TableStyle,
                                  Paragraph, Spacer, HRFlowable)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from sqlalchemy.orm import Session
from app.models.payroll import Payslip, Payrun
from app.models.employee import Employee

PRIMARY = colors.HexColor("#01696f")
LIGHT   = colors.HexColor("#e8f4f5")
DARK    = colors.HexColor("#28251d")
MUTED   = colors.HexColor("#7a7974")
RED     = colors.HexColor("#a12c7b")
MONTHS  = ["","January","February","March","April","May","June",
           "July","August","September","October","November","December"]

def _m(v) -> str:
    return f"Rs. {float(v):,.2f}"

def _s():
    b = getSampleStyleSheet()
    return {
        "h1":    ParagraphStyle("h1",    parent=b["Heading1"], fontSize=16,
                                textColor=PRIMARY, spaceAfter=4),
        "h2":    ParagraphStyle("h2",    parent=b["Heading2"], fontSize=10,
                                textColor=PRIMARY, spaceAfter=2),
        "body":  ParagraphStyle("body",  parent=b["Normal"], fontSize=8,
                                textColor=DARK),
        "muted": ParagraphStyle("muted", parent=b["Normal"], fontSize=7,
                                textColor=MUTED),
        "right": ParagraphStyle("right", parent=b["Normal"], fontSize=8,
                                textColor=DARK, alignment=TA_RIGHT),
        "bold":  ParagraphStyle("bold",  parent=b["Normal"], fontSize=8,
                                textColor=DARK, fontName="Helvetica-Bold"),
        "rbold": ParagraphStyle("rbold", parent=b["Normal"], fontSize=8,
                                textColor=DARK, fontName="Helvetica-Bold",
                                alignment=TA_RIGHT),
    }

def generate_payslip_pdf(db: Session, payslip_id: int) -> bytes:
    ps = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not ps:
        raise ValueError("Payslip not found")
    pr  = db.query(Payrun).filter(Payrun.id == ps.payrun_id).first()
    emp = db.query(Employee).filter(Employee.id == ps.employee_id).first()

    buf = io.BytesIO()
    W   = A4[0] - 30*mm
    doc = SimpleDocTemplate(buf, pagesize=A4,
                             rightMargin=15*mm, leftMargin=15*mm,
                             topMargin=15*mm, bottomMargin=15*mm)
    s = _s()
    story = []

    # ── Header ────────────────────────────────────────────────────────────────
    ht = Table([
        [Paragraph("EmPay HRMS", s["h1"]),
         Paragraph("PAYSLIP", ParagraphStyle("ps", fontSize=18, textColor=PRIMARY,
             fontName="Helvetica-Bold", alignment=TA_RIGHT))],
        [Paragraph(f"{MONTHS[pr.month]} {pr.year}", s["muted"]),
         Paragraph(f"Generated: {datetime.now().strftime('%d %b %Y')}",
             ParagraphStyle("pg", fontSize=7, textColor=MUTED, alignment=TA_RIGHT))],
    ], colWidths=[W*0.6, W*0.4])
    ht.setStyle(TableStyle([("BOTTOMPADDING",(0,0),(-1,-1),2),
                             ("TOPPADDING",(0,0),(-1,-1),2)]))
    story += [ht, HRFlowable(width=W, thickness=1.5, color=PRIMARY, spaceAfter=6)]

    # ── Employee Info ─────────────────────────────────────────────────────────
    dept  = emp.department.name if emp.department else "—"
    desig = emp.designation.title if emp.designation else "—"
    ei = Table([
        [Paragraph("Employee Details", s["h2"]), ""],
        [Paragraph("Name",           s["muted"]),
         Paragraph(f"{emp.first_name} {emp.last_name}", s["bold"])],
        [Paragraph("Employee Code",  s["muted"]), Paragraph(emp.employee_code, s["body"])],
        [Paragraph("Department",     s["muted"]), Paragraph(dept,  s["body"])],
        [Paragraph("Designation",    s["muted"]), Paragraph(desig, s["body"])],
        [Paragraph("Date of Joining",s["muted"]), Paragraph(str(emp.date_of_joining), s["body"])],
        [Paragraph("PAN",            s["muted"]), Paragraph(emp.pan_number or "—", s["body"])],
        [Paragraph("Bank",           s["muted"]),
         Paragraph(f"{emp.bank_name or '—'} | {emp.account_number or '—'}", s["body"])],
    ], colWidths=[W*0.3, W*0.7])
    ei.setStyle(TableStyle([
        ("SPAN",(0,0),(1,0)), ("BACKGROUND",(0,0),(-1,0),LIGHT),
        ("TEXTCOLOR",(0,0),(-1,0),PRIMARY), ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
        ("FONTSIZE",(0,0),(-1,0),9), ("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("TOPPADDING",(0,0),(-1,-1),4), ("LINEBELOW",(0,0),(-1,-1),0.25,MUTED),
    ]))
    story += [ei, Spacer(1, 5)]

    # ── Attendance ────────────────────────────────────────────────────────────
    at = Table([
        ["Attendance","Working Days","Days Present","Paid Leave","Unpaid","Absent"],
        ["", str(ps.total_working_days), str(float(ps.days_present)),
         str(float(ps.paid_leave_days)), str(float(ps.unpaid_leave_days)),
         str(float(ps.days_absent))],
    ], colWidths=[W*0.25]+[W*0.15]*5)
    at.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),LIGHT), ("TEXTCOLOR",(0,0),(-1,0),PRIMARY),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"), ("FONTSIZE",(0,0),(-1,-1),7.5),
        ("ALIGN",(1,0),(-1,-1),"CENTER"), ("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("TOPPADDING",(0,0),(-1,-1),4), ("LINEBELOW",(0,0),(-1,-1),0.25,MUTED),
    ]))
    story += [at, Spacer(1, 5)]

    # ── Earnings & Deductions ─────────────────────────────────────────────────
    half = W/2 - 2*mm
    earn = Table([
        [Paragraph("Earnings", s["h2"]), ""],
        [Paragraph("Basic Salary",       s["body"]), Paragraph(_m(ps.basic),             s["right"])],
        [Paragraph("HRA",                s["body"]), Paragraph(_m(ps.hra),               s["right"])],
        [Paragraph("Conveyance",         s["body"]), Paragraph(_m(ps.conveyance),         s["right"])],
        [Paragraph("Medical",            s["body"]), Paragraph(_m(ps.medical),            s["right"])],
        [Paragraph("Special Allowance",  s["body"]), Paragraph(_m(ps.special_allowance),  s["right"])],
        [Paragraph("LTA",                s["body"]), Paragraph(_m(ps.lta),                s["right"])],
        [Paragraph("Bonus",              s["body"]), Paragraph(_m(ps.bonus),              s["right"])],
        [Paragraph("Gross Earnings",     s["bold"]), Paragraph(_m(ps.gross_earnings),     s["rbold"])],
    ], colWidths=[half*0.65, half*0.35])
    ded = Table([
        [Paragraph("Deductions", s["h2"]), ""],
        [Paragraph("PF Employee 12%",  s["body"]), Paragraph(_m(ps.pf_employee),      s["right"])],
        [Paragraph("PF Employer 12%",  s["body"]), Paragraph(_m(ps.pf_employer),      s["right"])],
        [Paragraph("Professional Tax", s["body"]), Paragraph(_m(ps.professional_tax), s["right"])],
        [Paragraph("TDS",              s["body"]), Paragraph(_m(ps.tds),              s["right"])],
        [Paragraph("Other",            s["body"]), Paragraph(_m(ps.other_deductions), s["right"])],
        ["",""], ["",""],
        [Paragraph("Total Deductions", s["bold"]), Paragraph(_m(ps.total_deductions), s["rbold"])],
    ], colWidths=[half*0.65, half*0.35])
    tbl_style = TableStyle([
        ("SPAN",(0,0),(1,0)), ("BACKGROUND",(0,0),(-1,0),LIGHT),
        ("TEXTCOLOR",(0,0),(-1,0),PRIMARY), ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
        ("FONTSIZE",(0,0),(-1,0),9),
        ("ROWBACKGROUNDS",(0,1),(-1,-2),[colors.white,colors.HexColor("#f7f6f2")]),
        ("FONTSIZE",(0,1),(-1,-1),7.5), ("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("TOPPADDING",(0,0),(-1,-1),4), ("LINEBELOW",(0,0),(-1,-1),0.25,MUTED),
        ("BACKGROUND",(0,-1),(-1,-1),colors.HexColor("#f0f0f0")),
    ])
    earn.setStyle(tbl_style)
    ded.setStyle(tbl_style)
    cols = Table([[earn, Spacer(4*mm,1), ded]], colWidths=[half, 4*mm, half])
    cols.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP")]))
    story += [cols, Spacer(1, 8)]

    # ── Net Pay ───────────────────────────────────────────────────────────────
    nt = Table([["NET PAY", _m(ps.net_pay)]], colWidths=[W*0.7, W*0.3])
    nt.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),PRIMARY), ("TEXTCOLOR",(0,0),(-1,-1),colors.white),
        ("FONTNAME",(0,0),(-1,-1),"Helvetica-Bold"), ("FONTSIZE",(0,0),(-1,-1),13),
        ("ALIGN",(1,0),(1,0),"RIGHT"), ("BOTTOMPADDING",(0,0),(-1,-1),10),
        ("TOPPADDING",(0,0),(-1,-1),10), ("LEFTPADDING",(0,0),(-1,-1),10),
        ("RIGHTPADDING",(0,0),(-1,-1),10),
    ]))
    story.append(nt)

    if ps.is_anomalous and ps.anomaly_flags:
        story.append(Spacer(1, 6))
        wt = Table([[Paragraph(f"Warning: {ps.anomaly_flags}",
            ParagraphStyle("w", fontSize=7, textColor=RED))]], colWidths=[W])
        wt.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#ffeef7")),
            ("BOTTOMPADDING",(0,0),(-1,-1),6), ("TOPPADDING",(0,0),(-1,-1),6),
        ]))
        story.append(wt)

    if ps.is_amended:
        story += [Spacer(1,4),
                  Paragraph(f"AMENDED — {ps.amendment_reason or ''}",
                             ParagraphStyle("am", fontSize=7, textColor=MUTED))]

    story += [
        Spacer(1, 8),
        HRFlowable(width=W, thickness=0.5, color=MUTED, spaceAfter=4),
        Paragraph("This is a computer-generated payslip. No signature required.",
                  ParagraphStyle("ft", fontSize=6.5, textColor=MUTED,
                                 alignment=TA_CENTER)),
    ]
    doc.build(story)
    return buf.getvalue()