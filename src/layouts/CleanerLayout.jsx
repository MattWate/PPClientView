// src/layouts/CleanerLayout.jsx
import React, { useMemo } from 'react';
import { supabase } from '../services/supabaseClient.js';
import CleanerTasksPage from '../pages/CleanerTasksPage.jsx';

// Inline error boundary
class LocalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('CleanerLayout child error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="m-4 p-4 rounded-md border border-red-200 bg-red-50 text-red-800">
          <div className="font-semibold mb-1">Something went wrong loading tasks.</div>
          <pre className="text-xs whitespace-pre-wrap">{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function CleanerLayout({ session, profile }) {
  if (!session?.user) return null;

  const safeProfile = useMemo(() => {
    const fallbackEmail = session?.user?.email ?? 'user@example.com';
    return {
      id: profile?.id ?? session?.user?.id ?? null,
      full_name: profile?.full_name ?? fallbackEmail,
      role: profile?.role ?? 'cleaner',
      company_id: profile?.company_id ?? null,
      ...profile,
    };
  }, [profile, session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <header className="bg-green-700 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <i className="fas fa-gem text-2xl mr-3" aria-hidden="true"></i>
            <div>
              <h1 className="text-xl font-bold">PristinePoint</h1>
              <p className="text-xs text-green-100">My Tasks</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{safeProfile.full_name}</p>
              <p className="text-xs text-green-100 capitalize">{safeProfile.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-3 py-2 rounded-md text-sm transition-colors"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!safeProfile?.id ? (
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-green-200/60 rounded w-44"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              <div className="h-4 bg-gray-300 rounded w-4/6"></div>
            </div>
          </div>
        ) : (
          <LocalErrorBoundary>
            <CleanerTasksPage profile={safeProfile} session={session} />
          </LocalErrorBoundary>
        )}
      </main>
    </div>
  );
}
