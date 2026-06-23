def test_get_me_unauthorized(client):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401

def test_save_preferences(client):
    # Need to login first to get the token
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "teststudent@example.com", "password": "securepassword"}
    )
    token = login_res.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    prefs = {
        "kcet_rank": 15000,
        "category": "GM",
        "is_rural": False,
        "is_kannada": False,
        "preferred_branches": ["CS", "IS"],
        "preferred_locations": ["Bangalore Urban", "Mysore"],
        "max_budget": 100000
    }
    
    res = client.post("/api/v1/users/preferences", json=prefs, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["kcet_rank"] == 15000
    assert data["category"] == "GM"
    assert data["preferred_branches"] == ["CS", "IS"]
    assert data["preferred_locations"] == ["Bangalore Urban", "Mysore"]

def test_get_preferences(client):
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "teststudent@example.com", "password": "securepassword"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get("/api/v1/users/preferences", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["kcet_rank"] == 15000
