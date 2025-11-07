// src/App.jsx
import React, { useState, useEffect } from 'react';
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
import ScanHandlerPage from './pages/ScanHandlerPage.jsx';
import CleanerAreaView from './pages/CleanerAreaView.jsx';
import SupervisorAreaView from './pages/SupervisorAreaView.jsx';
import SiteReportPage from './pages/SiteReportPage.jsx';

// ---
// All components moved to the top level, outside the 'App' function.
// ---

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

  if (loading) return <LoadingScreen />; // This is just for the session
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

//
// --- THIS COMPONENT CONTAINS THE FINAL FIX ---
//
function AppLayout() {
  const { session } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    // We wrap all logic in an async function
    const fetchProfile = async () => {
      try {
        if (!session?.user?.id) {
          // If there's no user ID, there's no profile to get.
          console.log('AppLayout: No user ID in session.');
          setProfile(null);
          return; // Exit early
        }

        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error.message);
          setProfile(null);
        } else {
          setProfile(userProfile);
        }
      } catch (e) {
        console.error('Critical error in fetchProfile:', e);
        setProfile(null);
      } finally {
        // **THIS IS THE FIX**: This block will run *no matter what*
        // happens in the 'try' or 'catch' blocks, ensuring
        // the loading screen always disappears.
        setProfileLoading(false);
      }
    };

    // Set loading to true *before* calling the fetch function.
    // The function itself is now responsible for setting it to false.
    setProfileLoading(true);
    fetchProfile();

  }, [session?.user?.id]); // Re-run only if the user ID changes

  // 1. Show loading screen while profile is being fetched
  if (profileLoading) {
    return <LoadingScreen />;
  }

  // 2. After loading, if profile is still null, show the error
  if (!profile) {
    return <ProfileNotFound onSignOut={() => supabase.auth.signOut()} />;
  }

  // 3. If loading is done and profile exists, show the correct dashboard
  switch (String(profile.role).toLowerCase()) {
    case 'admin':
    case 'super_admin':
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
  // This 'loading' is now only for the session, so it will be very fast
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public routes are no longer blocked */}
      <Route path="/" element={<PublicHomePage />} />
      <Route path="/login" element={<Login />} />
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
      <Route 
        path="/report/site" 
        element={<RequireAuth><SiteReportPage /></RequireAuth>} 
      />
      
      {/* Fallback redirect */}
      <Route
        path="*"
        element={session ? <Navigate to="/app" replace /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
