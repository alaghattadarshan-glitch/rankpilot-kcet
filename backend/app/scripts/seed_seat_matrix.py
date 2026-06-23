import os
import sys
import random
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.database import SessionLocal, engine, Base
from app.models.cutoff import Cutoff
from app.models.seat_matrix import SeatMatrix

def seed_seat_matrix():
    db = SessionLocal()
    
    # Check if already seeded
    existing = db.query(SeatMatrix).first()
    if existing:
        print("Seat matrix already seeded.")
        # We can drop it for a fresh seed or just return
        db.query(SeatMatrix).delete()
        db.commit()
    
    print("Seeding mock seat matrix based on historical cutoffs...")
    
    # Get distinct college + branch + category combos from cutoffs
    combos = db.query(Cutoff.college_code, Cutoff.branch_code, Cutoff.category).distinct().all()
    
    records = []
    for college_code, branch_code, category in combos:
        # Mock logic: General Merit usually has more seats. Reserved categories have fewer.
        if category == 'GM':
            seats = random.randint(20, 60)
        else:
            seats = random.randint(1, 15)
            
        records.append(
            SeatMatrix(
                college_code=college_code,
                branch_code=branch_code,
                category=category,
                seats_available=seats
            )
        )
    
    if records:
        db.bulk_save_objects(records)
        db.commit()
        print(f"Successfully seeded {len(records)} seat matrix records.")
    
    db.close()

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed_seat_matrix()
