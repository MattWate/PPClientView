// src/layouts/AdminLayout.jsx
import React from 'react';
import { supabase } from '../services/supabaseClient';

export default function AdminLayout({ user }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Portal</h1>
        <p>Welcome, {user.email}</p>
        <button onClick={() => supabase.auth.signOut()} className="w-full mt-4 text-left text-red-400 hover:text-red-300">
          Log Out
        </button>
      </aside>
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        <p>Admin-specific content goes here.</p>
      </main>
    </div>
  );
}
