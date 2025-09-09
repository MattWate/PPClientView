// src/layouts/SupervisorLayout.jsx
import React, { useMemo, useState } from 'react';
import Header from '../components/common/Header.jsx';
import Sidebar from '../components/common/Sidebar.jsx';
import SupervisorDashboard from '../pages/SupervisorDashboard.jsx';

// Inline error boundary so child errors render a friendly panel instead of crashing
class LocalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('SupervisorLayout child error:', error, info);
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

export default function SupervisorLayout({ session, profile }) {
  // Guard: App should ensure session exists; if not, render nothing
  if (!session?.user) return null;

  // Safe profile passed to children
  const safeProfile = useMemo(() => {
    const fallbackEmail = session?.user?.email ?? 'user@example.com';
    return {
      id: profile?.id ?? session?.user?.id ?? null,
      full_name: profile?.full_name ?? fallbackEmail,
      role: profile?.role ?? 'supervisor',
      company_id: profile?.company_id ?? null,
      ...profile,
    };
  }, [profile, session]);

  // Simple tab state; Sidebar can drive this if it uses setCurrentPage
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Provide both styles of API to Sidebar (for compatibility)
  const supervisorNavLinks = [
    { name: 'Dashboard',   href: '#/dashboard',   current: currentPage === 'dashboard' },
    { name: 'My Tasks',    href: '#/my-tasks',    current: currentPage === 'my-tasks' },
    { name: 'Team Status', href: '#/team-status', current: currentPage === 'team-status' },
    { name: 'Reports',     href: '#/reports',     current: currentPage === 'reports' },
  ];

  const navigate = (page) => {
    const valid = ['dashboard', 'my-tasks', 'team-status', 'reports'];
    setCurrentPage(valid.includes(page) ? page : 'dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <SupervisorDashboard profile={safeProfile} session={session} />;
      case 'my-tasks':
        return (
          <div className="rounded-xl bg-white border p-6 shadow-sm">
            <p className="text-gray-700">My Tasks — content coming soon.</p>
          </div>
        );
      case 'team-status':
        return (
          <div className="rounded-xl bg-white border p-6 shadow-sm">
            <p className="text-gray-700">Team Status — content coming soon.</p>
          </div>
        );
      case 'reports':
        return (
          <div className="rounded-xl bg-white border p-6 shadow-sm">
            <p className="text-gray-700">Reports — content coming soon.</p>
          </div>
        );
      default:
        return <SupervisorDashboard profile={safeProfile} session={session} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar: support both prop shapes your app uses elsewhere */}
      <Sidebar
        navLinks={supervisorNavLinks}
        user={session.user}
        profile={safeProfile}
        currentPage={currentPage}
        setCurrentPage={navigate}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Give Header a safe title; also pass user/profile for components that expect them */}
        <Header title={currentPage} user={session?.user} profile={safeProfile} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200">
          <div className="container mx-auto px-6 py-8">
            <LocalErrorBoundary>
              {renderPage()}
            </LocalErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
