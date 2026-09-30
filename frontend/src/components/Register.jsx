import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { registerUser } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: 'Male',
    weight: '',
    height: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg('');

    if (!formData.name.trim()) return setError('Please enter your full name');
    if (!formData.email.trim()) return setError('Please enter your email address');
    if (!formData.password) return setError('Please enter a password');
    if (formData.password.length < 6) return setError('Password must be at least 6 characters long');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    if (!formData.age || parseInt(formData.age) <= 0) return setError('Please enter a valid age');
    if (!formData.weight || parseFloat(formData.weight) <= 0) return setError('Please enter a valid weight');
    if (!formData.height || parseFloat(formData.height) <= 0) return setError('Please enter a valid height');

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        age: parseInt(formData.age),
        gender: formData.gender,
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height)
      };

      const res = await registerUser(payload);
      if (res.success) {
        setSuccessMsg('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      const serverError = err.response?.data?.detail || 'Registration failed. Please check your inputs.';
      setError(serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl py-6">
      {/* Card */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Your Account</h2>
          <p className="text-gray-400 text-xs mt-1">Start tracking your workouts & calorie predictions</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center gap-3 text-red-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-green-950/60 border border-green-500/40 flex items-center gap-3 text-green-300 text-xs animate-in fade-in">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 font-medium text-xs transition-all"
              />
              <User className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 font-medium text-xs transition-all"
              />
              <Mail className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 font-medium text-xs transition-all"
                />
                <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 font-medium text-xs transition-all"
                />
                <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
              </div>
            </div>
          </div>

          {/* Age & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="25"
                min="1"
                max="120"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 font-medium text-xs transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 font-medium text-xs transition-all cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Weight & Height */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                name="weight"
                step="0.1"
                value={formData.weight}
                onChange={handleChange}
                placeholder="70.5"
                min="1"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 font-medium text-xs transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                name="height"
                step="0.1"
                value={formData.height}
                onChange={handleChange}
                placeholder="175"
                min="1"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 font-medium text-xs transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 text-xs uppercase tracking-wider cursor-pointer"
          >
            {loading ? (
              <span>Registering...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Register Account</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center mt-6 pt-4 border-t border-slate-800">
          <p className="text-xs text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
