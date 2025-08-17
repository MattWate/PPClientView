// src/layouts/SupervisorLayout.jsx
import React from 'react';
import { supabase } from '../services/supabaseClient';

export default function SupervisorLayout({ user }) {
  return (
    <div className="flex h-screen bg-blue-50">
      <aside className="w-64 bg-blue-800 text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Supervisor Portal</h1>
        <p>Welcome, {user.email}</p>
        <button onClick={() => supabase.auth.signOut()} className="w-full mt-4 text-left text-red-300 hover:text-red-200">
          Log Out
        </button>
      </aside>
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold">Supervisor Dashboard</h2>
        <p>Supervisor-specific content goes here.</p>
      </main>
    </div>
  );
}
