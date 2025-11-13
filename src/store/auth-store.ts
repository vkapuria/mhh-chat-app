import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  display_name: string;
  user_type: 'customer' | 'expert' | 'admin';
  expert_id?: string;
  created_at: string;
  user_metadata?: {
    avatar_url?: string;
    display_name?: string;
    name?: string;
    user_type?: string;
    expert_id?: string;
  };
}

interface AuthStore {
  // State
  user: User | null;
  loading: boolean;
  initialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
  
  // Initialize auth (call once on app startup)
  initializeAuth: () => Promise<void>;
  
  // Login/Logout
  signIn: (email: string, password: string) => Promise<{ error: string | null; user: User | null }>;
  signOut: () => Promise<void>;
}

// Helper: Map Supabase user to our User type
function mapSupabaseUser(authUser: SupabaseUser): User {
  return {
    id: authUser.id,
    email: authUser.email!,
    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
    display_name: authUser.user_metadata?.display_name || authUser.user_metadata?.name || 'User',
    user_type: authUser.user_metadata?.user_type || 'customer',
    expert_id: authUser.user_metadata?.expert_id,
    created_at: authUser.created_at,
    user_metadata: authUser.user_metadata,
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      initialized: false,

      setUser: (user) => set({ user, loading: false }),
      
      setLoading: (loading) => set({ loading }),
      
      clearUser: () => set({ user: null, loading: false }),

      // Initialize auth - call once on app startup
      initializeAuth: async () => {
        // Prevent multiple initializations
        if (get().initialized) {
          console.log('🔵 Auth already initialized, skipping');
          return;
        }

        console.log('🔵 Initializing auth store...');
        
        // Clear any persisted user data first - don't trust it until verified
        set({ user: null, loading: true, initialized: true });

        try {
          // Get current session - use getSession() instead of getUser()
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('🔴 Auth initialization error:', error);
            set({ user: null, loading: false });
            return;
          }

          const authUser = session?.user;

          if (authUser) {
            const mappedUser = mapSupabaseUser(authUser);
            console.log('🟢 User authenticated:', mappedUser.email, mappedUser.user_type);
            set({ user: mappedUser, loading: false });
          } else {
            console.log('⚪ No authenticated user');
            set({ user: null, loading: false });
          }
        } catch (error) {
          console.error('🔴 Auth initialization failed:', error);
          set({ user: null, loading: false });
        }

        // Listen for auth state changes (login/logout)
        supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔵 Auth state changed:', event);

          // Don't process INITIAL_SESSION - we handle that in initializeAuth
          if (event === 'INITIAL_SESSION') {
            return;
          }

          if (event === 'SIGNED_IN' && session?.user) {
            const mappedUser = mapSupabaseUser(session.user);
            console.log('🟢 User signed in:', mappedUser.email);
            set({ user: mappedUser, loading: false });
          } else if (event === 'SIGNED_OUT') {
            console.log('🔴 User signed out');
            set({ user: null, loading: false });
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            const mappedUser = mapSupabaseUser(session.user);
            console.log('🔄 Token refreshed for:', mappedUser.email);
            set({ user: mappedUser });
          }
        });
      },

      // Sign in
      signIn: async (email: string, password: string) => {
        set({ loading: true });

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ loading: false });
            return { error: error.message, user: null };
          }

          if (data.user) {
            const mappedUser = mapSupabaseUser(data.user);
            set({ user: mappedUser, loading: false });
            return { error: null, user: mappedUser };
          }

          set({ loading: false });
          return { error: 'Login failed', user: null };
        } catch (error: any) {
          set({ loading: false });
          return { error: error.message || 'Login failed', user: null };
        }
      },

      // Sign out
      signOut: async () => {
        set({ loading: true });
        
        // Clear login tracking
        const userId = get().user?.id;
        if (userId) {
          sessionStorage.removeItem(`login_logged_${userId}`);
        }
        
        // Sign out from Supabase
        await supabase.auth.signOut();
        
        // Clear user and reset initialized flag
        set({ user: null, loading: false, initialized: false });
        
        // NUCLEAR: Clear localStorage immediately
        localStorage.removeItem('auth-storage');
        
        // Mark that we just logged out (after clearing storage)
        sessionStorage.setItem('just_logged_out', 'true');
        
        // Force reload to ensure clean state
        window.location.href = '/login';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        // Don't persist loading/initialized
      }),
      // CHECK FLAG WHEN REHYDRATING FROM STORAGE
      onRehydrateStorage: () => {
        return (state, error) => {
          // Check if user just logged out
          const justLoggedOut = sessionStorage.getItem('just_logged_out');
          
          if (justLoggedOut) {
            console.log('🔴 Just logged out - clearing stored auth state');
            sessionStorage.removeItem('just_logged_out');
            
            // Clear the rehydrated state
            if (state) {
              state.user = null;
              state.loading = true; // Keep loading true until initializeAuth runs
              state.initialized = false;
            }
          } else if (state && state.user) {
            // Even if we have persisted data, set loading=true until we verify with Supabase
            console.log('⏳ Found persisted auth data, verifying with Supabase...');
            state.loading = true;
            state.user = null; // Don't trust persisted data until verified
          }
        };
      },
    }
  )
);