from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.user import User, MentorChat
from app.api.deps import get_current_user, get_current_active_admin
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter()

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str
    citations: List[str]

# Simple Local Knowledge Base for RAG Citations
KNOWLEDGE_BASE = [
    {
        "topic": "SNQ Quota",
        "keywords": ["snq", "supernumerary", "fee waiver", "quota", "income"],
        "content": "The Supernumerary Quota (SNQ) is a KEA seat category reserved for economically weaker students in engineering colleges. It provides a full tuition fee waiver (students pay only university registration fees). Candidates whose family income is below ₹8 Lakhs per annum are automatically eligible. 5% extra seats are allocated in each branch under this quota.",
        "citation": "KEA Admission Brochure Section 7.4 (SNQ Policy)"
    },
    {
        "topic": "Option Entry Rules",
        "keywords": ["option entry", "how to fill", "choices", "priority", "select", "order"],
        "content": "Option entry requires you to list colleges and branches in a strictly decreasing order of preference. The system processes options sequentially starting from priority #1. Never list a college you do not want to join. You can add as many options as you wish; there is no upper limit. Sequence your Dream options first, then Moderate options, and always include at least 5 Safe options to guarantee a seat.",
        "citation": "KEA Option Entry User Handbook Page 12-15"
    },
    {
        "topic": "AIML vs CSE Comparison",
        "keywords": ["aiml", "cse", "computer science", "artificial intelligence", "difference", "which is better"],
        "content": "Computer Science & Engineering (CSE) provides a broad foundation including systems, databases, networks, and software engineering. Artificial Intelligence & Machine Learning (AIML) is a specialized subset focusing on data structures, algorithms, neural networks, and model training. CSE offers broader initial job placement paths, while AIML is highly suited for data analyst, machine learning engineer, and AI research roles.",
        "citation": "RankPilot Curriculum Comparison Studies (2026)"
    },
    {
        "topic": "KEA Choices (1, 2, 3, 4)",
        "keywords": ["choice 1", "choice 2", "choice 3", "choice 4", "accept", "hold", "reject"],
        "content": "After seat allotment, you have 4 choices: Choice 1: Accept the seat and pay fee (cannot participate in next rounds). Choice 2: Accept the allotted seat but hold it and participate in the next round for better options. Choice 3: Reject the allotted seat but participate in the next round. Choice 4: Reject the seat and exit KEA counselling.",
        "citation": "KEA Rules Chapter 9 (Post-Allotment Choices)"
    },
    {
        "topic": "Mock Round vs Real Rounds",
        "keywords": ["mock round", "mock", "purpose", "change options"],
        "content": "The Mock Round is simulated to show you which college you might get based on current entries. No seat is permanently allocated in the Mock Round. You can completely modify, reorder, add, or delete options after the mock round results are announced before Round 1 starts.",
        "citation": "KEA Counselling Schedule & Procedures Guide"
    }
]

