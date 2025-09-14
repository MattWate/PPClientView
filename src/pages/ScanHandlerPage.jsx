import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// This is a "gatekeeper" component. It has no UI of its own.
// Its sole purpose is to redirect the user to the correct page based on their role.
export default function ScanHandlerPage() {
  const { areaId } = useParams(); // 1. Get the Area ID from the URL
  const { session, profile, loading: authLoading } = useAuth(); // 2. Get user's auth state
  const navigate = useNavigate();

  useEffect(() => {
    // Wait until the initial authentication check is complete
    if (authLoading) {
      return; // Do nothing while we're still loading the session
    }

    // 3. Decide where to redirect the user
    if (!session) {
      // CASE 1: No user is logged in. Send to the public landing/login page.
      navigate(`/public-scan/${areaId}`);
    } else if (profile) {
      // CASE 2: A user is logged in and we have their profile.
      switch (profile.role) {
        case 'cleaner':
          navigate(`/cleaner-view/${areaId}`);
          break;
        case 'supervisor':
        case 'admin':
          navigate(`/supervisor-view/${areaId}`);
          break;
        default:
          // A user with an unknown role is treated as a non-user.
          navigate(`/public-scan/${areaId}`);
          break;
      }
    }
    // If auth is done, but profile is still loading, this effect will re-run when profile is available.
    
  }, [session, profile, authLoading, areaId, navigate]);


  // Display a simple loading message while the redirection logic is running.
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <p className="text-gray-600">Please wait, routing...</p>
    </div>
  );
}

