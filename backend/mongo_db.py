import os
import re
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson.objectid import ObjectId
from pymongo import MongoClient, ASCENDING
from pymongo.errors import DuplicateKeyError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/fitness_ai")
JWT_SECRET = os.getenv("JWT_SECRET", "fitness_ai_jwt_secret_key_2026_super_secure")
JWT_ALGORITHM = "HS256"


client = MongoClient(MONGODB_URI)
# Infer database name from URI path or default to fitness_ai
db_name = MONGODB_URI.rsplit('/', 1)[-1].split('?')[0] or 'fitness_ai'
db = client[db_name]

users_collection = db["users"]
workout_sessions_collection = db["workout_sessions"]

# Ensure unique index on email
users_collection.create_index([("email", ASCENDING)], unique=True)

# Ensure indexes for WorkoutSession
workout_sessions_collection.create_index([("userId", ASCENDING)])
workout_sessions_collection.create_index([("completedAt", -1)])
workout_sessions_collection.create_index([("userId", ASCENDING), ("completedAt", -1)])


def hash_password(password: str) -> str:
    """Hash password securely using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def validate_email_format(email: str) -> bool:
    """Validate email using standard regex format."""
    email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(email_regex, email.strip()))


def create_user(user_data: dict) -> dict:
    """
    Validate and insert a new user document into MongoDB.
    Raises ValueError with descriptive message for validation errors.
    """
    name = str(user_data.get("name", "")).strip()
    email = str(user_data.get("email", "")).strip().lower()
    password = user_data.get("password")
    age = user_data.get("age")
    gender = str(user_data.get("gender", "")).strip()
    weight = user_data.get("weight")
    height = user_data.get("height")

    # 1. Missing fields check
    missing_fields = []
    if not name: missing_fields.append("name")
    if not email: missing_fields.append("email")
    if not password: missing_fields.append("password")
    if age is None or age == "": missing_fields.append("age")
    if not gender: missing_fields.append("gender")
    if weight is None or weight == "": missing_fields.append("weight")
    if height is None or height == "": missing_fields.append("height")

    if missing_fields:
        raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

    # 2. Validate email
    if not validate_email_format(email):
        raise ValueError("Invalid email format")

    # 3. Validate password length
    if not isinstance(password, str) or len(password) < 6:
        raise ValueError("Password must be at least 6 characters long")

    # 4. Validate age
    try:
        age_int = int(age)
        if age_int < 1 or age_int > 120:
            raise ValueError("Age must be between 1 and 120")
    except (ValueError, TypeError):
        raise ValueError("Invalid age value")

    # 5. Validate weight
    try:
        weight_float = float(weight)
        if weight_float <= 0 or weight_float > 500:
            raise ValueError("Weight must be greater than 0")
    except (ValueError, TypeError):
        raise ValueError("Invalid weight value")

    # 6. Validate height
    try:
        height_float = float(height)
        if height_float <= 0 or height_float > 300:
            raise ValueError("Height must be greater than 0")
    except (ValueError, TypeError):
        raise ValueError("Invalid height value")

    # Hash password
    hashed_pwd = hash_password(password)
    now = datetime.now(timezone.utc)

    user_doc = {
        "name": name,
        "email": email,
        "password": hashed_pwd,
        "age": age_int,
        "gender": gender,
        "weight": weight_float,
        "height": height_float,
        "createdAt": now,
        "updatedAt": now
    }

    try:
        result = users_collection.insert_one(user_doc)
        return {
            "id": str(result.inserted_id),
            "name": name,
            "email": email,
            "age": age_int,
            "gender": gender,
            "weight": weight_float,
            "height": height_float,
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat()
        }
    except DuplicateKeyError:
        raise ValueError("Email is already registered")


def generate_jwt_token(user_id: str, expires_in_hours: int = 24) -> str:
    """Generate signed JWT token containing userId."""
    now = datetime.now(timezone.utc)
    expiration = now + timedelta(hours=expires_in_hours)
    payload = {
        "userId": str(user_id),
        "iat": now,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt_token(token: str) -> dict:
    """Decode and verify JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")


