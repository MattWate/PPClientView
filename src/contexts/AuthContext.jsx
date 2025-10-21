import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { supabase } from '../services/supabaseClient.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener now ONLY manages the session.
    // It no longer fetches the profile, which prevents the hang on login.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false); // Set loading to false as soon as the session is known.
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // The context now only provides the session and the initial loading state.
  const value = useMemo(() => ({
    session,
    loading,
  }), [session, loading]);

  // We no longer show a blank screen while loading, App.jsx handles it.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
