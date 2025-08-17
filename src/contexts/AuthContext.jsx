// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Stage 1: Perform an initial check to see if a session already exists.
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) throw error;

          if (userProfile?.role === 'super_admin') {
            await supabase.auth.signOut();
            setSession(null);
            setProfile(null);
          } else {
            setSession(session);
            setProfile(userProfile);
          }
        } else {
          // This is the crucial fix: ensure state is cleared if no session exists.
          setSession(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("Initial session fetch error:", error);
        setSession(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Stage 2: Set up a listener for any subsequent changes in auth state.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userProfile?.role === 'super_admin') {
            await supabase.auth.signOut();
            setSession(null);
            setProfile(null);
          } else {
            setSession(session);
            setProfile(userProfile);
          }
        } else {
          setSession(null);
          setProfile(null);
        }
      }
    );

    // Clean up the listener when the component unmounts.
    return () => {
      authListener?.subscription?.unsubscribe();
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
