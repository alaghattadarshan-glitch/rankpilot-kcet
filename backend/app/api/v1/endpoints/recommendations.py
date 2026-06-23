from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.services.recommendation import get_recommendations, get_round_comparison

router = APIRouter()

@router.get("/")
def read_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_recommendations(db, current_user.id)

@router.get("/option-entry")
def read_option_entry(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
    return get_round_comparison(db, current_user.id)
