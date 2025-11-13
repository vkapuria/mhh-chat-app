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
      return NextResponse.json({ success: true, users: onlineUsers });
    }

    if (type === 'recent') {
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: todayLogins } = await supabaseServer
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'login')
        .gte('created_at', today.toISOString());

      const { count: onlineNow } = await supabaseServer
        .from('user_presence')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'online');

      return NextResponse.json({
        success: true,
        stats: {
          todayLogins: todayLogins || 0,
          currentlyOnline: onlineNow || 0,
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