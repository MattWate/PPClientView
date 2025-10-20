// src/App.jsx
import React from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';

// Real project imports (adjust paths if your repo structure is different)
import { useAuth } from './contexts/AuthContext.jsx';
import { supabase } from './supabaseClient.js';

// Pages (based on your pages/ directory)
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

// Small UI helpers kept from your original file
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

// Route guard for authenticated routes
function RequireAuth({ children }) {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

// Role-based main dashboard selector
function MainDashboard() {
  const { profile } = useAuth();

  if (!profile) {
    return <ProfileNotFound onSignOut={() => supabase.auth.signOut()} />;
  }

  switch (profile.role) {
    case 'admin':
    case 'administrator':
      return <Dashboard />;

    case 'supervisor':
      return <SupervisorDashboard />;

    case 'cleaner':
      // Cleaner users probably need the area view or tasks
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
      {/* Note: keep tailwind build loaded in your index.html/main template — avoid injecting CDN here */}
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/public-scan/:areaId" element={<PublicScanPage />} />
        <Route path="/scan/:areaId" element={<ScanHandlerPage />} />

        {/* Authenticated / protected routes */}
        <Route
          path="/app/*"
          element={
            <RequireAuth>
              <Routes>
                <Route index element={<MainDashboard />} />

                {/* Generic admin pages */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="sites" element={<Sites />} />
                <Route path="staff" element={<Staff />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="cleaner/tasks" element={<CleanerTasksPage />} />

                {/* Role / area specific views */}
                <Route path="scan/:areaId" element={<ScanHandlerPage />} />
                <Route path="cleaner-view/:areaId" element={<CleanerAreaView />} />
                <Route path="supervisor-view/:areaId" element={<SupervisorAreaView />} />

                {/* Reports */}
                <Route path="report/site" element={<SiteReportPage />} />

                {/* Fallback to dashboard for unknown /app routes */}
                <Route path="*" element={<Navigate to="/app" replace />} />
              </Routes>
            </RequireAuth>
          }
        />

        {/* Catch-all: if authenticated send to app dashboard, otherwise home */}
        <Route
          path="*"
          element={session ? <Navigate to="/app" replace /> : <Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}
