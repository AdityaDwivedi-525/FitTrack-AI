import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Dumbbell, 
  Activity, 
  Flame, 
  Clock, 
  TrendingUp, 
  RefreshCw, 
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { getWorkoutStats, getWorkoutAnalytics } from '../services/api';

const COLORS = ['#3B82F6', '#06B6D4', '#A855F7', '#F97316', '#10B981', '#EC4899'];

const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl shadow-xl text-xs space-y-1">
        <p className="font-semibold text-gray-300">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="font-bold" style={{ color: entry.color || '#38BDF8' }}>
            {entry.name}: {entry.value} {unit}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ReportsView = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        getWorkoutStats(),
        getWorkoutAnalytics()
      ]);

      if (statsRes.success && analyticsRes.success) {
        setStats(statsRes);
        setAnalytics(analyticsRes);
      } else {
        setError("Failed to load fitness analytics data.");
      }
    } catch (err) {
      console.error("Reports data fetch error:", err);
      setError("Error connecting to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatTotalTime = (totalSecs) => {
    if (!totalSecs || totalSecs <= 0) return '0m 0s';
    const total = Math.round(totalSecs);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const hasData = stats && stats.totalWorkouts > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white tracking-wide">Fitness Analytics</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-semibold uppercase tracking-wider">
                Live Data
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Comprehensive insights calculated from your recorded workout sessions</p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-gray-300 font-semibold py-2 px-3.5 rounded-xl border border-slate-800 text-xs uppercase tracking-wider cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-panel p-4 rounded-2xl border border-slate-800 animate-pulse space-y-2">
                <div className="h-3 w-16 bg-slate-800 rounded"></div>
                <div className="h-7 w-20 bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-panel p-6 rounded-3xl border border-slate-800 h-80 animate-pulse flex flex-col justify-between">
                <div className="h-5 w-40 bg-slate-800 rounded"></div>
                <div className="h-48 w-full bg-slate-800/40 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="glass-panel p-8 rounded-3xl border border-red-500/40 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-red-300">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !hasData && (
        <div className="glass-panel p-12 md:p-16 rounded-3xl border border-slate-800 text-center space-y-6 max-w-2xl mx-auto my-8">
          <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400 glow-box">
            <TrendingUp className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">No workout data available yet.</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
              Complete workouts to generate your fitness reports and unlock comprehensive analytics charts.
            </p>
          </div>

          <Link
            to="/workout"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-blue-600/20 text-xs uppercase tracking-wider group"
          >
            <Dumbbell className="w-4 h-4" />
            <span>Start Your First Workout</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}

      {/* Main Analytics Content */}
      {!loading && !error && hasData && (
        <>
          {/* Stat Cards Grid (6 Stat Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* Stat 1: Total Workouts */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Workouts</span>
                <Dumbbell className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-2 font-mono">{stats.totalWorkouts}</p>
            </div>

            {/* Stat 2: Total Reps */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Reps</span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-2 font-mono">{stats.totalReps}</p>
            </div>

            {/* Stat 3: Calories Burned */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Calories Burned</span>
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-orange-400 mt-2 font-mono">
                {stats.totalCalories} <span className="text-xs text-gray-400 font-normal">kcal</span>
              </p>
            </div>

            {/* Stat 4: Average Calories / Workout */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Cal / Session</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-2 font-mono">
                {stats.averageCalories} <span className="text-xs text-gray-400 font-normal">kcal</span>
              </p>
            </div>

            {/* Stat 5: Average Reps / Workout */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Reps / Session</span>
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-2 font-mono">{stats.averageReps}</p>
            </div>

            {/* Stat 6: Total Workout Time */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-center text-gray-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Time</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-2 font-mono">{formatTotalTime(stats.totalDuration)}</p>
            </div>

          </div>

          {/* Charts Section: 2-column Desktop, 1-column Mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Chart 1: Calories Burned Over Time */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" /> 1. Calories Burned Over Time
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">Line Chart</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.caloriesOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <Tooltip content={<CustomTooltip unit="kcal" />} />
                    <Line type="monotone" dataKey="calories" name="Calories" stroke="#F97316" strokeWidth={3} dot={{ r: 4, fill: '#F97316' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Reps Progress */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" /> 2. Reps Progress
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">Line Chart</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.repsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <Tooltip content={<CustomTooltip unit="reps" />} />
                    <Line type="monotone" dataKey="reps" name="Reps" stroke="#38BDF8" strokeWidth={3} dot={{ r: 4, fill: '#38BDF8' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Workout Frequency */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" /> 3. Workout Frequency
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">Bar Chart</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.workoutFrequency} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={11} allowDecimals={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip unit="sessions" />} />
                    <Bar dataKey="count" name="Sessions" fill="#A855F7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Exercise Distribution */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> 4. Exercise Distribution
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">Donut Chart</span>
              </div>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.exerciseDistribution}
                      dataKey="count"
                      nameKey="exercise"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {analytics.exerciseDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip unit="sessions" />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5: Calories by Exercise */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-cyan-400" /> 5. Calories by Exercise
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">Bar Chart</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.caloriesByExercise} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="exercise" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <Tooltip content={<CustomTooltip unit="kcal" />} />
                    <Bar dataKey="calories" name="Calories Burned" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6: Workout Duration */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" /> 6. Workout Duration (Secs)
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">Line Chart</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.workoutDuration.overTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <Tooltip content={<CustomTooltip unit="secs" />} />
                    <Line type="monotone" dataKey="duration" name="Duration" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};

export default ReportsView;
