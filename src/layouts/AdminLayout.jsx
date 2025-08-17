// src/layouts/AdminLayout.jsx
import React, { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import DashboardPage from '../pages/Dashboard';
import SitesPage from '../pages/Sites';
import StaffPage from '../pages/Staff';
import TasksPage from '../pages/Tasks';

export default function AdminLayout({ session, profile }) {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'sites':
        return <SitesPage />;
      case 'staff':
        return <StaffPage />;
      case 'tasks':
        return <TasksPage />;
      case 'dashboard':
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={session.user} profile={profile} currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={currentPage} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
