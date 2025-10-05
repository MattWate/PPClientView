import React from 'react';
import { NavLink } from 'react-router-dom'; // Import NavLink
import { supabase } from '../../services/supabaseClient';

export default function Sidebar({ user, profile }) {
  // The navigation items now map directly to your route paths
  const navItems = {
    admin: [
      { name: 'Dashboard', icon: 'fa-tachometer-alt', path: '/' },
      { name: 'Sites & Zones', icon: 'fa-building', path: '/sites' },
      { name: 'Staff', icon: 'fa-users', path: '/staff' },
      { name: 'Task Management', icon: 'fa-clipboard-list', path: '/tasks' },
    ],
    supervisor: [
      { name: 'Dashboard', icon: 'fa-tachometer-alt', path: '/' },
      // Add other supervisor links here if needed
    ],
    cleaner: [
      { name: 'My Tasks', icon: 'fa-clipboard-check', path: '/' },
    ],
  };

  const currentNavItems = navItems[profile.role] || [];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // The router and AuthContext will handle the redirect automatically.
  };

  // This function is passed to the className prop of NavLink.
  // It receives an `isActive` boolean and returns the correct CSS classes.
  const getNavLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-2.5 text-sm font-medium rounded-md ${
      isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <aside className="w-64 bg-gray-800 text-white flex-shrink-0 flex flex-col">
      <div className="h-16 flex items-center justify-center px-4 bg-gray-900">
        <i className="fas fa-gem text-2xl text-blue-400 mr-3"></i>
        <h1 className="text-xl font-semibold">PristinePoint</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {currentNavItems.map(item => (
          // --- THE FIX: Use NavLink instead of <a> ---
          <NavLink
            key={item.name}
            to={item.path}
            className={getNavLinkClass}
            end={item.path === '/'} // Ensures "Dashboard" is only active on the exact root path
          >
            <i className={`fas ${item.icon} w-6 text-center mr-3`}></i> {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-700">
        <p className="text-sm font-medium text-white truncate">{profile.full_name || user.email}</p>
        <p className="text-xs text-gray-400 capitalize">{profile.role}</p>
        <button onClick={handleSignOut} className="w-full mt-2 text-left text-sm text-red-400 hover:text-red-300">
          Log Out
        </button>
      </div>
    </aside>
  );
}

