import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Dumbbell, 
  History, 
  BarChart3, 
  Flame, 
  Activity, 
  Clock, 
  ArrowRight,
  Sparkles,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { getWorkoutStats, getUserWorkouts, getWorkoutAnalytics } from '../services/api';

const DashboardView = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, workoutsRes, analyticsRes] = await Promise.all([
        getWorkoutStats(),
        getUserWorkouts(),
        getWorkoutAnalytics()
      ]);

      if (statsRes.success && workoutsRes.success && analyticsRes.success) {
        setStats(statsRes);
        setRecentWorkouts(workoutsRes.workouts.slice(0, 5));
        setAnalytics(analyticsRes);
      } else {
        setError("Failed to fetch dashboard data.");
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Error connecting to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatTime = (totalSecs) => {
    if (!totalSecs || totalSecs <= 0) return '0m 0s';
    const total = Math.round(totalSecs);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-950 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>AI Fitness Portal</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">{user?.name || 'Athlete'}</span>!
            </h1>
            <p className="text-gray-400 text-xs md:text-sm mt-2 max-w-2xl leading-relaxed">
              Track live pose estimation, count repetitions automatically, and manage your workout progress in real-time.
            </p>
          </div>

          {/* Action Buttons Header */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/workout"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 px-5 rounded-2xl transition-all shadow-lg shadow-blue-600/20 text-xs uppercase tracking-wider group cursor-pointer"
            >
              <Dumbbell className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>Start Workout</span>
            </Link>
            
            <Link
              to="/history"
              className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-gray-200 font-semibold py-3.5 px-5 rounded-2xl transition-all border border-slate-800 text-xs uppercase tracking-wider cursor-pointer"
            >
              <History className="w-4 h-4 text-purple-400" />
              <span>View History</span>
            </Link>

            <Link
              to="/reports"
              className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-gray-200 font-semibold py-3.5 px-5 rounded-2xl transition-all border border-slate-800 text-xs uppercase tracking-wider cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>View Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-panel p-5 rounded-2xl border border-slate-800 animate-pulse space-y-2">
                <div className="h-3 w-20 bg-slate-800 rounded"></div>
                <div className="h-8 w-24 bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="glass-panel p-6 rounded-3xl border border-red-500/40 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-red-300">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* 1. Total Workouts */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Dumbbell className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Workouts</p>
                <p className="text-2xl font-bold text-white font-mono mt-0.5">{stats?.totalWorkouts || 0}</p>
                <span className="text-[11px] text-blue-400 font-medium">Recorded Sessions</span>
              </div>
            </div>

            {/* 2. Total Reps */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Reps</p>
                <p className="text-2xl font-bold text-white font-mono mt-0.5">{stats?.totalReps || 0}</p>
                <span className="text-[11px] text-cyan-300 font-medium">Completed Reps</span>
              </div>
            </div>

            {/* 3. Total Calories */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Calories</p>
                <p className="text-2xl font-bold text-orange-400 font-mono mt-0.5">
                  {stats?.totalCalories || 0} <span className="text-xs text-gray-400 font-normal">kcal</span>
                </p>
                <span className="text-[11px] text-orange-300 font-medium">Estimated Burn</span>
              </div>
            </div>

            {/* 4. Total Workout Time */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Workout Time</p>
                <p className="text-2xl font-bold text-white font-mono mt-0.5">{formatTime(stats?.totalDuration)}</p>
                <span className="text-[11px] text-emerald-400 font-medium">Cumulative Time</span>
              </div>
            </div>

          </div>

          {/* Small Progress Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Calories Burned */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" /> Calories Burned Progress
                </h3>
                <span className="text-xs text-gray-400 font-mono">Live Record</span>
              </div>

              {analytics?.caloriesOverTime?.length > 0 ? (
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.caloriesOverTime} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="#6B7280" fontSize={10} tickLine={false} />
                      <YAxis stroke="#6B7280" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }} />
                      <Line type="monotone" dataKey="calories" stroke="#F97316" strokeWidth={2.5} dot={{ r: 3, fill: '#F97316' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-gray-500">
                  No calorie history logged yet. Complete a workout to see progress!
                </div>
              )}
            </div>

            {/* Weekly Workout Activity */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" /> Weekly Workout Activity
                </h3>
                <span className="text-xs text-gray-400 font-mono">Sessions / Day</span>
              </div>

              {analytics?.workoutFrequency?.length > 0 ? (
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.workoutFrequency} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="#6B7280" fontSize={10} tickLine={false} />
                      <YAxis stroke="#6B7280" fontSize={10} allowDecimals={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }} />
                      <Bar dataKey="count" fill="#A855F7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-gray-500">
                  No activity history logged yet. Complete a workout to see activity!
                </div>
              )}
            </div>

          </div>

          {/* Recent Workouts */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">Recent Workouts</h2>
                <p className="text-xs text-gray-400">Your latest 5 completed workout sessions</p>
              </div>
              <Link
                to="/history"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <span>View Full History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentWorkouts.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-xs">
                No recent workouts found. Click <span className="text-blue-400 font-semibold">Start Workout</span> to complete your first session!
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {recentWorkouts.map((w) => (
                  <div key={w.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/60 px-3 rounded-xl transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{w.exerciseName}</h4>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          {formatDate(w.completedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs font-mono">
                      <div className="text-right">
                        <span className="text-gray-400 text-[10px] uppercase block">Reps</span>
                        <span className="font-bold text-white">{w.reps}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 text-[10px] uppercase block">Duration</span>
                        <span className="font-bold text-white">{formatTime(w.duration)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 text-[10px] uppercase block">Calories</span>
                        <span className="font-bold text-orange-400">{w.caloriesBurned} kcal</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default DashboardView;
