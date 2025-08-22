// src/App.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './services/supabaseClient';
import PublicHomePage from './pages/PublicHomePage';
import AdminLayout from './layouts/AdminLayout.jsx';
import SupervisorLayout from './layouts/SupervisorLayout.jsx';
import CleanerLayout from './layouts/CleanerLayout.jsx';

export default function App() {
  const { session, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [view, setView] = useState('landing'); // Always start on the landing page

  useEffect(() => {
    const fetchProfile = async () => {
      if (session) {
        setProfileLoading(true);
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
        setView('landing'); // If user logs out, return to landing page
      }
    };

    fetchProfile();
  }, [session]);

  const renderDashboard = () => {
    if (authLoading || profileLoading) {
      return <div className="flex items-center justify-center h-screen"><p>Loading Dashboard...</p></div>;
    }

    if (!session || !profile) {
        setView('landing'); // Should not happen, but as a fallback
        return null;
    }

    switch (profile.role) {
      case 'admin':
        return <AdminLayout session={session} profile={profile} />;
      case 'supervisor':
        return <SupervisorLayout session={session} profile={profile} />;
      case 'cleaner':
        return <CleanerLayout session={session} profile={profile} />;
      default:
        // If user has an unknown role, send them back to landing
        setView('landing');
        return null;
    }
  };

  if (view === 'landing') {
    return <PublicHomePage onGoToDashboard={() => setView('dashboard')} />;
  }

  return renderDashboard();
}
