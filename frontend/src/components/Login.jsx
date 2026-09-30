import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.email.trim()) return setError('Please enter your email address');
    if (!formData.password) return setError('Please enter your password');

    setLoading(true);

    try {
      const res = await loginUser({
        email: formData.email.trim(),
        password: formData.password
      });

      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        navigate('/dashboard');
      } else {
        setError(res.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login failed:', err);
      const serverError = err.response?.data?.detail || 'Invalid email or password';
      setError(serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md py-6">
      {/* Card */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
            <LogIn className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-gray-400 text-xs mt-1">Sign in to access your fitness dashboard</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center gap-3 text-red-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
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

          {/* Password Field */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-11 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 font-medium text-xs transition-all"
              />
              <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-400">
                Don't have an account yet?{' '}
                <Link
                  to="/register"
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors underline"
                >
                  Go to Register
                </Link>
              </p>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Login;
