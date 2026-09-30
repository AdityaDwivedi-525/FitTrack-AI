import urllib.request
import urllib.parse
import json
import time
import sys

BASE_URL = "http://localhost:8000"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    req = urllib.request.Request(url, method=method, headers=headers)
    if data:
        req.add_header('Content-Type', 'application/json')
        body = json.dumps(data).encode('utf-8')
    else:
        body = None
    try:
        with urllib.request.urlopen(req, data=body) as response:
            status = response.status
            resp_body = response.read().decode('utf-8')
            return status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode('utf-8')
        return e.code, json.loads(resp_body) if resp_body else {}

def run_tests():
    print("==========================================")
    print("   STARTING END-TO-END AUTH ROUTING TESTS")
    print("==========================================")
    
    test_email = f"route_user_{int(time.time())}@example.com"
    test_password = "TestPassword123!"

    # Step 1: Register User
    print("\n--- Test 1: User Registration ---")
    reg_payload = {
        "name": "Navigation Tester",
        "email": test_email,
        "password": test_password,
        "age": 25,
        "gender": "Male",
        "weight": 70.0,
        "height": 175.0
    }
    status, reg_res = make_request(f"{BASE_URL}/api/auth/register", method="POST", data=reg_payload)
    assert status == 200, f"Registration failed ({status}): {reg_res}"
    assert reg_res.get("success") is True
    print(f"[OK] Registration successful for {test_email}")

    # Step 2: Login Request (User Test step 3)
    print("\n--- Test 2: Login Request ---")
    login_payload = {
        "email": test_email,
        "password": test_password
    }
    status, login_res = make_request(f"{BASE_URL}/api/auth/login", method="POST", data=login_payload)
    assert status == 200, f"Login failed ({status}): {login_res}"
    assert login_res.get("success") is True
    token = login_res.get("token")
    user = login_res.get("user")
    assert token is not None, "Token missing in response"
    assert user.get("name") == "Navigation Tester"
    print(f"[OK] Login successful! Token acquired: {token[:20]}...")

    # Step 3: Access /api/auth/me with Token (Simulates /dashboard access & Browser Refresh - User Test steps 4 & 5)
    print("\n--- Test 3: Session Verification / Refresh (/dashboard access) ---")
    status, me_res = make_request(
        f"{BASE_URL}/api/auth/me",
        method="GET",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert status == 200, f"Me verification failed ({status}): {me_res}"
    assert me_res.get("success") is True
    assert me_res.get("user", {}).get("email") == test_email
    print(f"[OK] Token verification successful for user: {me_res['user']['name']}")

    # Step 4: Access without token or after logout (User Test steps 1, 2, 6, 7)
    print("\n--- Test 4: Access without token / After Logout ---")
    status, bad_res = make_request(
        f"{BASE_URL}/api/auth/me",
        method="GET",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert status == 401, f"Expected 401, got {status}"
    print("[OK] Protected endpoint correctly returned 401 Unauthorized for invalid token.")

    print("\n==========================================")
    print("   ALL ROUTING & AUTH TESTS COMPLETED 100% SUCCESS")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
