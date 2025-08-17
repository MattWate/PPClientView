// src/App.jsx
import React from 'react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/Login.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import SupervisorLayout from './layouts/SupervisorLayout.jsx';
import CleanerLayout from './layouts/CleanerLayout.jsx';

export default function App() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  if (!session) {
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
      // If the profile is still loading or has an unknown role, show a loading screen or an error.
      return <div className="flex items-center justify-center h-screen"><p>Loading user profile...</p></div>;
  }
}
