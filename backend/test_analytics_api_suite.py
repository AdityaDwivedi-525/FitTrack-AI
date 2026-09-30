import time
from fastapi.testclient import TestClient
import mongo_db
from main import app
from bson.objectid import ObjectId

client = TestClient(app)

def run_tests():
    print("==========================================================")
    print("   STARTING BACKEND ANALYTICS & STATS API TEST SUITE")
    print("==========================================================")

    # 1. Test 401 Unauthorized for Unauthenticated Requests
    print("\n--- Test 1: Authentication Requirement ---")
    res_stats_unauth = client.get("/api/workouts/stats")
    assert res_stats_unauth.status_code == 401, f"Expected 401 for unauth stats, got {res_stats_unauth.status_code}"
    print("[OK] GET /api/workouts/stats unauthenticated request properly returned 401 Unauthorized")

    res_analytics_unauth = client.get("/api/workouts/analytics")
    assert res_analytics_unauth.status_code == 401, f"Expected 401 for unauth analytics, got {res_analytics_unauth.status_code}"
    print("[OK] GET /api/workouts/analytics unauthenticated request properly returned 401 Unauthorized")

    # 2. Setup 2 Distinct Users (User Alpha & User Beta)
    ts = int(time.time())
    email_alpha = f"alpha_analytics_{ts}@example.com"
    email_beta = f"beta_analytics_{ts}@example.com"
    password = "SecurePassword123!"

    user_a = mongo_db.create_user({
        "name": "User Alpha Analytics",
        "email": email_alpha,
        "password": password,
        "age": 28,
        "gender": "Male",
        "weight": 75.0,
        "height": 180.0
    })
    user_a_id = user_a["id"]

    user_b = mongo_db.create_user({
        "name": "User Beta Analytics",
        "email": email_beta,
        "password": password,
        "age": 30,
        "gender": "Female",
        "weight": 60.0,
        "height": 165.0
    })
    user_b_id = user_b["id"]

    print(f"[OK] User Alpha created with ID: {user_a_id}")
    print(f"[OK] User Beta created with ID: {user_b_id}")

    # Login both users to acquire JWT tokens
    login_a = client.post("/api/auth/login", json={"email": email_alpha, "password": password}).json()
    token_a = login_a["token"]

    login_b = client.post("/api/auth/login", json={"email": email_beta, "password": password}).json()
    token_b = login_b["token"]

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. Create Sample Workout Records in MongoDB
    print("\n--- Test 2: Populate Real Workouts for User Alpha & User Beta ---")
    
    # User Alpha Workouts (2 workouts: Left Bicep Curl & Squat)
    client.post("/api/workouts", json={
        "exerciseName": "Left Bicep Curl",
        "exerciseType": "left_bicep_curl",
        "reps": 20,
        "duration": 60.0,
        "caloriesBurned": 30.0,
        "averageJointAngle": 95.0,
        "mlModel": "Random Forest",
        "completedAt": "2026-09-28T10:00:00Z"
    }, headers=headers_a)

    client.post("/api/workouts", json={
        "exerciseName": "Squat",
        "exerciseType": "squat",
        "reps": 30,
        "duration": 90.0,
        "caloriesBurned": 50.0,
        "averageJointAngle": 110.0,
        "mlModel": "XGBoost",
        "completedAt": "2026-09-28T14:00:00Z"
    }, headers=headers_a)

    # User Beta Workouts (1 workout: Shoulder Press)
    client.post("/api/workouts", json={
        "exerciseName": "Shoulder Press",
        "exerciseType": "shoulder_press",
        "reps": 15,
        "duration": 45.0,
        "caloriesBurned": 20.0,
        "averageJointAngle": 140.0,
        "mlModel": "SVM",
        "completedAt": "2026-09-28T12:00:00Z"
    }, headers=headers_b)

    print("[OK] User Alpha created 2 workouts (total reps: 50, calories: 80.0, duration: 150.0s)")
    print("[OK] User Beta created 1 workout (total reps: 15, calories: 20.0, duration: 45.0s)")

    # 4. Test GET /api/workouts/stats
    print("\n--- Test 3: GET /api/workouts/stats Verification & User Isolation ---")
    
    stats_a = client.get("/api/workouts/stats", headers=headers_a).json()
    assert stats_a["success"] is True
    assert stats_a["totalWorkouts"] == 2
    assert stats_a["totalReps"] == 50
    assert stats_a["totalCalories"] == 80.0
    assert stats_a["totalDuration"] == 150.0
    assert stats_a["averageCalories"] == 40.0
    assert stats_a["averageReps"] == 25.0
    print(f"[OK] User Alpha Stats verified: totalWorkouts={stats_a['totalWorkouts']}, totalReps={stats_a['totalReps']}, totalCalories={stats_a['totalCalories']}, avgCalories={stats_a['averageCalories']}")

    stats_b = client.get("/api/workouts/stats", headers=headers_b).json()
    assert stats_b["success"] is True
    assert stats_b["totalWorkouts"] == 1
    assert stats_b["totalReps"] == 15
    assert stats_b["totalCalories"] == 20.0
    assert stats_b["totalDuration"] == 45.0
    assert stats_b["averageCalories"] == 20.0
    assert stats_b["averageReps"] == 15.0
    print(f"[OK] User Beta Stats verified: totalWorkouts={stats_b['totalWorkouts']}, totalReps={stats_b['totalReps']}, totalCalories={stats_b['totalCalories']}, avgCalories={stats_b['averageCalories']}")

    # 5. Test GET /api/workouts/analytics
    print("\n--- Test 4: GET /api/workouts/analytics Verification & User Isolation ---")
    
    analytics_a = client.get("/api/workouts/analytics", headers=headers_a).json()
    assert analytics_a["success"] is True
    
    # Check 6 Analytics Components present
    assert "caloriesOverTime" in analytics_a
    assert "repsOverTime" in analytics_a
    assert "workoutFrequency" in analytics_a
    assert "exerciseDistribution" in analytics_a
    assert "caloriesByExercise" in analytics_a
    assert "workoutDuration" in analytics_a

    # User Alpha Exercises should contain Left Bicep Curl & Squat, NOT Shoulder Press
    exercises_a = [e["exercise"] for e in analytics_a["exerciseDistribution"]]
    assert "Left Bicep Curl" in exercises_a and "Squat" in exercises_a
    assert "Shoulder Press" not in exercises_a, f"DATA LEAKAGE: User Alpha analytics contained User Beta exercise!"

    print("[OK] User Alpha Analytics verified (Calories over time, Reps over time, Frequency, Distribution, Duration)")

    analytics_b = client.get("/api/workouts/analytics", headers=headers_b).json()
    assert analytics_b["success"] is True
    
    exercises_b = [e["exercise"] for e in analytics_b["exerciseDistribution"]]
    assert "Shoulder Press" in exercises_b
    assert "Left Bicep Curl" not in exercises_b and "Squat" not in exercises_b, f"DATA LEAKAGE: User Beta analytics contained User Alpha exercise!"

    print("[OK] User Beta Analytics verified (Contains strictly User Beta data)")

    # 6. Clean up test users & workouts
    mongo_db.users_collection.delete_one({"_id": ObjectId(user_a_id)})
    mongo_db.users_collection.delete_one({"_id": ObjectId(user_b_id)})
    mongo_db.workout_sessions_collection.delete_many({"userId": {"$in": [user_a_id, user_b_id]}})
    print("\n[OK] Cleaned up test data from MongoDB.")

    print("\n==========================================================")
    print("   ALL ANALYTICS & STATS API TESTS PASSED 100% SUCCESS!")
    print("==========================================================")

if __name__ == "__main__":
    run_tests()
