import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Get session from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify it's an admin by checking the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (user.user_metadata?.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    if (type === 'online') {
      const { data: onlineUsers, error } = await supabaseServer
        .from('user_presence')
        .select('*')
        .eq('status', 'online')
        .order('last_seen', { ascending: false });

      if (error) throw error;

      // 🆕 Enrich with fresh avatars from auth.users
      const enrichedUsers = await Promise.all(
        (onlineUsers || []).map(async (user) => {
          try {
            // Get fresh avatar from auth.users
            const { data: authUser } = await supabaseServer.auth.admin.getUserById(user.user_id);
            
            return {
              ...user,
              avatar_url: authUser?.user?.user_metadata?.avatar_url || user.avatar_url, // Use fresh avatar or fallback
              user_name: authUser?.user?.user_metadata?.display_name || user.user_name, // Also update display name
            };
          } catch (err) {
            console.error('Failed to fetch user metadata for', user.user_id, err);
            return user; // Return original if fetch fails
          }
        })
      );

      return NextResponse.json({ success: true, users: enrichedUsers });
    }

    if (type === 'recent') {
      const actionParam = searchParams.get('action'); // 'login' | 'page_view' | 'logout' | 'heartbeat' | null
      const search = searchParams.get('search') || '';
      const limitParam = searchParams.get('limit');
      const offsetParam = searchParams.get('offset');
    
      const limit = Math.min(Number(limitParam) || 25, 100); // cap at 100 per page
      const offset = Number(offsetParam) || 0;
    
      const startDateParam = searchParams.get('start_date');
const endDateParam = searchParams.get('end_date');

// Default to last 24 hours if not specified
const since = startDateParam 
  ? new Date(startDateParam) 
  : new Date(Date.now() - 24 * 60 * 60 * 1000);

let query = supabaseServer
  .from('activity_log')
  .select('*', { count: 'exact' })
  .gte('created_at', since.toISOString());

// Add end date filter if provided (for "yesterday" filter)
if (endDateParam) {
  query = query.lt('created_at', endDateParam);
}
    
      // Filter by action if provided and not 'all'
      if (actionParam && actionParam !== 'all') {
        query = query.eq('action', actionParam);
      }
    
      // Search by name or email (case-insensitive)
      if (search.trim().length > 0) {
        const term = search.trim();
        query = query.or(
          `user_email.ilike.%${term}%,user_name.ilike.%${term}%`
        );
      }
    
      const from = offset;
      const to = offset + limit - 1;
    
      const { data: recentActivity, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
    
      if (error) throw error;
    
      return NextResponse.json({
        success: true,
        activity: recentActivity || [],
        total: count || 0,
      });
    }

    if (type === 'stats') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
    
      // Today Login COUNT
      const { count: todayLogins } = await supabaseServer
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'login')
        .gte('created_at', todayISO);
    
      // Currently Online Count
      const { count: onlineNow } = await supabaseServer
        .from('user_presence')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'online');
    
      // 🔵 TODAY LOGIN LIST (deduplicated by user, most recent only)
      const { data: todayLoginRows } = await supabaseServer
        .from('activity_log')
        .select('user_id,user_name,user_email,user_type,created_at')
        .eq('action', 'login')
        .gte('created_at', todayISO)
        .order('created_at', { ascending: false });
    
      // 🆕 Deduplicate by user_id (keep only most recent login per user)
      const seenUsers = new Set<string>();
      const uniqueLoginRows = (todayLoginRows ?? []).filter((row) => {
        if (seenUsers.has(row.user_id)) {
          return false; // Skip duplicate
        }
        seenUsers.add(row.user_id);
        return true; // Keep first occurrence (most recent)
      });
    
      // Get fresh avatars from auth.users
      const todayLoginsList = await Promise.all(
        uniqueLoginRows.map(async (row) => {
          try {
            // Get fresh avatar from auth.users
            const { data: authUser } = await supabaseServer.auth.admin.getUserById(row.user_id);
            
            return {
              user_id: row.user_id,
              user_name: authUser?.user?.user_metadata?.display_name || row.user_name,
              user_email: row.user_email,
              user_type: row.user_type,
              avatar_url: authUser?.user?.user_metadata?.avatar_url || null,
              created_at: row.created_at,
            };
          } catch (err) {
            console.error('Failed to fetch user metadata for', row.user_id, err);
            return {
              user_id: row.user_id,
              user_name: row.user_name,
              user_email: row.user_email,
              user_type: row.user_type,
              avatar_url: null,
              created_at: row.created_at,
            };
          }
        })
      );
    
      // 📈 LAST 7 DAYS LOGIN TREND
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6); // include today
      startDate.setHours(0, 0, 0, 0);
    
      const { data: loginRows } = await supabaseServer
        .from('activity_log')
        .select('created_at')
        .eq('action', 'login')
        .gte('created_at', startDate.toISOString());
    
      // aggregate by day
      const counts: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10); // yyyy-mm-dd
        counts[key] = 0;
      }
    
      (loginRows ?? []).forEach((row) => {
        const key = row.created_at.slice(0, 10);
        if (counts[key] !== undefined) counts[key]++;
      });
    
      const last7daysLogins = Object.entries(counts).map(([date, count]) => ({
        date,
        count,
      }));
    
      // 🆕 MOST VISITED PAGE (TODAY)
      const { data: pageViewRows } = await supabaseServer
        .from('activity_log')
        .select('page_path')
        .eq('action', 'page_view')
        .gte('created_at', todayISO);
    
      let mostVisitedPage = null;
      if (pageViewRows && pageViewRows.length > 0) {
        const pageCounts: Record<string, number> = {};
        pageViewRows.forEach((row) => {
          if (row.page_path) {
            pageCounts[row.page_path] = (pageCounts[row.page_path] || 0) + 1;
          }
        });
    
        if (Object.keys(pageCounts).length > 0) {
          const sorted = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]);
          mostVisitedPage = {
            page_path: sorted[0][0],
            count: sorted[0][1],
          };
        }
      }
    
      // 🆕 AVERAGE SESSION DURATION (TODAY)
      const { data: logoutRows } = await supabaseServer
        .from('activity_log')
        .select('session_duration')
        .eq('action', 'logout')
        .gte('created_at', todayISO)
        .not('session_duration', 'is', null);
    
      let avgSessionDurationSeconds = null;
      if (logoutRows && logoutRows.length > 0) {
        const totalSeconds = logoutRows.reduce(
          (sum, row) => sum + (row.session_duration || 0),
          0
        );
        avgSessionDurationSeconds = Math.round(totalSeconds / logoutRows.length);
      }
    
      return NextResponse.json({
        success: true,
        stats: {
          todayLogins: todayLogins || 0,
          currentlyOnline: onlineNow || 0,
          todayLoginsList,
          last7daysLogins,
          mostVisitedPage,
          avgSessionDurationSeconds,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Activity API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, action, session_duration } = body;

    if (action === 'logout' && user_id) {
      await supabaseServer
        .from('user_presence')
        .update({ status: 'offline', last_seen: new Date().toISOString() })
        .eq('user_id', user_id);

      await supabaseServer.from('activity_log').insert({
        user_id,
        action: 'logout',
        session_duration,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout tracking error:', error);
    return NextResponse.json({ error: 'Failed to track logout' }, { status: 500 });
  }
}