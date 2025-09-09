import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext.jsx';
import { supabase } from './services/supabaseClient.js';
import PublicHomePage from './pages/PublicHomePage.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import SupervisorLayout from './layouts/SupervisorLayout.jsx';
import CleanerLayout from './layouts/CleanerLayout.jsx';

// Minimal loading screen
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <p className="text-gray-600">Loading...</p>
  </div>
);

// Error boundary that falls back to the landing page on any layout error
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    // Optional: log to your monitoring here
    console.error('Layout error:', error, info);
  }
  render() {
    if (this.state.error) {
      return <PublicHomePage />;
    }
    return this.props.children;
  }
}

export default function App() {
  const { session, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      // No session: show landing
      if (!session?.user?.id) {
        if (isMounted) {
          setProfile(null);
          setProfileLoading(false);
        }
        return;
      }

      // IMPORTANT: set loading true whenever we (re)fetch with a session
      if (isMounted) setProfileLoading(true);

      try {
        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('id, full_name, role, company_id')
          .eq('id', session.user.id)
          .maybeSingle(); // safer than .single() if 0 rows

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

  // Gates
  if (authLoading || (session && profileLoading)) return <LoadingScreen />;

  // No session → landing page
  if (!session) return <PublicHomePage />;

  // Normalize role; missing/unknown role → landing page
  const role = (profile?.role ?? '').toString().trim().toLowerCase();
  if (!role) return <PublicHomePage />;

  // Choose layout; fallback to landing if unknown
  let layout = null;
  if (role === 'admin') {
    layout = <AdminLayout session={session} profile={profile} />;
  } else if (role === 'supervisor') {
    layout = <SupervisorLayout session={session} profile={profile} />;
  } else if (role === 'cleaner') {
    layout = <CleanerLayout session={session} profile={profile} />;
  } else {
    return <PublicHomePage />;
  }

  // Catch any runtime errors in the chosen layout and fallback to landing
  return <ErrorBoundary>{layout}</ErrorBoundary>;
}
