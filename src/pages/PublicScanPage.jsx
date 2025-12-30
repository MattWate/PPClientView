// src/pages/PublicScanPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function PublicScanPage() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  
  const [areaName, setAreaName] = useState('');
  const [view, setView] = useState('options'); // 'options', 'login', or 'report'
  const [loading, setLoading] = useState(true);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Report form state
  const [reportDescription, setReportDescription] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');

  // Fetch the area's name when the component loads
  useEffect(() => {
    const fetchAreaName = async () => {
      if (!areaId) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('areas')
          .select('name')
          .eq('id', areaId)
          .single();
        
        if (error) throw error;
        setAreaName(data?.name || 'Unknown Area');
      } catch (err) {
        console.error('Failed to fetch area name:', err);
        setAreaName('Unknown Area');
      } finally {
        setLoading(false);
      }
    };
    fetchAreaName();
  }, [areaId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Redirect to the role-based router
      navigate(`/scan/${areaId}`);

    } catch (err) {
      setLoginError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Fetch the area details to get the company_id, zone_id, and site_id
      const { data: areaData, error: areaErr } = await supabase
        .from('areas')
        .select('company_id, zone_id, zones(site_id)')
        .eq('id', areaId)
        .single();
        
      if (areaErr) throw areaErr;

      // 2. Create the Task
      // Since we don't have a 'priority' column, we use the title to flag importance
      const { error: taskErr } = await supabase
        .from('tasks')
        .insert({
          title: '🚨 CLIENT ISSUE REPORT',
          description: `${reportDescription} \n\nReported by: ${reporterEmail || 'Anonymous'}`,
          status: 'pending',
          task_type: 'ad_hoc',
          area_id: areaId,
          company_id: areaData.company_id,
          zone_id: areaData.zone_id,
          site_id: areaData.zones?.site_id,
          created_by: null // Explicitly null for anonymous public users
        });

      if (taskErr) throw taskErr;

      alert('Report submitted successfully! A supervisor has been notified.');
      setView('options');
      setReportDescription('');
      setReporterEmail('');

    } catch (err) {
      console.error('Error reporting issue:', err);
      alert('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const renderReportForm = () => (
    <form onSubmit={handleReportSubmit} className="space-y-4">
        <div className="bg-red-50 p-4 rounded-lg mb-4 border border-red-100">
            <h3 className="text-xl font-semibold text-red-800 mb-1">Report Issue</h3>
            <p className="text-sm text-red-600">
                Location: <span className="font-bold">{areaName}</span>
            </p>
        </div>
        
        <div>
            <label className="text-sm font-medium text-gray-700">What is the issue?</label>
            <textarea
                required
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm h-32 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., Spill in the corner, soap dispenser broken..."
            />
        </div>

        <div>
            <label className="text-sm font-medium text-gray-700">Your Email (Optional)</label>
            <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                placeholder="To receive updates"
            />
        </div>

        <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 px-4 text-white bg-red-600 rounded-md hover:bg-red-700 font-medium shadow-sm disabled:opacity-50 transition-colors"
        >
            {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Submitting...</> : 'Submit Report'}
        </button>
        <button 
            type="button" 
            onClick={() => setView('options')} 
            className="w-full py-3 px-4 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 font-medium transition-colors"
        >
            Cancel
        </button>
    </form>
  );

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
         <h3 className="text-xl font-semibold text-blue-800">Staff Login</h3>
         <p className="text-sm text-blue-600">Access tasks for {areaName}</p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Email</label>
        <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <i className="fas fa-envelope"></i>
            </span>
            <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="staff@pristinepoint.com"
            />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Password</label>
        <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <i className="fas fa-lock"></i>
            </span>
            <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="••••••••"
            />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full py-3 px-4 text-white bg-blue-600 rounded-md hover:bg-blue-700 font-medium shadow-sm disabled:opacity-50 transition-colors"
      >
        {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Logging in...</> : 'Login'}
      </button>

      {loginError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 flex items-start gap-2">
            <i className="fas fa-exclamation-circle mt-0.5"></i>
            <span>{loginError}</span>
        </div>
      )}

       <button 
        type="button" 
        onClick={() => setView('options')} 
        className="w-full mt-2 py-3 px-4 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 font-medium transition-colors"
       >
            Back
        </button>
    </form>
  );

  const renderOptions = () => (
     <div className="text-center">
        <div className="mb-8">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-map-marker-alt text-3xl text-indigo-600"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome</h2>
            {loading ? (
                <div className="flex items-center justify-center gap-2 text-gray-500">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                    <span>Locating area...</span>
                </div>
            ) : (
                <p className="text-gray-600">
                    You are at: <br/>
                    <span className="font-semibold text-xl text-indigo-600">{areaName}</span>
                </p>
            )}
        </div>

        <div className="space-y-4">
            <button 
                onClick={() => setView('login')} 
                className="w-full py-4 px-4 flex items-center justify-center gap-3 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:-translate-y-0.5"
            >
                <i className="fas fa-user-shield text-xl"></i>
                <span>Staff Login</span>
            </button>
            <button 
                onClick={() => setView('report')} 
                className="w-full py-4 px-4 flex items-center justify-center gap-3 font-semibold text-white bg-red-500 rounded-lg shadow-md hover:bg-red-600 transition-transform transform hover:-translate-y-0.5"
            >
                <i className="fas fa-bullhorn text-xl"></i>
                <span>Report an Issue</span>
            </button>
        </div>
        
        <div className="mt-8 text-xs text-gray-400">
            Powered by PristinePoint
        </div>
     </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Top decorative bar */}
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            
            <div className="p-8">
                {view === 'options' && renderOptions()}
                {view === 'login' && renderLoginForm()}
                {view === 'report' && renderReportForm()}
            </div>
        </div>
    </div>
  );
}
