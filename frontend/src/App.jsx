import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Layout from './components/Layout';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import WorkoutTracker from './components/WorkoutTracker';
import HistoryView from './components/HistoryView';
import ReportsView from './components/ReportsView';
import ProfileView from './components/ProfileView';
import { AuthProvider } from './context/AuthContext';

function AppRoutes() {
  return (
    <Routes>
      {/* Public / Unauthenticated Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-gray-100 flex flex-col">
              <Navbar />
              <div className="flex-1 flex items-center justify-center p-4">
                <Login />
              </div>
            </div>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-gray-100 flex flex-col">
              <Navbar />
              <div className="flex-1 flex items-center justify-center p-4">
                <Register />
              </div>
            </div>
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardView />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workout"
        element={
          <ProtectedRoute>
            <Layout>
              <WorkoutTracker />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <Layout>
              <HistoryView />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <ReportsView />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfileView />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
