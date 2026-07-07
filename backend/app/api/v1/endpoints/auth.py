import random
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User, LoginHistory, EmailVerificationToken, PasswordResetToken
from app.schemas.user import (
    UserCreate, UserResponse, Token,
    SendVerificationRequest, VerifyOTPRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from app.core.security import get_password_hash, verify_password, create_access_token
from app.services.email import send_verification_otp, send_password_reset_email

router = APIRouter()

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _get_client_info(request: Request):
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "unknown")
    return ip, ua


def _log_login(db: Session, user_id: str, email: str, ip: str, ua: str, status: str = "success"):
    """Write a login history record. Never raises — login should not fail because of this."""
    try:
        record = LoginHistory(
            user_id=user_id,
            email=email,
            ip_address=ip,
            user_agent=ua,
            login_status=status,
        )
        db.add(record)
        db.commit()
    except Exception as e:
        db.rollback()
        import logging
        logging.getLogger("rankpilot.auth").error(f"Failed to write login history: {e}")


# ---------------------------------------------------------------------------
# Step 1 — Send OTP to verify email (before registration)
# ---------------------------------------------------------------------------

@router.post("/send-verification")
def send_verification(body: SendVerificationRequest, db: Session = Depends(get_db)):
    """
    Check if email is already in use.
    Generate a 6-digit OTP, store it (expires in 10 min), and send via email.
    """
    # Block duplicate registrations
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists. Please login instead."
        )

    # Rate-limit: if a fresh unverified OTP exists (< 1 min old), reject
    recent = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.email == body.email,
        EmailVerificationToken.is_verified == False,
        EmailVerificationToken.created_at >= datetime.utcnow() - timedelta(minutes=1),
    ).first()
    if recent:
        raise HTTPException(
            status_code=429,
            detail="Please wait 1 minute before requesting another OTP."
        )

    # Invalidate old tokens for this email
    db.query(EmailVerificationToken).filter(
        EmailVerificationToken.email == body.email
    ).delete()

    otp = str(random.randint(100000, 999999))
    token = EmailVerificationToken(
        email=body.email,
        otp=otp,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    )
    db.add(token)
    db.commit()

    send_verification_otp(body.email, otp)

    return {"message": "Verification OTP sent. Check your email (or backend console in dev mode)."}


# ---------------------------------------------------------------------------
# Step 2 — Verify the OTP
# ---------------------------------------------------------------------------

@router.post("/verify-otp")
def verify_otp(body: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Validate the OTP. Marks the token as verified so registration can proceed.
    """
    record = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.email == body.email,
        EmailVerificationToken.otp == body.otp,
        EmailVerificationToken.is_verified == False,
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please check and try again.")

    if datetime.utcnow() > record.expires_at:
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    record.is_verified = True
    db.commit()

    return {"message": "Email verified successfully. You may now create your account."}


# ---------------------------------------------------------------------------
# Register — only allowed after email is verified
# ---------------------------------------------------------------------------

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check duplicate
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    # Require email to be verified via OTP
    verified_token = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.email == user_in.email,
        EmailVerificationToken.is_verified == True,
    ).first()

    if not verified_token:
        raise HTTPException(
            status_code=400,
            detail="Email not verified. Please verify your email with an OTP first."
        )

    # Create account
    user_obj = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_verified=True,
    )
    db.add(user_obj)

    # Clean up verification tokens
    db.query(EmailVerificationToken).filter(
        EmailVerificationToken.email == user_in.email
    ).delete()

    db.commit()
    db.refresh(user_obj)
    return user_obj


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=Token)
def login(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    ip, ua = _get_client_info(request)
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        # Log failed attempt if user exists
        if user:
            _log_login(db, user.id, user.email, ip, ua, status="failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last_login
    user.last_login = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    db.commit()

    # Log successful login
    _log_login(db, user.id, user.email, ip, ua, status="success")

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# ---------------------------------------------------------------------------
# Forgot Password
# ---------------------------------------------------------------------------

@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Send a password reset link to the email if it belongs to a registered user.
    Always returns success (to prevent account enumeration).
    """
    user = db.query(User).filter(User.email == body.email).first()

    if user:
        # Rate-limit: block if a fresh token < 1 min old
        recent = db.query(PasswordResetToken).filter(
            PasswordResetToken.email == body.email,
            PasswordResetToken.is_used == False,
            PasswordResetToken.created_at >= datetime.utcnow() - timedelta(minutes=1),
        ).first()

        if not recent:
            # Invalidate old reset tokens
            db.query(PasswordResetToken).filter(
                PasswordResetToken.email == body.email,
                PasswordResetToken.is_used == False,
            ).delete()

            token_str = secrets.token_urlsafe(48)
            reset_token = PasswordResetToken(
                user_id=user.id,
                email=user.email,
                token=token_str,
                expires_at=datetime.utcnow() + timedelta(minutes=30),
            )
            db.add(reset_token)
            db.commit()

            send_password_reset_email(user.email, token_str)

    # Always return the same message (don't reveal if email exists)
    return {
        "message": "If this email is registered, a password reset link has been sent. Check your email (or backend console in dev mode)."
    }


# ---------------------------------------------------------------------------
# Reset Password
# ---------------------------------------------------------------------------

@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Validate the reset token and update the user's password.
    """
    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == body.token,
        PasswordResetToken.is_used == False,
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or already used reset link.")

    if datetime.utcnow() > record.expires_at:
        record.is_used = True
        db.commit()
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.password_hash = get_password_hash(body.new_password)
    user.updated_at = datetime.utcnow()
    record.is_used = True
    db.commit()

    return {"message": "Password reset successfully. You can now login with your new password."}
