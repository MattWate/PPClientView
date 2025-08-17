// src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import LoginPage from './pages/Login.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import SupervisorLayout from './layouts/SupervisorLayout.jsx';
import CleanerLayout from './layouts/CleanerLayout.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  // This effect will run once when the app starts to check for an existing session.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session);
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
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    // This is the security check. If the user is a super_admin, log them out.
    if (userProfile?.role === 'super_admin') {
        supabase.auth.signOut();
    } else {
        setProfile(userProfile);
        setSession(session);
    }
  };

  // If there is no valid session or profile, show the login page.
  if (!session || !profile) {
    return <LoginPage onLoginSuccess={fetchProfile} />;
  }

  // Otherwise, render the correct layout based on the user's role.
  switch (profile.role) {
    case 'admin':
      return <AdminLayout user={session.user} />;
    case 'supervisor':
      return <SupervisorLayout user={session.user} />;
    case 'cleaner':
      return <CleanerLayout user={session.user} />;
    default:
      return <LoginPage onLoginSuccess={fetchProfile} />;
  }
}
