// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange fires once upon initial load, and again whenever the auth state changes.
    // This is the single source of truth for the user's session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (session) {
            // If a session exists, fetch the user's profile.
            const { data: userProfile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error) throw error;
            
            // Security check: If the user is a super_admin, sign them out of the client portal.
            if (userProfile?.role === 'super_admin') {
              await supabase.auth.signOut();
              setSession(null);
              setProfile(null);
            } else {
              setSession(session);
              setProfile(userProfile);
            }
          } else {
            // If no session exists, clear the state.
            setSession(null);
            setProfile(null);
          }
        } catch (error) {
          console.error('Error in auth listener:', error);
          setSession(null);
          setProfile(null);
        } finally {
          // This is crucial: set loading to false after the auth state has been determined.
          setLoading(false);
        }
      }
    );

    // Clean up the listener when the component unmounts.
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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
