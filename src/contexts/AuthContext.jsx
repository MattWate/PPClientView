// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Start loading

  useEffect(() => {
    // This listener handles the initial app load AND all auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        try {
          // Set session (will be null if logged out, or a session if logged in)
          setSession(newSession);

          // Fetch profile if session exists, otherwise set profile to null
          if (newSession?.user) {
            const { data: userProfile, error: profileError } = await supabase
              .from('profiles')
              .select('id, full_name, role, company_id')
              .eq('id', newSession.user.id)
              .single();
            
            if (profileError) throw profileError;
            setProfile(userProfile || null);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Error during auth state change:', error);
          setProfile(null);
        } finally {
          // IMPORTANT: Set loading to false.
          // This will run after the first check (on app load) and
          // stop the loading screen.
          setLoading(false);
        }
      }
    );

    // Clean up the listener when the component unmounts
    return () => {
      subscription?.unsubscribe();
    };
  }, []); // The empty array ensures this effect runs only once on mount

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
