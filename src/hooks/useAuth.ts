'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';
import { signIn, signOut, getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    getCurrentUser().then((user) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    
    if (result.user) {
      setUser(result.user);
      // Don't redirect here - let the login page handle it
    }
    
    return result;
  };

  const logout = async () => {
    setLoading(true);
    await signOut();
    setUser(null);
    setLoading(false);
    router.push('/login');
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}