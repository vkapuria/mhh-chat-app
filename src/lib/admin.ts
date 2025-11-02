import { supabaseServer } from './supabase-server';
import { generateSecurePassword } from './password-generator';
import { sendEmail, generateWelcomeEmail } from './email';

export interface CreateUserParams {
  email: string;
  name: string;
  userType: 'customer' | 'expert';
  expertId?: string; // Required if userType is 'expert'
}

export interface CreateUserResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    password: string; // Return password so it can be shown to admin
  };
  error?: string;
}

/**
 * Create a new user account in Supabase Auth
 */
export async function createUserAccount(
  params: CreateUserParams
): Promise<CreateUserResult> {
  try {
    const { email, name, userType, expertId } = params;

    // Validate inputs
    if (!email || !name || !userType) {
      return { success: false, error: 'Missing required fields' };
    }

    if (userType === 'expert' && !expertId) {
      return { success: false, error: 'Expert ID is required for expert accounts' };
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseServer.auth.admin.listUsers();
    const userExists = existingUsers?.users.some((u) => u.email === email);

    if (userExists) {
      return { success: false, error: 'User with this email already exists' };
    }

    // Generate secure password
    const password = generateSecurePassword(12);

    // Prepare user metadata
    const userMetadata: Record<string, string> = {
      name,
      user_type: userType,
    };

    if (userType === 'expert' && expertId) {
      userMetadata.expert_id = expertId;
    }

    // Create user in Supabase Auth
    const { data: newUser, error: createError } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: userMetadata,
    });

    if (createError || !newUser.user) {
      console.error('Error creating user:', createError);
      return { success: false, error: createError?.message || 'Failed to create user' };
    }

    return {
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email!,
        password, // Return password so admin can show it to user
      },
    };
  } catch (error) {
    console.error('Create user error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send welcome email to new user with credentials
 */
export async function sendWelcomeEmailToUser(
  email: string,
  name: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
    
    const emailHtml = generateWelcomeEmail({
      name,
      email,
      password,
      loginUrl,
    });

    const result = await sendEmail({
      to: email,
      subject: 'Welcome to MyHomeworkHelp Chat - Your Login Credentials',
      html: emailHtml,
    });

    return result;
  } catch (error) {
    console.error('Send welcome email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * List all users with optional filtering
 */
export async function listUsers(filters?: {
  userType?: 'customer' | 'expert' | 'admin';
  search?: string;
}) {
  try {
    const { data, error } = await supabaseServer.auth.admin.listUsers();

    if (error) {
      return { success: false, error: error.message, users: [] };
    }

    let users = data.users;

    // Filter by user type
    if (filters?.userType) {
      users = users.filter(
        (u) => u.user_metadata?.user_type === filters.userType
      );
    }

    // Search by name or email
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.email?.toLowerCase().includes(searchLower) ||
          u.user_metadata?.name?.toLowerCase().includes(searchLower)
      );
    }

    return {
      success: true,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name || 'N/A',
        userType: u.user_metadata?.user_type || 'unknown',
        expertId: u.user_metadata?.expert_id,
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
        confirmed: !!u.email_confirmed_at,
      })),
    };
  } catch (error) {
    console.error('List users error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      users: [],
    };
  }
}

/**
 * Get list of experts from experts table (for dropdown)
 */
export async function listExperts() {
  try {
    const { data, error } = await supabaseServer
      .from('experts')
      .select('id, name, email')
      .order('name', { ascending: true });

    if (error) {
      return { success: false, error: error.message, experts: [] };
    }

    return { success: true, experts: data };
  } catch (error) {
    console.error('List experts error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      experts: [],
    };
  }
}