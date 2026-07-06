from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import shutil
import subprocess
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.user import User, StudentPreference, Shortlist, LoginHistory, ActivityLog, FeedbackLog
from app.models.college import College, Branch
from app.models.cutoff import Cutoff
from app.api.deps import get_current_active_admin
from app.ai.engine import load_ml_assets

router = APIRouter()

def run_ingestion_and_training():
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
    try:
        # Run Data Ingestion
        print("Starting Automated Data Ingestion...")
        subprocess.run(["python", "ingest_data.py"], cwd=backend_dir, check=True)
        
        # Run AI Training
        print("Starting Automated ML Training...")
        subprocess.run(["python", "app/ai/train.py"], cwd=backend_dir, check=True)
        
        # Hot-reload models into memory
        print("Hot-reloading ML models...")
        load_ml_assets()
        print("Pipeline Complete.")
    except subprocess.CalledProcessError as e:
        print(f"Pipeline failed: {e}")


@router.get("/stats")
def get_system_stats(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    users_count = db.query(func.count(User.id)).scalar() or 0
    colleges_count = db.query(func.count(College.code)).scalar() or 0
    branches_count = db.query(func.count(Branch.code)).scalar() or 0
    cutoffs_count = db.query(func.count(Cutoff.id)).scalar() or 0

    return {
        "total_users": users_count,
        "total_colleges": colleges_count,
        "total_branches": branches_count,
        "total_cutoffs": cutoffs_count
    }

@router.post("/upload/{dataset_type}")
def upload_dataset(
    dataset_type: str,
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_active_admin)
):
    valid_types = ["colleges", "branches", "master_cutoffs", "fee_structure"]
    if dataset_type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid dataset type.")
    
    # Save file to the backend root directory where ingest_data.py expects them
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
    file_path = os.path.join(backend_dir, f"{dataset_type}.csv")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload: {str(e)}")
        
    return {"message": f"Successfully uploaded {dataset_type}.csv"}

@router.post("/trigger-pipeline")
def trigger_pipeline(
    background_tasks: BackgroundTasks,
    current_admin: User = Depends(get_current_active_admin)
):
    background_tasks.add_task(run_ingestion_and_training)
    return {"message": "Data ingestion and ML training pipeline started in the background. Models will hot-reload automatically upon completion."}


