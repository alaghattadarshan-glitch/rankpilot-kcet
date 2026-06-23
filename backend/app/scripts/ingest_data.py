import pandas as pd
import random
import os
import sys

# Add backend directory to sys path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.database import SessionLocal, engine, Base
from app.models.college import College, Branch
from app.models.cutoff import Cutoff, Placement, Fee

def ingest():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # 1. Ingest Colleges
    backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    colleges_path = os.path.join(backend_root, "colleges.csv")
    if not os.path.exists(colleges_path):
        # Fallback to cet directory if not in backend/
        colleges_path = os.path.join(os.path.dirname(backend_root), "colleges.csv")

    print(f"Ingesting {colleges_path}...")
    colleges_df = pd.read_csv(colleges_path)
    for _, row in colleges_df.iterrows():
        existing = db.query(College).filter(College.code == row['college_code']).first()
        if not existing:
            college = College(
                code=row['college_code'],
                name=row['college_name'],
                city=row.get('city', ''),
                district=row.get('district', ''),
                type=row.get('type', '')
            )
            db.add(college)
    db.commit()

    # 2. Ingest Branches
    branches_path = os.path.join(backend_root, "branches.csv")
    if not os.path.exists(branches_path):
        branches_path = os.path.join(os.path.dirname(backend_root), "branches.csv")

    print(f"Ingesting {branches_path}...")
    branches_df = pd.read_csv(branches_path)
    for _, row in branches_df.iterrows():
        existing = db.query(Branch).filter(Branch.code == row['branch_code']).first()
        if not existing:
            branch = Branch(
                code=row['branch_code'],
                name=row['branch_name']
            )
            db.add(branch)
    db.commit()

    # 3. Ingest Cutoffs (Chunked)
    print("Ingesting master_cutoffs.csv (this might take a minute)...")
    db.query(Cutoff).delete() # Clear existing for fresh import
    db.commit()
    
    cutoffs_path = os.path.join(backend_root, "master_cutoffs.csv")
    if not os.path.exists(cutoffs_path):
        cutoffs_path = os.path.join(os.path.dirname(backend_root), "master_cutoffs.csv")

    chunk_size = 10000
    for chunk in pd.read_csv(cutoffs_path, chunksize=chunk_size):
        cutoffs = []
        for _, row in chunk.iterrows():
            cutoffs.append(Cutoff(
                year=row['year'],
                round=row['round'],
                college_code=row['college_code'],
                branch_code=row['branch_code'],
                category=row['category'],
                cutoff_rank=row['cutoff_rank']
            ))
        db.bulk_save_objects(cutoffs)
        db.commit()

    # 4. Generate Mock Placements & Load Actual Fees
    print("Generating Mock Placement and loading Actual Fee data...")
    db.query(Placement).delete()
    db.query(Fee).delete()
    db.commit()

    fee_path = os.path.join(backend_root, "fee_structure.csv")
    if not os.path.exists(fee_path):
        fee_path = os.path.join(os.path.dirname(backend_root), "KCET_2026_Fee_Structure.csv")
        
    fee_df = pd.read_csv(fee_path)
    fee_map_gen = {}
    fee_map_snq = {}
    for _, row in fee_df.iterrows():
        fee_map_gen[row['College Type']] = row['GM_2A_2B_3A_3B_SCST_Income_Above_10L']
        fee_map_snq[row['College Type']] = row['SNQ_Supernumerary_Quota'] if pd.notnull(row['SNQ_Supernumerary_Quota']) else 0

    all_colleges = db.query(College).all()
    placements = []
    fees = []
    for c in all_colleges:
        # Placements
        base_pkg = random.uniform(3.5, 8.0)
        if "B M S" in c.name or "RV" in c.name or "PES" in c.name or "Ramaiah" in c.name:
            base_pkg = random.uniform(10.0, 16.0)
            
        placements.append(Placement(
            college_code=c.code,
            year=2024,
            avg_package=round(base_pkg, 2),
            highest_package=round(base_pkg * random.uniform(2.5, 4.0), 2),
            placement_percentage=round(random.uniform(75.0, 99.0), 2)
        ))

        # Fees
        c_type = c.type
        if c_type in ["GOVERNMENT", "PUBLIC UNIVERSITY"]:
            fee_type = "Government Colleges"
        elif c_type == "CONSTITUENT":
            fee_type = "VTU Constituent Colleges"
        elif c_type == "DEEMED":
            fee_type = "Deemed / Private Universities"
        else:
            fee_type = "Type-1 Unaided (Private)"

        gen_fee = fee_map_gen.get(fee_type, 112410)
        snq_fee = fee_map_snq.get(fee_type, 30610)

        fees.append(Fee(college_code=c.code, quota="General", fee_amount=int(gen_fee)))
        if snq_fee > 0:
            fees.append(Fee(college_code=c.code, quota="SNQ", fee_amount=int(snq_fee)))

    db.bulk_save_objects(placements)
    db.bulk_save_objects(fees)
    db.commit()
    
    print("Ingestion complete!")
    db.close()

if __name__ == "__main__":
    ingest()
