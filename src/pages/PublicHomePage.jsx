// src/pages/PublicHomePage.jsx
import React, { useState } from 'react';

// --- Mocks & Components for Single-File Compilation ---
// To resolve build errors in this environment, dependencies from other files
// are included directly here. In your multi-file project, you would use imports.

const useAuth = () => ({
  session: null, // Change to a mock session object to test the logged-in view
  loading: false,
});

const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }) => {
      alert(`Attempting to sign in with email: ${email}`);
      // In a real app, this would be a network request.
      // We'll simulate an error for demonstration.
      if (password !== 'password') {
          return { error: { message: 'Invalid password. Try "password".' } };
      }
      return { error: null };
    },
    signOut: () => {
      alert('Signing out...');
    }
  }
};

// This is the functional LoginPage component, now included directly
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
            alert('Login successful! (In real app, you would be redirected)');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md w-full">
            <div className="text-center mb-6">
                 <span className="text-4xl text-indigo-600">💎</span>
                 <h1 className="text-2xl font-bold text-gray-900 mt-2">PristinePoint</h1>
                 <p className="text-gray-600">Client Portal</p>
            </div>
            <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                        id="email"
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@yourcompany.com"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                    <input
                        id="password"
                        className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full py-2 px-4 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
                {error && <p className="text-sm text-red-600 text-center pt-2">{error}</p>}
            </form>
        </div>
    );
};
// --- End Mocks & Components ---


export default function PublicHomePage({ onGoToDashboard }) {
    const { session, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
    }
    
    const pricingTiers = [
        {
            name: 'Starter',
            price: 'R2,499',
            description: 'For SMEs landing their first ISO contracts',
            features: [
                'Up to 10 active sites',
                'Centralized dashboard view',
                'Live KPI tracking',
                'Interactive data filtering',
                'Visual SLA monitoring',
                'On-screen report generation',
                'Unlimited users (supervisors, managers)',
            ],
            cta: 'Get Started',
            onboarding: 'R3,500',
            popular: false,
        },
        {
            name: 'Professional',
            price: 'R4,999',
            description: 'For growing teams with bigger portfolios',
            features: [
                'Up to 30 active sites',
                'Centralized dashboard view',
                'Live KPI tracking',
                'Interactive data filtering',
                'Visual SLA monitoring',
                'On-screen report generation',
                'Unlimited users (supervisors, managers)',
            ],
            cta: 'Upgrade to Professional',
            onboarding: 'R7,500',
            popular: true,
        },
        {
            name: 'Enterprise',
            price: 'R7,999',
            description: 'For established providers with national portfolios',
            features: [
                'Up to 100 active sites',
                'Centralized dashboard view',
                'Live KPI tracking',
                'Interactive data filtering',
                'Visual SLA monitoring',
                'On-screen report generation',
                'Unlimited users (supervisors, managers)',
            ],
            cta: 'Book a Demo',
            onboarding: 'R15,000+',
            popular: false,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
             {/* Font Awesome CDN for icons */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center">
                        <i className="fas fa-gem text-3xl text-indigo-600 mr-3"></i>
                        <h1 className="text-2xl font-bold text-gray-900">PristinePoint</h1>
                    </div>
                    {session ? (
                        <div>
                            <button onClick={onGoToDashboard} className="bg-indigo-600 text-white px-4 py-2 rounded-md mr-2 hover:bg-indigo-700">Go to Dashboard</button>
                            <button onClick={() => supabase.auth.signOut()} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Sign Out</button>
                        </div>
                    ) : (
                        <a href="#login" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Client Login</a>
                    )}
                </div>
            </header>
            
            <main>
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                    <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                        <h2 className="text-4xl font-extrabold sm:text-5xl md:text-6xl">
                            The Future of Cleaning Management
                        </h2>
                        <p className="mt-4 max-w-2xl mx-auto text-xl text-indigo-100">
                            Streamline operations, ensure compliance, and deliver pristine results with our all-in-one audit and task management platform.
                        </p>
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
                                     {tier.popular && (
                                        <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                                            <span className="bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">Most Popular</span>
                                        </div>
                                    )}
                                    <h4 className="text-2xl font-semibold text-gray-900">{tier.name}</h4>
                                    <p className="mt-2 text-gray-500">{tier.description}</p>
                                    <p className="mt-6 text-5xl font-bold tracking-tight text-gray-900">{tier.price}<span className="text-xl font-medium text-gray-500"> / month</span></p>
                                    <ul className="mt-8 space-y-3 flex-grow">
                                        {tier.features.map(feature => (
                                            <li key={feature} className="flex items-start">
                                                <svg className="flex-shrink-0 h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
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
                
                {!session && (
                    <div id="login" className="py-16 bg-gray-100">
                        <div className="max-w-md mx-auto px-4 flex justify-center">
                            <LoginPage />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