@router.get("/users")
def get_admin_users(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    results = []
    for u in users:
        pref = u.preferences
        results.append({
            "id": u.id,
            "name": u.full_name,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at,
            "last_login": u.last_login,
            "category": pref.category if pref else None,
            "kcet_rank": pref.kcet_rank if pref else None,
            "preferred_branches": pref.preferred_branches if pref else [],
            "preferred_locations": pref.preferred_locations if pref else []
        })
    return results


@router.get("/analytics")
def get_admin_analytics(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    # Log analytics page view activity
    act_log = ActivityLog(user_id=current_admin.id, activity_type="analytics_view")
    db.add(act_log)
    db.commit()

    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    today_start = datetime(now.year, now.month, now.day)
    seven_days_ago = now - timedelta(days=7)
    
    # User stats cards
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.last_login >= thirty_days_ago).scalar() or 0
    users_today = db.query(func.count(User.id)).filter(User.created_at >= today_start).scalar() or 0
    users_this_week = db.query(func.count(User.id)).filter(User.created_at >= seven_days_ago).scalar() or 0
    users_this_month = db.query(func.count(User.id)).filter(User.created_at >= thirty_days_ago).scalar() or 0
    
    # Activity counts
    recommendation_requests = db.query(func.count(ActivityLog.id)).filter(ActivityLog.activity_type == "recommendation").scalar() or 0
    simulator_usage = db.query(func.count(ActivityLog.id)).filter(ActivityLog.activity_type == "simulator").scalar() or 0
    option_entry_usage = db.query(func.count(ActivityLog.id)).filter(ActivityLog.activity_type == "option_entry").scalar() or 0
    analytics_view_usage = db.query(func.count(ActivityLog.id)).filter(ActivityLog.activity_type == "analytics_view").scalar() or 0

    # Aggregate student preferences for charts
    preferences = db.query(StudentPreference).all()
    
    # 1. Round preference distribution
    rounds_dist = {"Mock Round": 0, "Round 1": 0, "Round 2": 0, "Round 3": 0}
    for p in preferences:
        rnd = p.counselling_round
        if rnd == "Mock": rounds_dist["Mock Round"] += 1
        elif rnd == "Round1": rounds_dist["Round 1"] += 1
        elif rnd == "Round2": rounds_dist["Round 2"] += 1
        elif rnd == "Round3": rounds_dist["Round 3"] += 1
        
    # 2. Category distribution
    cat_dist = {}
    for p in preferences:
        c = p.category or "GM"
        cat_dist[c] = cat_dist.get(c, 0) + 1

    # 3. Rank distribution buckets
    rank_dist = {"0-5k": 0, "5k-10k": 0, "10k-25k": 0, "25k-50k": 0, "50k-100k": 0, "100k+": 0}
    for p in preferences:
        r = p.kcet_rank
        if r is not None:
            if r <= 5000: rank_dist["0-5k"] += 1
            elif r <= 10000: rank_dist["5k-10k"] += 1
            elif r <= 25000: rank_dist["10k-25k"] += 1
            elif r <= 50000: rank_dist["25k-50k"] += 1
            elif r <= 100000: rank_dist["50k-100k"] += 1
            else: rank_dist["100k+"] += 1

    # 4. Most popular preferred branches
    branch_counts = {}
    for p in preferences:
        if p.preferred_branches:
            for b in p.preferred_branches:
                branch_counts[b] = branch_counts.get(b, 0) + 1
    sorted_branches = sorted(branch_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    # 5. Most preferred districts
    district_counts = {}
    for p in preferences:
        if p.preferred_locations:
            for d in p.preferred_locations:
                district_counts[d] = district_counts.get(d, 0) + 1
    sorted_districts = sorted(district_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    # 6. Most popular colleges (most added in Shortlist)
    college_counts = db.query(
        Shortlist.college_code,
        func.count(Shortlist.id).label("count")
    ).group_by(Shortlist.college_code).order_by(func.count(Shortlist.id).desc()).limit(5).all()
    
    colleges_list = []
    for c_code, count in college_counts:
        c_name = db.query(College.name).filter(College.code == c_code).scalar() or c_code
        colleges_list.append({"college_code": c_code, "college_name": c_name, "count": count})

    return {
        "summary": {
            "total_users": total_users,
            "active_users": active_users,
            "users_today": users_today,
            "users_this_week": users_this_week,
            "users_this_month": users_this_month,
            "recommendation_requests": recommendation_requests,
            "simulator_usage": simulator_usage,
            "option_entry_usage": option_entry_usage,
            "analytics_view_usage": analytics_view_usage
        },
        "distributions": {
            "rounds": [{"name": k, "value": v} for k, v in rounds_dist.items()],
            "categories": [{"name": k, "value": v} for k, v in cat_dist.items()],
            "ranks": [{"name": k, "value": v} for k, v in rank_dist.items()]
        },
        "popular": {
            "branches": [{"branch": k, "count": v} for k, v in sorted_branches],
            "districts": [{"district": k, "count": v} for k, v in sorted_districts],
            "colleges": colleges_list
        }
    }


@router.get("/logins")
def get_admin_logins(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    logins = db.query(LoginHistory).order_by(LoginHistory.login_time.desc()).limit(100).all()
    results = []
    for l in logins:
        # Determine last activity as the last activity log time or default to login time
        last_act = db.query(ActivityLog.timestamp).filter(ActivityLog.user_id == l.user_id).order_by(ActivityLog.timestamp.desc()).first()
        results.append({
            "id": l.id,
            "email": l.email,
            "login_time": l.login_time,
            "ip_address": l.ip_address,
            "user_agent": l.user_agent,
            "last_activity": last_act[0] if last_act else l.login_time
        })
    return results


@router.get("/activity")
def get_admin_activity(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    activities = db.query(
        ActivityLog.id,
        ActivityLog.activity_type,
        ActivityLog.timestamp,
        User.email
    ).join(User, ActivityLog.user_id == User.id).order_by(ActivityLog.timestamp.desc()).limit(100).all()
    
    return [
        {
            "id": a.id,
            "activity_type": a.activity_type,
            "timestamp": a.timestamp,
            "email": a.email
        }
        for a in activities
    ]


@router.get("/feedback")
def get_admin_feedback(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    # Retrieve all feedback logs and join with College and Branch names
    logs = db.query(FeedbackLog).all()
    
    colleges = {c.code: c.name for c in db.query(College).all()}
    branches = {b.code: b.name for b in db.query(Branch).all()}
    
    feedback_stats = {}
    for l in logs:
        key = (l.college_code, l.branch_code)
        if key not in feedback_stats:
            feedback_stats[key] = {"accepted": 0, "rejected": 0}
        feedback_stats[key][l.action] += 1
        
    results = []
    for (c_code, b_code), stats in feedback_stats.items():
        results.append({
            "college_code": c_code,
            "college_name": colleges.get(c_code, c_code),
            "branch_code": b_code,
            "branch_name": branches.get(b_code, b_code),
            "accepted": stats["accepted"],
            "rejected": stats["rejected"]
        })
        
    return results
