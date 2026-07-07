"""
Email service for RankPilot.

In DEVELOPMENT mode (no SMTP_HOST configured), all emails are printed to
the console/logs so you can test OTPs and reset links without a mail server.

To enable real email sending, set these environment variables (in a .env file):
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=your_gmail@gmail.com
    SMTP_PASSWORD=your_app_password
    EMAILS_FROM_EMAIL=your_gmail@gmail.com
    FRONTEND_URL=http://localhost:5173
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

logger = logging.getLogger("rankpilot.email")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

_DEV_MODE = not (settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)


def _send_smtp(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAILS_FROM_EMAIL or settings.SMTP_USER
        msg["To"] = to_email
        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL or settings.SMTP_USER, to_email, msg.as_string())
        return True
    except Exception as e:
        logger.error(f"SMTP send failed to {to_email}: {e}")
        return False


def send_verification_otp(email: str, otp: str) -> bool:
    """Send a 6-digit OTP to verify email during registration."""
    subject = "RankPilot - Verify Your Email"
    text_body = f"Your RankPilot verification OTP is: {otp}\nExpires in 10 minutes."
    html_body = f"""
<html><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px;">
  <div style="max-width:480px;margin:auto;background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <h2 style="color:#2563eb;margin-top:0;">Verify Your Email</h2>
    <p>Your one-time password (OTP) for RankPilot registration:</p>
    <div style="background:#eff6ff;border:2px dashed #2563eb;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
      <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;">{otp}</span>
    </div>
    <p style="color:#6b7280;font-size:14px;">Expires in <strong>10 minutes</strong>. Do not share this OTP.</p>
  </div>
</body></html>"""

    if _DEV_MODE:
        print("\n" + "="*60)
        print("📧 [DEV EMAIL] Verification OTP")
        print(f"   To:  {email}")
        print(f"   OTP: {otp}")
        print("="*60 + "\n")
        logger.info(f"[DEV] Verification OTP for {email}: {otp}")
        return True
    return _send_smtp(email, subject, html_body, text_body)


def send_password_reset_email(email: str, token: str) -> bool:
    """Send a password reset link to the user."""
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    subject = "RankPilot - Reset Your Password"
    text_body = f"Reset your RankPilot password here (expires in 30 min):\n{reset_url}"
    html_body = f"""
<html><body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px;">
  <div style="max-width:480px;margin:auto;background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <h2 style="color:#2563eb;margin-top:0;">Reset Your Password</h2>
    <p>You requested a password reset for your RankPilot account.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="{reset_url}" style="background:#2563eb;color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;">Reset Password</a>
    </div>
    <p style="color:#6b7280;font-size:14px;">This link expires in <strong>30 minutes</strong>.</p>
    <p style="color:#6b7280;font-size:13px;word-break:break-all;">Or copy: <a href="{reset_url}">{reset_url}</a></p>
  </div>
</body></html>"""

    if _DEV_MODE:
        print("\n" + "="*60)
        print("📧 [DEV EMAIL] Password Reset Link")
        print(f"   To:        {email}")
        print(f"   Reset URL: {reset_url}")
        print("="*60 + "\n")
        logger.info(f"[DEV] Password reset link for {email}: {reset_url}")
        return True
    return _send_smtp(email, subject, html_body, text_body)
