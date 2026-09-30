import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, 
  LayoutDashboard, 
  Dumbbell, 
  History, 
  BarChart3, 
  User, 
  LogOut, 
  LogIn, 
  UserPlus, 
  ChevronDown, 
  Menu, 
  X 
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Workout', path: '/workout', icon: Dumbbell },
    { name: 'History', path: '/history', icon: History },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link 
            to={isAuthenticated ? "/dashboard" : "/login"} 
            className="flex items-center space-x-3 group cursor-pointer"
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform duration-200">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">
                Fit-Track AI
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/60">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          )}

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl text-xs text-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center font-bold text-[11px] text-blue-400">
                    {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <span className="font-semibold max-w-[120px] truncate">
                    {user?.name || user?.email || 'User'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2.5 border-b border-slate-800">
                      <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                      >
                        <User className="w-4 h-4 mr-2.5 text-blue-400" />
                        Profile
                      </Link>
                    </div>

                    <div className="border-t border-slate-800 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 mr-2.5 text-red-400" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-gray-200 font-semibold py-2 px-4 rounded-xl transition-all border border-slate-800 text-xs uppercase tracking-wider"
                >
                  <LogIn className="w-4 h-4 text-blue-400" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-md text-xs uppercase tracking-wider"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2 animate-in slide-in-from-top-2">
          {isAuthenticated ? (
            <>
              <div className="px-3 py-2 border-b border-slate-800 mb-2">
                <p className="text-sm font-semibold text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-gray-300 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/30 transition-all text-left mt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col space-y-2 pt-2">
              <Link
                to="/login"
                className="flex items-center justify-center space-x-2 bg-slate-900 text-gray-200 py-2.5 rounded-xl border border-slate-800 font-semibold text-sm"
              >
                <LogIn className="w-4 h-4 text-blue-400" />
                <span>Login</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2.5 rounded-xl font-semibold text-sm shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
