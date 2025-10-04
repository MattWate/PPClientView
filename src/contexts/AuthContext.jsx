import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange is the single source of truth for the user's session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        // --- NEW: Fetch profile whenever the session changes ---
        if (session?.user) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('id, full_name, role, company_id')
              .eq('id', session.user.id)
              .single();
            
            if (error) throw error;
            setProfile(data || null);

          } catch (error) {
            console.error('Error fetching profile in AuthContext:', error);
            setProfile(null);
          }
        } else {
          // If there's no session, clear the profile
          setProfile(null);
        }
        
        setLoading(false);
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

