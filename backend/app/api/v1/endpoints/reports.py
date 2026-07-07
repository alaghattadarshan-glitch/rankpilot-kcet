from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.user import User, PDFReportLog
from app.api.deps import get_current_user, get_current_active_admin
from pydantic import BaseModel
from typing import List

router = APIRouter()

class LogRequest(BaseModel):
    action: str # generate, download

@router.post("/log")
def log_report_action(
    req: LogRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.action not in ["generate", "download"]:
        raise HTTPException(status_code=400, detail="Invalid report log action")
        
    log = PDFReportLog(
        user_id=current_user.id,
        action=req.action
    )
    db.add(log)
    db.commit()
    return {"message": f"Successfully logged report {req.action}"}

@router.get("/analytics")
def get_report_analytics(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    total_generated = db.query(func.count(PDFReportLog.id)).filter(PDFReportLog.action == "generate").scalar() or 0
    total_downloaded = db.query(func.count(PDFReportLog.id)).filter(PDFReportLog.action == "download").scalar() or 0
    
    # Recent log list
    recent_logs = db.query(PDFReportLog).order_by(PDFReportLog.timestamp.desc()).limit(15).all()
    logs_data = [{
        "email": l.user.email,
        "action": l.action,
        "timestamp": l.timestamp
    } for l in recent_logs]
    
    return {
        "generated_count": total_generated,
        "downloaded_count": total_downloaded,
        "recent_downloads": logs_data
    }
