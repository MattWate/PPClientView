// src/App.jsx
import React, { useState, useEffect } from 'react'; // <-- Added useState and useEffect
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

// --- THIS COMPONENT IS NOW FIXED ---
// It now fetches the profile itself, ensuring the correct layout is chosen.
function AppLayout() {
  const { session } = useAuth(); // We only get the session from the context now.
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    // This effect runs when the session is available.
    if (session?.user) {
      const fetchProfile = async () => {
        try {
          // --- MODIFIED DATABASE QUERY ---
          // We are no longer using .single() to get more detailed results.
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id);

          if (error) {
            // If Supabase itself throws an error, we catch it here.
            throw error;
          }

          if (data && data.length === 1) {
            // SUCCESS: We found exactly one profile.
            setProfile(data[0]);
          } else if (data && data.length > 1) {
            // ERROR: This indicates a data integrity issue.
            throw new Error("Multiple profiles found for the same user ID.");
          } else {
            // ERROR: The user is authenticated, but no profile row exists.
            throw new Error("No profile found for this user.");
          }

        } catch (e) {
          console.error("Failed to fetch profile in AppLayout:", e);
          setProfile(null); // Set profile to null on error
        } finally {
          setLoadingProfile(false); // Stop loading once done
        }
      };
      fetchProfile();
    } else {
      // If there's no session, we're not loading a profile.
      setLoadingProfile(false);
    }
  }, [session]);

  // Show a loading screen while the profile is being fetched.
  if (loadingProfile) {
    return <LoadingScreen />;
  }

  // If fetching is done but we have no profile, show the error.
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

  // This initial loading screen is for the session, which is very fast.
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
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

