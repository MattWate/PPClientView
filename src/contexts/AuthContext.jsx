import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { supabase } from '../services/supabaseClient.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This single listener handles initial state, logins, and logouts.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('id, full_name, role, company_id')
              .eq('id', session.user.id)
              .single();
            if (error) throw error;
            setProfile(data);
          } catch (e) {
            console.error('Error fetching profile:', e);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // --- THIS IS THE FIX ---
  // useMemo stabilizes the context value, preventing consumers from
  // re-rendering unnecessarily. The value object is only recreated when
  // session, profile, or loading actually change.
  const value = useMemo(() => ({
    session,
    profile,
    loading,
  }), [session, profile, loading]);
  // --- END OF FIX ---

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

