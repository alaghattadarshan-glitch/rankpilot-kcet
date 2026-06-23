from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.college import College, Branch
from app.models.cutoff import Cutoff, Placement, Fee
from app.models.user import User, StudentPreference
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/")
def get_colleges(db: Session = Depends(get_db)):
    # Limit to avoid massive payload on initial load
    return db.query(College).limit(200).all()

@router.get("/branches")
def get_branches(db: Session = Depends(get_db)):
    return db.query(Branch).all()

@router.get("/compare")
def compare_colleges(
    codes: str = Query(..., description="Comma separated college codes"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    code_list = codes.split(',')
    colleges = db.query(College).filter(College.code.in_(code_list)).all()
    
    # Get user pref for branch/category
    pref = db.query(StudentPreference).filter(StudentPreference.user_id == current_user.id).first()
    category = pref.category if pref else 'GM'
    preferred_branches = pref.preferred_branches if pref and pref.preferred_branches else ['CS']
    
    results = []
    for c in colleges:
        # Placement
        p = db.query(Placement).filter(Placement.college_code == c.code).first()
        
        # Fees
        f_govt = db.query(Fee).filter(Fee.college_code == c.code, Fee.quota == 'Govt').first()
        f_priv = db.query(Fee).filter(Fee.college_code == c.code, Fee.quota == 'Private').first()
        
        # Cutoff (Latest year for any of preferred branches, order by rank ascending to find best cutoff)
        cutoff_query = db.query(Cutoff).filter(
            Cutoff.college_code == c.code,
            Cutoff.category == category,
            Cutoff.branch_code.in_(preferred_branches)
        ).order_by(Cutoff.year.desc(), Cutoff.cutoff_rank.asc()).first()
        
        results.append({
            "college_code": c.code,
            "name": c.name,
            "district": c.district,
            "type": c.type,
            "avg_package": p.avg_package if p else None,
            "highest_package": p.highest_package if p else None,
            "placement_percent": p.placement_percentage if p else None,
            "fee_govt": f_govt.fee_amount if f_govt else None,
            "fee_private": f_priv.fee_amount if f_priv else None,
            "latest_cutoff": cutoff_query.cutoff_rank if cutoff_query else None,
            "cutoff_branch": cutoff_query.branch_code if cutoff_query else None
        })
        
    return results
