import os
import sys
import random
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.database import SessionLocal, engine, Base
from app.models.college import College
from app.models.cutoff import Placement

def seed_placements():
    db = SessionLocal()
    
    print("Clearing old placements...")
    db.query(Placement).delete()
    db.commit()
    
    colleges = db.query(College).all()
    print(f"Generating realistic placement packages for {len(colleges)} colleges...")
    
    placements = []
    for c in colleges:
        name_lower = c.name.lower()
        is_premium = False
        
        # Exact code matching for top tier institutions
        if c.code in ['E005', 'E003', 'E048', 'E006', 'E141', 'E001']:
            is_premium = True
        # Precise keyword matching avoiding false positives like 'SURVEY'
        elif any(kw in name_lower for kw in ["r. v. college", "rv college", "rvce", "b.m.s. college", "bms college", "pes university", "pes institute", "ramaiah institute"]):
            is_premium = True
            
        if is_premium:
            if c.code == 'E005' or "r. v." in name_lower or "rv" in name_lower:
                base_pkg = random.uniform(13.0, 16.5) # RVCE
            elif c.code in ['E003', 'E048'] or "bms" in name_lower or "b.m.s." in name_lower:
                base_pkg = random.uniform(11.5, 14.5) # BMS
            elif c.code == 'E006' or "ramaiah" in name_lower:
                base_pkg = random.uniform(10.5, 13.5) # MSRIT
            elif c.code == 'E141' or "pes" in name_lower:
                base_pkg = random.uniform(10.0, 13.0) # PESU
            else:
                base_pkg = random.uniform(9.0, 12.0)  # Other top colleges
        else:
            base_pkg = random.uniform(3.5, 7.5)
            
        placements.append(Placement(
            college_code=c.code,
            year=2024,
            avg_package=round(base_pkg, 2),
            highest_package=round(base_pkg * random.uniform(2.5, 4.0), 2),
            placement_percentage=round(random.uniform(75.0, 99.0), 2)
        ))
        
    db.bulk_save_objects(placements)
    db.commit()
    print("Placements seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_placements()
