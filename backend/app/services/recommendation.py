import logging
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import StudentPreference
from app.models.college import College, Branch
from app.models.cutoff import Cutoff, Placement, Fee
from app.models.seat_matrix import SeatMatrix
from app.ai.engine import predict_cutoff

def get_recommendations(db: Session, user_id: str = None, test_rank: int = None, test_category: str = 'GM', test_prefs: dict = None):
    if user_id:
        pref = db.query(StudentPreference).filter(StudentPreference.user_id == user_id).first()
        if not pref or not pref.kcet_rank:
            return {"all_recommendations": [], "_all_predictions": []}
        R = pref.kcet_rank
        category = pref.category or 'GM'
        preferred_locs = pref.preferred_locations or []
        preferred_branches = pref.preferred_branches or []
        max_budget = pref.max_budget
        selected_round = pref.counselling_round or 'Mock'
    else:
        R = test_rank
        category = test_category
        preferred_locs = test_prefs.get('locs', []) if test_prefs else []
        preferred_branches = test_prefs.get('branches', []) if test_prefs else []
        max_budget = test_prefs.get('budget') if test_prefs else None
        selected_round = test_prefs.get('round', 'Mock') if test_prefs else 'Mock'

    college_query = db.query(College)
    if preferred_locs:
        college_query = college_query.filter(College.district.in_(preferred_locs))
    colleges = college_query.all()
    college_map = {c.code: c for c in colleges}
    valid_college_codes = list(college_map.keys())

    if preferred_locs and not valid_college_codes:
        return {"all_recommendations": [], "safe": [], "moderate": [], "dream": [], "_all_predictions": []}

    branches = db.query(Branch).all()
    branch_map = {b.code: b for b in branches}

    fees = db.query(Fee).all()
    fee_map = {}
    for f in fees:
        if f.college_code not in fee_map:
            fee_map[f.college_code] = []
        fee_map[f.college_code].append(f.fee_amount)

    placements = db.query(Placement).all()
    placement_map = {p.college_code: p for p in placements}

    seat_query = db.query(SeatMatrix).filter(SeatMatrix.category == category)
    if preferred_branches:
        seat_query = seat_query.filter(SeatMatrix.branch_code.in_(preferred_branches))
    if preferred_locs:
        seat_query = seat_query.filter(SeatMatrix.college_code.in_(valid_college_codes))
    seat_matrices = seat_query.all()
    seat_map = {(s.college_code, s.branch_code): s.seats_available for s in seat_matrices}

    if selected_round == 'Mock':
        valid_rounds = ['Mock', 'Mock1', 'Mock2']
    elif selected_round == 'Round1':
        valid_rounds = ['Round1']
    elif selected_round == 'Round2':
        valid_rounds = ['Round2']
    elif selected_round == 'Round3':
        valid_rounds = ['Round3']
    else:
        valid_rounds = [selected_round]

    cutoff_query = db.query(Cutoff).filter(Cutoff.category == category, Cutoff.round.in_(valid_rounds))
    if preferred_branches:
        cutoff_query = cutoff_query.filter(Cutoff.branch_code.in_(preferred_branches))
    if preferred_locs:
        cutoff_query = cutoff_query.filter(Cutoff.college_code.in_(valid_college_codes))
    cutoffs = cutoff_query.all()
    
    history_map = {}
    for ctf in cutoffs:
        key = (ctf.college_code, ctf.branch_code)
        if key not in history_map:
            history_map[key] = {'2024': [], '2025': [], '2026': []}
        if ctf.year == 2024:
            history_map[key]['2024'].append(ctf.cutoff_rank)
        elif ctf.year == 2025:
            history_map[key]['2025'].append(ctf.cutoff_rank)
        elif ctf.year == 2026:
            history_map[key]['2026'].append(ctf.cutoff_rank)

    all_predictions = []
    
    for (c_code, b_code), rounds in history_map.items():
        all_2024 = rounds['2024']
        all_2025 = rounds['2025']
        all_2026 = rounds['2026']
        
        if not all_2024 and not all_2025 and not all_2026:
            continue
            
        if all_2026:
            latest_cutoff = max(all_2026)
        elif all_2025:
            latest_cutoff = max(all_2025)
        else:
            latest_cutoff = max(all_2024)
            
        all_rounds = all_2024 + all_2025 + all_2026
        avg_cutoff = sum(all_rounds) / len(all_rounds)
        
        diff_max_min = max(all_rounds) - min(all_rounds)
        volatility = diff_max_min / max(1, avg_cutoff)
        
        years_present = {y for y, rlist in [('2024', all_2024), ('2025', all_2025), ('2026', all_2026)] if rlist}
        if len(years_present) >= 2:
            confidence = "🟡 Medium Confidence" if len(all_rounds) < 3 else "🟢 High Confidence"
        else:
            confidence = "🔴 Low Confidence"

        trend = "➡ Stable"
        if all_2026 and all_2025:
            max_curr = max(all_2026)
            max_prev = max(all_2025)
            diff = max_curr - max_prev
            if diff > 1000:
                trend = "⬇ Becoming Easier"
            elif diff < -1000:
                trend = "⬆ Becoming Competitive"
        elif all_2025 and all_2024:
            max_curr = max(all_2025)
            max_prev = max(all_2024)
            diff = max_curr - max_prev
            if diff > 1000:
                trend = "⬇ Becoming Easier"
            elif diff < -1000:
                trend = "⬆ Becoming Competitive"
                
        c_fees = fee_map.get(c_code, [])
        min_fee = min(c_fees) if c_fees else None
        
        p = placement_map.get(c_code)
        placement_pct = p.placement_percentage if p else 0
        
        distr = college_map[c_code].district
        
        # Predict Cutoff Range using XGBoost Quantile Models
        range_min, predicted_baseline, range_max = predict_cutoff(
            year=2026, 
            round_name=selected_round, 
            college_code=c_code, 
            branch_code=b_code, 
            category=category, 
            district=distr, 
            prev_cutoff=latest_cutoff
        )
        
        predicted_range = f"{range_min} - {range_max}"

        score_comp = 70 * (1 - (min(predicted_baseline, 150000) / 150000))
        
        score_branch = 15 if b_code in preferred_branches else 0
        if not preferred_branches: score_branch = 15
        
        score_loc = 5 if distr in preferred_locs else 0
        if not preferred_locs: score_loc = 5
        
        score_place = 5 * (placement_pct / 100)
        
        score_fee = 0
        if min_fee:
            if min_fee < 60000: score_fee = 5
            elif min_fee < 100000: score_fee = 2.5
        else:
            score_fee = 2.5 # default redistribute somewhat if no fee data
        
        seats = seat_map.get((c_code, b_code), 0)
        
        ranking_score = score_comp + score_branch + score_loc + score_place + score_fee
        
        # SAFE / MODERATE / DREAM based on range
        if R < range_min: type_label = 'safe'
        elif range_min <= R <= range_max: type_label = 'moderate'
        else: type_label = 'dream'
        
        # Filter out completely unrealistic options
        if R > 5000 and predicted_baseline < R * 0.75:
            logging.warning(f"Dropped unrealistic option {c_code}-{b_code} (Cutoff: {predicted_baseline}) for Rank {R}")
            continue
            
        warning = None
        if seats > 0 and seats <= 3:
            warning = f"Only {seats} seats left! High risk."
        elif seats == 0:
            warning = "Seat availability unknown."
        
        all_predictions.append({
            "college_code": c_code,
            "college_name": college_map[c_code].name,
            "district": distr,
            "branch_code": b_code,
            "branch_name": branch_map[b_code].name if b_code in branch_map else b_code,
            "category_used": category,
            "seats_available": seats,
            "warning": warning,
            "latest_cutoff": predicted_baseline,
            "predicted_range": predicted_range,
            "avg_cutoff": int(avg_cutoff),
            "trend": trend,
            "confidence": confidence,
            "min_fee": min_fee,
            "placement_pct": placement_pct if placement_pct != 0 else None,
            "ranking_score": ranking_score,
            "type": type_label
        })

    # Pre-index all_predictions to optimize nested searches from O(N^2) to O(N)
    college_branches = {}
    district_branch_predictions = {}
    for p in all_predictions:
        c_code = p['college_code']
        if c_code not in college_branches:
            college_branches[c_code] = []
        college_branches[c_code].append(p)
        
        db_key = (p['district'], p['branch_code'])
        if db_key not in district_branch_predictions:
            district_branch_predictions[db_key] = []
        district_branch_predictions[db_key].append(p)

    results = []
    
    for rec in all_predictions:
        if max_budget and rec['min_fee'] and rec['min_fee'] > max_budget:
            continue
            
        if preferred_locs and rec['district'] not in preferred_locs:
            continue
            
        if preferred_branches and rec['branch_code'] not in preferred_branches:
            continue
            
        alt_branches = []
        if rec['branch_code'] == 'CS':
            alt_branches = [p for p in college_branches.get(rec['college_code'], []) if p['branch_code'] in ['IS', 'AI', 'DS']]
        elif rec['branch_code'] == 'IS':
            alt_branches = [p for p in college_branches.get(rec['college_code'], []) if p['branch_code'] in ['CS', 'AI', 'DS']]
            
        rec['alternative_branches'] = [{"branch_name": a['branch_name'], "latest_cutoff": a['latest_cutoff']} for a in alt_branches]
        
        similar_candidates = district_branch_predictions.get((rec['district'], rec['branch_code']), [])
        similar = [
            p for p in similar_candidates
            if p['college_code'] != rec['college_code']
            and 0.85 * rec['latest_cutoff'] <= p['latest_cutoff'] <= 1.15 * rec['latest_cutoff']
        ]
        similar.sort(key=lambda x: abs(x['latest_cutoff'] - rec['latest_cutoff']))
        
        rec['similar_colleges'] = [{"college_name": s['college_name']} for s in similar[:3]]
        
        results.append(rec)

    results.sort(key=lambda x: x['ranking_score'], reverse=True)

    return {
        "all_recommendations": results,
        "safe": [r for r in results if r['type'] == 'safe'], 
        "moderate": [r for r in results if r['type'] == 'moderate'], 
        "dream": [r for r in results if r['type'] == 'dream'], 
        "_all_predictions": all_predictions
    }


