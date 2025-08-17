// src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import LoginPage from './pages/Login.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
// Placeholders for other layouts
// import SupervisorLayout from './layouts/SupervisorLayout.jsx';
// import CleanerLayout from './layouts/CleanerLayout.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect runs once when the app starts to check for an existing session.
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            fetchProfile(session);
        } else {
            setLoading(false);
        }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          fetchProfile(session);
        } else {
          setSession(null);
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (session) => {
    try {
        const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
        
        if (error) throw error;
        
        // This is the security check. If the user is a super_admin, log them out.
        if (userProfile?.role === 'super_admin') {
            supabase.auth.signOut();
            setProfile(null);
            setSession(null);
        } else {
            setProfile(userProfile);
            setSession(session);
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
        supabase.auth.signOut(); // Log out if profile is missing
    } finally {
        setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  // If there is no valid session or profile, show the login page.
  if (!session || !profile) {
    return <LoginPage />;
  }

  // Otherwise, render the correct layout based on the user's role.
  switch (profile.role) {
    case 'admin':
      return <AdminLayout user={session.user} profile={profile} />;
    // case 'supervisor':
    //   return <SupervisorLayout user={session.user} profile={profile} />;
    // case 'cleaner':
    //   return <CleanerLayout user={session.user} profile={profile} />;
    default:
      return <LoginPage />;
  }
}
