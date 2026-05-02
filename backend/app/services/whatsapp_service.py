import logging
from twilio.rest import Client
from app.core.config import settings

logger = logging.getLogger(__name__)

def _twilio_configured() -> bool:
    return bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_PHONE)

def send_whatsapp_message(to_phone: str, body: str) -> bool:
    """Send a WhatsApp message via Twilio. Returns True on success, False on failure."""
    if not _twilio_configured():
        logger.warning(
            "[WHATSAPP — NOT SENT — Twilio not configured]\n"
            f"  To:   {to_phone}\n"
            f"  Body: {body}"
        )
        return False
        
    if not to_phone:
        logger.warning("[WHATSAPP — NOT SENT — No phone number provided]")
        return False

    # Ensure the phone number is prefixed with 'whatsapp:'
    if not to_phone.startswith("whatsapp:"):
        # Add a + if the number doesn't have it and isn't already prefixed with whatsapp:
        if not to_phone.startswith("+"):
            to_phone = f"+{to_phone}"
        to_phone = f"whatsapp:{to_phone}"

    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        # In a real environment, we would also validate the twilio phone format, 
        # but config can specify 'whatsapp:+14155238886' directly.
        from_phone = settings.TWILIO_PHONE
        if not from_phone.startswith("whatsapp:"):
            from_phone = f"whatsapp:{from_phone}"

        message = client.messages.create(
            from_=from_phone,
            body=body,
            to=to_phone
        )
        
        logger.info(f"[WHATSAPP SENT] To: {to_phone}  SID: {message.sid}")
        return True
    except Exception as exc:
        logger.error(f"[WHATSAPP FAILED] To: {to_phone} — {exc}")
        return False
