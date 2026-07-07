import pytest
from app.models.user import User
from app.core.security import get_password_hash

@pytest.fixture(autouse=True)
def seed_admin_and_student(db):
    # Ensure default admin
    admin = db.query(User).filter(User.email == "alaghattadarshan@gmail.com").first()
    if not admin:
        admin = User(
            email="alaghattadarshan@gmail.com",
            password_hash=get_password_hash("Darshan@162006"),
            full_name="Darshan Prabhu K",
            role="admin"
        )
        db.add(admin)
        
    student = db.query(User).filter(User.email == "student@example.com").first()
    if not student:
        student = User(
            email="student@example.com",
            password_hash=get_password_hash("Darshan@162006"),
            full_name="Test Student",
            role="student"
        )
        db.add(student)
    db.commit()

def test_mentor_endpoints(client, db):
    # Log in as student
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "student@example.com", "password": "Darshan@162006"} # conftest overrides credentials verification for test db client or we mock login
    )
    # Get student token
    # Let's perform chat request
    # Since auth verification requires valid tokens, we can test with admin login token or client requests
    admin_login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "alaghattadarshan@gmail.com", "password": "Darshan@162006"}
    )
    assert admin_login_res.status_code == 200
    token = admin_login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Mentor Chat Question
    chat_payload = {"question": "What is the fee for SNQ Quota?"}
    chat_res = client.post("/api/v1/mentor/chat", json=chat_payload, headers=headers)
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "answer" in chat_data
    assert "citations" in chat_data

    # 2. Mentor Analytics
    analytics_res = client.get("/api/v1/mentor/analytics", headers=headers)
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()
    assert "total_chats" in analytics_data
    assert "recent_queries" in analytics_data
    assert "topic_distribution" in analytics_data

def test_career_and_suitability_endpoints(client):
    admin_login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "alaghattadarshan@gmail.com", "password": "Darshan@162006"}
    )
    token = admin_login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Career branches metadata list
    branches_res = client.get("/api/v1/career/branches", headers=headers)
    assert branches_res.status_code == 200
    branches_data = branches_res.json()
    assert "CSE" in branches_data
    assert "ECE" in branches_data

    # 2. Suitability quiz post
    suitability_payload = {
        "likes_coding": True,
        "likes_maths": True,
        "likes_electronics": False,
        "likes_problem_solving": True,
        "prefers_software": True,
        "wants_research": False,
        "prefers_core": False
    }
    suit_res = client.post("/api/v1/career/suitability", json=suitability_payload, headers=headers)
    assert suit_res.status_code == 200
    suit_data = suit_res.json()
    assert "scores" in suit_data
    assert "reasoning" in suit_data
    assert suit_data["scores"]["CSE"] > suit_data["scores"]["ECE"] # coding preference checks

    # 3. Career suitability analytics
    career_analytics_res = client.get("/api/v1/career/analytics", headers=headers)
    assert career_analytics_res.status_code == 200
    c_analytics_data = career_analytics_res.json()
    assert "total_submissions" in c_analytics_data
    assert "recent_submissions" in c_analytics_data
    assert "branch_averages" in c_analytics_data

def test_reports_and_ml_training_endpoints(client):
    admin_login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "alaghattadarshan@gmail.com", "password": "Darshan@162006"}
    )
    token = admin_login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. PDF Reports analytics
    reports_res = client.get("/api/v1/reports/analytics", headers=headers)
    assert reports_res.status_code == 200
    reports_data = reports_res.json()
    assert "generated_count" in reports_data
    assert "downloaded_count" in reports_data
    assert "recent_downloads" in reports_data

    # 2. Model training metrics check
    metrics_res = client.get("/api/v1/admin/model-training/metrics", headers=headers)
    assert metrics_res.status_code == 200
    metrics_data = metrics_res.json()
    assert "mae" in metrics_data
    assert "rmse" in metrics_data
    assert "r2_score" in metrics_data

    # 3. Model training trigger check
    retrain_res = client.post("/api/v1/admin/model-training/retrain", headers=headers)
    assert retrain_res.status_code == 200
    assert "retraining process started in background" in retrain_res.json()["message"]

    # 4. Dataset validations list check
    datasets_res = client.get("/api/v1/admin/datasets/list", headers=headers)
    assert datasets_res.status_code == 200
    assert isinstance(datasets_res.json(), list)
