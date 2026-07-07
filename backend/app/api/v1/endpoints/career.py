from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.user import User, BranchRecommendationLog
from app.api.deps import get_current_user, get_current_active_admin
from pydantic import BaseModel
from typing import Dict, List, Any

router = APIRouter()

class SuitabilityRequest(BaseModel):
    # Questions from the branch recommendation AI questionnaire
    likes_coding: bool
    likes_maths: bool
    likes_electronics: bool
    likes_problem_solving: bool
    prefers_software: bool
    wants_research: bool
    prefers_core: bool

# Core career details data structure
CAREER_MAPS = {
    "CSE": {
        "title": "Computer Science & Engineering",
        "demand": "Very High (9.8/10)",
        "salary": "₹6,000,000 - ₹3,500,000 per annum",
        "skills": ["Algorithms", "Data Structures", "System Design", "Cloud Computing", "Databases"],
        "roles": ["Software Engineer", "Full Stack Developer", "Cloud Solutions Architect", "DevOps Engineer"],
        "recruiters": ["Google", "Microsoft", "Amazon", "Infosys", "TCS"],
        "higher_studies": ["M.Tech in CS", "MS in Software Systems", "MBA in IT Management"],
        "scope": "The backbone of modern tech. Focuses on general software, systems programming, and distributed computing."
    },
    "AIML": {
        "title": "Artificial Intelligence & Machine Learning",
        "demand": "Exponential (9.9/10)",
        "salary": "₹8,000,000 - ₹4,000,000 per annum",
        "skills": ["Python", "TensorFlow/PyTorch", "Probability & Statistics", "Data Analysis", "Neural Networks"],
        "roles": ["ML Engineer", "AI Specialist", "Computer Vision Analyst", "NLP Developer"],
        "recruiters": ["NVIDIA", "OpenAI", "Meta", "Adobe", "Intel"],
        "higher_studies": ["M.Tech in AI", "PhD in Deep Learning", "MS in Data Science"],
        "scope": "Rapidly growing field. Specializes in predictive modeling, computer vision, natural language processing, and neural architectures."
    },
    "Data Science": {
        "title": "Computer Science (Data Science)",
        "demand": "Very High (9.5/10)",
        "salary": "₹7,500,000 - ₹3,800,000 per annum",
        "skills": ["SQL/NoSQL", "Data Engineering", "R/Python", "Tableau/PowerBI", "Machine Learning"],
        "roles": ["Data Scientist", "Data Engineer", "Business Intelligence Developer", "Quantitative Analyst"],
        "recruiters": ["Goldman Sachs", "Fractal Analytics", "Walmart Labs", "Mu Sigma", "Paypal"],
        "higher_studies": ["MS in Analytics", "M.Tech in Data Engineering", "MBA in Business Analytics"],
        "scope": "Focuses on gathering, cleansing, analyzing, and model-fitting vast data pools to drive business intelligence."
    },
    "ISE": {
        "title": "Information Science & Engineering",
        "demand": "High (9.3/10)",
        "salary": "₹5,800,000 - ₹3,000,000 per annum",
        "skills": ["Information Security", "Java/C++", "Software Engineering", "Web Technologies", "DBMS"],
        "roles": ["Information Security Analyst", "Backend Engineer", "Systems Analyst", "IT consultant"],
        "recruiters": ["Cognizant", "Wipro", "Oracle", "Cisco", "Accenture"],
        "higher_studies": ["M.Tech in Information Science", "MS in Cybersecurity", "MBA"],
        "scope": "Closely aligned with CSE, but places heavier emphasis on data management, security protocols, and software design."
    },
    "ECE": {
        "title": "Electronics & Communication Engineering",
        "demand": "High (8.7/10)",
        "salary": "₹5,200,000 - ₹2,500,000 per annum",
        "skills": ["VLSI Design", "Signal Processing", "Embedded C", "Microcontrollers", "Verilog"],
        "roles": ["VLSI Design Engineer", "Embedded Systems Engineer", "RF Engineer", "Network Engineer"],
        "recruiters": ["Qualcomm", "Intel", "Texas Instruments", "Samsung", "Sony"],
        "higher_studies": ["M.Tech in VLSI/Embedded Systems", "MS in Telecommunications", "MBA"],
        "scope": "The bridge between hardware and software. Explores chip architectures, signal routing, wireless networks, and smart devices."
    },
    "EEE": {
        "title": "Electrical & Electronics Engineering",
        "demand": "Moderate (8.0/10)",
        "salary": "₹4,500,000 - ₹2,000,000 per annum",
        "skills": ["Power Systems", "Control Systems", "MATLAB", "Analog Design", "Electrical Machines"],
        "roles": ["Electrical Grid Architect", "Control Systems Analyst", "Power Electronics Engineer", "Renewable Energy Specialist"],
        "recruiters": ["ABB", "Siemens", "General Electric", "L&T", "PowerGrid"],
        "higher_studies": ["M.Tech in Power Systems", "MS in Smart Grids", "MBA"],
        "scope": "Explores electricity generation, grid routing, motors, power plants, and renewable energy circuits."
    },
    "Mechanical": {
        "title": "Mechanical Engineering",
        "demand": "Moderate (7.8/10)",
        "salary": "₹4,200,000 - ₹1,800,000 per annum",
        "skills": ["CAD/CAM", "Thermodynamics", "Robotics", "Fluid Mechanics", "FEA Analysis"],
        "roles": ["Product Design Engineer", "Automotive Analyst", "Robotics Integrator", "HVAC Engineer"],
        "recruiters": ["Tata Motors", "Mahindra", "L&T", "Bosch", "ISRO"],
        "higher_studies": ["M.Tech in CAD/CAM", "MS in Robotics", "MBA in Operations"],
        "scope": "The classic core branch. Specializes in structural stress, physical dynamics, engine design, thermodynamics, and physical manufacturing."
    },
    "Civil": {
        "title": "Civil Engineering",
        "demand": "Moderate (7.5/10)",
        "salary": "₹3,800,000 - ₹1,600,000 per annum",
        "skills": ["Structural Analysis", "AutoCAD", "Surveying", "Geotechnical Engineering", "Project Management"],
        "roles": ["Structural Engineer", "Site Supervisor", "Urban Planner", "Valuer"],
        "recruiters": ["L&T", "DLF", "GMR Group", "NHAI", "PWD"],
        "higher_studies": ["M.Tech in Structural Engineering", "MS in Construction Management", "MBA in Real Estate"],
        "scope": "Focuses on designing, building, and maintaining public infrastructures like skyscrapers, bridges, dams, highways, and water systems."
    },
    "Biotechnology": {
        "title": "Biotechnology Engineering",
        "demand": "Specialized (8.2/10)",
        "salary": "₹4,800,000 - ₹2,200,000 per annum",
        "skills": ["Bioinformatics", "Microbiology", "Genetic Engineering", "Bio-processes", "Data Analytics"],
        "roles": ["Bioinformatics Researcher", "Clinical Trial Analyst", "Bioprocess Engineer", "Quality Control Specialist"],
        "recruiters": ["Biocon", "Syngene", "Serum Institute", "Dr. Reddy's Labs", "Novartis"],
        "higher_studies": ["MS in Biotechnology", "M.Tech in Bioinformatics", "PhD in Genetics"],
        "scope": "Combines biological sciences with engineering principles. Applied to pharmaceutical discovery, genetic editing, and vaccine research."
    }
}

