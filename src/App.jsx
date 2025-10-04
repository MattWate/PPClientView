import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import { supabase } from './services/supabaseClient.js'; // Import supabase for the logout button

// Import Pages & Layouts
import PublicHomePage from './pages/PublicHomePage.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import SupervisorLayout from './layouts/SupervisorLayout.jsx';
import CleanerLayout from './layouts/CleanerLayout.jsx';
import ScanHandlerPage from './pages/ScanHandlerPage.jsx';
import PublicScanPage from './pages/PublicScanPage.jsx';
import CleanerAreaView from './pages/CleanerAreaView.jsx';
import SupervisorAreaView from './pages/SupervisorAreaView.jsx';

// Minimal loading screen
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <p className="text-gray-600">Loading...</p>
  </div>
);

// A component to show if a user is logged in but their profile is missing.
const ProfileNotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4 text-center">
    <h2 className="text-2xl font-bold text-red-600 mb-2">Profile Not Found</h2>
    <p className="text-gray-700 mb-4">
      Your user profile could not be loaded. This may be due to a permissions issue (RLS).
    </p>
    <button
      onClick={() => supabase.auth.signOut()}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
    >
      Sign Out
    </button>
  </div>
);

// This component renders the correct dashboard based on the user's role.
const MainDashboard = () => {
  const { session, profile } = useAuth();
  
  // This should not happen if the routing logic is correct, but it's a safe fallback.
  if (!profile) return <ProfileNotFound />;

  switch (profile.role) {
    case 'admin':
      return <AdminLayout session={session} profile={profile} />;
    case 'supervisor':
      return <SupervisorLayout session={session} profile={profile} />;
    case 'cleaner':
      return <CleanerLayout session={session} profile={profile} />;
    default:
      return <ProfileNotFound />; // Fallback for unknown roles
  }
};


export default function App() {
  const { session, profile, loading } = useAuth();

  // Show a loading screen while the AuthContext is determining the session and profile.
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Main Route ('/'): 
        This is the main gatekeeper for the application.
      */}
      <Route
        path="/"
        element={
          // If no session, show the public login page.
          !session ? <PublicHomePage /> :
          // If there is a session but NO profile, show the error page.
          !profile ? <ProfileNotFound /> :
          // If there is a session AND a profile, show the correct dashboard.
          <MainDashboard />
        }
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

