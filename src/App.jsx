import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext.jsx';
import { supabase } from './services/supabaseClient.js';
import PublicHomePage from './pages/PublicHomePage.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import SupervisorLayout from './layouts/SupervisorLayout.jsx';
import CleanerLayout from './layouts/CleanerLayout.jsx';

// Minimal Error Boundary to surface layout crashes (e.g., reading undefined)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 max-w-xl mx-auto my-16 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong in the layout.</h2>
          <pre className="text-sm text-red-800 whitespace-pre-wrap">{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <p className="text-gray-600">Loading...</p>
  </div>
);

const ProfileNotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4 text-center">
    <h2 className="text-2xl font-bold text-red-600 mb-2">Profile Not Found</h2>
    <p className="text-gray-700 mb-4">
      Your user profile could not be loaded. This may be due to permissions or missing fields (e.g., role/company).
    </p>
    <button
      onClick={() => supabase.auth.signOut()}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
    >
      Sign Out
    </button>
  </div>
);

export default function App() {
  const { session, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      // No session: ensure clean state
      if (!session?.user?.id) {
        if (isMounted) {
          setProfile(null);
          setProfileLoading(false);
        }
        return;
      }

      // IMPORTANT: set loading true whenever a session exists and we fetch
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

  // Gates
  if (authLoading || (session && profileLoading)) return <LoadingScreen />;
  if (!session) return <PublicHomePage />;

  // Route by normalized role
  const role = (profile?.role ?? '').toString().trim().toLowerCase();

  let Layout = null;
  if (role === 'admin') Layout = AdminLayout;
  else if (role === 'supervisor') Layout = SupervisorLayout;
  else if (role === 'cleaner') Layout = CleanerLayout;

  if (!Layout) return <ProfileNotFound />;

  // Catch crashes inside the chosen layout (missing company_id, etc.)
  return (
    <ErrorBoundary>
      <Layout session={session} profile={profile} />
    </ErrorBoundary>
  );
}