def login_user(email: str, password: str) -> dict:
    """Authenticate user with email and password, returning JWT and sanitized user data."""
    if not email or not password:
        raise ValueError("Email and password are required")

    clean_email = str(email).strip().lower()
    user_doc = users_collection.find_one({"email": clean_email})
    if not user_doc:
        raise ValueError("Invalid email or password")

    if not verify_password(password, user_doc["password"]):
        raise ValueError("Invalid email or password")

    user_id_str = str(user_doc["_id"])
    token = generate_jwt_token(user_id_str)

    created_at_val = user_doc["createdAt"].isoformat() if isinstance(user_doc.get("createdAt"), datetime) else str(user_doc.get("createdAt", ""))
    updated_at_val = user_doc["updatedAt"].isoformat() if isinstance(user_doc.get("updatedAt"), datetime) else str(user_doc.get("updatedAt", ""))

    user_data = {
        "id": user_id_str,
        "name": user_doc["name"],
        "email": user_doc["email"],
        "age": user_doc.get("age"),
        "gender": user_doc.get("gender"),
        "weight": user_doc.get("weight"),
        "height": user_doc.get("height"),
        "createdAt": created_at_val,
        "updatedAt": updated_at_val
    }

    return {
        "token": token,
        "user": user_data
    }


def get_user_by_id(user_id: str) -> dict:
    """Retrieve user document by ID without sensitive fields."""
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise ValueError("Invalid user ID format")

    user_doc = users_collection.find_one({"_id": obj_id})
    if not user_doc:
        raise ValueError("User not found")

    created_at_val = user_doc["createdAt"].isoformat() if isinstance(user_doc.get("createdAt"), datetime) else str(user_doc.get("createdAt", ""))
    updated_at_val = user_doc["updatedAt"].isoformat() if isinstance(user_doc.get("updatedAt"), datetime) else str(user_doc.get("updatedAt", ""))

    return {
        "id": str(user_doc["_id"]),
        "name": user_doc["name"],
        "email": user_doc["email"],
        "age": user_doc.get("age"),
        "gender": user_doc.get("gender"),
        "weight": user_doc.get("weight"),
        "height": user_doc.get("height"),
        "createdAt": created_at_val,
        "updatedAt": updated_at_val
    }


def format_workout_doc(doc: dict) -> dict:
    """Format a MongoDB workout session document into a clean dict."""
    created_at_val = doc.get("createdAt")
    if isinstance(created_at_val, datetime):
        created_at_str = created_at_val.isoformat()
    else:
        created_at_str = str(created_at_val) if created_at_val is not None else ""

    completed_at_val = doc.get("completedAt")
    if isinstance(completed_at_val, datetime):
        completed_at_str = completed_at_val.isoformat()
    else:
        completed_at_str = str(completed_at_val) if completed_at_val is not None else ""

    return {
        "id": str(doc["_id"]),
        "userId": str(doc.get("userId")),
        "exerciseName": doc.get("exerciseName"),
        "exerciseType": doc.get("exerciseType"),
        "reps": doc.get("reps"),
        "duration": doc.get("duration"),
        "caloriesBurned": doc.get("caloriesBurned"),
        "bodyWeight": doc.get("bodyWeight"),
        "age": doc.get("age"),
        "gender": doc.get("gender"),
        "averageJointAngle": doc.get("averageJointAngle"),
        "mlModel": doc.get("mlModel"),
        "completedAt": completed_at_str,
        "createdAt": created_at_str
    }


