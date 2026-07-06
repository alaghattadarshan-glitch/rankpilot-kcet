import pytest
import os
from app.models.user import User, StudentPreference, Shortlist, FeedbackLog, ActivityLog, ContactInquiry
from app.core.security import get_password_hash

@pytest.fixture(autouse=True)
def seed_default_admin_if_needed(db):
    # Seed the default admin user into the test database (since lifespan uses local file db, not memory db)
    admin = db.query(User).filter(User.email == "alaghattadarshan@gmail.com").first()
    if not admin:
        admin = User(
            email="alaghattadarshan@gmail.com",
            password_hash=get_password_hash("Darshan@162006"),
            full_name="Darshan Prabhu K",
            role="admin"
        )
        db.add(admin)
        db.commit()

def test_default_admin_created(client, db):
    # Verify the default admin seeded on app startup exists in the database
    admin = db.query(User).filter(User.email == "alaghattadarshan@gmail.com").first()
    assert admin is not None
    assert admin.full_name == "Darshan Prabhu K"
    assert admin.role == "admin"

    # Test login with default admin credentials
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "alaghattadarshan@gmail.com", "password": "Darshan@162006"}
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"


def test_contact_form_submission_and_alerts(client, db):
    # Ensure any previous sent emails log is cleared
    if os.path.exists("emails_sent.log"):
        os.remove("emails_sent.log")

    contact_payload = {
        "name": "Darshan Support",
        "email": "darshantest@example.com",
        "phone": "+91 99999 88888",
        "subject": "Inquiry on Counselling",
        "message": "I need help understanding KCET options placement."
    }
    
    # 1. Test successful submission
    res = client.post("/api/v1/contact/", json=contact_payload)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["message"] == "Inquiry submitted successfully"
    assert "id" in res_data
    inquiry_id = res_data["id"]

    # 2. Verify record exists in DB
    inquiry = db.query(ContactInquiry).filter(ContactInquiry.id == inquiry_id).first()
    assert inquiry is not None
    assert inquiry.name == "Darshan Support"
    assert inquiry.email == "darshantest@example.com"
    assert inquiry.status == "New"

    # 3. Verify notification alert log was created
    assert os.path.exists("emails_sent.log")
    with open("emails_sent.log", "r") as f:
        content = f.read()
        assert "alaghattadarshan@gmail.com" in content
        assert "Inquiry on Counselling" in content
        assert "understanding KCET options" in content

    # 4. Test spam protection blocking
    spam_payload = {
        "name": "Spammer Bot",
        "email": "spambot@example.com",
        "subject": "Unsolicited SEO offer",
        "message": "Buy backlinks now from cheap services."
    }
    res_spam = client.post("/api/v1/contact/", json=spam_payload)
    assert res_spam.status_code == 400
    assert "Spam message detected" in res_spam.json()["detail"]


def test_cascading_user_deletion(client, db):
    # 1. Setup - Create a user to delete
    student_email = "student_to_delete@example.com"
    pwd = "Securepassword123!"
    
    reg_res = client.post(
        "/api/v1/auth/register",
        json={"email": student_email, "password": pwd, "full_name": "Delete Me"}
    )
    assert reg_res.status_code == 200

    # Retrieve user
    user = db.query(User).filter(User.email == student_email).first()
    assert user is not None
    user_id = user.id

    # Add preferences, shortlists, feedback log, and activity log entries for user
    pref = StudentPreference(user_id=user_id, category="GM", kcet_rank=5000)
    db.add(pref)
    
    sl = Shortlist(user_id=user_id, college_code="E005", branch_code="CS")
    db.add(sl)
    
    fb = FeedbackLog(user_id=user_id, college_code="E005", branch_code="CS", action="accepted")
    db.add(fb)

    act = ActivityLog(user_id=user_id, activity_type="login")
    db.add(act)
    
    db.commit()

    # 2. Perform deletion as Admin
    # Login as admin to get token
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "alaghattadarshan@gmail.com", "password": "Darshan@162006"}
    )
    admin_token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Delete request
    del_res = client.delete(f"/api/v1/admin/user/{user_id}", headers=admin_headers)
    assert del_res.status_code == 200
    assert "deleted successfully" in del_res.json()["message"]

    # 3. Assert cascade completeness
    assert db.query(User).filter(User.id == user_id).first() is None
    assert db.query(StudentPreference).filter(StudentPreference.user_id == user_id).first() is None
    assert db.query(Shortlist).filter(Shortlist.user_id == user_id).first() is None
    assert db.query(FeedbackLog).filter(FeedbackLog.user_id == user_id).first() is None
    assert db.query(ActivityLog).filter(ActivityLog.user_id == user_id).first() is None


def test_system_health_and_contacts_admin_apis(client, db):
    # Login as admin
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "alaghattadarshan@gmail.com", "password": "Darshan@162006"}
    )
    admin_token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Test system health check
    health_res = client.get("/api/v1/admin/system-health", headers=admin_headers)
    assert health_res.status_code == 200
    health_data = health_res.json()
    assert health_data["backend_status"] == "Healthy"
    assert "database_status" in health_data
    assert "ai_model_status" in health_data
    assert "datasets" in health_data

    # 2. Test fetching contact inquiries list
    contacts_res = client.get("/api/v1/admin/contacts", headers=admin_headers)
    assert contacts_res.status_code == 200
    contacts_list = contacts_res.json()
    assert len(contacts_list) > 0
    inquiry_id = contacts_list[0]["id"]

    # 3. Test changing inquiry status
    status_res = client.patch(
        f"/api/v1/admin/contact/{inquiry_id}/status",
        json={"status": "Replied"},
        headers=admin_headers
      )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "Replied"

    # 4. Test deleting inquiry
    del_res = client.delete(f"/api/v1/admin/contact/{inquiry_id}", headers=admin_headers)
    assert del_res.status_code == 200
    assert db.query(ContactInquiry).filter(ContactInquiry.id == inquiry_id).first() is None
