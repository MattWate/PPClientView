// src/pages/PublicHomePage.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import LoginPage from './Login';

export default function PublicHomePage({ onGoToDashboard }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  const pricingTiers = [
    {
      name: 'Professional',
      price: 'R2,499',
      description: 'For SMEs landing their first ISO contracts',
      features: [
        'Up to 10 active sites',
        'Unlimited users (cleaners, supervisors, managers)',
        'QR code scan logging & supervisor photo verification',
        'Area checklists & recurring job schedules',
        'Client staff issue reporting (no login needed)',
        'Audit-ready PDF reports (12-month retention)',
        'Email support',
      ],
      cta: 'Get Started',
      onboarding: 'R3,500'
    },
    {
      name: 'Growth',
      price: 'R4,999',
      description: 'For growing teams with bigger portfolios',
      features: [
        'Up to 30 active sites',
        'Everything in Professional, plus:',
        'Multi-site dashboards',
        'ISO-aligned report packs (9001 / 14001 / 45001)',
        'SLA breach alerts & escalations',
        'Client read-only portal',
        '5-year data retention',
        'Priority email + chat support',
      ],
      cta: 'Upgrade to Growth',
      onboarding: 'R7,500'
    },
    {
      name: 'Enterprise',
      price: 'R7,999',
      description: 'For established providers with national portfolios',
      features: [
        'Up to 100 active sites',
        'Everything in Growth, plus:',
        'API & webhooks for integrations',
        'SSO (Google/Microsoft)',
        'Advanced audit logs & custom reporting',
        'Power BI connector',
        'Branded client reports',
        'Dedicated customer success manager',
      ],
      cta: 'Book a Demo',
      onboarding: 'R15,000+'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <i className="fas fa-gem text-3xl text-blue-600 mr-3"></i>
            <h1 className="text-2xl font-bold text-gray-900">PristinePoint</h1>
          </div>
          {session ? (
            <div>
              <button onClick={onGoToDashboard} className="bg-blue-600 text-white px-4 py-2 rounded-md mr-2 hover:bg-blue-700">Go to Dashboard</button>
              <button onClick={() => supabase.auth.signOut()} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Sign Out</button>
            </div>
          ) : (
            <a href="#login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Client Login</a>
          )}
        </div>
      </header>
      
      <main>
        <div className="bg-white">
            <div className="max-w-4xl mx-auto py-16 px-4 text-center">
                <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    The Future of Cleaning Management
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                    Streamline operations, ensure compliance, and deliver pristine results with our all-in-one audit and task management platform.
                </p>
            </div>
        </div>

        <div className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h3 className="text-3xl font-extrabold text-gray-900">PristinePoint Pricing</h3>
                    <p className="mt-2 text-lg text-gray-500">Built for South African cleaning service providers.</p>
                    <p className="mt-1 text-lg font-semibold text-blue-600">No per-user surprises. Unlimited cleaners, supervisors, and managers on every plan.</p>
                </div>

                <div className="grid gap-8 lg:grid-cols-3 lg:gap-x-8">
                    {pricingTiers.map(tier => (
                        <div key={tier.name} className="bg-white p-8 rounded-lg shadow-md flex flex-col">
                            <h4 className="text-2xl font-bold text-gray-900">{tier.name}</h4>
                            <p className="mt-2 text-gray-500">{tier.description}</p>
                            <p className="mt-6 text-4xl font-extrabold text-gray-900">{tier.price}<span className="text-base font-medium text-gray-500"> / month</span></p>
                            <ul className="mt-6 space-y-4 flex-grow">
                                {tier.features.map(feature => (
                                    <li key={feature} className="flex items-start">
                                        <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                                        <span className="text-gray-600">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-8">
                                <a href="#" className="w-full block text-center bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700">{tier.cta}</a>
                                <p className="text-center text-sm text-gray-500 mt-4">One-time setup fee: <span className="font-bold">{tier.onboarding}</span></p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        
        {!session && (
            <div id="login" className="py-12 bg-white">
                <div className="max-w-md mx-auto px-4">
                    <LoginPage />
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
