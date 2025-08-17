// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      console.log("🔄 Checking for existing session...");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("🟢 Session:", session);

        if (session) {
          console.log("🔍 Fetching profile for:", session.user.id);
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) throw error;

          console.log("🟢 Profile:", userProfile);

          if (userProfile?.role === 'super_admin') {
            console.warn("🚫 Super admin detected, logging out...");
            await supabase.auth.signOut();
            setSession(null);
            setProfile(null);
          } else {
            setSession(session);
            setProfile(userProfile);
          }
        } else {
          console.log("🟡 No session found");
          setSession(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("❌ Initial session fetch error:", error);
        setSession(null);
        setProfile(null);
      } finally {
        console.log("✅ Auth state loading complete");
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("⚡ Auth state changed:", _event, session);

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

    return () => {
      authListener?.unsubscribe?.(); // ✅ modern safe cleanup
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
