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
  const [error, setError] = useState('');

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
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // IMPORTANT: After successful login, redirect back to the scan handler.
      // The ScanHandlerPage will now have an active session and will redirect
      // the user to the correct, role-specific view for the area.
      navigate(`/scan/${areaId}`);

    } catch (err) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  // Placeholder for the issue reporting form
  const renderReportForm = () => (
    <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Report Issue in {areaName}</h3>
        <p className="text-gray-600 mb-4">This feature is coming soon. For now, please contact management directly.</p>
        <button onClick={() => setView('options')} className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
            Back
        </button>
    </div>
  );

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Staff Login</h3>
      <div>
        <label className="text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <button type="submit" disabled={loading} className="w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p className="text-sm text-center text-red-600">{error}</p>}
       <button type="button" onClick={() => setView('options')} className="w-full mt-2 py-2 px-4 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
            Back
        </button>
    </form>
  );

  const renderOptions = () => (
     <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome</h2>
        {loading ? (
             <p className="text-gray-600">Loading location...</p>
        ) : (
            <p className="text-gray-600 mb-6">You are at: <span className="font-semibold">{areaName}</span></p>
        )}
        <div className="space-y-4">
            <button onClick={() => setView('login')} className="w-full py-3 px-4 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Staff Login
            </button>
            <button onClick={() => setView('report')} className="w-full py-3 px-4 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                Report an Issue
            </button>
        </div>
     </div>
  );


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-md">
            {view === 'options' && renderOptions()}
            {view === 'login' && renderLoginForm()}
            {view === 'report' && renderReportForm()}
        </div>
    </div>
  );
}

