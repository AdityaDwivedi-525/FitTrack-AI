# Trigger reload
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import cv2
import numpy as np
import pandas as pd
import joblib
import os
from fastapi import HTTPException
from app_state import state
from pose_module import process_frame
import database
import mongo_db
from typing import Optional

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ML Models
models_dir = os.path.dirname(__file__)
rf_model_path  = os.path.join(models_dir, 'rf_model.pkl')
lr_model_path  = os.path.join(models_dir, 'lr_model.pkl')
xgb_model_path = os.path.join(models_dir, 'xgb_model.pkl')
svm_model_path = os.path.join(models_dir, 'svm_model.pkl')

rf_model  = None
lr_model  = None
xgb_model = None
svm_model = None

try:
    if os.path.exists(rf_model_path):
        rf_model = joblib.load(rf_model_path)
except Exception as e:
    print(f"Failed to load Random Forest model: {e}")

try:
    if os.path.exists(lr_model_path):
        lr_model = joblib.load(lr_model_path)
except Exception as e:
    print(f"Failed to load Linear Regression model: {e}")

try:
    if os.path.exists(xgb_model_path):
        xgb_model = joblib.load(xgb_model_path)
except Exception as e:
    print(f"Failed to load XGBoost model: {e}")

try:
    if os.path.exists(svm_model_path):
        svm_model = joblib.load(svm_model_path)
except Exception as e:
    print(f"Failed to load SVM model: {e}")


from typing import Optional, Any

class RegisterRequest(BaseModel):
    name: Optional[Any] = None
    email: Optional[Any] = None
    password: Optional[Any] = None
    age: Optional[Any] = None
    gender: Optional[Any] = None
    weight: Optional[Any] = None
    height: Optional[Any] = None

