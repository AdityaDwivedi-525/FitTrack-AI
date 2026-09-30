class AppState:
    def __init__(self):
        self.exercise = "Left Bicep Curl"
        self.reps = {'total': 0, 'left': 0, 'right': 0}
        self.stage = {'total': None, 'left': None, 'right': None}
        self.feedback = "Ready"

    def reset(self):
        self.reps = {'total': 0, 'left': 0, 'right': 0}
        self.stage = {'total': None, 'left': None, 'right': None}
        self.feedback = "Ready"

    def set_exercise(self, exercise):
        self.exercise = exercise
        self.reset()

state = AppState()
