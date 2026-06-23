from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserResponse
from app.models.user import User, StudentPreference
from app.api.deps import get_current_user
from app.db.database import get_db
from app.schemas.preference import PreferenceCreate, PreferenceResponse

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/preferences", response_model=PreferenceResponse)
def get_preferences(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pref = db.query(StudentPreference).filter(StudentPreference.user_id == current_user.id).first()
    if not pref:
        raise HTTPException(status_code=404, detail="Preferences not found")
    return pref

@router.post("/preferences", response_model=PreferenceResponse)
def create_or_update_preferences(
    pref_in: PreferenceCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pref = db.query(StudentPreference).filter(StudentPreference.user_id == current_user.id).first()
    if pref:
        for var, value in vars(pref_in).items():
            setattr(pref, var, value)
    else:
        pref = StudentPreference(
            user_id=current_user.id,
            **pref_in.model_dump()
        )
        db.add(pref)
    db.commit()
    db.refresh(pref)
    return pref