@router.get("/branches")
def get_career_maps(current_user: User = Depends(get_current_user)):
    return CAREER_MAPS

@router.post("/suitability")
def calculate_suitability(
    req: SuitabilityRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Suitability algorithm mapping questions to scores
    scores = {
        "CSE": 50,
        "AIML": 50,
        "Data Science": 50,
        "ISE": 50,
        "ECE": 50,
        "EEE": 45,
        "Mechanical": 40,
        "Civil": 40,
        "Biotechnology": 40
    }
    
    reasoning = {
        "CSE": "Base suitability calculated from logical foundation.",
        "AIML": "Base suitability calculated from technological orientation.",
        "Data Science": "Base suitability calculated from analytical profile.",
        "ISE": "Base suitability calculated from database orientation.",
        "ECE": "Base suitability calculated from signal processing context.",
        "EEE": "Base suitability calculated from power systems context.",
        "Mechanical": "Base suitability calculated from physical dynamics preference.",
        "Civil": "Base suitability calculated from infrastructure layout context.",
        "Biotechnology": "Base suitability calculated from molecular sciences context."
    }

    # 1. Coding Question
    if req.likes_coding:
        scores["CSE"] += 25
        scores["AIML"] += 20
        scores["Data Science"] += 20
        scores["ISE"] += 22
        scores["ECE"] += 5
        reasoning["CSE"] = "Coding interest strongly aligns with software architectures."
    else:
        scores["CSE"] -= 20
        scores["AIML"] -= 10
        scores["ISE"] -= 15
        scores["Mechanical"] += 10
        scores["Civil"] += 10
        reasoning["CSE"] = "Low coding interest reduces suitability for pure software branches."

    # 2. Mathematics Question
    if req.likes_maths:
        scores["AIML"] += 20
        scores["Data Science"] += 20
        scores["ECE"] += 15
        scores["CSE"] += 10
        reasoning["AIML"] = "Strong mathematical grounding is crucial for model architectures & statistics."
    else:
        scores["AIML"] -= 15
        scores["Data Science"] -= 15
        scores["ECE"] -= 10

    # 3. Electronics Question
    if req.likes_electronics:
        scores["ECE"] += 25
        scores["EEE"] += 25
        reasoning["ECE"] = "Interest in electronics strongly supports hardware-oriented ECE routing."
    else:
        scores["ECE"] -= 10
        scores["EEE"] -= 10

    # 4. Problem Solving Question
    if req.likes_problem_solving:
        for k in scores.keys():
            scores[k] = min(100, scores[k] + 10)
    
    # 5. Software Job Preference
    if req.prefers_software:
        scores["CSE"] += 15
        scores["ISE"] += 15
        scores["AIML"] += 10
        scores["Data Science"] += 10
        scores["Mechanical"] -= 15
        scores["Civil"] -= 15
    else:
        scores["Mechanical"] += 15
        scores["Civil"] += 15
        scores["EEE"] += 10
        reasoning["Mechanical"] = "Preference for non-office physical dynamics aligns with core engineering."

    # 6. Research Opportunities
    if req.wants_research:
        scores["AIML"] += 10
        scores["Biotechnology"] += 25
        reasoning["Biotechnology"] = "Research interest is highly beneficial for chemical and genetics fields."
    
    # 7. Core Engineering Preference
    if req.prefers_core:
        scores["Mechanical"] += 20
        scores["Civil"] += 20
        scores["EEE"] += 15
        scores["CSE"] -= 15
        scores["ISE"] -= 15
    
    # Ensure scores stay in bounds [0, 100]
    final_scores = {}
    for k, v in scores.items():
        final_scores[k] = min(100, max(5, v))

    # Log to database
    rec_log = BranchRecommendationLog(
        user_id=current_user.id,
        scores=final_scores,
        reasoning=reasoning
    )
    db.add(rec_log)
    db.commit()

    return {
        "scores": final_scores,
        "reasoning": reasoning
    }

@router.get("/analytics")
def get_branch_analytics(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    # Total branch recommendations logged
    total_logs = db.query(func.count(BranchRecommendationLog.id)).scalar() or 0
    
    # Fetch recent logs
    recent_logs = db.query(BranchRecommendationLog).order_by(BranchRecommendationLog.timestamp.desc()).limit(10).all()
    recent = [{"email": r.user.email, "scores": r.scores, "timestamp": r.timestamp} for r in recent_logs]
    
    # Calculate average suitability per branch
    avg_suitability = {k: [] for k in CAREER_MAPS.keys()}
    all_logs = db.query(BranchRecommendationLog.scores).all()
    for (s_obj,) in all_logs:
        if isinstance(s_obj, dict):
            for branch, score in s_obj.items():
                if branch in avg_suitability:
                    avg_suitability[branch].append(score)
                    
    aggregated = []
    for branch, scores_list in avg_suitability.items():
        avg_val = int(sum(scores_list) / len(scores_list)) if scores_list else 50
        aggregated.append({"branch": branch, "average_score": avg_val, "submissions": len(scores_list)})

    return {
        "total_submissions": total_logs,
        "recent_submissions": recent,
        "branch_averages": aggregated
    }