@router.post("/chat", response_model=ChatResponse)
def mentor_chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = req.question.lower()
    
    # Simple semantic keyword matching (Mock RAG)
    matched_content = []
    citations = []
    
    for kb_item in KNOWLEDGE_BASE:
        # Check if query matches any keywords
        if any(keyword in q for keyword in kb_item["keywords"]):
            matched_content.append(kb_item["content"])
            citations.append(kb_item["citation"])
            
    if matched_content:
        answer = " ".join(matched_content)
    else:
        # Check if they are asking about top/best colleges in a specific location
        is_asking_colleges = any(kw in q for kw in ["best college", "top college", "good college", "list of college", "recommend college"])
        location_match = None
        loc_label = ""
        
        if is_asking_colleges or any(loc in q for loc in ["bangalore", "bengaluru", "mysore", "mysuru", "mangalore", "mangaluru", "udupi", "tumkur", "dharwad", "belgaum"]):
            if "bangalore" in q or "bengaluru" in q:
                location_match = ["Bangalore Urban", "Bangalore Rural"]
                loc_label = "Bengaluru"
            elif "mysore" in q or "mysuru" in q:
                location_match = ["Mysore"]
                loc_label = "Mysore"
            elif "mangalore" in q or "mangaluru" in q:
                location_match = ["Dakshina Kannada"]
                loc_label = "Mangalore"
            elif "udupi" in q:
                location_match = ["Udupi"]
                loc_label = "Udupi"
            elif "tumkur" in q:
                location_match = ["Tumkur"]
                loc_label = "Tumkur"
            elif "dharwad" in q:
                location_match = ["Dharwad", "Dharward"]
                loc_label = "Dharwad"
            elif "belgaum" in q or "belagavi" in q:
                location_match = ["Belgaum"]
                loc_label = "Belagavi"

        if location_match:
            from app.models.college import College
            from app.models.cutoff import Placement
            top_colleges = (
                db.query(College, Placement)
                .join(Placement, College.code == Placement.college_code)
                .filter(College.district.in_(location_match))
                .order_by(Placement.avg_package.desc())
                .limit(5)
                .all()
            )
            
            if top_colleges:
                college_list_str = []
                for idx, (col, plac) in enumerate(top_colleges):
                    college_list_str.append(
                        f"{idx+1}. **{col.name}** (Code: `{col.code}`) in {col.city or col.district} — "
                        f"Average Package: ₹{plac.avg_package} LPA, Highest Package: ₹{plac.highest_package} LPA."
                    )
                answer = f"Here are the top engineering colleges in {loc_label} based on placement statistics:\n\n" + "\n".join(college_list_str) + "\n\nFeel free to explore their detailed fee structures and branch cutoffs in the College Comparison console."
                citations.append("KEA Verified Placements Database (2026)")
            else:
                answer = f"I searched our database for colleges in {loc_label}, but no placement logs were found. Please refine your query."
                citations.append("KEA Verified Placements Database (2026)")
        elif is_asking_colleges:
            from app.models.college import College
            from app.models.cutoff import Placement
            top_colleges = (
                db.query(College, Placement)
                .join(Placement, College.code == Placement.college_code)
                .order_by(Placement.avg_package.desc())
                .limit(5)
                .all()
            )
            if top_colleges:
                college_list_str = []
                for idx, (col, plac) in enumerate(top_colleges):
                    college_list_str.append(
                        f"{idx+1}. **{col.name}** (Code: `{col.code}`) in {col.city or col.district} — "
                        f"Average Package: ₹{plac.avg_package} LPA, Highest Package: ₹{plac.highest_package} LPA."
                    )
                answer = "Here are the top engineering colleges in Karnataka based on average placement metrics:\n\n" + "\n".join(college_list_str) + "\n\nFeel free to check detailed fee structures and round cutoffs in the Comparison console."
                citations.append("KEA Verified Placements Database (2026)")
            else:
                answer = "No placement logs found in the database. Please make sure data is ingested."
                citations.append("KEA Verified Placements Database (2026)")
        else:
            # Generic Fallback LLM prompt/counselling response
            answer = ("RankPilot AI Mentor: That is a great question. In KCET counselling, "
                      "it is essential to monitor category drift (e.g. GM, 2A, 3B, SC/ST) and round-wise cutoff variations. "
                      "Always ensure your option entry list has a robust safety net of colleges where your rank is well below "
                      "the historical predicted cutoff. Please refine your query or ask about 'SNQ Quota', 'Option Entry Rules', "
                      "'AIML vs CSE', or 'KEA Choices' for specific cited guide files.")
            citations.append("RankPilot Platform Knowledge Base (General Support)")
        
    # Log chat to DB
    chat_log = MentorChat(
        user_id=current_user.id,
        question=req.question,
        answer=answer
    )
    db.add(chat_log)
    db.commit()
    
    return {
        "answer": answer,
        "citations": citations
    }

@router.get("/analytics")
def get_mentor_analytics(
    current_admin: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db)
):
    # Total chats
    total_chats = db.query(func.count(MentorChat.id)).scalar() or 0
    
    # Retrieve recent questions
    recent_chats = db.query(MentorChat).order_by(MentorChat.timestamp.desc()).limit(10).all()
    recent = [{"question": c.question, "timestamp": c.timestamp, "email": c.user.email} for c in recent_chats]
    
    # Aggregate common topics based on keywords
    all_questions = db.query(MentorChat.question).all()
    topic_counts = {
        "SNQ Quota": 0,
        "Option Entry": 0,
        "AIML vs CSE": 0,
        "KEA Choices": 0,
        "Other Queries": 0
    }
    for (q_text,) in all_questions:
        q_lower = q_text.lower()
        matched = False
        if "snq" in q_lower or "fee" in q_lower:
            topic_counts["SNQ Quota"] += 1
            matched = True
        if "option" in q_lower or "priority" in q_lower or "fill" in q_lower:
            topic_counts["Option Entry"] += 1
            matched = True
        if "aiml" in q_lower or "cse" in q_lower or "branch" in q_lower:
            topic_counts["AIML vs CSE"] += 1
            matched = True
        if "choice" in q_lower or "round" in q_lower:
            topic_counts["KEA Choices"] += 1
            matched = True
        if not matched:
            topic_counts["Other Queries"] += 1

    return {
        "total_chats": total_chats,
        "recent_queries": recent,
        "topic_distribution": [{"name": k, "value": v} for k, v in topic_counts.items()]
    }
