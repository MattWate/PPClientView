// src/App.jsx
import React from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/Login.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
// Placeholders for other layouts
// import SupervisorLayout from './layouts/SupervisorLayout.jsx';
// import CleanerLayout from './layouts/CleanerLayout.jsx';

export default function App() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  if (!session || !profile) {
    return <LoginPage />;
  }

  // Render the correct layout based on the user's role from their profile.
  switch (profile.role) {
    case 'admin':
      return <AdminLayout />;
    // case 'supervisor':
    //   return <SupervisorLayout />;
    // case 'cleaner':
    //   return <CleanerLayout />;
    default:
      // If the user has an unknown role, show the login page.
      return <LoginPage />;
  }
}
