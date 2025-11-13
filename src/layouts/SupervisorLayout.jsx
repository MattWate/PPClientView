// src/layouts/SupervisorLayout.jsx
import React, { useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import SupervisorDashboard from '../pages/SupervisorDashboard.jsx';

/* ---------- Error boundary ---------- */
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
          <div className="font-semibold mb-1">Something went wrong.</div>
          <pre className="text-xs whitespace-pre-wrap">{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------- Main Layout ---------- */
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <i className="fas fa-gem text-2xl text-indigo-600 mr-3"></i>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PristinePoint</h1>
              <p className="text-xs text-gray-500">Supervisor Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700">{safeProfile.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{safeProfile.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm transition-colors"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LocalErrorBoundary>
          <SupervisorDashboard profile={safeProfile} session={session} />
        </LocalErrorBoundary>
      </main>
    </div>
  );
}
