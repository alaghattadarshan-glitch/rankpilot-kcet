from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import shutil
import subprocess

from app.db.database import get_db
from app.models.user import User
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
    users_count = db.query(func.count(User.id)).scalar()
    colleges_count = db.query(func.count(College.code)).scalar()
    branches_count = db.query(func.count(Branch.code)).scalar()
    cutoffs_count = db.query(func.count(Cutoff.id)).scalar()

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
