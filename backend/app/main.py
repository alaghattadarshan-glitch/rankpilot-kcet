import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import auth, users, colleges, recommendations, analytics, admin, shortlist
from app.core.config import settings
from app.db.database import Base, engine
from app.ai.engine import load_ml_assets
from app.models.seat_matrix import SeatMatrix

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_ml_assets()
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

@app.get("/")
def root():
    return {"message": "Welcome to KCET AI Counselling Assistant API"}
