import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/common/Sidebar.jsx';
import Header from '../components/common/Header.jsx';
import DashboardPage from '../pages/Dashboard.jsx';
import SitesPage from '../pages/Sites.jsx';
import StaffPage from '../pages/Staff.jsx';
import TasksPage from '../pages/Tasks.jsx';
import AssignmentsPage from '../pages/Assignments.jsx';

const validPages = ['dashboard', 'sites', 'staff', 'tasks', 'assignments'];

// Inline error boundary so a child crash doesn't kick you back to landing
class LocalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('AdminLayout child error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="m-6 p-4 rounded-md border border-red-200 bg-red-50 text-red-800">
          <div className="font-semibold mb-1">Something went wrong loading this section.</div>
          <pre className="text-xs whitespace-pre-wrap">{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function getPageFromHash() {
  const raw = (typeof window !== 'undefined' ? window.location.hash : '') || '';
  const page = raw.replace('#/', '').trim();
  return validPages.includes(page) ? page : 'dashboard';
}

export default function AdminLayout({ session, profile }) {
  if (!session?.user) return null;

  const safeProfile = useMemo(() => {
    const fallbackEmail = session?.user?.email ?? 'user@example.com';
    return {
      id: profile?.id ?? session?.user?.id ?? null,
      full_name: profile?.full_name ?? fallbackEmail,
      role: profile?.role ?? 'admin',
      company_id: profile?.company_id ?? null,
      ...profile,
    };
  }, [profile, session]);

  const [currentPage, setCurrentPage] = useState(() => getPageFromHash());

  // Keep state in sync with URL hash (browser nav/back/forward)
  useEffect(() => {
    const onHashChange = () => {
      const next = getPageFromHash();
      setCurrentPage(prev => {
        // Only update if actually different
        if (prev !== next) {
          console.log('Hash changed from', prev, 'to', next);
          return next;
        }
        return prev;
      });
    };
    
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // When currentPage changes via sidebar clicks, reflect it in the hash
  // But DON'T do this if the hash already matches (to avoid loops)
  useEffect(() => {
    const expected = `#/${currentPage}`;
    const current = window.location.hash;
    
    if (current !== expected) {
      console.log('Setting hash to', expected);
      // --- THIS IS THE FIX ---
      // Changed from window.history.replaceState to window.location.hash
      window.location.hash = expected;
    }
  }, [currentPage]);

  const navigate = (page) => {
    if (!validPages.includes(page)) {
      setCurrentPage('dashboard');
      return;
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'sites':
        return <SitesPage profile={safeProfile} />;
      case 'staff':
        return <StaffPage profile={safeProfile} />;
      case 'tasks':
        return <TasksPage profile={safeProfile} />;
      case 'assignments':
        return <AssignmentsPage profile={safeProfile} />;
      case 'dashboard':
      default:
        return <DashboardPage profile={safeProfile} setCurrentPage={navigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        user={session.user}
        profile={safeProfile}
        currentPage={currentPage}
        setCurrentPage={navigate}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={currentPage} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <LocalErrorBoundary>
            {renderPage()}
          </LocalErrorBoundary>
        </main>
      </div>
    </div>
  );
}
