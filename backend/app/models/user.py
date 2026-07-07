import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="user")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    preferences = relationship("StudentPreference", back_populates="user", uselist=False)

class StudentPreference(Base):
    __tablename__ = "student_preferences"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), unique=True, index=True)
    kcet_rank = Column(Integer, nullable=True)
    category = Column(String, nullable=True)
    is_rural = Column(Boolean, default=False)
    is_kannada = Column(Boolean, default=False)
    preferred_branches = Column(JSON, nullable=True)
    preferred_locations = Column(JSON, nullable=True)
    max_budget = Column(Integer, nullable=True)
    counselling_round = Column(String, default="Mock")
    
    user = relationship("User", back_populates="preferences")

class Shortlist(Base):
    __tablename__ = "shortlists"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    college_code = Column(String, index=True)
    branch_code = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="shortlists")

class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    email = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    login_time = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="login_history_records")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    activity_type = Column(String, nullable=False) # recommendation, simulator, option_entry, analytics_view
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="activity_logs_records")

class FeedbackLog(Base):
    __tablename__ = "feedback_logs"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    college_code = Column(String, nullable=False)
    branch_code = Column(String, nullable=False)
    action = Column(String, nullable=False) # accepted, rejected
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="feedback_logs_records")

class ContactInquiry(Base):
    __tablename__ = "contact_inquiries"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    subject = Column(String, nullable=False)
    message = Column(String, nullable=False)
    submitted_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="New") # New, Read, Replied, Closed

class PDFReportLog(Base):
    __tablename__ = "pdf_report_logs"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    action = Column(String, nullable=False) # generate, download
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="pdf_report_logs_records")

class DatasetUpload(Base):
    __tablename__ = "dataset_uploads"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    dataset_type = Column(String, nullable=False) # mock, round1, round2, round3, colleges, placements, fees
    year = Column(Integer, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    records_count = Column(Integer, default=0)
    quality_score = Column(Float, default=100.0)
    status = Column(String, default="pending") # pending, approved, rejected
    preview_data = Column(JSON, nullable=True)

class MentorChat(Base):
    __tablename__ = "mentor_chats"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    question = Column(String, nullable=False)
    answer = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="mentor_chats_records")

class BranchRecommendationLog(Base):
    __tablename__ = "branch_recommendation_logs"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    scores = Column(JSON, nullable=False) # JSON object
    reasoning = Column(JSON, nullable=True) # JSON object
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="branch_recommendation_logs_records")