def create_workout_session(user_id: str, session_data: dict) -> dict:
    """
    Validates and inserts a new WorkoutSession document for the authenticated user.
    Frontend userId is strictly ignored in favor of authenticated user_id.
    """
    if not user_id:
        raise ValueError("User authentication required")

    # Fetch user details for defaults
    user_info = get_user_by_id(user_id)

    # 1. Validate exerciseName
    raw_name = session_data.get("exerciseName")
    if not raw_name or not isinstance(raw_name, str) or not raw_name.strip():
        raise ValueError("exerciseName is required and must be a non-empty string")
    exercise_name = raw_name.strip()

    # 2. Validate reps
    reps_val = session_data.get("reps")
    if reps_val is None:
        raise ValueError("reps is required")
    try:
        reps = int(reps_val)
        if reps < 0:
            raise ValueError("reps cannot be negative")
    except (ValueError, TypeError):
        raise ValueError("reps must be a non-negative integer")

    # 3. Validate duration
    duration_val = session_data.get("duration")
    if duration_val is None:
        raise ValueError("duration is required")
    try:
        duration = float(duration_val)
        if duration <= 0:
            raise ValueError("duration must be greater than 0")
    except (ValueError, TypeError):
        raise ValueError("duration must be a positive number")

    # 4. Validate caloriesBurned
    calories_val = session_data.get("caloriesBurned")
    if calories_val is None:
        raise ValueError("caloriesBurned is required")
    try:
        calories_burned = float(calories_val)
        if calories_burned < 0:
            raise ValueError("caloriesBurned cannot be negative")
    except (ValueError, TypeError):
        raise ValueError("caloriesBurned must be a non-negative number")

    # Optional / Context fields
    exercise_type = str(session_data.get("exerciseType") or exercise_name.lower().replace(" ", "_")).strip()
    
    # Body stats fallbacks from user profile if not provided
    body_weight = session_data.get("bodyWeight")
    if body_weight is not None:
        try:
            body_weight = float(body_weight)
        except (ValueError, TypeError):
            body_weight = user_info.get("weight", 70.0)
    else:
        body_weight = user_info.get("weight", 70.0)

    age = session_data.get("age")
    if age is not None:
        try:
            age = int(age)
        except (ValueError, TypeError):
            age = user_info.get("age", 25)
    else:
        age = user_info.get("age", 25)

    gender = str(session_data.get("gender") or user_info.get("gender") or "Male").strip()
    
    joint_angle = session_data.get("averageJointAngle")
    if joint_angle is not None:
        try:
            joint_angle = float(joint_angle)
        except (ValueError, TypeError):
            joint_angle = 0.0
    else:
        joint_angle = 0.0

    ml_model = str(session_data.get("mlModel") or "XGBoost").strip()

    # Timestamps
    now = datetime.now(timezone.utc)
    raw_completed_at = session_data.get("completedAt")
    if raw_completed_at:
        try:
            if isinstance(raw_completed_at, datetime):
                completed_at = raw_completed_at
            else:
                completed_at = datetime.fromisoformat(str(raw_completed_at).replace('Z', '+00:00'))
        except Exception:
            completed_at = now
    else:
        completed_at = now

    doc = {
        "userId": str(user_id),
        "exerciseName": exercise_name,
        "exerciseType": exercise_type,
        "reps": reps,
        "duration": duration,
        "caloriesBurned": calories_burned,
        "bodyWeight": body_weight,
        "age": age,
        "gender": gender,
        "averageJointAngle": joint_angle,
        "mlModel": ml_model,
        "completedAt": completed_at,
        "createdAt": now
    }

    result = workout_sessions_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return format_workout_doc(doc)


def get_user_workouts(user_id: str) -> list:
    """Returns all workout sessions belonging strictly to the specified authenticated user."""
    if not user_id:
        return []
        
    cursor = workout_sessions_collection.find({"userId": str(user_id)}).sort("completedAt", -1)
    return [format_workout_doc(doc) for doc in cursor]


def get_workout_by_id(workout_id: str, requesting_user_id: str) -> dict:
    """
    Returns a workout session by ID if and only if it belongs to the requesting user.
    Raises PermissionError if workout exists but belongs to a different user.
    Raises ValueError if workout not found or invalid ID.
    """
    try:
        obj_id = ObjectId(workout_id)
    except Exception:
        raise ValueError("Invalid workout ID format")

    doc = workout_sessions_collection.find_one({"_id": obj_id})
    if not doc:
        raise ValueError("Workout session not found")

    owner_id = str(doc.get("userId"))
    if owner_id != str(requesting_user_id):
        raise PermissionError("Access denied: You do not own this workout session")

    return format_workout_doc(doc)


