// User types for authentication and profile
export type UserType = 'customer' | 'expert' | 'admin';

export interface User {
  id: string;
  email: string;
  user_type: UserType;
  name: string;
  created_at: string;
  // Link to existing tables
  customer_id?: string;
  expert_id?: string;
}

export interface UserMetadata {
  name: string;
  user_type: UserType;
  customer_id?: string;
  expert_id?: string;
}

export interface AuthResponse {
  user: User | null;
  session: any | null;
  error: string | null;
}