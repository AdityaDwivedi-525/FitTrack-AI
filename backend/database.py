import sqlite3
import hashlib
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "fitness_ai.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mobile_number TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create Workout History table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workout_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            exercise_type TEXT NOT NULL,
            reps INTEGER NOT NULL,
            duration_secs REAL NOT NULL,
            calories_burned REAL NOT NULL,
            model_used TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    conn.close()

def hash_password(password: str) -> str:
    # Use SHA-256 with a static salt for password hashing
    salt = "fitness_ai_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def register_user(mobile_number: str, username: str, password: str):
    conn = get_connection()
    cursor = conn.cursor()
    pwd_hash = hash_password(password)
    
    try:
        cursor.execute(
            "INSERT INTO users (mobile_number, username, password_hash) VALUES (?, ?, ?)",
            (mobile_number.strip(), username.strip(), pwd_hash)
        )
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return {"id": user_id, "mobile_number": mobile_number.strip(), "username": username.strip()}
    except sqlite3.IntegrityError:
        conn.close()
        raise ValueError("Mobile number is already registered")

def login_user(mobile_number: str, password: str):
    conn = get_connection()
    cursor = conn.cursor()
    pwd_hash = hash_password(password)
    
    cursor.execute(
        "SELECT id, mobile_number, username, password_hash FROM users WHERE mobile_number = ?",
        (mobile_number.strip(),)
    )
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise ValueError("Mobile number not found")
    
    if user["password_hash"] != pwd_hash:
        raise ValueError("Incorrect password")
    
    return {"id": user["id"], "mobile_number": user["mobile_number"], "username": user["username"]}

def save_workout(user_id: int, exercise_type: str, reps: int, duration_secs: float, calories_burned: float, model_used: str):
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO workout_history (user_id, exercise_type, reps, duration_secs, calories_burned, model_used)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, exercise_type, reps, duration_secs, calories_burned, model_used))
    
    conn.commit()
    workout_id = cursor.lastrowid
    conn.close()
    return {
        "id": workout_id,
        "user_id": user_id,
        "exercise_type": exercise_type,
        "reps": reps,
        "duration_secs": duration_secs,
        "calories_burned": calories_burned,
        "model_used": model_used
    }

def get_user_history(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, user_id, exercise_type, reps, duration_secs, calories_burned, model_used, created_at
        FROM workout_history
        WHERE user_id = ?
        ORDER BY created_at DESC
    """, (user_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        history.append({
            "id": row["id"],
            "user_id": row["user_id"],
            "exercise_type": row["exercise_type"],
            "reps": row["reps"],
            "duration_secs": row["duration_secs"],
            "calories_burned": row["calories_burned"],
            "model_used": row["model_used"],
            "created_at": row["created_at"]
        })
    return history

def delete_workout(workout_id: int, user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM workout_history WHERE id = ? AND user_id = ?", (workout_id, user_id))
    conn.commit()
    conn.close()
    return True

# Initialize database on module load
init_db()
