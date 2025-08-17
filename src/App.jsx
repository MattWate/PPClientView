// src/App.jsx
import React, { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { supabase } from './services/supabaseClient';
import LoginPage from './pages/Login.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import SupervisorLayout from './layouts/SupervisorLayout.jsx';
import CleanerLayout from './layouts/CleanerLayout.jsx';

export default function App() {
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    // This effect runs when the profile is loaded.
    // If the user is a super_admin, they should not be in the client portal.
    // We log them out automatically.
    if (profile?.role === 'super_admin') {
      supabase.auth.signOut();
    }
  }, [profile]);


  if (loading) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  if (!session || profile?.role === 'super_admin') {
    // Show login page if there's no session OR if the user is a super_admin.
    return <LoginPage />;
  }

  // Render the correct layout based on the user's role from their profile.
  switch (profile?.role) {
    case 'admin':
      return <AdminLayout user={session.user} />;
    case 'supervisor':
      return <SupervisorLayout user={session.user} />;
    case 'cleaner':
      return <CleanerLayout user={session.user} />;
    default:
      // If the profile is still loading or has an unknown role, show a loading screen.
      return <div className="flex items-center justify-center h-screen"><p>Loading user profile...</p></div>;
  }
}
