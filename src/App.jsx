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
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      console.log('🔍 AppLayout: Starting profile fetch...'); // DEBUG
      try {
        if (!session?.user?.id) {
          console.log('❌ AppLayout: No user ID in session'); // DEBUG
          setProfile(null);
          setProfileError('No user session found');
          return;
        }

        console.log('📡 AppLayout: Fetching profile for user:', session.user.id); // DEBUG

        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('❌ AppLayout: Profile fetch error:', error); // DEBUG
          setProfile(null);
          setProfileError(error.message);
        } else {
          console.log('✅ AppLayout: Profile loaded successfully:', userProfile); // DEBUG
          setProfile(userProfile);
          setProfileError(null);
        }
      } catch (e) {
        console.error('💥 AppLayout: Critical error in fetchProfile:', e); // DEBUG
        setProfile(null);
        setProfileError(e.message);
      } finally {
        console.log('🏁 AppLayout: Profile fetch complete'); // DEBUG
        setProfileLoading(false);
      }
    };

    setProfileLoading(true);
    fetchProfile();
  }, [session?.user?.id]);

  // Show loading screen while profile is being fetched
  if (profileLoading) {
    console.log('⏳ AppLayout: Showing loading screen'); // DEBUG
    return <LoadingScreen />;
  }

  // After loading, if profile is still null, show the error
  if (!profile) {
    console.log('⚠️ AppLayout: No profile found, showing error screen'); // DEBUG
    console.log('Profile Error:', profileError); // DEBUG
    return <ProfileNotFound onSignOut={() => supabase.auth.signOut()} />;
  }

  // If loading is done and profile exists, show the correct dashboard
  console.log('🎯 AppLayout: Routing to role:', profile.role); // DEBUG
  
  switch (String(profile.role).toLowerCase()) {
    case 'admin':
    case 'super_admin':
      console.log('✨ AppLayout: Rendering AdminLayout'); // DEBUG
      return <AdminLayout session={session} profile={profile} />;

    case 'supervisor':
      console.log('✨ AppLayout: Rendering SupervisorLayout'); // DEBUG
      return <SupervisorLayout session={session} profile={profile} />;

    case 'cleaner':
      console.log('✨ AppLayout: Rendering CleanerLayout'); // DEBUG
      return <CleanerLayout session={session} profile={profile} />;

    default:
      console.log('❓ AppLayout: Unknown role, showing error'); // DEBUG
      return <ProfileNotFound onSignOut={() => supabase.auth.signOut()} />;
  }
}

export default function App() {
  const { session, loading } = useAuth();

  console.log('🚀 App: Render - session:', !!session, 'loading:', loading); // DEBUG

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public routes */}
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
