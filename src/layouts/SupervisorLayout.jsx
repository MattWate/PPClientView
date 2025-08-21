// src/layouts/SupervisorLayout.jsx
import React, { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import SupervisorDashboard from '../pages/SupervisorDashboard';

export default function SupervisorLayout({ session, profile }) {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
      default:
        return <SupervisorDashboard profile={profile} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={session.user} profile={profile} currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Supervisor Dashboard" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
