from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, StudentPreference
from app.models.college import College, Branch
from app.models.cutoff import Cutoff, Fee
from app.services.recommendation import get_recommendations

router = APIRouter()

@router.get("/student-insights")
def get_student_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pref = db.query(StudentPreference).filter(StudentPreference.user_id == current_user.id).first()
    if not pref or not pref.kcet_rank:
        return {"error": "Incomplete profile"}

    recs = get_recommendations(db, current_user.id)
    all_recs = recs.get('safe', []) + recs.get('moderate', []) + recs.get('dream', [])
    _all_preds = recs.get('_all_predictions', [])
    
    total_eligible = len(all_recs)
    R = pref.kcet_rank

    # 1. Rank Analysis
    trend_scores = []
    for r in all_recs:
        if "Easier" in r['trend']: trend_scores.append(1)
        elif "Competitive" in r['trend']: trend_scores.append(-1)
        else: trend_scores.append(0)
    
    macro_trend_val = sum(trend_scores)
    if macro_trend_val > 5:
        macro_trend = "⬆ Improving"
    elif macro_trend_val < -5:
        macro_trend = "⬇ Becoming Competitive"
    else:
        macro_trend = "➡ Stable"

    # Compare 2024 vs 2025 cutoffs overall for the rank
    rank_analysis = {
        "rank": R,
        "trend": macro_trend,
        "eligible_colleges": total_eligible
    }

    # 2. Branch Opportunity
    branch_opps = {}
    for r in all_recs:
        b_name = r['branch_name']
        if b_name not in branch_opps:
            branch_opps[b_name] = {"safe": 0, "moderate": 0, "dream": 0, "total": 0}
        branch_opps[b_name][r['type']] += 1
        branch_opps[b_name]['total'] += 1
    
    branch_opportunity = [{"branch": k, **v} for k, v in branch_opps.items()]

    # 3. Explore Additional Opportunities
    # Group ALL predictions (not just filtered) by district, excluding preferred locs
    pref_locs = pref.preferred_locations or []
    pref_branches = pref.preferred_branches or []
    
    dist_opps = {}
    for p in _all_preds:
        d = p['district']
        if d in pref_locs:
            continue # Skip already selected
            
        # Optional: Only count if it's within budget and branch preferences
        if pref.max_budget and p['min_fee'] and p['min_fee'] > pref.max_budget:
            continue
        if pref_branches and p['branch_code'] not in pref_branches:
            continue
            
        # Only count if cutoff is realistic (> 80% of rank)
        if p['latest_cutoff'] < R * 0.8:
            continue
            
        if d not in dist_opps:
            dist_opps[d] = {"count": 0, "has_cse": False, "has_cheap": False}
        dist_opps[d]["count"] += 1
        if p['branch_code'] == 'CS': dist_opps[d]["has_cse"] = True
        if p['min_fee'] and p['min_fee'] < 60000: dist_opps[d]["has_cheap"] = True

    additional_opportunities = []
    for d, info in dist_opps.items():
        if info["count"] > 0:
            reason = "✓ Multiple Options"
            if info["has_cse"]: reason = "✓ Strong CSE"
            elif info["has_cheap"]: reason = "✓ Affordable"
            additional_opportunities.append({"district": d, "count": info["count"], "reason": reason})
            
    additional_opportunities = sorted(additional_opportunities, key=lambda x: x['count'], reverse=True)[:5]

    # 4. Category Analysis
    cat = pref.category or "GM"
    latest_year = db.query(func.max(Cutoff.year)).scalar() or 2025
    prev_year = latest_year - 1
    
    cat_prev = cat
    if latest_year == 2026 and cat.startswith(('S1', 'S2', 'S3', 'S4')):
        if cat.endswith('G'):
            cat_prev = 'SCG'
        elif cat.endswith('K'):
            cat_prev = 'SCK'
        elif cat.endswith('R'):
            cat_prev = 'SCR'

    cat_latest = db.query(func.count(Cutoff.id)).filter(
        Cutoff.year == latest_year, Cutoff.category == cat, Cutoff.cutoff_rank >= R
    ).scalar() or 0
    gm_latest = db.query(func.count(Cutoff.id)).filter(
        Cutoff.year == latest_year, Cutoff.category == 'GM', Cutoff.cutoff_rank >= R
    ).scalar() or 0
    
    additional_vs_gm = max(0, cat_latest - gm_latest) if cat != 'GM' else 0

    category_analysis = {
        "category": cat,
        "total_eligible": total_eligible,
        "additional_vs_gm": additional_vs_gm
    }

    # 5. Budget Analysis
    budget_analysis = None
    if pref.max_budget:
        within = 0
        above = 0
        for r in _all_preds:
            if not pref_locs or r['district'] in pref_locs:
                if not pref_branches or r['branch_code'] in pref_branches:
                    if r['latest_cutoff'] >= R * 0.90: # Only count realistic ones
                        if r['min_fee'] and r['min_fee'] <= pref.max_budget:
                            within += 1
                        else:
                            above += 1
        budget_analysis = {
            "budget": pref.max_budget,
            "within": within,
            "above": above
        }

    # 6. Branch Demand Trends (2024 vs 2025 comparison)
    branch_trends_dict = {}
    for r in all_recs:
        b = r['branch_name']
        if b not in branch_trends_dict:
            branch_trends_dict[b] = 0
        if "Easier" in r['trend']:
            branch_trends_dict[b] += 1
        elif "Competitive" in r['trend']:
            branch_trends_dict[b] -= 1
            
    branch_demand = []
    for b, score in branch_trends_dict.items():
        if score > 0:
            t = "⬇ Declining"
        elif score < 0:
            t = "⬆ Growing"
        else:
            t = "➡ Stable"
        branch_demand.append({"branch": b, "trend": t})

    # 7. Seat Availability Trend (prev vs latest year)
    c_prev = db.query(func.count(Cutoff.id)).filter(
        Cutoff.year == prev_year, Cutoff.category == cat_prev, Cutoff.cutoff_rank >= R
    ).scalar() or 0
    c_latest = cat_latest
    
    seat_trend = {
        str(prev_year): c_prev,
        str(latest_year): c_latest,
        "trend": "⬆ Opportunities increasing" if c_latest > c_prev else "⬇ Opportunities decreasing" if c_latest < c_prev else "➡ Opportunities stable"
    }

    # 8. Counsellor Tips
    tips = []
    if total_eligible < 10:
        tips.append("🎓 Counsellor Tip: Your eligible colleges are low. Consider adding more districts or branches to your preferences.")
    if additional_opportunities:
        tips.append(f"🎓 Counsellor Tip: Avoid restricting yourself to {', '.join(pref_locs[:2])}. You have strong opportunities in {additional_opportunities[0]['district']}.")
    if len(tips) == 0:
        tips.append("🎓 Counsellor Tip: Your Option Entry list looks strong. Focus on arranging them perfectly by your true preference.")

    return {
        "rank_analysis": rank_analysis,
        "branch_opportunity": branch_opportunity,
        "additional_opportunities": additional_opportunities,
        "category_analysis": category_analysis,
        "budget_analysis": budget_analysis,
        "branch_demand": branch_demand,
        "seat_trend": seat_trend,
        "tips": tips
    }
