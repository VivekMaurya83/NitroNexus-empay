"""
email_service.py — SMTP email delivery using Gmail.
Gracefully logs to console if SMTP is not configured (dev mode).
"""
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from app.core.config import settings

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(settings.MAIL_USERNAME and settings.MAIL_PASSWORD and settings.MAIL_FROM)


def send_email(to: str, subject: str, html_body: str, attachments: list[tuple[str, bytes]] = None) -> bool:
    """Send an HTML email with optional attachments. Returns True on success, False on failure."""
    if not _smtp_configured():
        logger.warning(
            "[EMAIL — NOT SENT — SMTP not configured]\n"
            f"  To:      {to}\n"
            f"  Subject: {subject}\n"
            f"  Body:    {html_body[:400]}…"
        )
        if attachments:
            logger.warning(f"  Attachments: {[name for name, _ in attachments]}")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = settings.MAIL_FROM
    msg["To"]      = to
    msg.attach(MIMEText(html_body, "html"))
    
    if attachments:
        for filename, file_bytes in attachments:
            part = MIMEApplication(file_bytes, Name=filename)
            part['Content-Disposition'] = f'attachment; filename="{filename}"'
            msg.attach(part)

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


def send_whatsapp_setup_email(to: str, name: str) -> bool:
    """Send an email instructing the user to join the WhatsApp sandbox."""
    # Ensure we use settings correctly; if TWILIO_PHONE is something like "whatsapp:+1415..." we extract the number
    from app.core.config import settings
    twilio_number = settings.TWILIO_PHONE.replace("whatsapp:", "") if settings.TWILIO_PHONE else "+14155238886"
    join_code = settings.TWILIO_JOIN_CODE or "store-creature"
    
    content = f"""
    <p>Hello <strong>{name}</strong>,</p>
    <p>We use WhatsApp to send you instant notifications about your leave requests and approvals.</p>
    
    <div class="cred-box" style="border-color: #22c55e;">
      <p style="margin: 0 0 10px 0; color: #e2e8f0;">To start receiving notifications, please send the following message:</p>
      <div style="background: #1e293b; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
        <span style="font-family: monospace; font-size: 16px; color: #4ade80;">join {join_code}</span>
      </div>
      <p style="margin: 0; color: #e2e8f0;">to our WhatsApp number: <strong><a href="https://wa.me/{twilio_number.replace('+', '')}?text=join%20{join_code}" style="color: #4ade80; text-decoration: none;">{twilio_number}</a></strong></p>
    </div>
    
    <p>Once you send this message, you'll be subscribed to receive real-time updates for your leave applications directly on WhatsApp!</p>
    """
    subject = "EmPay — Set Up Your WhatsApp Notifications"
    return send_email(to, subject, _base_template(content))


def send_leave_status_email(to: str, name: str, leave_type: str, start_date: str, status_str: str, remarks: str = None) -> bool:
    """Send an email notifying the employee of their leave status update."""
    color = "#4ade80" if "APPROVED" in status_str else "#ef4444"
    remarks_html = f'<p style="margin-top: 15px;"><strong>Remarks:</strong> {remarks}</p>' if remarks else ""
    
    content = f"""
    <p>Hello <strong>{name}</strong>,</p>
    <p>There is an update on your leave application.</p>
    
    <div class="cred-box" style="border-color: {color};">
      <div class="cred-row">
        <span class="cred-label">Leave Type</span>
        <span class="cred-value" style="color: #e2e8f0; font-family: inherit;">{leave_type}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Start Date</span>
        <span class="cred-value" style="color: #e2e8f0; font-family: inherit;">{start_date}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Status</span>
        <span class="cred-value" style="color: {color}; font-family: inherit;">{status_str}</span>
      </div>
      {remarks_html}
    </div>
    
    <p>You can check the full details by logging into your EmPay portal.</p>
    """
    subject = f"EmPay — Leave Request Update: {status_str}"
    return send_email(to, subject, _base_template(content))


def send_payslip_email(to: str, name: str, month_str: str, year: int, net_pay: str, pdf_bytes: bytes, filename: str) -> bool:
    """Send an email to the employee with their payslip PDF attached."""
    content = f"""
    <p>Hello <strong>{name}</strong>,</p>
    <p>Your payslip for <strong>{month_str} {year}</strong> has been generated and is attached to this email.</p>
    
    <div class="cred-box" style="border-color: #6366f1;">
      <div class="cred-row">
        <span class="cred-label">Month</span>
        <span class="cred-value" style="color: #e2e8f0; font-family: inherit;">{month_str} {year}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Net Pay</span>
        <span class="cred-value" style="color: #4ade80;">{net_pay}</span>
      </div>
    </div>
    
    <p>You can also view and download your payslips by logging into your EmPay portal.</p>
    """
    subject = f"EmPay — Payslip for {month_str} {year}"
    return send_email(to, subject, _base_template(content), attachments=[(filename, pdf_bytes)])
