import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- NEW: More robust effect logic ---
    const setupAuth = async () => {
      try {
        // 1. Get the initial session. This is a one-time check.
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        // 2. If a session exists, fetch the user's profile.
        if (initialSession?.user) {
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, role, company_id')
            .eq('id', initialSession.user.id)
            .single();
          
          if (profileError) throw profileError;
          setProfile(userProfile || null);
        } else {
          setProfile(null);
        }
        
        setSession(initialSession);

      } catch (error) {
        console.error('Error in initial auth setup:', error);
        setSession(null);
        setProfile(null);
      } finally {
        // 3. No matter what, stop the initial loading process.
        setLoading(false);
      }
    };

    // Run the initial setup
    setupAuth();

    // 4. Set up the listener for any subsequent auth changes (login/logout).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        // When auth state changes, update the session and re-fetch the profile.
        setSession(newSession);
      }
    );

    // Clean up the listener when the component unmounts.
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Expose session, profile, and loading state to the rest of the app.
  const value = {
    session,
    profile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

