import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Scale, Ruler, ShieldCheck, LogOut, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileView = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const weightKg = parseFloat(user?.weight || 0);
  const heightM = parseFloat(user?.height || 0) / 100;
  const bmi = (weightKg > 0 && heightM > 0) ? (weightKg / (heightM * heightM)).toFixed(1) : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-950">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 border border-blue-400/30 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-extrabold text-2xl">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{user?.name || 'User Profile'}</h1>
            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>{user?.email}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md text-xs uppercase tracking-wider cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* User Attributes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Age */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Age</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{user?.age || '--'} <span className="text-xs font-normal text-gray-400">years</span></p>
        </div>

        {/* Gender */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Gender</span>
            <User className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">{user?.gender || '--'}</p>
        </div>

        {/* Weight */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Weight</span>
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{user?.weight || '--'} <span className="text-xs font-normal text-gray-400">kg</span></p>
        </div>

        {/* Height */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Height</span>
            <Ruler className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{user?.height || '--'} <span className="text-xs font-normal text-gray-400">cm</span></p>
        </div>

      </div>

      {/* Account Info Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Fitness Metrics */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-white font-bold text-sm tracking-wide">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>Body Mass Index (BMI)</span>
          </div>
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-semibold">Calculated BMI Score</p>
              <p className="text-3xl font-mono font-bold text-white mt-1">{bmi || 'N/A'}</p>
            </div>
            {bmi && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                bmi < 18.5 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                bmi < 25 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal Weight' : 'Overweight'}
              </span>
            )}
          </div>
        </div>

        {/* Security & Status */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-white font-bold text-sm tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Security & Session</span>
          </div>
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center text-gray-300">
              <span>Authentication Status:</span>
              <span className="text-emerald-400 font-semibold">Active JWT Token</span>
            </div>
            <div className="flex justify-between items-center text-gray-300">
              <span>User ID:</span>
              <span className="font-mono text-gray-400 text-[11px] truncate max-w-[160px]">{user?.id || user?._id || 'N/A'}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ProfileView;
