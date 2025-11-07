// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { supabase } from '../services/supabaseClient.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // This is just for the session

  useEffect(() => {
    // 1. Get the initial session on app load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // <-- Unblock the app as soon as session is known
    });

    // 2. Listen for future auth changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Loading is already false, so we just update the session
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // The context now only provides the session and its loading state.
  const value = useMemo(() => ({
    session,
    loading,
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
