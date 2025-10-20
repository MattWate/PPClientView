// src/App.jsx
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Auth & client (adjust import paths if your project uses different file locations)
import { useAuth } from './contexts/AuthContext.jsx';
import { supabase } from './services/supabaseClient.js';

// Pages (matching your pages/ folder). Adjust if your filenames are different.
import PublicHomePage from './pages/PublicHomePage.jsx';
import PublicScanPage from './pages/PublicScanPage.jsx';
import Login from './pages/Login.jsx';
import ScanHandlerPage from './pages/ScanHandlerPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SupervisorDashboard from './pages/SupervisorDashboard.jsx';
import CleanerAreaView from './pages/CleanerAreaView.jsx';
import SupervisorAreaView from './pages/SupervisorAreaView.jsx';
import SiteReportPage from './pages/SiteReportPage.jsx';
import Assignments from './pages/Assignments.jsx';
import CleanerTasksPage from './pages/CleanerTasksPage.jsx';
import Sites from './pages/Sites.jsx';
import Staff from './pages/Staff.jsx';
import Tasks from './pages/Tasks.jsx';

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

// Pick main dashboard component by role
function MainDashboard() {
  const { profile } = useAuth();

  if (!profile) {
    return <ProfileNotFound onSignOut={() => supabase.auth.signOut()} />;
  }

  switch (String(profile.role).toLowerCase()) {
    case 'admin':
    case 'administrator':
      return <Dashboard />;

    case 'supervisor':
      return <SupervisorDashboard />;

    case 'cleaner':
      return <CleanerAreaView />;

    default:
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
        <Route path="/scan/:areaId" element={<ScanHandlerPage />} />

        {/* Authenticated app routes grouped under /app */}
        <Route
          path="/app/*"
          element={
            <RequireAuth>
              <Routes>
                {/* /#/app -> main dashboard */}
                <Route index element={<MainDashboard />} />

                {/* Admin / global pages */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="sites" element={<Sites />} />
                <Route path="staff" element={<Staff />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="cleaner/tasks" element={<CleanerTasksPage />} />

                {/* Area & role specific */}
                <Route path="scan/:areaId" element={<ScanHandlerPage />} />
                <Route path="cleaner-view/:areaId" element={<CleanerAreaView />} />
                <Route path="supervisor-view/:areaId" element={<SupervisorAreaView />} />

                {/* Reports */}
                <Route path="report/site" element={<SiteReportPage />} />

                {/* Unknown under /app -> go to dashboard */}
                <Route path="*" element={<Navigate to="/app" replace />} />
              </Routes>
            </RequireAuth>
          }
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
