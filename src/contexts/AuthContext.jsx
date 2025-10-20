// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // This function fetches the profile for a given user ID
  const fetchProfile = async (userId) => {
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role, company_id')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      setProfile(userProfile || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    // 1. Run initial setup on app load
    const setupAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (initialSession?.user) {
          await fetchProfile(initialSession.user.id);
        } else {
          setProfile(null);
        }
        
        setSession(initialSession);

      } catch (error) {
        console.error('Error in initial auth setup:', error);
        setSession(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    setupAuth();

    // 2. Set up the listener for subsequent auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        
        // --- THIS IS THE FIX ---
        // When the session changes (e.g., user logs in or out),
        // we must update the session AND fetch the new profile (or set it to null).

        setSession(newSession); // Set session immediately

        if (newSession?.user) {
          // User just logged in
          await fetchProfile(newSession.user.id);
        } else {
          // User just logged out
          setProfile(null);
        }
        // --- END OF FIX ---
      }
    );

    // Clean up the listener
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
