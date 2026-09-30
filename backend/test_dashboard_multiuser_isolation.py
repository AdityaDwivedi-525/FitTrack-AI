import time
from fastapi.testclient import TestClient
import mongo_db
from main import app
from bson.objectid import ObjectId

client = TestClient(app)

def run_tests():
    print("==========================================================")
    print("   STARTING DASHBOARD MULTI-USER DATA ISOLATION TEST")
    print("==========================================================")

    ts = int(time.time())
    email_a = f"dash_user_a_{ts}@example.com"
    email_b = f"dash_user_b_{ts}@example.com"
    password = "SecurePassword123!"

    # 1. Register User A & User B
    user_a = mongo_db.create_user({
        "name": "Dashboard User Alpha",
        "email": email_a,
        "password": password,
        "age": 28,
        "gender": "Male",
        "weight": 75.0,
        "height": 180.0
    })
    user_a_id = user_a["id"]

    user_b = mongo_db.create_user({
        "name": "Dashboard User Beta",
        "email": email_b,
        "password": password,
        "age": 30,
        "gender": "Female",
        "weight": 60.0,
        "height": 165.0
    })
    user_b_id = user_b["id"]

    # Login both users
    token_a = client.post("/api/auth/login", json={"email": email_a, "password": password}).json()["token"]
    token_b = client.post("/api/auth/login", json={"email": email_b, "password": password}).json()["token"]

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    print(f"[OK] User Alpha created ({user_a_id}) and logged in.")
    print(f"[OK] User Beta created ({user_b_id}) and logged in.")

    # 2. Add Workouts for User A (2 Workouts)
    client.post("/api/workouts", json={
        "exerciseName": "Left Bicep Curl",
        "reps": 20,
        "duration": 60.0,
        "caloriesBurned": 30.0,
        "averageJointAngle": 95.0,
        "mlModel": "Random Forest"
    }, headers=headers_a)

    client.post("/api/workouts", json={
        "exerciseName": "Squat",
        "reps": 30,
        "duration": 90.0,
        "caloriesBurned": 50.0,
        "averageJointAngle": 110.0,
        "mlModel": "XGBoost"
    }, headers=headers_a)

    # 3. Add Workout for User B (1 Workout)
    client.post("/api/workouts", json={
        "exerciseName": "Shoulder Press",
        "reps": 15,
        "duration": 45.0,
        "caloriesBurned": 20.0,
        "averageJointAngle": 140.0,
        "mlModel": "SVM"
    }, headers=headers_b)

    # 4. Verify User A Dashboard Data
    print("\n--- Test 1: User Alpha Dashboard Data Verification ---")
    stats_a = client.get("/api/workouts/stats", headers=headers_a).json()
    workouts_a = client.get("/api/workouts", headers=headers_a).json()["workouts"]
    analytics_a = client.get("/api/workouts/analytics", headers=headers_a).json()

    assert stats_a["totalWorkouts"] == 2
    assert stats_a["totalReps"] == 50
    assert stats_a["totalCalories"] == 80.0
    assert len(workouts_a) == 2
    assert all(w["userId"] == user_a_id for w in workouts_a)
    print(f"[OK] User Alpha sees strictly 2 workouts, 50 reps, 80 kcal total. Zero User Beta data.")

    # 5. Verify User B Dashboard Data
    print("\n--- Test 2: User Beta Dashboard Data Verification ---")
    stats_b = client.get("/api/workouts/stats", headers=headers_b).json()
    workouts_b = client.get("/api/workouts", headers=headers_b).json()["workouts"]

    assert stats_b["totalWorkouts"] == 1
    assert stats_b["totalReps"] == 15
    assert stats_b["totalCalories"] == 20.0
    assert len(workouts_b) == 1
    assert workouts_b[0]["userId"] == user_b_id
    print(f"[OK] User Beta sees strictly 1 workout, 15 reps, 20 kcal total. Zero User Alpha data.")

    # 6. Cleanup
    mongo_db.users_collection.delete_one({"_id": ObjectId(user_a_id)})
    mongo_db.users_collection.delete_one({"_id": ObjectId(user_b_id)})
    mongo_db.workout_sessions_collection.delete_many({"userId": {"$in": [user_a_id, user_b_id]}})
    print("\n[OK] Cleaned up test data from MongoDB.")

    print("\n==========================================================")
    print("   MULTI-USER DASHBOARD DATA ISOLATION TEST PASSED 100%!")
    print("==========================================================")

if __name__ == "__main__":
    run_tests()
