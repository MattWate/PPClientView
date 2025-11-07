// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { supabase } from '../services/supabaseClient.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🔐 AuthContext: Initializing...');
        
        // Get the initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          throw sessionError;
        }
        
        if (!mounted) return;
        
        console.log('Session:', session ? 'Found' : 'None');
        setSession(session);

        // If there's a session, fetch the profile
        if (session?.user?.id) {
          console.log('📡 Fetching profile...');
          
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('❌ Profile error:', profileError);
            // Don't throw - just set profile to null
            // This allows the app to continue and show the "profile not found" screen
            if (mounted) setProfile(null);
          } else if (mounted) {
            console.log('✅ Profile loaded');
            setProfile(userProfile);
          }
        } else {
          console.log('No session, skipping profile fetch');
          if (mounted) setProfile(null);
        }
      } catch (e) {
        console.error('💥 Auth initialization error:', e);
        if (mounted) {
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          console.log('🏁 Auth initialization complete');
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    console.log('👂 Setting up auth listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state changed:', event);
        
        if (!mounted) return;
        
        setSession(session);

        if (session?.user?.id) {
          // Fetch profile when user logs in
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Profile fetch error on auth change:', error);
          }

          if (mounted) {
            setProfile(userProfile || null);
          }
        } else {
          if (mounted) setProfile(null);
        }
        
        if (mounted) setLoading(false);
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth listener');
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    session,
    profile,
    loading,
  }), [session, profile, loading]);

  console.log('🔄 AuthContext render - loading:', loading, 'session:', !!session, 'profile:', !!profile);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
