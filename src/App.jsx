import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext.jsx';
import { supabase } from './services/supabaseClient.js';
import PublicHomePage from './pages/PublicHomePage.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import SupervisorLayout from './layouts/SupervisorLayout.jsx';
import CleanerLayout from './layouts/CleanerLayout.jsx';

// A simple loading component to show while fetching data.
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
      Your user profile could not be loaded. This may be due to a permissions issue (RLS) or missing data.
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
    let isMounted = true; // --- FIX: Track if the component is still mounted ---

    const fetchProfile = async () => {
      if (session?.user) {
        try {
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('id, full_name, role, company_id')
            .eq('id', session.user.id)
            .single();

          if (error) throw error;
          
          // --- FIX: Only update state if the component is still mounted ---
          if (isMounted) {
            setProfile(userProfile);
          }

        } catch (error) {
          console.error("Error fetching profile:", error);
          if (isMounted) {
            setProfile(null);
          }
        } finally {
          if (isMounted) {
            setProfileLoading(false);
          }
        }
      } else {
        if (isMounted) {
          setProfile(null);
          setProfileLoading(false);
        }
      }
    };

    fetchProfile();

    // --- FIX: The cleanup function ---
    // This runs when the component unmounts or if the effect re-runs.
    // It prevents setting state on an unmounted component.
    return () => {
      isMounted = false;
    };
  }, [session]);

  // --- ROBUST RENDER LOGIC (No changes needed here) ---

  if (authLoading || (session && profileLoading)) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <PublicHomePage />;
  }

  if (profile && profile.role) {
    switch (profile.role) {
      case 'admin':
        return <AdminLayout session={session} profile={profile} />;
      case 'supervisor':
        return <SupervisorLayout session={session} profile={profile} />;
      case 'cleaner':
        return <CleanerLayout session={session} profile={profile} />;
      default:
        return <ProfileNotFound />;
    }
  }

  return <ProfileNotFound />;
}

