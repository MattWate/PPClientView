import React, { useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import SupervisorDashboard from '../pages/SupervisorDashboard.jsx';

// --- Sidebar ---
const Sidebar = ({ navLinks, profile, setCurrentPage }) => (
  <div className="w-64 bg-gray-800 text-white flex-shrink-0 hidden md:flex md:flex-col">
    <div className="p-4">
      <h2 className="text-xl font-bold">PristinePoint</h2>
      <p className="text-sm text-gray-400">{profile?.full_name}</p>
    </div>
    <nav className="flex-1">
      <ul>
        {navLinks.map(link => (
          <li key={link.name}>
            <button
              onClick={() => setCurrentPage(link.name.toLowerCase().replace(' ', '-'))}
              className={`w-full text-left p-4 hover:bg-gray-700 ${link.current ? 'bg-gray-900' : ''}`}
            >
              {link.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  </div>
);

// --- Simple header (optional, if you need it)
const Header = ({ title, profile }) => (
  <header className="bg-white shadow-md p-4 flex justify-between items-center">
    <h1 className="text-2xl font-semibold text-gray-800 capitalize">{title.replace('-', ' ')}</h1>
    <div>
      <span className="text-gray-600">{profile?.full_name} ({profile?.role})</span>
    </div>
  </header>
);

// --- Error boundary
class LocalErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('SupervisorLayout child error:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="m-6 p-4 rounded-md border border-red-200 bg-red-50 text-red-800">
          <div className="font-semibold mb-1">Something went wrong.</div>
          <pre className="text-xs whitespace-pre-wrap">{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SupervisorLayout({ session, profile }) {
  if (!session?.user) return null;

  const safeProfile = useMemo(() => {
    const fallbackEmail = session?.user?.email ?? 'user@example.com';
    const baseProfile = profile || {};
    return {
      ...baseProfile,
      id: baseProfile.id ?? session?.user?.id ?? null,
      full_name: baseProfile.full_name ?? fallbackEmail,
      role: baseProfile.role ?? 'supervisor',
      company_id: baseProfile.company_id ?? null,
    };
  }, [profile, session]);

  const [currentPage, setCurrentPage] = useState('dashboard');

  const supervisorNavLinks = [
    { name: 'Dashboard',   current: currentPage === 'dashboard' },
    { name: 'My Tasks',    current: currentPage === 'my-tasks' },
    { name: 'Team Status', current: currentPage === 'team-status' },
    { name: 'Reports',     current: currentPage === 'reports' },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <SupervisorDashboard profile={safeProfile} session={session} />;
      case 'my-tasks':
        return <div className="p-6 bg-white rounded-lg shadow-md">My Tasks page coming soon.</div>;
      case 'team-status':
        return <div className="p-6 bg-white rounded-lg shadow-md">Team Status page coming soon.</div>;
      case 'reports':
        return <div className="p-6 bg-white rounded-lg shadow-md">Reports page coming soon.</div>;
      default:
        return <SupervisorDashboard profile={safeProfile} session={session} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        navLinks={supervisorNavLinks}
        profile={safeProfile}
        setCurrentPage={setCurrentPage}
      />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200">
        <div className="container mx-auto px-6 py-8">
          <LocalErrorBoundary>
            {renderPage()}
          </LocalErrorBoundary>
        </div>
      </main>
    </div>
  );
}
