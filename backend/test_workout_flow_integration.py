import time
from fastapi.testclient import TestClient
import mongo_db
from main import app
from bson.objectid import ObjectId

client = TestClient(app)

def run_tests():
    print("==========================================================")
    print("   STARTING WORKOUT COMPLETION FLOW INTEGRATION TEST")
    print("==========================================================")

    ts = int(time.time())
    test_email = f"flow_user_{ts}@example.com"
    password = "SecurePassword123!"

    # 1. Register & Login
    reg_user = mongo_db.create_user({
        "name": "Workout Completion Tester",
        "email": test_email,
        "password": password,
        "age": 28,
        "gender": "Male",
        "weight": 75.0,
        "height": 180.0
    })
    user_id = reg_user["id"]

    login_res = client.post("/api/auth/login", json={"email": test_email, "password": password}).json()
    token = login_res["token"]
    headers = {"Authorization": f"Bearer {token}"}

    print(f"[OK] User logged in successfully. User ID: {user_id}")

    # 2. Simulate Finish Workout payload matching prompt specifications:
    # Exercise: Left Bicep Curl
    # Total Reps: 25
    # Duration: 02:35 (155 secs)
    # Estimated Calories: 18.4 kcal
    # Average Joint Angle: 101.7°
    # ML Model: Random Forest
    workout_payload = {
        "exerciseName": "Left Bicep Curl",
        "exerciseType": "left_bicep_curl",
        "reps": 25,
        "duration": 155.0,
        "caloriesBurned": 18.4,
        "averageJointAngle": 101.7,
        "mlModel": "Random Forest",
        "completedAt": "2026-09-29T00:48:43Z"
    }

    print("\n--- Test 1: POST /api/workouts (Save Workout) ---")
    save_res = client.post("/api/workouts", json=workout_payload, headers=headers)
    assert save_res.status_code == 200, f"Expected 200, got {save_res.status_code}: {save_res.text}"
    save_data = save_res.json()
    assert save_data["success"] is True
    saved_workout = save_data["workout"]

    assert saved_workout["userId"] == user_id
    assert saved_workout["exerciseName"] == "Left Bicep Curl"
    assert saved_workout["reps"] == 25
    assert saved_workout["duration"] == 155.0
    assert saved_workout["caloriesBurned"] == 18.4
    assert saved_workout["averageJointAngle"] == 101.7
    assert saved_workout["mlModel"] == "Random Forest"
    print("[OK] Workout session saved successfully to database!")

    # 3. Test GET /api/workouts (History List)
    print("\n--- Test 2: GET /api/workouts (History List Verification) ---")
    history_res = client.get("/api/workouts", headers=headers)
    assert history_res.status_code == 200
    workouts_list = history_res.json()["workouts"]
    assert len(workouts_list) == 1
    assert workouts_list[0]["id"] == saved_workout["id"]
    print(f"[OK] Workout history verified! 1 saved workout found for user: {workouts_list[0]['exerciseName']} ({workouts_list[0]['reps']} Reps)")

    # 4. Clean up test data
    mongo_db.users_collection.delete_one({"_id": ObjectId(user_id)})
    mongo_db.workout_sessions_collection.delete_many({"userId": user_id})
    print("\n[OK] Cleaned up test data.")

    print("\n==========================================================")
    print("   WORKOUT COMPLETION FLOW INTEGRATION TEST SUCCESS 100%!")
    print("==========================================================")

if __name__ == "__main__":
    run_tests()
