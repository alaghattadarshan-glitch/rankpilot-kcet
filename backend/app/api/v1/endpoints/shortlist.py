from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User, Shortlist
from app.api.deps import get_current_user
from pydantic import BaseModel

router = APIRouter()

class ShortlistCreate(BaseModel):
    college_code: str
    branch_code: str

@router.post("/")
def add_to_shortlist(
    item: ShortlistCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(Shortlist).filter(
        Shortlist.user_id == current_user.id,
        Shortlist.college_code == item.college_code,
        Shortlist.branch_code == item.branch_code
    ).first()
    
    if existing:
        return {"status": "already_exists"}
        
    new_item = Shortlist(
        user_id=current_user.id,
        college_code=item.college_code,
        branch_code=item.branch_code
    )
    db.add(new_item)
    db.commit()
    return {"status": "success"}

@router.delete("/")
def remove_from_shortlist(
    college_code: str,
    branch_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Shortlist).filter(
        Shortlist.user_id == current_user.id,
        Shortlist.college_code == college_code,
        Shortlist.branch_code == branch_code
    ).first()
    
    if item:
        db.delete(item)
        db.commit()
    return {"status": "success"}

@router.get("/")
def get_shortlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(Shortlist).filter(Shortlist.user_id == current_user.id).all()
    return [{"college_code": i.college_code, "branch_code": i.branch_code} for i in items]
