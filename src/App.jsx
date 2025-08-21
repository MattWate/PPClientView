// src/App.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './services/supabaseClient';
import LoginPage from './pages/Login.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import SupervisorLayout from './layouts/SupervisorLayout.jsx';
// Placeholder for CleanerLayout
// import CleanerLayout from './layouts/CleanerLayout.jsx';

export default function App() {
  const { session, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session) {
        try {
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) throw error;

          if (userProfile?.role === 'super_admin') {
            supabase.auth.signOut();
          } else {
            setProfile(userProfile);
          }
        } catch (error) {
          console.error("Error fetching profile in App.jsx:", error);
          supabase.auth.signOut();
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [session]);

  if (authLoading || profileLoading) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  if (!session || !profile) {
    return <LoginPage />;
  }

  // Render the correct layout based on the user's role from their profile.
  switch (profile.role) {
    case 'admin':
      return <AdminLayout session={session} profile={profile} />;
    case 'supervisor':
      return <SupervisorLayout session={session} profile={profile} />;
    // case 'cleaner':
    //   return <CleanerLayout session={session} profile={profile} />;
    default:
      return <LoginPage />;
  }
}