def get_round_comparison(db: Session, user_id: str):
    pref = db.query(StudentPreference).filter(StudentPreference.user_id == user_id).first()
    if not pref or not pref.kcet_rank:
        return {}
        
    R = pref.kcet_rank
    category = pref.category or 'GM'
    preferred_locs = pref.preferred_locations or []
    preferred_branches = pref.preferred_branches or []

    college_query = db.query(College)
    if preferred_locs:
        college_query = college_query.filter(College.district.in_(preferred_locs))
    colleges = college_query.all()
    college_map = {c.code: c for c in colleges}
    valid_college_codes = list(college_map.keys())

    if preferred_locs and not valid_college_codes:
        return {}

    branches = db.query(Branch).all()
    branch_map = {b.code: b for b in branches}

    rounds_to_check = [
        {"id": "Mock", "valid": ['Mock', 'Mock1', 'Mock2']},
        {"id": "Round1", "valid": ['Round1']},
        {"id": "Round2", "valid": ['Round2']},
        {"id": "Round3", "valid": ['Round3']}
    ]

    cutoff_query = db.query(Cutoff).filter(Cutoff.category == category)
    if preferred_branches:
        cutoff_query = cutoff_query.filter(Cutoff.branch_code.in_(preferred_branches))
    if preferred_locs:
        cutoff_query = cutoff_query.filter(Cutoff.college_code.in_(valid_college_codes))
    all_cutoffs = cutoff_query.all()

    comparison_results = {}

    for round_info in rounds_to_check:
        round_id = round_info["id"]
        valid_rounds = round_info["valid"]

        cutoffs = [c for c in all_cutoffs if c.round in valid_rounds]
            
        history_map = {}
        for ctf in cutoffs:
            key = (ctf.college_code, ctf.branch_code)
            if key not in history_map:
                history_map[key] = {'2024': [], '2025': [], '2026': []}
            if ctf.year == 2024:
                history_map[key]['2024'].append(ctf.cutoff_rank)
            elif ctf.year == 2025:
                history_map[key]['2025'].append(ctf.cutoff_rank)
            elif ctf.year == 2026:
                history_map[key]['2026'].append(ctf.cutoff_rank)

        results = []
        for (c_code, b_code), rounds in history_map.items():
            all_2024 = rounds['2024']
            all_2025 = rounds['2025']
            all_2026 = rounds['2026']
            if not all_2024 and not all_2025 and not all_2026:
                continue
                
            if all_2026:
                latest_cutoff = max(all_2026)
            elif all_2025:
                latest_cutoff = max(all_2025)
            else:
                latest_cutoff = max(all_2024)
                    
            distr = college_map[c_code].district
            
            score_comp = 70 * (1 - (min(latest_cutoff, 150000) / 150000))
            score_branch = 20 if b_code in preferred_branches else 0
            if not preferred_branches: score_branch = 20
            score_loc = 10 if distr in preferred_locs else 0
            if not preferred_locs: score_loc = 10
            
            ranking_score = score_comp + score_branch + score_loc
            
            if R > 5000 and latest_cutoff < R * 0.75:
                continue

            # Basic Safe/Moderate/Dream
            if latest_cutoff >= R * 1.15: type_label = 'safe'
            elif R * 0.90 <= latest_cutoff < R * 1.15: type_label = 'moderate'
            else: type_label = 'dream'
                
            rec = {
                "college_code": c_code,
                "college_name": college_map[c_code].name,
                "district": distr,
                "branch_code": b_code,
                "branch_name": branch_map[b_code].name if b_code in branch_map else b_code,
                "expected_cutoff": latest_cutoff,
                "ranking_score": ranking_score,
                "type": type_label
            }
            
            if preferred_locs and rec['district'] not in preferred_locs:
                continue
            if preferred_branches and rec['branch_code'] not in preferred_branches:
                continue
                
            results.append(rec)

        results.sort(key=lambda x: x['ranking_score'], reverse=True)
        
        comparison_results[round_id] = {
            "total_colleges": len(results),
            "top_5": results[:5]
        }

    return comparison_results
