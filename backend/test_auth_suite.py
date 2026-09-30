import os
import time
import jwt
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
import mongo_db
from main import app

client = TestClient(app)

def run_tests():
    print("=== STARTING AUTHENTICATION & JWT TEST SUITE ===")
    
    # Setup test user
    test_user_email = f"test_login_{int(time.time())}@example.com"
    test_password = "SecurePassword123!"
    
    # 1. Register test user
    user_data = {
        "name": "Auth Test User",
        "email": test_user_email,
        "password": test_password,
        "age": 28,
        "gender": "Male",
        "weight": 75.0,
        "height": 180.0
    }
    
    reg_res = mongo_db.create_user(user_data)
    user_id = reg_res["id"]
    print(f"[OK] User Registered with ID: {user_id}")
    
    # TEST 1: Valid login
    print("\n--- Test 1: Valid login ---")
    login_res = client.post("/api/auth/login", json={
        "email": test_user_email,
        "password": test_password
    })
    assert login_res.status_code == 200, f"Expected 200, got {login_res.status_code}: {login_res.text}"
    login_data = login_res.json()
    assert login_data["success"] is True
    assert "token" in login_data
    assert login_data["user"]["email"] == test_user_email
    assert "password" not in login_data["user"]
    
    token = login_data["token"]
    print(f"[OK] Valid login successful! Token received: {token[:20]}...")
    
    # TEST 2: Invalid password
    print("\n--- Test 2: Invalid password ---")
    bad_pwd_res = client.post("/api/auth/login", json={
        "email": test_user_email,
        "password": "WrongPassword999"
    })
    assert bad_pwd_res.status_code == 401, f"Expected 401 for invalid password, got {bad_pwd_res.status_code}"
    print(f"[OK] Invalid password properly rejected with 401: {bad_pwd_res.json()['detail']}")
    
    # TEST 3: Non-existing email
    print("\n--- Test 3: Non-existing email ---")
    non_exist_res = client.post("/api/auth/login", json={
        "email": "nonexistent_email_9999@example.com",
        "password": test_password
    })
    assert non_exist_res.status_code == 401, f"Expected 401 for non-existing email, got {non_exist_res.status_code}"
    print(f"[OK] Non-existing email properly rejected with 401: {non_exist_res.json()['detail']}")
    
    # TEST 4: Expired/invalid JWT
    print("\n--- Test 4: Expired & Invalid JWT ---")
    # Invalid JWT token
    invalid_token_res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_garbage_token"})
    assert invalid_token_res.status_code == 401, f"Expected 401 for garbage token, got {invalid_token_res.status_code}"
    print(f"[OK] Invalid token rejected: {invalid_token_res.json()['detail']}")
    
    # Expired JWT token
    expired_payload = {
        "userId": user_id,
        "iat": datetime.now(timezone.utc) - timedelta(hours=2),
        "exp": datetime.now(timezone.utc) - timedelta(hours=1)
    }
    expired_token = jwt.encode(expired_payload, mongo_db.JWT_SECRET, algorithm=mongo_db.JWT_ALGORITHM)
    expired_token_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert expired_token_res.status_code == 401, f"Expected 401 for expired token, got {expired_token_res.status_code}"
    print(f"[OK] Expired token rejected: {expired_token_res.json()['detail']}")
    
    # TEST 7: Protected API request (with valid token)
    print("\n--- Test 7: Protected API Request ---")
    protected_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert protected_res.status_code == 200, f"Expected 200 for protected route, got {protected_res.status_code}"
    me_data = protected_res.json()
    assert me_data["success"] is True
    assert me_data["user"]["id"] == user_id
    assert me_data["user"]["email"] == test_user_email
    print(f"[OK] Protected API request successful for user: {me_data['user']['name']} ({me_data['user']['email']})")

    # Clean up test user
    mongo_db.users_collection.delete_one({"_id": mongo_db.ObjectId(user_id)})
    print("\n[OK] Cleaned up test user from database.")
    print("\nALL 7 BACKEND AUTHENTICATION SUITE TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_tests()
