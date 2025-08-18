// src/layouts/AdminLayout.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import DashboardPage from '../pages/Dashboard';
import SitesPage from '../pages/Sites';
import StaffPage from '../pages/Staff';
import TasksPage from '../pages/Tasks';

const validPages = ['dashboard', 'sites', 'staff', 'tasks'];

export default function AdminLayout({ session, profile }) {
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      if (validPages.includes(hash)) {
        setCurrentPage(hash);
      } else {
        setCurrentPage('dashboard');
      }
    };

    // Set initial page from URL hash
    handleHashChange();

    // Listen for hash changes (e.g., browser back/forward buttons)
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'sites':
        return <SitesPage profile={profile} />;
      case 'staff':
        return <StaffPage profile={profile} />;
      case 'tasks':
        return <TasksPage profile={profile} />;
      case 'dashboard':
      default:
        return <DashboardPage profile={profile} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={session.user} profile={profile} currentPage={currentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={currentPage} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
