
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './services/supabase';
import { Profile } from './types';
import Login from './components/Login';
import Layout from './components/Layout';
import { SpinnerIcon } from './components/Icons';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (user: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
        await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <SpinnerIcon className="w-12 h-12 text-blue-500" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, logout: handleLogout, refreshProfile }}>
      {session && profile ? <Layout /> : <Login />}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};