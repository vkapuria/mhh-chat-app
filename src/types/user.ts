// User types for authentication and profile
export type UserType = 'customer' | 'expert' | 'admin';

// MODIFY: Add display_name field
export interface User {
  id: string;
  email: string;
  user_type: UserType;
  name: string;              // Real name (for admin only)
  display_name: string;      // ← ADD THIS: Public display name
  created_at: string;
  customer_id?: string;
  expert_id?: string;
}

export interface UserMetadata {
  name: string;              // Real name
  display_name: string;      // ← ADD THIS: Display name
  user_type: UserType;
  customer_id?: string;
  expert_id?: string;
}

export interface AuthResponse {
  user: User | null;
  session: any | null;
  error: string | null;
}