import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

// --- Mocks & Placeholders for Single-File Compilation ---
const useAuth = () => ({ session: null, profile: null, loading: false });

const supabase = {
  auth: {
    signOut: () => alert('Signing out...'),
    signInWithPassword: async ({ email, password }) => {
      alert(`Signing in with ${email}...`);
      if (password !== 'password') {
        return { error: { message: 'Invalid credentials. Try password: "password"' } };
      }
      return { data: { session: { user: { id: '123' } } }, error: null };
    }
  }
};


// --- Real Components Integrated ---
const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            alert('Login successful! You would be redirected now.');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
            <div className="text-center">
                <span className="text-4xl text-indigo-600">💎</span>
                <h1 className="text-2xl font-bold text-gray-900 mt-2">PristinePoint</h1>
                <p className="text-gray-600">Client Portal</p>
            </div>
            <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
                    <input id="email" className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourcompany.com" required />
                </div>
                <div>
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                    <input id="password" className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <button type="submit" className="w-full py-2 px-4 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50" disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            </form>
        </div>
    );
};

const PublicHomePage = () => {
    const { session } = useAuth();
    const pricingTiers = [
        { name: 'Starter', price: 'R2,499', description: 'For SMEs landing their first ISO contracts', features: ['Up to 10 active sites', 'Centralized dashboard view', 'Live KPI tracking', 'Interactive data filtering', 'Visual SLA monitoring', 'On-screen report generation', 'Unlimited users (supervisors, managers)'], cta: 'Get Started', onboarding: 'R3,500', popular: false },
        { name: 'Professional', price: 'R4,999', description: 'For growing teams with bigger portfolios', features: ['Up to 30 active sites', 'Centralized dashboard view', 'Live KPI tracking', 'Interactive data filtering', 'Visual SLA monitoring', 'On-screen report generation', 'Unlimited users (supervisors, managers)'], cta: 'Upgrade to Professional', onboarding: 'R7,500', popular: true },
        { name: 'Enterprise', price: 'R7,999', description: 'For established providers with national portfolios', features: ['Up to 100 active sites', 'Centralized dashboard view', 'Live KPI tracking', 'Interactive data filtering', 'Visual SLA monitoring', 'On-screen report generation', 'Unlimited users (supervisors, managers)'], cta: 'Book a Demo', onboarding: 'R15,000+', popular: false },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center">
                        <i className="fas fa-gem text-3xl text-indigo-600 mr-3"></i>
                        <h1 className="text-2xl font-bold text-gray-900">PristinePoint</h1>
                    </div>
                    {session ? (
                        <div>
                            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md mr-2">Go to Dashboard</button>
                            <button onClick={() => supabase.auth.signOut()} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md">Sign Out</button>
                        </div>
                    ) : (
                        <Link to="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Client Login</Link>
                    )}
                </div>
            </header>
            <main>
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                    <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                        <h2 className="text-4xl font-extrabold sm:text-5xl md:text-6xl">The Future of Cleaning Management</h2>
                        <p className="mt-4 max-w-2xl mx-auto text-xl text-indigo-100">Streamline operations, ensure compliance, and deliver pristine results.</p>
                    </div>
                </div>
                <div className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-12">
                            <h3 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Simple, Transparent Pricing</h3>
                            <p className="mt-4 text-xl text-gray-600">Choose a plan based on your portfolio size. All features included.</p>
                        </div>
                        <div className="grid gap-8 lg:grid-cols-3 lg:gap-x-8">
                            {pricingTiers.map(tier => (
                                <div key={tier.name} className={`bg-white p-8 rounded-2xl shadow-lg flex flex-col relative ${tier.popular ? 'border-2 border-indigo-600' : ''}`}>
                                     {tier.popular && (<div className="absolute top-0 -translate-y-1/2 w-full flex justify-center"><span className="bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">Most Popular</span></div>)}
                                    <h4 className="text-2xl font-semibold text-gray-900">{tier.name}</h4>
                                    <p className="mt-2 text-gray-500">{tier.description}</p>
                                    <p className="mt-6 text-5xl font-bold tracking-tight text-gray-900">{tier.price}<span className="text-xl font-medium text-gray-500"> / month</span></p>
                                    <ul className="mt-8 space-y-3 flex-grow">
                                        {tier.features.map(feature => (
                                            <li key={feature} className="flex items-start">
                                                <svg className="flex-shrink-0 h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                <span className="ml-3 text-gray-600">{feature.startsWith('Up to') ? <span className="font-semibold text-indigo-600">{feature}</span> : feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-8">
                                        <a href="#" className={`w-full block text-center px-6 py-3 rounded-lg font-semibold ${tier.name === 'Enterprise' ? 'bg-gray-800 text-white hover:bg-gray-900' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{tier.cta}</a>
                                        <p className="text-center text-sm text-gray-500 mt-4">One-time setup fee: <span className="font-bold">{tier.onboarding}</span></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {/* The embedded login page is removed as we now have a dedicated /login route */}
            </main>
        </div>
    );
};


// --- Other Mock Components ---
const AdminLayout = () => <div className="p-8"><h1 className="text-3xl font-bold">Admin Dashboard</h1></div>;
const SupervisorLayout = () => <div className="p-8"><h1 className="text-3xl font-bold">Supervisor Dashboard</h1></div>;
const CleanerLayout = () => <div className="p-8"><h1 className="text-3xl font-bold">Cleaner Dashboard</h1></div>;
const ScanHandlerPage = () => <div className="p-8"><h1 className="text-3xl font-bold">Scan Handler</h1></div>;
const PublicScanPage = () => <div className="p-8"><h1 className="text-3xl font-bold">Public Scan Page</h1></div>;
const CleanerAreaView = () => <div className="p-8"><h1 className="text-3xl font-bold">Cleaner Area View</h1></div>;
const SupervisorAreaView = () => <div className="p-8"><h1 className="text-3xl font-bold">Supervisor Area View</h1></div>;
const SiteReportPage = () => <div className="p-8"><h1 className="text-3xl font-bold">Site Report Page</h1></div>;

const LoadingScreen = () => <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
const ProfileNotFound = () => <div className="flex flex-col items-center justify-center h-screen"><h2 className="text-2xl font-bold text-red-600">Profile Not Found</h2><button onClick={() => supabase.auth.signOut()} className="px-4 py-2 text-white bg-blue-600 rounded-md">Sign Out</button></div>;
const MainDashboard = () => {
    const { profile } = useAuth();
    if (!profile) return <ProfileNotFound />;
    switch (profile.role) {
        case 'admin': return <AdminLayout />;
        case 'supervisor': return <SupervisorLayout />;
        case 'cleaner': return <CleanerLayout />;
        default: return <ProfileNotFound />;
    }
};

// --- Main App Component ---
export default function App() {
    const { session, profile, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <>
            {/* SCRIPT TAG TO LOAD TAILWIND CSS FOR PREVIEW */}
            <script src="https://cdn.tailwindcss.com"></script>
            {/* Font Awesome for icons */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />

            {session && profile ? (
                <Routes>
                    <Route path="/" element={<MainDashboard />} />
                    <Route path="/scan/:areaId" element={<ScanHandlerPage />} />
                    <Route path="/cleaner-view/:areaId" element={<CleanerAreaView />} />
                    <Route path="/supervisor-view/:areaId" element={<SupervisorAreaView />} />
                    <Route path="/report/site" element={<SiteReportPage />} />
                </Routes>
            ) : (
                <Routes>
                    <Route path="/" element={<PublicHomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/scan/:areaId" element={<ScanHandlerPage />} />
                    <Route path="/public-scan/:areaId" element={<PublicScanPage />} />
                </Routes>
            )}
        </>
    );
}

