import pytest
from app.models.user import User, LoginHistory, ActivityLog, FeedbackLog
from app.core.security import get_password_hash

def test_admin_endpoints_by_regular_user(client, db):
    # Register a standard user
    email = "std_user@example.com"
    pwd = "Securepassword123!"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": pwd, "full_name": "Standard User"}
    )
    
    # Login to get token
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": pwd}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Assert restricted admin endpoints return 403 Forbidden for standard user
    for endpoint in ["users", "analytics", "logins", "activity", "feedback"]:
        res = client.get(f"/api/v1/admin/{endpoint}", headers=headers)
        assert res.status_code == 403, f"Endpoint /admin/{endpoint} should be restricted"


def test_admin_endpoints_by_admin(client, db):
    # Seed an admin user manually in db
    admin_email = "admin_user@example.com"
    pwd = "Securepassword123!"
    
    # Check if admin already exists
    existing = db.query(User).filter(User.email == admin_email).first()
    if not existing:
        admin_user = User(
            email=admin_email,
            password_hash=get_password_hash(pwd),
            full_name="Admin Director",
            role="admin"
        )
        db.add(admin_user)
        db.commit()
        
    # Login as admin
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": admin_email, "password": pwd}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Verify that a LoginHistory entry was successfully recorded
    db_login = db.query(LoginHistory).filter(LoginHistory.email == admin_email).first()
    assert db_login is not None
    
    # Check admin users endpoint
    users_res = client.get("/api/v1/admin/users", headers=headers)
    assert users_res.status_code == 200
    users_list = users_res.json()
    assert len(users_list) > 0
    assert any(u["email"] == admin_email for u in users_list)
    
    # Check admin analytics endpoint
    analytics_res = client.get("/api/v1/admin/analytics", headers=headers)
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()
    assert "summary" in analytics_data
    assert "distributions" in analytics_data
    assert "popular" in analytics_data
    
    # Check admin logins endpoint
    logins_res = client.get("/api/v1/admin/logins", headers=headers)
    assert logins_res.status_code == 200
    logins_list = logins_res.json()
    assert len(logins_list) > 0
    
    # Check admin activity endpoint
    activity_res = client.get("/api/v1/admin/activity", headers=headers)
    assert activity_res.status_code == 200
    
    # Check admin feedback endpoint
    feedback_res = client.get("/api/v1/admin/feedback", headers=headers)
    assert feedback_res.status_code == 200


def test_activity_logging_and_feedback(client, db):
    email = "student_active@example.com"
    pwd = "Securepassword123!"
    
    # Register and login student
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": pwd, "full_name": "Active Student"}
    )
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": pwd}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Query recommendation endpoint (which triggers ActivityLog creation)
    rec_res = client.get("/api/v1/recommendations/", headers=headers)
    assert rec_res.status_code == 200
    
    # Post feedback
    feedback_payload = {
        "college_code": "E005",
        "branch_code": "CS",
        "action": "accepted"
    }
    fb_res = client.post("/api/v1/recommendations/feedback", json=feedback_payload, headers=headers)
    assert fb_res.status_code == 200
    assert fb_res.json()["message"] == "Feedback recorded successfully"
    
    # Log in as admin to verify logging
    admin_login = client.post(
        "/api/v1/auth/login",
        data={"username": "admin_user@example.com", "password": pwd}
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Verify feedback stats reflect the submission
    feedback_stats_res = client.get("/api/v1/admin/feedback", headers=admin_headers)
    assert feedback_stats_res.status_code == 200
    feedback_list = feedback_stats_res.json()
    assert len(feedback_list) > 0
    feedback_item = next(item for item in feedback_list if item["college_code"] == "E005" and item["branch_code"] == "CS")
    assert feedback_item["accepted"] == 1
    assert feedback_item["rejected"] == 0
    
    # Verify activity list logs the student's recommendation load
    activity_res = client.get("/api/v1/admin/activity", headers=admin_headers)
    assert activity_res.status_code == 200
    activity_list = activity_res.json()
    assert any(a["email"] == email and a["activity_type"] == "recommendation" for a in activity_list)
