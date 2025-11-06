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
// FIX 1: All components moved to the top level, outside the 'App' function.
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

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout() {
  const { session } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (session?.user) {
      const fetchProfile = async () => {
        try {
          console.log("Forcing Supabase auth refresh...");
          await supabase.auth.refreshSession();
          console.log("Auth refresh complete. Fetching profile...");

          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id);

          if (error) {
            throw error;
          }

          if (data && data.length === 1) {
            setProfile(data[0]);
          } else if (data && data.length > 1) {
            throw new Error("Multiple profiles found for the same user ID.");
          } else {
            throw new Error("No profile found for this user.");
          }

        } catch (e) {
          console.error("Failed to fetch profile in AppLayout:", e);
          setProfile(null);
        } finally {
          setLoadingProfile(false);
        }
      };
      fetchProfile();
    } else {
      setLoadingProfile(false);
    }
  }, [session]);

  if (loadingProfile) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return <ProfileNotFound onSignOut={() => supabase.auth.signOut()} />;
  }

  // Once the profile is loaded, render the correct layout.
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
    <Routes>
      {/* FIX 2: Set PublicHomePage as the default route */}
      <Route path="/" element={<PublicHomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/public-home" element={<PublicHomePage />} />
      <Route path="/public-scan/:areaId" element={<PublicScanPage />} />
      <Route path="/scan/:areaId" element={<ScanHandlerPage />} />
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
      <Route
        path="*"
        element={session ? <Navigate to="/app" replace /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
