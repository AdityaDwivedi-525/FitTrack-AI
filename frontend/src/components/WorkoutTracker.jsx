import React, { useState } from 'react';
import WebcamStream from './WebcamStream';
import Dashboard from './Dashboard';
import { Dumbbell, Activity } from 'lucide-react';

const WorkoutTracker = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState({
    image: null,
    reps_total: 0,
    reps_left: 0,
    reps_right: 0,
    stage_total: 'Ready',
    stage_left: 'Ready',
    stage_right: 'Ready',
    feedback: 'Select an exercise and press Start',
    angle_left: 0,
    angle_right: 0,
    exercise: 'Left Bicep Curl'
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Sub-header Banner */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 leading-tight">
              AI Workout Pose Tracker
            </h1>
            <p className="text-gray-400 text-xs leading-snug">
              Real-Time Pose Estimation, Joint Angle Calculation & Calorie Burn Prediction
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-gray-300">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>System Status: <span className="text-emerald-400">Ready</span></span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Video Feed Area */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          <WebcamStream isRunning={isRunning} setStats={setStats} stats={stats} />
          
          {/* Actionable Feedback Banner */}
          <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-gray-400 text-[11px] uppercase tracking-wider mb-1 font-semibold">AI Coach Feedback</h3>
              <p className={`text-lg font-bold ${
                stats.feedback.includes("Good") ? "text-emerald-400" :
                stats.feedback.includes("Error") ? "text-red-400" : "text-blue-300"
              }`}>
                {stats.feedback}
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-gray-400 text-[11px] uppercase tracking-wider mb-1 font-semibold">Joint Angle</h3>
              <p className="text-2xl font-mono text-white font-extrabold">{stats.angle_left}°</p>
            </div>
          </div>
        </div>

        {/* Sidebar Dashboard */}
        <div className="lg:col-span-1">
          <Dashboard 
            stats={stats} 
            isRunning={isRunning} 
            setIsRunning={setIsRunning} 
            setStats={setStats}
          />
        </div>
        
      </div>
    </div>
  );
};

export default WorkoutTracker;
