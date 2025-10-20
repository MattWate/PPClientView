// src/App.jsx
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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
import ScanHandlerPage from './pages/ScanHandlerPage.jsx';
import CleanerAreaView from './pages/CleanerAreaView.jsx';
import SupervisorAreaView from './pages/SupervisorAreaView.jsx';
import SiteReportPage from './pages/SiteReportPage.jsx';

// (The pages loaded by AdminLayout, like Dashboard, Sites, Staff,
// are imported by AdminLayout itself, so they are not needed here)

// Small UI helpers
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <p className="text-gray-600">Loading...</p>
  </div>
);

const ProfileNotFound = ({ onSignOut }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4 text-center">
    <h2 className="text-2xl font-bold text-red-600 mb-2">Profile Not Found</h2>
    <p className="text-gray-700 mb-4">
      Your user profile could not be loaded. Please sign out and try again.
    </p>
    <button
      onClick={onSignOut}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
    >
      Sign Out
    </button>
  </div>
);

// Protect routes: if not authenticated, go to /login
function RequireAuth({ children }) {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

// --- NEW COMPONENT ---
// This component selects the correct *layout* for the user.
// The layouts themselves handle all nested pages (Dashboard, Sites, Staff, etc).
function AppLayout() {
  const { session, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!profile) {
    return <ProfileNotFound onSignOut={() => supabase.auth.signOut()} />;
  }

  // Pass session and profile to the layouts
  switch (String(profile.role).toLowerCase()) {
    case 'admin':
    case 'administrator':
      return <AdminLayout session={session} profile={profile} />;

    case 'supervisor':
      return <SupervisorLayout session={session} profile={profile} />;

    case 'cleaner':
      return <CleanerLayout session={session} profile={profile} />;

    default:
      // A user with an unknown role
      return <ProfileNotFound onSignOut={() => supabase.auth.signOut()} />;
  }
}

export default function App() {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/public-scan/:areaId" element={<PublicScanPage />} />

        {/* This is the QR code entry point. It's public but will
          redirect to a protected route if the user logs in.
        */}
        <Route path="/scan/:areaId" element={<ScanHandlerPage />} />

        {/* --- SIMPLIFIED APP ROUTE --- */}
        {/* Any URL starting with /app/* will be protected.
          It will render the <AppLayout /> component, which then
          selects the correct layout (Admin, Supervisor, Cleaner).
          Those layouts use the URL hash (e.g., #/app/sites) to show the correct page.
        */}
        <Route
          path="/app/*"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        />

        {/* --- Specific role-based routes for scanning --- */}
        <Route 
          path="/cleaner-view/:areaId" 
          element={<RequireAuth><CleanerAreaView /></RequireAuth>} 
        />
        <Route 
          path="/supervisor-view/:areaId" 
          element={<RequireAuth><SupervisorAreaView /></RequireAuth>} 
        />
        
        {/* --- Report route --- */}
        <Route 
          path="/report/site" 
          element={<RequireAuth><SiteReportPage /></RequireAuth>} 
        />

        {/* Fallback — if signed in, send to /app; otherwise home */}
        <Route
          path="*"
          element={session ? <Navigate to="/app" replace /> : <Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}
