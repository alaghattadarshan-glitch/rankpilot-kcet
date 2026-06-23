import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.services.recommendation import get_recommendations

def run_tests():
    db = SessionLocal()
    ranks_to_test = [1, 100, 1000, 5000, 10000, 25000, 50000, 75000, 100000, 150000]
    
    print("=======================================")
    print("Option Entry Rank Validation Engine")
    print("=======================================\n")
    
    for rank in ranks_to_test:
        print(f"Testing KCET Rank: {rank}")
        recs = get_recommendations(db, test_rank=rank, test_category='GM')
        all_recs = recs.get("all_recommendations", [])
        
        print(f"Total Eligible Options Found: {len(all_recs)}")
        
        if len(all_recs) > 0:
            print("Top 5 Recommended Colleges (Option Entry Order):")
            for i in range(min(5, len(all_recs))):
                r = all_recs[i]
                print(f"  {i+1}. {r['college_name']} - {r['branch_name']} (Cutoff: {r['latest_cutoff']} | Score: {r['ranking_score']:.2f})")
        else:
            print("No recommendations found.")
        print("-" * 50)
        
if __name__ == "__main__":
    run_tests()
