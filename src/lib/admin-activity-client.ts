import { supabase } from '@/lib/supabase';

export async function fetchAdminActivity(
  type: 'online' | 'recent' | 'stats',
  params?: Record<string, string | number | undefined>
) {
  try {
    // Get the session token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error('No session found');
      return { success: false, error: 'Not authenticated' };
    }

    // Build query string
    const queryParams = new URLSearchParams({ type });
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`/api/admin/activity?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching admin activity:', error);
    return { success: false, error: 'Failed to fetch data' };
  }
}