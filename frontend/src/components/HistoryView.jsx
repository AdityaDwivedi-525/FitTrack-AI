import React, { useState, useEffect } from 'react';
import { History, Clock, Calendar, Dumbbell, Flame, Activity, RefreshCw } from 'lucide-react';
import { getUserWorkouts } from '../services/api';

const HistoryView = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUserWorkouts();
      if (res.success && Array.isArray(res.workouts)) {
        setWorkouts(res.workouts);
      }
    } catch (err) {
      console.error("Failed to load workout history:", err);
      setError("Could not load workout history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDuration = (secs) => {
    const totalSecs = Math.max(0, Math.round(secs || 0));
    const mins = Math.floor(totalSecs / 60);
    const remainingSecs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const totalWorkouts = workouts.length;
  const totalReps = workouts.reduce((sum, w) => sum + (w.reps || 0), 0);
  const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
            <History className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Workout History</h1>
            <p className="text-xs text-gray-400">View past workout sessions, repetition records & calorie burn metrics</p>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-gray-300 font-semibold py-2 px-3.5 rounded-xl border border-slate-800 text-xs uppercase tracking-wider cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Aggregate Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Sessions</p>
            <p className="text-2xl font-bold text-white">{totalWorkouts}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Reps Completed</p>
            <p className="text-2xl font-bold text-white font-mono">{totalReps}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Calories Burned</p>
            <p className="text-2xl font-bold text-orange-400 font-mono">{totalCalories} <span className="text-xs text-gray-400 font-normal">kcal</span></p>
          </div>
        </div>
      </div>

      {/* Workouts History List */}
      {loading ? (
        <div className="glass-panel p-12 rounded-3xl text-center border border-slate-800">
          <div className="flex justify-center items-center space-x-3 text-gray-400 text-xs">
            <svg className="animate-spin h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading workout history...</span>
          </div>
        </div>
      ) : workouts.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center border border-slate-800 space-y-4 max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No Workouts Saved Yet</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Start a live workout session in the Workout Tracker, press Finish Workout, and save your results to see them here!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workouts.map((w) => (
            <div
              key={w.id}
              className="glass-panel p-5 rounded-3xl border border-slate-800 hover:border-purple-500/40 transition-all duration-200 space-y-4"
            >
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-purple-400" />
                    {w.exerciseName}
                  </h3>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    {formatDate(w.completedAt)}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-semibold uppercase tracking-wider">
                  {w.mlModel || 'Random Forest'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Total Reps</span>
                  <span className="text-lg font-bold text-white font-mono">{w.reps}</span>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Duration</span>
                  <span className="text-base font-bold text-white font-mono">{formatDuration(w.duration)}</span>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Calories</span>
                  <span className="text-base font-bold text-orange-400 font-mono">{w.caloriesBurned} kcal</span>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Joint Angle</span>
                  <span className="text-base font-bold text-white font-mono">{w.averageJointAngle}°</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default HistoryView;