@app.post("/api/auth/register")
def register_user(req: RegisterRequest):
    try:
        user = mongo_db.create_user(req.dict())
        return {"success": True, "message": "Registration successful"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, Security, Request, HTTPException

security = HTTPBearer(auto_error=False)

def auth_middleware(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> dict:
    token = None
    if credentials:
        token = credentials.credentials
    else:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required")

    try:
        payload = mongo_db.decode_jwt_token(token)
        user_id = payload.get("userId")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        user = mongo_db.get_user_by_id(user_id)
        request.state.user = user
        request.scope["user"] = user
        return user
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/login")
def login_user_endpoint(req: LoginRequest):
    try:
        res = mongo_db.login_user(req.email, req.password)
        return {
            "success": True,
            "message": "Login successful",
            "token": res["token"],
            "user": res["user"]
        }
    except ValueError as e:
        err_msg = str(e)
        if "Invalid email or password" in err_msg:
            raise HTTPException(status_code=401, detail=err_msg)
        raise HTTPException(status_code=400, detail=err_msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/api/auth/me")
def get_current_user_profile(current_user: dict = Depends(auth_middleware)):
    return {
        "success": True,
        "user": current_user
    }


class WorkoutSessionCreateRequest(BaseModel):
    exerciseName: Optional[Any] = None
    exerciseType: Optional[Any] = None
    reps: Optional[Any] = None
    duration: Optional[Any] = None
    caloriesBurned: Optional[Any] = None
    bodyWeight: Optional[Any] = None
    age: Optional[Any] = None
    gender: Optional[Any] = None
    averageJointAngle: Optional[Any] = None
    mlModel: Optional[Any] = None
    completedAt: Optional[Any] = None

@app.post("/api/workouts")
def create_workout_session_endpoint(
    req: WorkoutSessionCreateRequest,
    current_user: dict = Depends(auth_middleware)
):
    user_id = current_user["id"]
    try:
        workout = mongo_db.create_workout_session(user_id, req.dict())
        return {
            "success": True,
            "message": "Workout session saved successfully",
            "workout": workout
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create workout session: {str(e)}")


@app.get("/api/workouts")
def get_user_workouts_endpoint(current_user: dict = Depends(auth_middleware)):
    user_id = current_user["id"]
    try:
        workouts = mongo_db.get_user_workouts(user_id)
        return {
            "success": True,
            "workouts": workouts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch workouts: {str(e)}")


@app.get("/api/workouts/stats")
def get_workout_stats_endpoint(current_user: dict = Depends(auth_middleware)):
    user_id = current_user["id"]
    try:
        stats = mongo_db.get_user_workout_stats(user_id)
        return {
            "success": True,
            **stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch workout stats: {str(e)}")


@app.get("/api/workouts/analytics")
def get_workout_analytics_endpoint(current_user: dict = Depends(auth_middleware)):
    user_id = current_user["id"]
    try:
        analytics = mongo_db.get_user_workout_analytics(user_id)
        return {
            "success": True,
            **analytics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch workout analytics: {str(e)}")


@app.get("/api/workouts/{workout_id}")
def get_single_workout_endpoint(
    workout_id: str,
    current_user: dict = Depends(auth_middleware)
):
    user_id = current_user["id"]
    try:
        workout = mongo_db.get_workout_by_id(workout_id, user_id)
        return {
            "success": True,
            "workout": workout
        }
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        err_str = str(e)
        if "not found" in err_str.lower():
            raise HTTPException(status_code=404, detail=err_str)
        raise HTTPException(status_code=400, detail=err_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch workout: {str(e)}")



class CaloriePredictionRequest(BaseModel):

    exercise_type: str
    gender: str = "Male"        # "Male" | "Female"
    age: int = 25               # user age in years
    reps: int
    duration_secs: float
    intensity: float
    body_weight_kg: float
    model_choice: str = "Random Forest"  # "Random Forest" | "Linear Regression" | "XGBoost" | "SVM"

@app.post("/predict_calories")
def predict_calories(req: CaloriePredictionRequest):
    model_map = {
        "Random Forest":     rf_model,
        "Linear Regression": lr_model,
        "XGBoost":           xgb_model,
        "SVM":               svm_model,
    }
    model = model_map.get(req.model_choice)
    if model is None:
        raise HTTPException(status_code=500, detail=f"Model '{req.model_choice}' is not available. Please re-train models first.")
    
    # Create DataFrame for pipeline (must match training feature order)
    input_data = pd.DataFrame([{
        'exercise_type': req.exercise_type,
        'gender':         req.gender,
        'age':            req.age,
        'intensity':      req.intensity,
        'body_weight_kg': req.body_weight_kg,
        'duration_secs':  req.duration_secs,
        'reps':           req.reps
    }])
    
    try:
        prediction = model.predict(input_data)[0]
        prediction = max(0.1, float(prediction)) # Prevent negatives / allow small micro-exercises
        return {"calories_burned": round(prediction, 2), "model_used": req.model_choice}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

class ExerciseRequest(BaseModel):
    exercise: str

@app.post("/start")
def start_exercise(request: ExerciseRequest):
    state.set_exercise(request.exercise)
    return {"message": f"Started {request.exercise}", "reps_total": state.reps['total'], "reps_left": state.reps['left'], "reps_right": state.reps['right']}

@app.post("/stop")
def stop_exercise():
    state.feedback = "Paused"
    return {"message": "Stopped counting"}

@app.post("/reset")
def reset_exercise():
    state.reset()
    return {"message": "Reset counters", "reps_total": state.reps['total'], "reps_left": state.reps['left'], "reps_right": state.reps['right']}

@app.get("/get_reps")
def get_reps():
    return {"reps_total": state.reps['total'], "reps_left": state.reps['left'], "reps_right": state.reps['right'], "exercise": state.exercise, "feedback": state.feedback}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            if not data.startswith("data:image"):
                continue
                
            try:
                header, encoded = data.split(",", 1)
                image_bytes = base64.b64decode(encoded)
                image_array = np.frombuffer(image_bytes, dtype=np.uint8)
                image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
                
                if image is not None:
                    # MediaPipe expects RGB
                    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                    result = process_frame(image_rgb)
                    await websocket.send_json(result)
                else:
                    await websocket.send_json({"error": "Invalid frame"})
            except Exception as frame_err:
                print(f"Frame processing error: {frame_err}")
                await websocket.send_json({"error": "Frame processing error"})
                
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

