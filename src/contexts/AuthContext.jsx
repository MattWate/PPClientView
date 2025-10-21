import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { supabase } from '../services/supabaseClient.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: useEffect started.');

    // --- WATCHDOG TIMER ---
    // If loading is still true after 10 seconds, we know it's hung.
    const watchdogTimer = setTimeout(() => {
      if (loading) {
        console.error('--- HANG DETECTED ---');
        console.error('AuthContext: WATCHDOG TIMEOUT. setLoading(false) was never called.');
        console.error('The app is stuck on the await call for supabase.from("profiles").');
        setLoading(false); // Force the app to un-hang
      }
    }, 10000); // 10-second timeout
    // --- END WATCHDOG ---

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('AuthContext: onAuthStateChange fired.');
        clearTimeout(watchdogTimer); // Clear the timer, we got a response.
        setSession(session);

        if (session?.user) {
          console.log(`AuthContext: Session found for user ${session.user.id}.`);
          try {
            console.log('AuthContext: AWAITING profile fetch...');
            const { data, error } = await supabase
              .from('profiles')
              .select('id, full_name, role, company_id')
              .eq('id', session.user.id)
              .single();
            
            console.log('AuthContext: Profile fetch COMPLETE.');

            if (error) {
              console.error('AuthContext: Profile fetch ERROR:', error);
              throw error;
            }
            
            console.log('AuthContext: Profile data found:', data);
            setProfile(data);

          } catch (e) {
            console.error('AuthContext: CATCH block error fetching profile:', e);
            setProfile(null);
          }
        } else {
          console.log('AuthContext: No session, setting profile to null.');
          setProfile(null);
        }
        
        console.log('AuthContext: Calling setLoading(false).');
        setLoading(false);
      }
    );

    return () => {
      console.log('AuthContext: Unsubscribing listener.');
      clearTimeout(watchdogTimer);
      subscription?.unsubscribe();
    };
  }, [loading]); // <-- IMPORTANT: Add 'loading' to the dependency array

  const value = useMemo(() => ({
    session,
    profile,
    loading,
  }), [session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// --- THIS IS THE FIX FOR THE BUILD ERROR ---
export function useAuth() {
  return useContext(AuthContext);
}
