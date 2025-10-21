import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthContext: useEffect started.");

    // --- Step 1: Get the initial session ---
    // This is a one-time check when the app loads.
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthContext: Initial getSession complete. Session:", session);
      setSession(session);
      // We set loading to false here initially, even if there's a profile to fetch.
      // This prevents the app from getting stuck if the profile fetch fails.
      setLoading(false); 
    });

    // --- Step 2: Listen for future changes (login/logout) ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("AuthContext: onAuthStateChange fired. New session:", session);
        setSession(session);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log("AuthContext: Unsubscribing from onAuthStateChange.");
      subscription?.unsubscribe();
    };
  }, []);

  // --- Step 3: Fetch profile whenever the session changes ---
  // This separate useEffect runs ONLY when the `session` object changes.
  useEffect(() => {
    if (session?.user) {
      console.log("AuthContext: Session found. Fetching profile for user:", session.user.id);
      setLoading(true); // Set loading to true while we fetch the profile

      supabase
        .from('profiles')
        .select('id, full_name, role, company_id')
        .eq('id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("AuthContext: Error fetching profile.", error);
            setProfile(null);
          } else {
            console.log("AuthContext: Profile fetched successfully.", data);
            setProfile(data);
          }
          setLoading(false); // Always set loading to false after the fetch attempt
        });
    } else {
      // If there is no session, ensure profile is null.
      setProfile(null);
    }
  }, [session]);

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
