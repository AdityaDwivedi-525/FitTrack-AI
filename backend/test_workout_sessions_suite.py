import time
from datetime import datetime
from fastapi.testclient import TestClient
import mongo_db
from main import app
from bson.objectid import ObjectId

client = TestClient(app)

def run_tests():
    print("==========================================================")
    print("   STARTING WORKOUT SESSION DB & SECURITY TEST SUITE")
    print("==========================================================")

    # Setup 2 Distinct Test Users (User A and User B)
    ts = int(time.time())
    email_a = f"user_a_workout_{ts}@example.com"
    email_b = f"user_b_workout_{ts}@example.com"
    password = "SecurePassword123!"

    reg_a = mongo_db.create_user({
        "name": "User Alpha",
        "email": email_a,
        "password": password,
        "age": 28,
        "gender": "Male",
        "weight": 75.0,
        "height": 180.0
    })
    user_a_id = reg_a["id"]

    reg_b = mongo_db.create_user({
        "name": "User Beta",
        "email": email_b,
        "password": password,
        "age": 32,
        "gender": "Female",
        "weight": 62.0,
        "height": 165.0
    })
    user_b_id = reg_b["id"]

    print(f"[OK] User A created with ID: {user_a_id}")
    print(f"[OK] User B created with ID: {user_b_id}")

    # Login both users to get JWT tokens
    login_a = client.post("/api/auth/login", json={"email": email_a, "password": password}).json()
    token_a = login_a["token"]

    login_b = client.post("/api/auth/login", json={"email": email_b, "password": password}).json()
    token_b = login_b["token"]

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # ----------------------------------------------------
    # TEST 1: Input Validation Tests
    # ----------------------------------------------------
    print("\n--- Test 1: Input Validation Enforcement ---")

    # Missing exerciseName
    res = client.post("/api/workouts", json={"reps": 10, "duration": 60, "caloriesBurned": 25}, headers=headers_a)
    assert res.status_code == 400, f"Expected 400 for missing exerciseName, got {res.status_code}"
    print("[OK] Missing exerciseName properly rejected (400 Bad Request)")

    # Negative reps
    res = client.post("/api/workouts", json={"exerciseName": "Curls", "reps": -5, "duration": 60, "caloriesBurned": 25}, headers=headers_a)
    assert res.status_code == 400, f"Expected 400 for negative reps, got {res.status_code}"
    print("[OK] Negative reps properly rejected (400 Bad Request)")

    # Zero/negative duration
    res = client.post("/api/workouts", json={"exerciseName": "Curls", "reps": 10, "duration": 0, "caloriesBurned": 25}, headers=headers_a)
    assert res.status_code == 400, f"Expected 400 for zero duration, got {res.status_code}"
    print("[OK] Zero duration properly rejected (400 Bad Request)")

    # Negative caloriesBurned
    res = client.post("/api/workouts", json={"exerciseName": "Curls", "reps": 10, "duration": 30, "caloriesBurned": -10}, headers=headers_a)
    assert res.status_code == 400, f"Expected 400 for negative caloriesBurned, got {res.status_code}"
    print("[OK] Negative caloriesBurned properly rejected (400 Bad Request)")

    # ----------------------------------------------------
    # TEST 2: Security Test - Prevent Frontend userId Override
    # ----------------------------------------------------
    print("\n--- Test 2: Security - Frontend userId Override Prevention ---")
    spoof_payload = {
        "userId": user_b_id, # Attempting to inject User B's ID from User A's session
        "exerciseName": "Spoofed Workout",
        "reps": 20,
        "duration": 45.0,
        "caloriesBurned": 30.0
    }
    res_spoof = client.post("/api/workouts", json=spoof_payload, headers=headers_a)
    assert res_spoof.status_code == 200, f"Expected 200, got {res_spoof.status_code}: {res_spoof.text}"
    workout_spoof = res_spoof.json()["workout"]
    assert workout_spoof["userId"] == user_a_id, f"SECURITY BREACH: Server accepted frontend userId! Expected {user_a_id}, got {workout_spoof['userId']}"
    assert workout_spoof["userId"] != user_b_id
    print(f"[OK] Server correctly ignored frontend userId '{user_b_id}' and bound workout to authenticated User A '{user_a_id}'")

    # ----------------------------------------------------
    # TEST 3: Create Workouts for User A & User B
    # ----------------------------------------------------
    print("\n--- Test 3: Workout Creation for User A & User B ---")
    payload_a1 = {
        "exerciseName": "Bicep Curl",
        "exerciseType": "bicep_curl",
        "reps": 15,
        "duration": 45.0,
        "caloriesBurned": 22.5,
        "averageJointAngle": 88.5,
        "mlModel": "XGBoost"
    }
    res_a1 = client.post("/api/workouts", json=payload_a1, headers=headers_a).json()
    workout_a1_id = res_a1["workout"]["id"]

    payload_a2 = {
        "exerciseName": "Squats",
        "exerciseType": "squats",
        "reps": 30,
        "duration": 90.0,
        "caloriesBurned": 55.0,
        "averageJointAngle": 110.2,
        "mlModel": "XGBoost"
    }
    res_a2 = client.post("/api/workouts", json=payload_a2, headers=headers_a).json()
    workout_a2_id = res_a2["workout"]["id"]

    payload_b1 = {
        "exerciseName": "Shoulder Press",
        "exerciseType": "shoulder_press",
        "reps": 12,
        "duration": 40.0,
        "caloriesBurned": 18.0,
        "averageJointAngle": 145.0,
        "mlModel": "Random Forest"
    }
    res_b1 = client.post("/api/workouts", json=payload_b1, headers=headers_b).json()
    workout_b1_id = res_b1["workout"]["id"]

    print(f"[OK] User A created Workout A1 ({workout_a1_id}) and Workout A2 ({workout_a2_id})")
    print(f"[OK] User B created Workout B1 ({workout_b1_id})")

    # Verify All Schema Required Fields on Created Document
    w_doc = res_a1["workout"]
    required_fields = [
        "id", "userId", "exerciseName", "exerciseType", "reps", "duration", 
        "caloriesBurned", "bodyWeight", "age", "gender", "averageJointAngle", 
        "mlModel", "completedAt", "createdAt"
    ]
    for field in required_fields:
        assert field in w_doc, f"Missing required WorkoutSession field: {field}"
    print("[OK] WorkoutSession schema validated with all required fields present.")

    # ----------------------------------------------------
    # TEST 4: Isolation Test - GET /api/workouts
    # ----------------------------------------------------
    print("\n--- Test 4: User Data Isolation - GET /api/workouts ---")
    list_a = client.get("/api/workouts", headers=headers_a).json()["workouts"]
    list_b = client.get("/api/workouts", headers=headers_b).json()["workouts"]

    user_a_ids = [w["id"] for w in list_a]
    user_b_ids = [w["id"] for w in list_b]

    assert workout_a1_id in user_a_ids and workout_a2_id in user_a_ids, "User A missing own workouts"
    assert workout_b1_id not in user_a_ids, f"DATA LEAKAGE: User A saw User B's workout {workout_b1_id}!"

    assert workout_b1_id in user_b_ids, "User B missing own workout"
    assert workout_a1_id not in user_b_ids and workout_a2_id not in user_b_ids, "DATA LEAKAGE: User B saw User A's workouts!"

    print(f"[OK] GET /api/workouts isolation verified! User A sees {len(list_a)} workouts (only own), User B sees {len(list_b)} workouts (only own).")

    # ----------------------------------------------------
    # TEST 5: Isolation Test - GET /api/workouts/:id
    # ----------------------------------------------------
    print("\n--- Test 5: User Data Isolation - GET /api/workouts/:id ---")
    # User A accesses own workout A1 -> 200 OK
    res_a_a1 = client.get(f"/api/workouts/{workout_a1_id}", headers=headers_a)
    assert res_a_a1.status_code == 200, f"Expected 200 for owner access, got {res_a_a1.status_code}"
    print("[OK] User A successfully accessed own Workout A1 (200 OK)")

    # User A attempts to access User B's workout B1 -> 403 Forbidden
    res_a_b1 = client.get(f"/api/workouts/{workout_b1_id}", headers=headers_a)
    assert res_a_b1.status_code == 403, f"Expected 403 Forbidden for cross-user access attempt, got {res_a_b1.status_code}"
    print(f"[OK] User A denied access to User B's Workout B1 (403 Forbidden): {res_a_b1.json()['detail']}")

    # User B accesses own workout B1 -> 200 OK
    res_b_b1 = client.get(f"/api/workouts/{workout_b1_id}", headers=headers_b)
    assert res_b_b1.status_code == 200
    print("[OK] User B successfully accessed own Workout B1 (200 OK)")

    # User B attempts to access User A's workout A1 -> 403 Forbidden
    res_b_a1 = client.get(f"/api/workouts/{workout_a1_id}", headers=headers_b)
    assert res_b_a1.status_code == 403
    print(f"[OK] User B denied access to User A's Workout A1 (403 Forbidden)")

    # ----------------------------------------------------
    # TEST 6: MongoDB Indexes Check
    # ----------------------------------------------------
    print("\n--- Test 6: Database Indexes Verification ---")
    index_info = mongo_db.workout_sessions_collection.index_information()
    index_keys = [idx["key"] for idx in index_info.values()]
    print(f"[OK] Current WorkoutSession indexes: {index_keys}")
    has_user_index = any(k[0][0] == "userId" for k in index_keys)
    has_completed_index = any(k[0][0] == "completedAt" for k in index_keys)
    assert has_user_index, "Missing userId index on workout_sessions"
    assert has_completed_index, "Missing completedAt index on workout_sessions"
    print("[OK] MongoDB indexes on 'userId' and 'completedAt' successfully verified.")

    # ----------------------------------------------------
    # Clean up test users & workouts
    # ----------------------------------------------------
    mongo_db.users_collection.delete_one({"_id": ObjectId(user_a_id)})
    mongo_db.users_collection.delete_one({"_id": ObjectId(user_b_id)})
    mongo_db.workout_sessions_collection.delete_many({"userId": {"$in": [user_a_id, user_b_id]}})
    print("\n[OK] Test users and workouts cleaned up from database.")

    print("\n==========================================================")
    print("   ALL WORKOUT SESSION DB & SECURITY TESTS PASSED 100%!")
    print("==========================================================")

if __name__ == "__main__":
    run_tests()
