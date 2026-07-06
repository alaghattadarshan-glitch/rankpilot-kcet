import smtplib
from email.mime.text import MIMEText
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.db.database import get_db
from app.models.user import ContactInquiry
from app.core.config import settings

router = APIRouter()

class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str

def send_contact_email_background(name: str, email: str, phone: Optional[str], subject: str, message: str, submitted_date: datetime):
    email_body = f"""Name:
{name}

Email:
{email}

Phone:
{phone or 'N/A'}

Message:
{message}

Submission Time:
{submitted_date}
"""
    
    # Write to local log file for verification/development testing
    try:
        with open("emails_sent.log", "a") as f:
            f.write(f"--- EMAIL TO: alaghattadarshan@gmail.com ---\n")
            f.write(f"Subject: [RankPilot Contact] {subject}\n")
            f.write(email_body)
            f.write("-----------------------------------------\n\n")
    except Exception as e:
        print(f"Error logging email to file: {e}")

    # Send real email via SMTP if credentials are configured
    if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            msg = MIMEText(email_body)
            msg["Subject"] = f"[RankPilot Contact] {subject}"
            msg["From"] = settings.EMAILS_FROM_EMAIL
            msg["To"] = "alaghattadarshan@gmail.com"
            
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            if settings.SMTP_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, ["alaghattadarshan@gmail.com"], msg.as_string())
            server.quit()
            print("Email sent successfully via SMTP.")
        except Exception as e:
            print(f"Error sending email via SMTP: {e}")


@router.post("/")
def submit_contact_form(
    inquiry: ContactCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Basic Spam Check: Reject if message contains suspicious bot strings
    suspicious_keywords = ["gsa search engine ranker", "buy backlinks", "seo spam", "cheap pills"]
    lowered_msg = inquiry.message.lower()
    if any(kw in lowered_msg for kw in suspicious_keywords):
        raise HTTPException(status_code=400, detail="Spam message detected and blocked.")

    new_inquiry = ContactInquiry(
        name=inquiry.name,
        email=inquiry.email,
        phone=inquiry.phone,
        subject=inquiry.subject,
        message=inquiry.message,
        status="New"
    )
    db.add(new_inquiry)
    db.commit()
    db.refresh(new_inquiry)
    
    # Send email in background
    background_tasks.add_task(
        send_contact_email_background,
        new_inquiry.name,
        new_inquiry.email,
        new_inquiry.phone,
        new_inquiry.subject,
        new_inquiry.message,
        new_inquiry.submitted_date
    )
    
    return {"message": "Inquiry submitted successfully", "id": new_inquiry.id}
