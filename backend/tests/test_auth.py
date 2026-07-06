def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "teststudent@example.com", "password": "Securepassword123!", "full_name": "Test Student"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "teststudent@example.com"
    assert "id" in data

def test_register_existing_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "teststudent@example.com", "password": "Securepassword123!", "full_name": "Test Student"}
    )
    assert response.status_code == 400
    assert "The user with this username already exists in the system." in response.json()["detail"]

def test_login_user(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "teststudent@example.com", "password": "Securepassword123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "teststudent@example.com", "password": "Wrongpassword123!"}
    )
    assert response.status_code == 401