def parse_date_str(val):
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%d")
    if isinstance(val, str) and val:
        return val[:10]
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def get_user_workout_stats(user_id: str) -> dict:
    """
    Computes overall summary statistics for the authenticated user using MongoDB aggregation.
    """
    user_id_str = str(user_id)
    pipeline = [
        {"$match": {"userId": user_id_str}},
        {
            "$group": {
                "_id": None,
                "totalWorkouts": {"$sum": 1},
                "totalReps": {"$sum": "$reps"},
                "totalCalories": {"$sum": "$caloriesBurned"},
                "totalDuration": {"$sum": "$duration"}
            }
        }
    ]

    result = list(workout_sessions_collection.aggregate(pipeline))
    if not result:
        return {
            "totalWorkouts": 0,
            "totalReps": 0,
            "totalCalories": 0.0,
            "totalDuration": 0.0,
            "averageCalories": 0.0,
            "averageReps": 0.0
        }

    data = result[0]
    total_workouts = int(data.get("totalWorkouts", 0))
    total_reps = int(data.get("totalReps", 0))
    total_calories = round(float(data.get("totalCalories", 0.0)), 2)
    total_duration = round(float(data.get("totalDuration", 0.0)), 2)

    avg_calories = round(total_calories / total_workouts, 2) if total_workouts > 0 else 0.0
    avg_reps = round(total_reps / total_workouts, 2) if total_workouts > 0 else 0.0

    return {
        "totalWorkouts": total_workouts,
        "totalReps": total_reps,
        "totalCalories": total_calories,
        "totalDuration": total_duration,
        "averageCalories": avg_calories,
        "averageReps": avg_reps
    }


def get_user_workout_analytics(user_id: str) -> dict:
    """
    Computes analytics required for charts using MongoDB aggregation from user's records:
    1. Calories over time
    2. Reps over time
    3. Workout frequency
    4. Exercise distribution
    5. Calories by exercise
    6. Workout duration
    """
    user_id_str = str(user_id)
    match_stage = {"$match": {"userId": user_id_str}}

    # Exercise Aggregation (Distribution, Calories by exercise, Duration by exercise)
    exercise_pipeline = [
        match_stage,
        {
            "$group": {
                "_id": "$exerciseName",
                "count": {"$sum": 1},
                "reps": {"$sum": "$reps"},
                "calories": {"$sum": "$caloriesBurned"},
                "duration": {"$sum": "$duration"}
            }
        },
        {"$sort": {"count": -1}}
    ]

    exercise_docs = list(workout_sessions_collection.aggregate(exercise_pipeline))
    total_exercise_count = sum(doc["count"] for doc in exercise_docs)

    exercise_distribution = [
        {
            "exercise": doc["_id"],
            "count": doc["count"],
            "reps": doc["reps"],
            "percentage": round((doc["count"] / total_exercise_count) * 100, 1) if total_exercise_count > 0 else 0.0
        }
        for doc in exercise_docs
    ]

    calories_by_exercise = [
        {
            "exercise": doc["_id"],
            "calories": round(float(doc["calories"]), 2)
        }
        for doc in exercise_docs
    ]

    duration_by_exercise = [
        {
            "exercise": doc["_id"],
            "duration": round(float(doc["duration"]), 2),
            "avgDuration": round(float(doc["duration"]) / doc["count"], 2) if doc["count"] > 0 else 0.0
        }
        for doc in exercise_docs
    ]

    # Timeline Aggregation (Calories, Reps, Frequency, Duration over time)
    all_user_workouts = list(workout_sessions_collection.find({"userId": user_id_str}).sort("completedAt", 1))

    by_date = {}
    for w in all_user_workouts:
        d_str = parse_date_str(w.get("completedAt") or w.get("createdAt"))
        if d_str not in by_date:
            by_date[d_str] = {
                "date": d_str,
                "calories": 0.0,
                "reps": 0,
                "count": 0,
                "duration": 0.0
            }
        by_date[d_str]["calories"] += float(w.get("caloriesBurned", 0.0))
        by_date[d_str]["reps"] += int(w.get("reps", 0))
        by_date[d_str]["count"] += 1
        by_date[d_str]["duration"] += float(w.get("duration", 0.0))

    sorted_dates = sorted(by_date.values(), key=lambda x: x["date"])

    calories_over_time = [{"date": item["date"], "calories": round(item["calories"], 2)} for item in sorted_dates]
    reps_over_time = [{"date": item["date"], "reps": item["reps"]} for item in sorted_dates]
    workout_frequency = [{"date": item["date"], "count": item["count"]} for item in sorted_dates]
    duration_over_time = [{"date": item["date"], "duration": round(item["duration"], 2)} for item in sorted_dates]

    return {
        "caloriesOverTime": calories_over_time,
        "repsOverTime": reps_over_time,
        "workoutFrequency": workout_frequency,
        "exerciseDistribution": exercise_distribution,
        "caloriesByExercise": calories_by_exercise,
        "workoutDuration": {
            "overTime": duration_over_time,
            "byExercise": duration_by_exercise
        }
    }



