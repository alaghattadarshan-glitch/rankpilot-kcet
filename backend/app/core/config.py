import os
from pydantic_settings import BaseSettings
from typing import Optional

# Compute absolute path to the backend directory's kcet.db
# This ensures the same database file is always used regardless of the working directory
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
_DEFAULT_DB_PATH = os.path.join(_BACKEND_DIR, "kcet.db")
_DEFAULT_DB_URL = f"sqlite:///{_DEFAULT_DB_PATH}"

class Settings(BaseSettings):
    PROJECT_NAME: str = "KCET AI Counselling Assistant"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey_change_in_production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database - uses absolute path to backend/kcet.db by default
    DATABASE_URL: str = os.getenv("DATABASE_URL", _DEFAULT_DB_URL)

    # SMTP Settings
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD", "")
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "True").lower() == "true"
    EMAILS_FROM_EMAIL: Optional[str] = os.getenv("EMAILS_FROM_EMAIL", "info@rankpilot.in")

    class Config:
        case_sensitive = True

settings = Settings()
