import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './services/supabaseClient';
import PublicHomePage from './pages/PublicHomePage';
import AdminLayout from './layouts/AdminLayout';
import SupervisorLayout from './layouts/SupervisorLayout';
import CleanerLayout from './layouts/CleanerLayout';

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
      Your user profile could not be loaded from the database. This may be due to a setup issue.
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
  const [profileLoading, setProfileLoading] = useState(true); // Default to true

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user) {
        setProfileLoading(true);
        try {
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            // This will catch RLS errors if the user has no access
            throw new Error(`Supabase query failed: ${error.message}`);
          }
          
          setProfile(userProfile);

        } catch (error) {
          console.error("Error fetching profile:", error);
          setProfile(null); // Ensure profile is null on error
        } finally {
          setProfileLoading(false);
        }
      } else {
        // No session, so clear any existing profile and stop loading.
        setProfile(null);
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [session]);

  // --- ROBUST RENDER LOGIC ---

  // While the initial authentication check is running, show a loading screen.
  if (authLoading) {
    return <LoadingScreen />;
  }

  // If authentication is done and there's no user session, show the login page.
  if (!session) {
    return <PublicHomePage />;
  }

  // If there is a session, but we are still fetching the profile, show a loading screen.
  if (profileLoading) {
    return <LoadingScreen />;
  }

  // If fetching is complete, but we still don't have a profile, it's an error.
  if (!profile) {
    return <ProfileNotFound />;
  }

  // If all checks pass, we have a session and a profile. Render the correct layout.
  switch (profile.role) {
    case 'admin':
      return <AdminLayout session={session} profile={profile} />;
    case 'supervisor':
      return <SupervisorLayout session={session} profile={profile} />;
    case 'cleaner':
      return <CleanerLayout session={session} profile={profile} />;
    default:
      // A user has a profile but an unknown role.
      return <ProfileNotFound />;
  }
}

