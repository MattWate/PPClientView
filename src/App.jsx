import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Import Pages & Layouts
import PublicHomePage from './pages/PublicHomePage';
import AdminLayout from './layouts/AdminLayout';
import SupervisorLayout from './layouts/SupervisorLayout';
import CleanerLayout from './layouts/CleanerLayout';
import ScanHandlerPage from './pages/ScanHandlerPage';
import PublicScanPage from './pages/PublicScanPage';
import CleanerAreaView from './pages/CleanerAreaView';
import SupervisorAreaView from './pages/SupervisorAreaView';

// Minimal loading screen
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <p className="text-gray-600">Loading...</p>
  </div>
);

// This component renders the correct dashboard based on the user's role.
const MainDashboard = () => {
  const { session, profile } = useAuth();
  
  // This should not happen if the routing logic is correct, but it's a safe fallback.
  if (!profile) return <PublicHomePage />;

  switch (profile.role) {
    case 'admin':
      return <AdminLayout session={session} profile={profile} />;
    case 'supervisor':
      return <SupervisorLayout session={session} profile={profile} />;
    case 'cleaner':
      return <CleanerLayout session={session} profile={profile} />;
    default:
      return <PublicHomePage />;
  }
};


export default function App() {
  const { session, loading } = useAuth();

  // Show a loading screen while the AuthContext is determining the session and profile.
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Main Route ('/'): 
        - If a user is logged in, show their role-specific dashboard.
        - If no user is logged in, show the public home/login page.
      */}
      <Route
        path="/"
        element={session ? <MainDashboard /> : <PublicHomePage />}
      />

      {/* QR Code Scan Handler Route */}
      <Route path="/scan/:areaId" element={<ScanHandlerPage />} />

      {/* Routes for the pages our ScanHandler will redirect to */}
      <Route path="/public-scan/:areaId" element={<PublicScanPage />} />
      <Route path="/cleaner-view/:areaId" element={<CleanerAreaView />} />
      <Route path="/supervisor-view/:areaId" element={<SupervisorAreaView />} />

    </Routes>
  );
}

