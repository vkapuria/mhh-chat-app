import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// In-memory auth cache
interface CachedAuth {
  user: any;
  error: any;
  expiry: number;
}

const authCache = new Map<string, CachedAuth>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cleanup expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, cached] of authCache.entries()) {
    if (now > cached.expiry) {
      authCache.delete(token);
    }
  }
}, 10 * 60 * 1000);

/**
 * Get user from JWT token with caching
 * Cache duration: 5 minutes
 * @param token - JWT token from Authorization header
 */
export async function getCachedUser(token: string) {
  // Check cache first
  const cached = authCache.get(token);
  const now = Date.now();

  if (cached && now < cached.expiry) {
    // Cache hit! Return immediately
    return { data: { user: cached.user }, error: cached.error };
  }

  // Cache miss - fetch from Supabase
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const result = await supabase.auth.getUser(token);

  // Store in cache
  authCache.set(token, {
    user: result.data.user,
    error: result.error,
    expiry: now + CACHE_DURATION,
  });

  return result;
}

/**
 * Invalidate cache for a specific token (e.g., on logout)
 */
export function invalidateAuthCache(token: string) {
  authCache.delete(token);
}

/**
 * Clear entire auth cache (use sparingly)
 */
export function clearAuthCache() {
  authCache.clear();
}

/**
 * Get cache stats (for debugging)
 */
export function getAuthCacheStats() {
  const now = Date.now();
  const total = authCache.size;
  const expired = Array.from(authCache.values()).filter(c => now > c.expiry).length;
  
  return {
    total,
    active: total - expired,
    expired,
  };
}