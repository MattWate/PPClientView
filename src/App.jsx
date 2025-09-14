import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './services/supabaseClient';

// Import Pages & Layouts
import PublicHomePage from './pages/PublicHomePage';
import AdminLayout from './layouts/AdminLayout';
import SupervisorLayout from './layouts/SupervisorLayout';
import CleanerLayout from './layouts/CleanerLayout';
import ScanHandlerPage from './pages/ScanHandlerPage';

// --- Placeholder Components ---
// We will build these out in the next steps.
const PublicScanPage = () => <div className="p-4">Public Scan Page for a specific area</div>;
const CleanerAreaView = () => <div className="p-4">Cleaner's View for a specific area</div>;
const SupervisorAreaView = () => <div className="p-4">Supervisor's View for a specific area</div>;


// Minimal loading screen
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <p className="text-gray-600">Loading...</p>
  </div>
);

// This component contains the original logic from App.jsx to show the correct dashboard
const MainDashboard = ({ session, profile }) => {
  const role = (profile?.role ?? '').toString().trim().toLowerCase();
  
  if (!role) {
    // This can happen briefly between login and profile fetch.
    return <PublicHomePage />;
  }
  
  switch (role) {
    case 'admin':
      return <AdminLayout session={session} profile={profile} />;
    case 'supervisor':
      return <SupervisorLayout session={session} profile={profile} />;
    case 'cleaner':
      return <CleanerLayout session={session} profile={profile} />;
    default:
      // If role is unknown, default to a safe view.
      return <PublicHomePage />;
  }
};


export default function App() {
  const { session, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      if (!session?.user?.id) {
        if (isMounted) {
          setProfile(null);
          setProfileLoading(false);
        }
        return;
      }

      if (isMounted) setProfileLoading(true);

      try {
        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('id, full_name, role, company_id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) throw error;
        if (isMounted) setProfile(userProfile || null);
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (isMounted) setProfile(null);
      } finally {
        if (isMounted) setProfileLoading(false);
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, [session]);

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Main Route: decides whether to show login or the correct dashboard */}
      <Route
        path="/"
        element={
          !session ? (
            <PublicHomePage />
          ) : profileLoading ? (
            <LoadingScreen />
          ) : (
            <MainDashboard session={session} profile={profile} />
          )
        }
      />

      {/* QR Code Scan Handler Route */}
      <Route path="/scan/:areaId" element={<ScanHandlerPage />} />

      {/* Placeholder routes for the pages our ScanHandler will redirect to */}
      <Route path="/public-scan/:areaId" element={<PublicScanPage />} />
      <Route path="/cleaner-view/:areaId" element={<CleanerAreaView />} />
      <Route path="/supervisor-view/:areaId" element={<SupervisorAreaView />} />

    </Routes>
  );
}

