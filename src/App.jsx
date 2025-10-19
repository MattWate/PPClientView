import React from 'react';
import { Routes, Route, Link, BrowserRouter } from 'react-router-dom';

// --- Mocks & Placeholders for Single-File Compilation ---
// In a real multi-file app, these would be imported. We are defining them
// here to create a runnable, self-contained application for this environment.

const supabase = {
  auth: {
    signOut: () => alert('Signing out...'),
  }
};

// Mock Auth Context Hook
const useAuth = () => {
    // To test the logged-in state, change this return value.
    // For example: return { session: { user: {} }, profile: { role: 'admin' }, loading: false };
    return { session: null, profile: null, loading: false };
};

// Mock Page & Layout Components
const PublicHomePage = () => (
    <div className="p-8">
        <h1 className="text-3xl font-bold">Public Home Page</h1>
        <p className="mt-2">This is the public-facing landing page.</p>
        <Link to="/login" className="text-blue-600 hover:underline mt-4 inline-block">Go to Login</Link>
    </div>
);
const LoginPage = () => <div className="p-8"><h1 className="text-3xl font-bold">Login Page</h1></div>;
const AdminLayout = () => <div className="p-8"><h1 className="text-3xl font-bold">Admin Dashboard Layout</h1></div>;
const SupervisorLayout = () => <div className="p-8"><h1 className="text-3xl font-bold">Supervisor Dashboard Layout</h1></div>;
const CleanerLayout = () => <div className="p-8"><h1 className="text-3xl font-bold">Cleaner Dashboard Layout</h1></div>;
const ScanHandlerPage = () => <div className="p-8"><h1 className="text-3xl font-bold">Scan Handler Page</h1></div>;
const PublicScanPage = () => <div className="p-8"><h1 className="text-3xl font-bold">Public Scan Page</h1></div>;
const CleanerAreaView = () => <div className="p-8"><h1 className="text-3xl font-bold">Cleaner Area View</h1></div>;
const SupervisorAreaView = () => <div className="p-8"><h1 className="text-3xl font-bold">Supervisor Area View</h1></div>;
const SiteReportPage = () => <div className="p-8"><h1 className="text-3xl font-bold">Site Report Page</h1></div>;


// --- Helper Components from Original App.jsx ---

const LoadingScreen = () => (
    <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-600">Loading...</p>
    </div>
);

const ProfileNotFound = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Profile Not Found</h2>
        <p className="text-gray-700 mb-4">
            Your user profile could not be loaded. This may be due to a permissions issue (RLS).
        </p>
        <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
            Sign Out
        </button>
    </div>
);

const MainDashboard = () => {
    const { session, profile } = useAuth();
    if (!profile) return <ProfileNotFound />;

    switch (profile.role) {
        case 'admin':
            return <AdminLayout session={session} profile={profile} />;
        case 'supervisor':
            return <SupervisorLayout session={session} profile={profile} />;
        case 'cleaner':
            return <CleanerLayout session={session} profile={profile} />;
        default:
            return <ProfileNotFound />;
    }
};

// --- Main App Component ---

export default function App() {
    const { session, profile, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    // This logic determines which set of routes to show based on login status.
    // NOTE: Because a Router is needed to make Links and Routes work, we wrap the
    // content in <BrowserRouter>. In your local setup, this is likely in main.jsx.
    return (
        <BrowserRouter>
            {session && profile ? (
                // Authenticated Routes
                <Routes>
                    <Route path="/" element={<MainDashboard />} />
                    <Route path="/scan/:areaId" element={<ScanHandlerPage />} />
                    <Route path="/cleaner-view/:areaId" element={<CleanerAreaView />} />
                    <Route path="/supervisor-view/:areaId" element={<SupervisorAreaView />} />
                    <Route path="/report/site" element={<SiteReportPage />} />
                </Routes>
            ) : (
                // Public (Logged-out) Routes
                <Routes>
                    <Route path="/" element={<PublicHomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/scan/:areaId" element={<ScanHandlerPage />} />
                    <Route path="/public-scan/:areaId" element={<PublicScanPage />} />
                </Routes>
            )}
        </BrowserRouter>
    );
}

