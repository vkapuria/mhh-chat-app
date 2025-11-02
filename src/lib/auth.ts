import { supabase } from './supabase';
import { User, UserType, AuthResponse } from '@/types/user';

// Login with email and password
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    // Get user metadata
    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      user_type: data.user.user_metadata.user_type as UserType,
      name: data.user.user_metadata.name || '',
      display_name: data.user.user_metadata.display_name || data.user.user_metadata.name || '', // ← NEW: Use display_name if exists, fallback to name
      created_at: data.user.created_at || '',
      customer_id: data.user.user_metadata.customer_id,
      expert_id: data.user.user_metadata.expert_id,
    };

    return { user, session: data.session, error: null };
  } catch (err) {
    return { 
      user: null, 
      session: null, 
      error: err instanceof Error ? err.message : 'Login failed' 
    };
  }
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Get current session
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
}

// Get current user with metadata
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      user_type: user.user_metadata.user_type as UserType,
      name: user.user_metadata.name || '',
      display_name: user.user_metadata.display_name || user.user_metadata.name || '', // ← NEW: Use display_name if exists, fallback to name
      created_at: user.created_at || '',
      customer_id: user.user_metadata.customer_id,
      expert_id: user.user_metadata.expert_id,
    };
  } catch {
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

// Create user account (admin only - will be called from main app)
export async function createUserAccount(
  email: string,
  password: string,
  userData: {
    name: string;
    user_type: UserType;
    customer_id?: string;
    expert_id?: string;
  }
) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  } catch (err) {
    return { 
      user: null, 
      error: err instanceof Error ? err.message : 'Failed to create account' 
    };
  }
}