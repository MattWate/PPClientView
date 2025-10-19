import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import { supabase } from './services/supabaseClient.js';

// Import Pages & Layouts
import PublicHomePage from './pages/PublicHomePage.jsx';
import LoginPage from './pages/Login.jsx'; // Correct the import to use your existing Login.jsx
import AdminLayout from './layouts/AdminLayout.jsx';
import SupervisorLayout from './layouts/SupervisorLayout.jsx';
import CleanerLayout from './layouts-cleaner/CleanerLayout.jsx'; // Assuming path
import ScanHandlerPage from './pages/ScanHandlerPage.jsx';
import PublicScanPage from './pages/PublicScanPage.jsx';
import CleanerAreaView from './pages/CleanerAreaView.jsx';
import SupervisorAreaView from './pages/SupervisorAreaView.jsx';
import SiteReportPage from './pages/SiteReportPage.jsx';

// ... (LoadingScreen and ProfileNotFound components remain the same) ...
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

export default function App() {
    const { session, profile, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    // If the user is logged in, show their dashboard.
    // Otherwise, show public pages.
    if (session && profile) {
        return (
            <Routes>
                <Route path="/" element={<MainDashboard />} />
                <Route path="/scan/:areaId" element={<ScanHandlerPage />} />
                <Route path="/cleaner-view/:areaId" element={<CleanerAreaView />} />
                <Route path="/supervisor-view/:areaId" element={<SupervisorAreaView />} />
                <Route path="/report/site" element={<SiteReportPage />} />
                 {/* Add more authenticated routes here */}
            </Routes>
        );
    }

    // Routes for logged-out users
    return (
        <Routes>
            <Route path="/" element={<PublicHomePage />} />
            <Route path="/login" element={<LoginPage />} /> {/* <-- ADD THIS NEW ROUTE */}
            <Route path="/scan/:areaId" element={<ScanHandlerPage />} />
            <Route path="/public-scan/:areaId" element={<PublicScanPage />} />
        </Routes>
    );
}

