'use client';

import { useAuthStore } from '@/store/auth-store';

export function useAuth() {
  const { user, loading, signIn, signOut } = useAuthStore();

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login: signIn,
    logout: signOut,
  };
}