// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth & client
import { useAuth } from './contexts/AuthContext.jsx';
import { supabase } from './services/supabaseClient.js';

// --- IMPORT THE LAYOUTS ---
import AdminLayout from './layouts/AdminLayout.jsx';
import SupervisorLayout from './layouts/SupervisorLayout.jsx';
import CleanerLayout from './layouts/CleanerLayout.jsx';

// --- IMPORT PUBLIC & ROLE-SPECIFIC PAGES ---
import PublicHomePage from './pages/PublicHomePage.jsx';
import PublicScanPage from './pages/PublicScanPage.jsx';
import Login from './pages/Login.jsx';
import PasswordReset from './pages/PasswordReset.jsx';
import UpdatePassword from './pages/UpdatePassword.jsx';
import ScanHandlerPage from './pages/ScanHandlerPage.jsx';
import CleanerAreaView from './pages/CleanerAreaView.jsx';
import SupervisorAreaView from './pages/SupervisorAreaView.jsx';
import SiteReportPage from './pages/SiteReportPage.jsx';
// FIXED: Changed import to match the actual filename 'StaffReport.jsx'
import StaffReportPage from './pages/StaffReport.jsx';

// Small UI helpers
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const ProfileNotFound = ({ onSignOut }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4 text-center">
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
      <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <i className="fas fa-user-slash text-red-600 text-2xl"></i>
      </div>
      <h2 className="text-2xl font-bold text-red-600 mb-2">Profile Not Found</h2>
      <p className="text-gray-700 mb-6">
        Your user profile could not be loaded. This may happen if your account setup is incomplete.
      </p>
      <button
        onClick={onSignOut}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Sign Out & Try Again
      </button>
    </div>
  </div>
);

// Protect routes: if not authenticated, go to /login
function RequireAuth({ children }) {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

// This component routes based on role
function AppLayout() {
  const { session, profile } = useAuth();

  // If no profile, show error
  if (!profile) {
    return <ProfileNotFound onSignOut={() => supabase.auth.signOut()} />;
  }

  // Route based on role
  const roleKey = String(profile.role || '').toLowerCase();
  
  switch (roleKey) {
    case 'admin':
    case 'super_admin':
      return <AdminLayout session={session} profile={profile} />;

    case 'supervisor':
      return <SupervisorLayout session={session} profile={profile} />;

    case 'cleaner':
      return <CleanerLayout session={session} profile={profile} />;

    default:
      return <ProfileNotFound onSignOut={() => supabase.auth.signOut()} />;
  }
}

export default function App() {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicHomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<PasswordReset />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="/public-home" element={<PublicHomePage />} />
      <Route path="/public-scan/:areaId" element={<PublicScanPage />} />
      <Route path="/scan/:areaId" element={<ScanHandlerPage />} />
      
      {/* Protected Routes */}
      <Route
        path="/app/*"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      />
      <Route 
        path="/cleaner-view/:areaId" 
        element={<RequireAuth><CleanerAreaView /></RequireAuth>} 
      />
      <Route 
        path="/supervisor-view/:areaId" 
        element={<RequireAuth><SupervisorAreaView /></RequireAuth>} 
      />
      
      {/* Report Routes - Protected */}
      <Route 
        path="/report/site" 
        element={<RequireAuth><SiteReportPage /></RequireAuth>} 
      />
      <Route 
        path="/report/staff" 
        element={<RequireAuth><StaffReportPage /></RequireAuth>} 
      />
      
      {/* Fallback redirect */}
      <Route
        path="*"
        element={session ? <Navigate to="/app" replace /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
