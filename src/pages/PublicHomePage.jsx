// src/pages/PublicHomePage.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import LoginPage from './Login';

export default function PublicHomePage({ onGoToDashboard }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <i className="fas fa-gem text-3xl text-blue-600 mr-3"></i>
            <h1 className="text-2xl font-bold text-gray-900">PristinePoint</h1>
          </div>
          {session ? (
            <div>
              <button onClick={onGoToDashboard} className="bg-blue-600 text-white px-4 py-2 rounded-md mr-2 hover:bg-blue-700">Go to Dashboard</button>
              <button onClick={() => supabase.auth.signOut()} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Sign Out</button>
            </div>
          ) : (
            <a href="#login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Client Login</a>
          )}
        </div>
      </header>
      
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                The Future of Cleaning Management
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                Streamline operations, ensure compliance, and deliver pristine results with our all-in-one audit and task management platform.
            </p>
        </div>

        <div className="mt-12 max-w-7xl mx-auto grid gap-8 lg:grid-cols-3 lg:gap-x-8 px-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <i className="fas fa-shield-alt text-3xl text-green-500 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900">Achieve Compliance</h3>
                <p className="mt-2 text-base text-gray-500">
                    Generate ironclad, timestamped audit trails for ISO certification and client reports with a single click.
                </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <i className="fas fa-rocket text-3xl text-blue-500 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900">Boost Efficiency</h3>
                <p className="mt-2 text-base text-gray-500">
                    Replace paper forms and manual data entry with a simple QR-code based system your staff will love.
                </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <i className="fas fa-eye text-3xl text-purple-500 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900">Real-Time Oversight</h3>
                <p className="mt-2 text-base text-gray-500">
                    From your dashboard, manage sites, assign tasks, and track performance across your entire operation in real-time.
                </p>
            </div>
        </div>
        
        {!session && (
            <div id="login" className="mt-12 max-w-md mx-auto px-4">
                <LoginPage />
            </div>
        )}
      </main>
    </div>
  );
}
