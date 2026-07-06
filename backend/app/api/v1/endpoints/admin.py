from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import shutil
import subprocess
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.user import User, StudentPreference, Shortlist, LoginHistory, ActivityLog, FeedbackLog, ContactInquiry
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


from sqlalchemy.sql import text

@router.get("/user/{user_id}")
def get_admin_user_detail(
    user_id: str,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    pref = user.preferences
    return {
        "id": user.id,
        "name": user.full_name,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at,
        "last_login": user.last_login,
        "category": pref.category if pref else None,
        "kcet_rank": pref.kcet_rank if pref else None,
        "preferred_branches": pref.preferred_branches if pref else [],
        "preferred_locations": pref.preferred_locations if pref else []
    }


@router.delete("/user/{user_id}")
def delete_admin_user(
    user_id: str,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Prevent self deletion
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own administrator account.")

    # Cascading delete all associated tables
    db.query(FeedbackLog).filter(FeedbackLog.user_id == user_id).delete()
    db.query(ActivityLog).filter(ActivityLog.user_id == user_id).delete()
    db.query(LoginHistory).filter(LoginHistory.user_id == user_id).delete()
    db.query(Shortlist).filter(Shortlist.user_id == user_id).delete()
    db.query(StudentPreference).filter(StudentPreference.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    
    return {"message": "User and all associated records permanently deleted successfully."}


@router.get("/system-health")
def get_system_health(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    # 1. Database Status
    try:
        db.execute(text("SELECT 1")).scalar()
        db_status = "Healthy"
    except Exception:
        db_status = "Unhealthy"

    # 2. AI Model Status
    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../ai/models"))
    model_median_path = os.path.join(models_dir, "cutoff_model_median.pkl")
    ai_status = "Loaded" if os.path.exists(model_median_path) else "Not Loaded"
    
    last_trained = "Never trained"
    if os.path.exists(model_median_path):
        mtime = os.path.getmtime(model_median_path)
        last_trained = datetime.fromtimestamp(mtime).isoformat()

    # 3. Last Dataset Update
    colleges_csv = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../colleges.csv"))
    last_dataset_update = "Never updated"
    if os.path.exists(colleges_csv):
        mtime_csv = os.path.getmtime(colleges_csv)
        last_dataset_update = datetime.fromtimestamp(mtime_csv).isoformat()

    # 4. Dataset Monitoring
    datasets = db.query(
        Cutoff.year,
        Cutoff.round,
        func.count(Cutoff.id).label("rows")
    ).group_by(Cutoff.year, Cutoff.round).all()
    
    dataset_monitoring = []
    for yr, rnd, rows in datasets:
        dataset_monitoring.append({
            "dataset_name": f"KCET {yr} {rnd} Cutoffs",
            "year": yr,
            "round": rnd,
            "rows": rows,
            "upload_date": last_dataset_update if last_dataset_update != "Never updated" else datetime.utcnow().date().isoformat(),
            "last_modified": last_dataset_update if last_dataset_update != "Never updated" else datetime.utcnow().date().isoformat(),
            "status": "Active"
        })

    return {
        "backend_status": "Healthy",
        "database_status": db_status,
        "ai_model_status": ai_status,
        "last_dataset_update": last_dataset_update,
        "last_model_training_time": last_trained,
        "datasets": dataset_monitoring
    }


@router.get("/contacts")
def get_admin_contacts(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    contacts = db.query(ContactInquiry).order_by(ContactInquiry.submitted_date.desc()).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "subject": c.subject,
            "message": c.message,
            "submitted_date": c.submitted_date,
            "status": c.status
        }
        for c in contacts
    ]


@router.get("/contact/{contact_id}")
def get_admin_contact_detail(
    contact_id: str,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    contact = db.query(ContactInquiry).filter(ContactInquiry.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact inquiry not found")
    return contact


@router.delete("/contact/{contact_id}")
def delete_admin_contact(
    contact_id: str,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    contact = db.query(ContactInquiry).filter(ContactInquiry.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact inquiry not found")
    db.delete(contact)
    db.commit()
    return {"message": "Contact inquiry deleted successfully"}


@router.patch("/contact/{contact_id}/status")
def update_admin_contact_status(
    contact_id: str,
    status_update: dict,
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    contact = db.query(ContactInquiry).filter(ContactInquiry.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact inquiry not found")
    
    new_status = status_update.get("status")
    if new_status not in ["New", "Read", "Replied", "Closed"]:
        raise HTTPException(status_code=400, detail="Invalid status option")
        
    contact.status = new_status
    db.commit()
    db.refresh(contact)
    return contact
