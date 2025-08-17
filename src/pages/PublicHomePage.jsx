// src/pages/PublicHomePage.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from './Login';

export default function PublicHomePage({ onGoToDashboard }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl mr-3">💎</span>
            <h1 className="text-2xl font-bold text-gray-900">PristinePoint</h1>
          </div>
          {session ? (
            <div>
              <button onClick={onGoToDashboard} className="bg-blue-600 text-white px-4 py-2 rounded-md mr-2">Go to Dashboard</button>
              <button onClick={() => supabase.auth.signOut()} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md">Sign Out</button>
            </div>
          ) : (
            <p className="text-gray-600">Please sign in to access your dashboard.</p>
          )}
        </div>
      </header>
      <main className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to PristinePoint</h2>
          <p className="text-gray-600 mb-6">The modern solution for managing cleaning operations and ensuring ISO compliance. Our platform provides a verifiable, timestamped audit trail for all your cleaning and supervisory activities.</p>
          {!session && <LoginPage />}
        </div>
      </main>
    </div>
  );
}
