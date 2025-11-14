import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Check if request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-vercel-cron-secret');
    
    // Allow both admin users and Vercel Cron
    if (!cronSecret) {
      // Regular admin request - verify auth
      if (!authHeader) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const token = authHeader.replace('Bearer ', '');
      const {
        data: { user },
        error: authError,
      } = await supabaseServer.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }

      if (user.user_metadata?.user_type !== 'admin') {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 });
      }
    }
    // If cronSecret exists, Vercel Cron is calling it - allow it

    // Delete logs older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { error, count } = await supabaseServer
      .from('activity_log')
      .delete({ count: 'exact' })
      .lt('created_at', sevenDaysAgo.toISOString());

    if (error) throw error;

    console.log(`🧹 Cleaned up ${count || 0} activity logs older than 7 days`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${count || 0} activity logs older than 7 days`,
      deletedCount: count || 0,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Failed to cleanup logs' }, { status: 500 });
  }
}