import cv2
import base64
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
from app_state import state
import os

POSE_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 7), (0, 4), (4, 5), (5, 6), (6, 8),
    (9, 10), (11, 12), (11, 13), (13, 15), (15, 17), (15, 19), (15, 21),
    (17, 19), (12, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20),
    (11, 23), (12, 24), (23, 24), (23, 25), (24, 26), (25, 27), (26, 28),
    (27, 29), (28, 30), (29, 31), (30, 32), (27, 31), (28, 32)
]

model_path = os.path.join(os.path.dirname(__file__), 'pose_landmarker_full.task')

if os.path.exists(model_path):
    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        output_segmentation_masks=False)
    detector = vision.PoseLandmarker.create_from_options(options)
else:
    detector = None

LM = {
    'LEFT_SHOULDER': 11, 'RIGHT_SHOULDER': 12,
    'LEFT_ELBOW': 13,    'RIGHT_ELBOW': 14,
    'LEFT_WRIST': 15,    'RIGHT_WRIST': 16,
    'LEFT_HIP': 23,      'RIGHT_HIP': 24,
    'LEFT_KNEE': 25,     'RIGHT_KNEE': 26,
    'LEFT_ANKLE': 27,    'RIGHT_ANKLE': 28
}

def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)
    if angle > 180.0:
        angle = 360-angle
    return angle

