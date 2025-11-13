import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'online', 'recent', 'stats'

    // Verify admin
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user || user.user_metadata?.user_type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (type === 'online') {
      // Get currently online users
      const { data: onlineUsers, error } = await supabaseServer
        .from('user_presence')
        .select('*')
        .eq('status', 'online')
        .order('last_seen', { ascending: false });

      if (error) throw error;

      return NextResponse.json({ success: true, users: onlineUsers });
    }

    if (type === 'recent') {
      // Get recent activity (last 24 hours)
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      const { data: recentActivity, error } = await supabaseServer
        .from('activity_log')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return NextResponse.json({ success: true, activity: recentActivity });
    }

    if (type === 'stats') {
      // Get activity stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayLogins, error: loginsError } = await supabaseServer
        .from('activity_log')
        .select('user_id', { count: 'exact', head: true })
        .eq('action', 'login')
        .gte('created_at', today.toISOString());

      const { data: onlineNow, error: onlineError } = await supabaseServer
        .from('user_presence')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'online');

      if (loginsError || onlineError) {
        throw loginsError || onlineError;
      }

      return NextResponse.json({
        success: true,
        stats: {
          todayLogins: todayLogins || 0,
          currentlyOnline: onlineNow || 0,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Activity API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle logout tracking from sendBeacon
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, action, session_duration } = body;

    if (action === 'logout' && user_id) {
      // Mark user as offline
      await supabaseServer
        .from('user_presence')
        .update({ status: 'offline', last_seen: new Date().toISOString() })
        .eq('user_id', user_id);

      // Log logout activity
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