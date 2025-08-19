// src/components/common/Sidebar.jsx
import React from 'react';
import { supabase } from '../../services/supabaseClient';

export default function Sidebar({ user, profile, currentPage, setCurrentPage }) {
  const navItems = {
    admin: [
      { name: 'Dashboard', icon: 'fa-tachometer-alt', page: 'dashboard' },
      { name: 'Sites & Zones', icon: 'fa-building', page: 'sites' },
      { name: 'Staff', icon: 'fa-users', page: 'staff' },
      { name: 'Task Management', icon: 'fa-clipboard-list', page: 'tasks' },
    ],
    supervisor: [
      { name: 'Dashboard', icon: 'fa-tachometer-alt', page: 'dashboard' },
      { name: 'Assign Tasks', icon: 'fa-tasks', page: 'tasks' },
    ],
    cleaner: [
      { name: 'My Tasks', icon: 'fa-clipboard-check', page: 'tasks' },
    ],
  };

  const currentNavItems = navItems[profile.role] || [];

  return (
    <aside className="w-64 bg-gray-800 text-white flex-shrink-0 flex flex-col">
      <div className="h-16 flex items-center justify-center px-4 bg-gray-900">
        <i className="fas fa-gem text-2xl text-blue-400 mr-3"></i>
        <h1 className="text-xl font-semibold">PristinePoint</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {currentNavItems.map(item => (
          <a
            key={item.name}
            href={`#/${item.page}`}
            onClick={(e) => {
                e.preventDefault();
                setCurrentPage(item.page);
                window.location.hash = `/${item.page}`;
            }}
            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-md ${currentPage === item.page ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
          >
            <i className={`fas ${item.icon} w-6 text-center mr-3`}></i> {item.name}
          </a>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-700">
        <p className="text-sm font-medium text-white truncate">{profile.full_name || user.email}</p>
        <p className="text-xs text-gray-400 capitalize">{profile.role}</p>
        <button onClick={() => supabase.auth.signOut()} className="w-full mt-2 text-left text-sm text-red-400 hover:text-red-300">
          Log Out
        </button>
      </div>
    </aside>
  );
}
