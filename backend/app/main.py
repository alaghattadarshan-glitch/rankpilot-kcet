import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import auth, users, colleges, recommendations, analytics, admin, shortlist, contact, mentor, career, reports
from app.core.config import settings
from app.db.database import Base, engine, SessionLocal
from app.ai.engine import load_ml_assets
from app.models.seat_matrix import SeatMatrix
from app.models.user import User
from app.core.security import get_password_hash

def create_default_admin():
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == "alaghattadarshan@gmail.com").first()
        if not admin_user:
            admin_user = User(
                email="alaghattadarshan@gmail.com",
                password_hash=get_password_hash("Darshan@162006"),
                full_name="Darshan Prabhu K",
                role="admin"
            )
            db.add(admin_user)
            db.commit()
            print("Default admin created successfully: alaghattadarshan@gmail.com")
    except Exception as e:
        print(f"Error creating default admin: {e}")
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_ml_assets()
    create_default_admin()
    yield

# Create tables for now instead of alembic migrations for fast iteration
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(colleges.router, prefix=f"{settings.API_V1_STR}/colleges", tags=["colleges"])
app.include_router(recommendations.router, prefix=f"{settings.API_V1_STR}/recommendations", tags=["recommendations"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(shortlist.router, prefix=f"{settings.API_V1_STR}/shortlist", tags=["shortlist"])
app.include_router(contact.router, prefix=f"{settings.API_V1_STR}/contact", tags=["contact"])
app.include_router(mentor.router, prefix=f"{settings.API_V1_STR}/mentor", tags=["mentor"])
app.include_router(career.router, prefix=f"{settings.API_V1_STR}/career", tags=["career"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["reports"])

@app.get("/")
def root():
    return {"message": "Welcome to KCET AI Counselling Assistant API"}