def process_frame(image_np):
    if not detector:
        return {"error": "Pose detector model not loaded."}
        
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_np)
    results = detector.detect(mp_image)
    
    annotated_image = np.copy(image_np)
    
    # Draw Skeleton if landmarks detected
    if results.pose_landmarks:
        h, w, _ = annotated_image.shape
        for pose_landmarks in results.pose_landmarks:
            # Map valid landmarks safely based on visibility threshold (0.5)
            points = {}
            for idx, lm in enumerate(pose_landmarks):
                if lm.visibility > 0.5:
                    points[idx] = (int(lm.x * w), int(lm.y * h))
            
            # Draw Connections
            for start_idx, end_idx in POSE_CONNECTIONS:
                if start_idx in points and end_idx in points:
                    cv2.line(annotated_image, points[start_idx], points[end_idx], (244, 244, 244), 3)

            # Draw Node Circles
            for pt in points.values():
                cv2.circle(annotated_image, pt, 5, (0, 255, 0), -1)

    angle_left = 0
    angle_right = 0
    feedback = "No person detected"
    
    if results.pose_landmarks and len(results.pose_landmarks) > 0:
        landmarks = results.pose_landmarks[0]
        
        try:
            def get_point(name):
                return [landmarks[LM[name]].x, landmarks[LM[name]].y]

            def eval_side(side_prefix, current_stg):
                if state.exercise in ["Left Bicep Curl", "Right Bicep Curl"]:
                    nodes = ["SHOULDER", "ELBOW", "WRIST"]
                elif state.exercise == "Squat":
                    nodes = ["HIP", "KNEE", "ANKLE"]
                else: # Sit-up
                    nodes = ["SHOULDER", "HIP", "KNEE"]
                    
                p1 = get_point(f"{side_prefix}_{nodes[0]}")
                p2 = get_point(f"{side_prefix}_{nodes[1]}")
                p3 = get_point(f"{side_prefix}_{nodes[2]}")

                # Ensure ALL THREE critical joints are visible to prevent hallucinatory auto-counting
                vis1 = landmarks[LM[f"{side_prefix}_{nodes[0]}"]].visibility
                vis2 = landmarks[LM[f"{side_prefix}_{nodes[1]}"]].visibility
                vis3 = landmarks[LM[f"{side_prefix}_{nodes[2]}"]].visibility
                vis = min(vis1, vis2, vis3)
                
                angle = calculate_angle(p1, p2, p3)
                
                if vis < 0.65:
                    return angle, current_stg, 0, "Adjust camera: Keep whole body in frame"

                current_stage = current_stg
                rep_increment = 0
                msg = ""

                if state.exercise in ["Left Bicep Curl", "Right Bicep Curl"]:
                    if angle > 150 and current_stage == 'up':
                        current_stage = "down"
                        rep_increment = 1
                        msg = "Rep completed! Curl up"
                    elif angle > 150:
                        current_stage = "down"
                        msg = "Good, now curl up"
                    elif angle < 60 and current_stage == 'down':
                        current_stage = "up"
                        msg = "Good curl! Now lower"
                
                elif state.exercise == "Squat":
                    if angle > 150 and current_stage == 'down':
                        current_stage = "up"
                        rep_increment = 1
                        msg = "Rep completed! Squat down"
                    elif angle > 150:
                        current_stage = "up"
                        msg = "Squat down"
                    elif angle < 100 and current_stage == 'up':
                        current_stage = "down"
                        msg = "Good squat! Now stand up"

                elif state.exercise == "Sit-up":
                    if angle > 140 and current_stage == 'up':
                        current_stage = "down"
                        rep_increment = 1
                        msg = "Rep completed! Sit up"
                    elif angle > 140:
                        current_stage = "down"
                        msg = "Sit up"
                    elif angle < 75 and current_stage == 'down':
                        current_stage = "up"
                        msg = "Good crunch! Go back down"
                
                return angle, current_stage, rep_increment, msg

            if state.exercise == "Left Bicep Curl":
                angle_t, new_stage_t, rep_t, msg_t = eval_side("LEFT", state.stage['left'])
                if rep_t: state.reps['total'] += rep_t
                state.stage['left'] = new_stage_t  # use 'left' stage variable logically
                state.stage['total'] = new_stage_t # copy to total for UX consistency
                feedback = f"Left Focus: {msg_t}" if msg_t else "Tracking Left Arm..."
                angle_left = angle_t
                angle_right = angle_t
            elif state.exercise == "Right Bicep Curl":
                angle_t, new_stage_t, rep_t, msg_t = eval_side("RIGHT", state.stage['right'])
                if rep_t: state.reps['total'] += rep_t
                state.stage['right'] = new_stage_t # use 'right' stage variable logically
                state.stage['total'] = new_stage_t # copy to total for UX consistency
                feedback = f"Right Focus: {msg_t}" if msg_t else "Tracking Right Arm..."
                angle_left = angle_t
                angle_right = angle_t
            else:
                l_vis = landmarks[LM['LEFT_HIP']].visibility
                r_vis = landmarks[LM['RIGHT_HIP']].visibility
                side_str = 'LEFT' if l_vis > r_vis else 'RIGHT'
                
                angle_t, new_stage_t, rep_t, msg_t = eval_side(side_str, state.stage['total'])
                if rep_t: state.reps['total'] += rep_t
                state.stage['total'] = new_stage_t
                feedback = msg_t if msg_t else "Tracking..."
                
                angle_left = angle_t
                angle_right = angle_t
                
        except Exception as e:
            print(f"Pose calculation error: {e}")
            feedback = "Calculating..."
            pass
            
    else:
        feedback = "Position yourself in frame"
        
    state.feedback = feedback
    
    # Encode annotated image to base64
    _, buffer = cv2.imencode('.jpg', cv2.cvtColor(annotated_image, cv2.COLOR_RGB2BGR))
    b64_img = base64.b64encode(buffer).decode('utf-8')
    encoded_image = f"data:image/jpeg;base64,{b64_img}"
    
    return {
        "image": encoded_image,
        "reps_total": state.reps['total'],
        "reps_left": state.reps['left'],
        "reps_right": state.reps['right'],
        "stage_total": state.stage['total'],
        "stage_left": state.stage['left'],
        "stage_right": state.stage['right'],
        "feedback": feedback,
        "angle_left": round(angle_left, 2),
        "angle_right": round(angle_right, 2),
        "exercise": state.exercise
    }
