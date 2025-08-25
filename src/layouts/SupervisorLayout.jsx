// src/layouts/SupervisorLayout.jsx
import React from 'react';
import Header from '../components/common/Header.jsx';
import Sidebar from '../components/common/Sidebar.jsx';
import SupervisorDashboard from '../pages/SupervisorDashboard.jsx'; // Import the dashboard

export default function SupervisorLayout({ session, profile }) {
  // Define navigation links specific to the Supervisor role
  const supervisorNavLinks = [
    { name: 'Dashboard', href: '#', current: true },
    { name: 'My Tasks', href: '#', current: false },
    { name: 'Team Status', href: '#', current: false },
    { name: 'Reports', href: '#', current: false },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Component */}
      <Sidebar navLinks={supervisorNavLinks} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Component */}
        <Header user={session?.user} profile={profile} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200">
          <div className="container mx-auto px-6 py-8">
            {/* Render the SupervisorDashboard and pass the profile prop */}
            <SupervisorDashboard profile={profile} />
          </div>
        </main>
      </div>
    </div>
  );
}
