from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User, ActivityLog, FeedbackLog
from app.api.deps import get_current_user
from app.services.recommendation import get_recommendations, get_round_comparison, get_option_strategies
from pydantic import BaseModel

router = APIRouter()

class FeedbackCreate(BaseModel):
    college_code: str
    branch_code: str
    action: str  # accepted, rejected

@router.get("/")
def read_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Log recommendation query activity
    act_log = ActivityLog(user_id=current_user.id, activity_type="recommendation")
    db.add(act_log)
    db.commit()
    return get_recommendations(db, current_user.id)

@router.get("/option-entry")
def read_option_entry(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Log option entry view activity
    act_log = ActivityLog(user_id=current_user.id, activity_type="option_entry")
    db.add(act_log)
    db.commit()
    
    recs = get_recommendations(db, current_user.id)
    
    # The list is completely pre-sorted by the backend ranking engine
    optimized_list = recs.get("all_recommendations", [])
    
    # Assign sequential priority
    for i, item in enumerate(optimized_list):
        item["priority"] = i + 1
        
    return optimized_list

@router.get("/simulator")
def read_simulator(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Log simulator view activity
    act_log = ActivityLog(user_id=current_user.id, activity_type="simulator")
    db.add(act_log)
    db.commit()
    return get_round_comparison(db, current_user.id)

@router.post("/feedback")
def record_recommendation_feedback(
    feedback: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if feedback.action not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid feedback action")
    
    # Create feedback log entry
    f_log = FeedbackLog(
        user_id=current_user.id,
        college_code=feedback.college_code,
        branch_code=feedback.branch_code,
        action=feedback.action
    )
    db.add(f_log)
    db.commit()
    
    return {"message": "Feedback recorded successfully"}


@router.get("/strategies")
def read_option_strategies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Log option strategies query
    act_log = ActivityLog(user_id=current_user.id, activity_type="option_strategies")
    db.add(act_log)
    db.commit()
    return get_option_strategies(db, current_user.id)

