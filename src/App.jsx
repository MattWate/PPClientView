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
  const [profileLoading, setProfileLoading] = useState(false);

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
        // No session, so clear any existing profile
        setProfile(null);
      }
    };

    fetchProfile();
  }, [session]);

  // --- NEW, SIMPLIFIED RENDER LOGIC ---

  // 1. Show a loading screen while authentication or profile fetching is in progress.
  if (authLoading || (session && profileLoading)) {
    return <LoadingScreen />;
  }

  // 2. If not loading and no session exists, show the public home/login page.
  if (!session) {
    return <PublicHomePage />;
  }

  // 3. If a session exists but the profile could not be fetched, show an error.
  // This is the critical fix for your blank page issue.
  if (session && !profile) {
    return <ProfileNotFound />;
  }

  // 4. If we get here, we have a session and a profile. Render the correct layout.
  if (profile) {
    switch (profile.role) {
      case 'admin':
        return <AdminLayout session={session} profile={profile} />;
      case 'supervisor':
        return <SupervisorLayout session={session} profile={profile} />;
      case 'cleaner':
        return <CleanerLayout session={session} profile={profile} />;
      default:
        // A user has an unknown role.
        return <ProfileNotFound />;
    }
  }

  // Fallback in case none of the above conditions are met.
  return <PublicHomePage />;
}

