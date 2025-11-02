import { supabaseServer } from './supabase-server';

/**
 * Generate display name from real name
 * Format: "FirstName LastInitial."
 * Example: "Prachi Singh" → "Prachi S."
 */
export function generateDisplayName(fullName: string): string {
  const parts = fullName.trim().split(' ').filter(Boolean);
  
  if (parts.length === 0) return 'User';
  if (parts.length === 1) return parts[0]; // Single name stays as is
  
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  
  return `${firstName} ${lastInitial}.`;
}

/**
 * Validation rules for display names
 */
export function validateDisplayName(displayName: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Trim whitespace
  const trimmed = displayName.trim();
  
  // Length check
  if (trimmed.length < 2) {
    errors.push('Display name must be at least 2 characters');
  }
  if (trimmed.length > 30) {
    errors.push('Display name must be less than 30 characters');
  }
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(trimmed)) {
    errors.push('Display name must contain at least one letter');
  }
  
  // Character check - letters, spaces, hyphens, periods only
  if (!/^[a-zA-Z\s\-\.]+$/.test(trimmed)) {
    errors.push('Display name can only contain letters, spaces, hyphens, and periods');
  }
  
  // Email/phone pattern check
  if (/@/.test(trimmed) || /\d{10}/.test(trimmed.replace(/\D/g, ''))) {
    errors.push('Display name cannot contain email addresses or phone numbers');
  }
  
  // Profanity check (basic - expand as needed)
  const profanityList = [
    'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 
    'cunt', 'dick', 'pussy', 'cock', 'whore', 'slut'
  ];
  const lowerName = trimmed.toLowerCase();
  if (profanityList.some(word => lowerName.includes(word))) {
    errors.push('Display name contains inappropriate language');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if display name is unique across all users
 * Returns true if unique (available), false if taken
 */
export async function isDisplayNameUnique(
  displayName: string,
  excludeUserId?: string // Don't count this user (for updates)
): Promise<boolean> {
  try {
    // Get all users from Supabase Auth
    const { data: { users }, error } = await supabaseServer.auth.admin.listUsers();
    
    if (error) {
      console.error('Error checking display name uniqueness:', error);
      return false; // Assume not unique on error (safer)
    }
    
    // Check if any user has this display name (case-insensitive)
    const displayNameLower = displayName.toLowerCase().trim();
    const isTaken = users.some(user => {
      // Skip the current user if updating
      if (excludeUserId && user.id === excludeUserId) {
        return false;
      }
      
      const userDisplayName = user.user_metadata?.display_name?.toLowerCase().trim();
      return userDisplayName === displayNameLower;
    });
    
    return !isTaken; // Return true if NOT taken
  } catch (error) {
    console.error('Exception checking display name uniqueness:', error);
    return false; // Assume not unique on error (safer)
  }
}

/**
 * Suggest alternative display names if taken
 * Example: "John D." → ["John D.2", "John D.3", "J. Doe"]
 */
export function suggestAlternativeDisplayNames(
  originalName: string,
  count: number = 3
): string[] {
  const suggestions: string[] = [];
  
  // Add numbers
  for (let i = 2; i <= count + 1; i++) {
    suggestions.push(`${originalName}${i}`);
  }
  
  return suggestions;
}