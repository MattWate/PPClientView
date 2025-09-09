import React, { useState, useEffect } from 'react';
import { useAuth } from 'contexts/AuthContext.jsx';
import { supabase } from 'services/supabaseClient.js';
import PublicHomePage from 'pages/PublicHomePage.jsx';
import AdminLayout from 'layouts/AdminLayout.jsx';
import SupervisorLayout from 'layouts/SupervisorLayout.jsx';
import CleanerLayout from 'layouts/CleanerLayout.jsx';

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
    // Function to fetch the user's profile from the database
    const fetchProfile = async () => {
      // Only run if we have a confirmed user session
      if (session?.user) {
        try {
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('id, full_name, role, company_id') // Explicitly select the role
            .eq('id', session.user.id)
            .single();

          if (error) throw error;
          
          // --- NEW: DEBUGGING LOG ---
          // Let's see exactly what the database returned.
          console.log("Fetched profile data:", userProfile);

          // On success, update the profile state
          setProfile(userProfile);

        } catch (error) {
          console.error("Error fetching profile:", error);
          setProfile(null); // Explicitly set profile to null on failure
        } finally {
          // No matter what, stop the loading process
          setProfileLoading(false);
        }
      } else {
        // If there's no session, ensure we're not in a loading state
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [session]);

  // --- ROBUST RENDER LOGIC ---

  // While the initial session is being determined, always show the loading screen.
  if (authLoading) {
    return <LoadingScreen />;
  }

  // If there's no session, show the public login page.
  if (!session) {
    return <PublicHomePage />;
  }

  // If there IS a session, but we are still waiting for the profile to load,
  // continue to show the loading screen.
  if (profileLoading) {
    return <LoadingScreen />;
  }

  // If we are done loading the profile, and it exists WITH a role, render the correct layout.
  if (profile && profile.role) {
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

  // The only remaining cases: loading is finished, a session exists, but the profile is null OR the profile has no role.
  // This is the error state.
  return <ProfileNotFound />;
}

