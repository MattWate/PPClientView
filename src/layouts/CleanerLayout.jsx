// src/layouts/CleanerLayout.jsx
import React from 'react';
import { supabase } from '../services/supabaseClient';
import CleanerTasksPage from '../pages/CleanerTasksPage';

export default function CleanerLayout({ session, profile }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-green-700 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <i className="fas fa-gem text-2xl mr-3"></i>
            <h1 className="text-xl font-semibold">PristinePoint</h1>
          </div>
          <div>
            <span className="text-sm mr-4">{profile.full_name}</span>
            <button onClick={() => supabase.auth.signOut()} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md text-sm">
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="p-4">
        <CleanerTasksPage profile={profile} />
      </main>
    </div>
  );
}
