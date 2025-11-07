import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { supabase } from '../services/supabaseClient.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // <-- ADDED
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch the initial session AND profile on load
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // If a session exists, fetch the user's profile
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(userProfile);
      }
      setLoading(false);
    };

    getSessionAndProfile();

    // 2. Set up the auth listener to fetch profile on changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        // Set loading to false only after the session and profile (or lack thereof) are known
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 3. Provide 'profile' in the context value
  const value = useMemo(() => ({
    session,
    profile, // <-- ADDED
    loading,
  }), [session, profile, loading]);

  // App.jsx will now handle the loading screen
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
