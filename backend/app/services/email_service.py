"""
email_service.py — SMTP email delivery using Gmail.
Gracefully logs to console if SMTP is not configured (dev mode).
"""
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(settings.MAIL_USERNAME and settings.MAIL_PASSWORD and settings.MAIL_FROM)


def send_email(to: str, subject: str, html_body: str) -> bool:
    """Send an HTML email. Returns True on success, False on failure."""
    if not _smtp_configured():
        logger.warning(
            "[EMAIL — NOT SENT — SMTP not configured]\n"
            f"  To:      {to}\n"
            f"  Subject: {subject}\n"
            f"  Body:    {html_body[:400]}…"
        )
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = settings.MAIL_FROM
    msg["To"]      = to
    msg.attach(MIMEText(html_body, "html"))

    try:
        if settings.MAIL_SSL_TLS:
            server = smtplib.SMTP_SSL(settings.MAIL_SERVER, settings.MAIL_PORT, timeout=10)
        else:
            server = smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT, timeout=10)
            if settings.MAIL_STARTTLS:
                server.starttls()

        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        server.sendmail(settings.MAIL_FROM, [to], msg.as_string())
        server.quit()
        logger.info(f"[EMAIL SENT] To: {to}  Subject: {subject}")
        return True
    except Exception as exc:
        logger.error(f"[EMAIL FAILED] To: {to} — {exc}")
        return False


# ── Branded email templates ──────────────────────────────────────────────────

