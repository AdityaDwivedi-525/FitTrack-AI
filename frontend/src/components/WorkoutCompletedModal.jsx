import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Save, X, History, Dumbbell, Flame, Clock, Activity, Zap, ShieldCheck } from 'lucide-react';
import { createWorkoutSession } from '../services/api';

const WorkoutCompletedModal = ({
  showModal,
  setShowModal,
  workoutData,
  onSaveSuccess
}) => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!showModal || !workoutData) return null;

  // Format duration as mm:ss
  const totalSecs = Math.max(0, Math.round(workoutData.durationSecs || 0));
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const formattedDuration = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const handleSave = async () => {
    if (saveSuccess || isSaving) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
        exerciseName: workoutData.exerciseName || 'Left Bicep Curl',
        exerciseType: (workoutData.exerciseName || 'bicep_curl').toLowerCase().replace(/\s+/g, '_'),
        reps: parseInt(workoutData.reps) || 0,
        duration: workoutData.durationSecs > 0 ? parseFloat(workoutData.durationSecs.toFixed(2)) : 1.0,
        caloriesBurned: parseFloat(workoutData.caloriesBurned) || 0.0,
        bodyWeight: parseFloat(workoutData.bodyWeight) || 70.0,
        age: parseInt(workoutData.age) || 25,
        gender: workoutData.gender || 'Male',
        averageJointAngle: parseFloat(workoutData.averageJointAngle) || 0.0,
        mlModel: workoutData.mlModel || 'Random Forest',
        completedAt: new Date().toISOString()
      };

      const res = await createWorkoutSession(payload);
      if (res.success) {
        setSaveSuccess(true);
        if (onSaveSuccess) onSaveSuccess(res.workout);
      } else {
        setErrorMsg('Failed to save workout session.');
      }
    } catch (err) {
      console.error('Save workout error:', err);
      const serverErr = err.response?.data?.detail || 'Error saving workout session.';
      setErrorMsg(serverErr);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSaveSuccess(false);
    setErrorMsg(null);
    setShowModal(false);
  };

  const handleGoToHistory = () => {
    handleClose();
    navigate('/history');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 md:p-8 border border-gray-700/60 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Modal Title Banner */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-wider uppercase">
                WORKOUT COMPLETED
              </h2>
              <p className="text-xs text-gray-400">Review session statistics & confirm save</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-green-950/60 border border-green-500/50 flex items-center space-x-3 text-green-300 text-sm animate-in fade-in">
            <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
            <span className="font-semibold text-green-300">Workout saved successfully.</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-sm">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Workout Completion Metrics Summary */}
        <div className="bg-gray-900/80 rounded-2xl p-5 border border-gray-800 space-y-4">
          
          {/* Exercise */}
          <div className="flex justify-between items-center border-b border-gray-800/80 pb-2.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-blue-400" /> Exercise:
            </span>
            <span className="text-sm font-bold text-white">{workoutData.exerciseName}</span>
          </div>

          {/* Total Reps */}
          <div className="flex justify-between items-center border-b border-gray-800/80 pb-2.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Total Reps:
            </span>
            <span className="text-xl font-mono font-bold text-white">{workoutData.reps}</span>
          </div>

          {/* Duration */}
          <div className="flex justify-between items-center border-b border-gray-800/80 pb-2.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Duration:
            </span>
            <span className="text-base font-mono font-bold text-white">{formattedDuration}</span>
          </div>

          {/* Estimated Calories */}
          <div className="flex justify-between items-center border-b border-gray-800/80 pb-2.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" /> Estimated Calories:
            </span>
            <span className="text-lg font-mono font-bold text-orange-400">{workoutData.caloriesBurned} kcal</span>
          </div>

          {/* Average Joint Angle */}
          <div className="flex justify-between items-center border-b border-gray-800/80 pb-2.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" /> Average Joint Angle:
            </span>
            <span className="text-base font-mono font-bold text-white">{workoutData.averageJointAngle}°</span>
          </div>

          {/* ML Model */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> ML Model:
            </span>
            <span className="text-sm font-semibold text-gray-200">{workoutData.mlModel}</span>
          </div>

        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          {!saveSuccess ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 text-sm uppercase tracking-wider disabled:opacity-50"
              >
                {isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Workout</span>
                  </>
                )}
              </button>
              <button
                onClick={handleClose}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3.5 px-5 rounded-xl transition-all border border-gray-700 text-sm uppercase tracking-wider"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleGoToHistory}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 text-sm uppercase tracking-wider"
            >
              <History className="w-4 h-4" />
              <span>View History</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default WorkoutCompletedModal;
