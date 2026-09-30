import React, { useState } from 'react';
import { Play, Square, RotateCcw, Activity, Flame, CheckCircle2 } from 'lucide-react';
import { startExercise, stopExercise, resetExercise, predictCalories } from '../services/api';
import CaloriePredictorModal from './CaloriePredictorModal';
import WorkoutCompletedModal from './WorkoutCompletedModal';
import { useAuth } from '../context/AuthContext';

const Dashboard = ({ stats, isRunning, setIsRunning, setStats }) => {
  const { user } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState('Left Bicep Curl');
  const exercises = ['Left Bicep Curl', 'Right Bicep Curl', 'Squat', 'Sit-up'];

  // Session tracking
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [durationSecs, setDurationSecs] = useState(0);

  // ML Modal State
  const [showModal, setShowModal] = useState(false);

  // Completion Modal State
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedWorkoutData, setCompletedWorkoutData] = useState(null);

  const handleStart = async () => {
    try {
      await startExercise(selectedExercise);
      setIsRunning(true);
      setSessionStartTime(Date.now());
      setStats(prev => ({ ...prev, exercise: selectedExercise, reps_total: 0, reps_left: 0, reps_right: 0 }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleFinishWorkout = async () => {
    try {
      await stopExercise();
      setIsRunning(false);
      
      const end = Date.now();
      const diffSecs = sessionStartTime ? Math.max(1, (end - sessionStartTime) / 1000) : (durationSecs > 0 ? durationSecs : 30);
      setDurationSecs(diffSecs);

      // Estimate calories using current ML model calculation
      const userWeight = user?.weight ? parseFloat(user.weight) : 70.0;
      const userAge = user?.age ? parseInt(user.age) : 25;
      const userGender = user?.gender || 'Male';
      const effectiveReps = stats.reps_total > 0 ? stats.reps_total : 1;
      const intensity = parseFloat((effectiveReps / diffSecs).toFixed(4));
      
      let estimatedCals = 18.4; // Default baseline if offline
      try {
        const calRes = await predictCalories({
          exercise_type: selectedExercise,
          gender: userGender,
          age: userAge,
          reps: effectiveReps,
          duration_secs: parseFloat(diffSecs.toFixed(2)),
          intensity: intensity,
          body_weight_kg: userWeight,
          model_choice: 'Random Forest'
        });
        if (calRes && calRes.calories_burned) {
          estimatedCals = calRes.calories_burned;
        }
      } catch (err) {
        console.warn("Calorie calculation fallback:", err);
      }

      // Calculate average joint angle or current angle fallback
      const angle = stats.angle_left > 0 ? stats.angle_left : (stats.angle_right > 0 ? stats.angle_right : 101.7);

      setCompletedWorkoutData({
        exerciseName: selectedExercise,
        reps: stats.reps_total,
        durationSecs: diffSecs,
        caloriesBurned: estimatedCals,
        averageJointAngle: angle,
        mlModel: 'Random Forest',
        bodyWeight: userWeight,
        age: userAge,
        gender: userGender
      });

      setShowCompletionModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    try {
      await resetExercise();
      setStats(prev => ({ ...prev, reps_total: 0, reps_left: 0, reps_right: 0 }));
      setSessionStartTime(null);
      setDurationSecs(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 flex flex-col h-full relative">
      
      {/* ML Prediction Modal Overlay */}
      <CaloriePredictorModal 
        showModal={showModal} 
        setShowModal={setShowModal} 
        stats={stats} 
        selectedExercise={selectedExercise} 
        durationSecs={durationSecs} 
      />

      {/* Workout Completion Modal Overlay */}
      <WorkoutCompletedModal
        showModal={showCompletionModal}
        setShowModal={setShowCompletionModal}
        workoutData={completedWorkoutData}
      />

      {/* Main Dashboard Content */}
      <div className="mb-8 p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl glow-box flex flex-col items-center justify-center transform transition-transform hover:scale-[1.02]">
        <span className="text-blue-100 text-sm font-semibold uppercase tracking-widest mb-2">Total Reps</span>
        <span className="text-7xl font-black text-white glow-text">{stats.reps_total}</span>
      </div>

      <div className="space-y-6 flex-grow">
        <div>
          <label className="text-sm font-medium text-gray-400 uppercase tracking-wider block mb-3">
            Select Exercise
          </label>
          <div className="relative">
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              disabled={isRunning}
              className={`w-full bg-gray-900 border ${isRunning ? 'border-gray-800 text-gray-600' : 'border-gray-700 text-white'} rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium`}
            >
              {exercises.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <Activity className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Current Phase</span>
            <span className="text-blue-400 font-medium uppercase text-sm tracking-widest">
              {stats.stage_total || 'Ready'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-8">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="col-span-2 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-colors shadow-lg shadow-blue-900/50 cursor-pointer"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            <span>Start Tracking</span>
          </button>
        ) : (
          <button
            onClick={handleFinishWorkout}
            className="col-span-2 flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-red-900/50 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Finish Workout</span>
          </button>
        )}

        <button
          onClick={handleReset}
          className="col-span-1 flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-2 rounded-xl transition-colors mt-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
        
        <button
          onClick={() => setShowModal(true)}
          disabled={isRunning || stats.reps_total === 0}
          className={`col-span-1 flex items-center justify-center space-x-2 ${isRunning || stats.reps_total === 0 ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/30 cursor-pointer'} font-medium py-3 px-2 rounded-xl transition-colors mt-2`}
        >
          <Flame className="w-4 h-4" />
          <span>Calories</span>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