def _base_template(content: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #0f0f1a; margin: 0; padding: 0; }}
    .wrapper {{ max-width: 560px; margin: 40px auto; }}
    .card {{ background: #1a1a2e; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,.4); }}
    .header {{ background: linear-gradient(135deg,#6366f1,#8b5cf6); padding: 32px 36px; text-align: center; }}
    .header h1 {{ color: #fff; margin: 0; font-size: 28px; letter-spacing: -0.5px; }}
    .header p  {{ color: rgba(255,255,255,.75); margin: 6px 0 0; font-size: 14px; }}
    .body {{ padding: 36px; color: #e2e8f0; }}
    .body p {{ line-height: 1.7; margin: 0 0 16px; }}
    .cred-box {{ background: #0f0f1a; border: 1px solid #6366f1; border-radius: 10px; padding: 20px 24px; margin: 20px 0; }}
    .cred-row {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }}
    .cred-row:last-child {{ margin-bottom: 0; }}
    .cred-label {{ font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }}
    .cred-value {{ font-size: 18px; font-weight: 700; color: #a5b4fc; font-family: monospace; }}
    .badge {{ display: inline-block; background: #6366f1; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }}
    .footer {{ text-align: center; padding: 20px; color: #475569; font-size: 12px; }}
    .warning {{ background: #1e1a2e; border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 4px; color: #fbbf24; font-size: 13px; margin-top: 16px; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>💰 EmPay</h1>
        <p>Smart HR &amp; Payroll Management</p>
      </div>
      <div class="body">
        {content}
      </div>
    </div>
    <div class="footer">© EmPay HRMS · This is an automated message, please do not reply.</div>
  </div>
</body>
</html>
"""


def send_temp_password(
    to: str,
    name: str,
    temp_password: str,
    role: str,
    login_id: str | None = None,
    company_name: str = "",
) -> bool:
    """Send a welcome / temp-password email to a new HR, Payroll, or Employee."""
    role_labels = {
        "hr_officer":      "HR Officer",
        "payroll_officer": "Payroll Officer",
        "employee":        "Employee",
    }
    role_label = role_labels.get(role, role.replace("_", " ").title())
    badge_html = f'<span class="badge">{role_label}</span>'

    login_id_row = ""
    if login_id:
        login_id_row = f"""
        <div class="cred-row">
          <span class="cred-label">Login ID</span>
          <span class="cred-value">{login_id}</span>
        </div>"""

    content = f"""
    <p>Hello <strong>{name}</strong>,</p>
    <p>Welcome to <strong>{company_name or "EmPay"}</strong>! Your {badge_html} account has been created.
       Below are your login credentials — please change your password after your first sign-in.</p>

    <div class="cred-box">
      <div class="cred-row">
        <span class="cred-label">Email</span>
        <span class="cred-value">{to}</span>
      </div>{login_id_row}
      <div class="cred-row">
        <span class="cred-label">Temporary Password</span>
        <span class="cred-value">{temp_password}</span>
      </div>
    </div>

    <div class="warning">
      ⚠️ This is a temporary password. You <strong>must</strong> change it immediately after logging in.
    </div>

    <p style="margin-top:24px;">You can log in at your company's EmPay portal.
       If you have any issues, contact your system administrator.</p>
    """
    subject = f"Welcome to EmPay — Your {role_label} Account"
    return send_email(to, subject, _base_template(content))


def send_admin_welcome(to: str, company_name: str) -> bool:
    """Send a welcome email to a newly registered Admin."""
    content = f"""
    <p>Hello,</p>
    <p>🎉 Your company <strong>{company_name}</strong> has been successfully registered on <strong>EmPay HRMS</strong>.</p>
    <p>You are now the <span class="badge">Administrator</span> of your organization. Here's what to do next:</p>
    <ol style="line-height:2; color:#e2e8f0;">
      <li>Log in to your dashboard</li>
      <li>Invite your <strong>HR Officer(s)</strong></li>
      <li>Invite your <strong>Payroll Officer</strong></li>
      <li>Set default <strong>payroll rules</strong></li>
      <li>Start adding employees!</li>
    </ol>
    <p>We're excited to have you on board.</p>
    """
    return send_email(to, "Welcome to EmPay — Company Registered!", _base_template(content))


def send_leave_application_email(to: str, name: str, leave_type: str, from_date: str, to_date: str, days: float) -> bool:
    """Send an email to the employee confirming their leave application."""
    content = f"""
    <p>Hello <strong>{name}</strong>,</p>
    <p>We have successfully received your leave application.</p>
    <div class="cred-box">
      <div class="cred-row">
        <span class="cred-label">Leave Type</span>
        <span class="cred-value">{leave_type}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Duration</span>
        <span class="cred-value">{from_date} to {to_date}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Total Days</span>
        <span class="cred-value">{days}</span>
      </div>
    </div>
    <p>Your request is currently <strong>Pending</strong> review by HR.</p>
    <p>You will be notified once a decision is made.</p>
    """
    subject = f"Leave Application Received: {leave_type}"
    return send_email(to, subject, _base_template(content))


def send_leave_status_update_email(to: str, name: str, leave_type: str, from_date: str, to_date: str, status: str, remarks: str) -> bool:
    """Send an email to the employee when their leave is approved or rejected."""
    # status could be HR_APPROVED, APPROVED, REJECTED
    status_display = status.replace("_", " ").title()
    color = "#10b981" if "Approved" in status_display else "#ef4444"
    
    remarks_html = ""
    if remarks:
        remarks_html = f"""
        <div class="cred-row" style="margin-top: 10px;">
          <span class="cred-label">Remarks</span>
          <span class="cred-value" style="font-size: 14px; font-weight: normal; color: #cbd5e1;">{remarks}</span>
        </div>
        """

    content = f"""
    <p>Hello <strong>{name}</strong>,</p>
    <p>There is an update regarding your recent leave application.</p>
    <div class="cred-box">
      <div class="cred-row">
        <span class="cred-label">Leave Type</span>
        <span class="cred-value">{leave_type}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Duration</span>
        <span class="cred-value">{from_date} to {to_date}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Status</span>
        <span class="cred-value" style="color: {color};">{status_display}</span>
      </div>
      {remarks_html}
    </div>
    <p>If you have any questions, please contact your HR department.</p>
    """
    subject = f"Leave Application Update: {status_display}"
    return send_email(to, subject, _base_template(content))

