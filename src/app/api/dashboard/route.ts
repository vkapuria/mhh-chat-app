import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userType = user.user_metadata?.user_type;
    const expertId = user.user_metadata?.expert_id;

    let query = supabase.from('orders').select('*');

    // Filter based on user type
    if (userType === 'customer') {
      query = query.eq('customer_email', user.email);
    } else if (userType === 'expert') {
      query = query.eq('expert_id', expertId);
    }

    const { data: orders, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats
    const totalOrders = orders?.length || 0;
    const activeOrders = orders?.filter(o => o.status === 'Assigned' || o.status === 'In Progress').length || 0;
    const completedOrders = orders?.filter(o => o.status === 'Completed').length || 0;
    const pendingOrders = orders?.filter(o => o.status === 'Pending').length || 0;

    // Get recent orders (last 5)
    const recentOrders = orders
      ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5) || [];

    // Get unread message count
    const { data: unreadMessages } = await supabase
      .from('chat_messages')
      .select('order_id')
      .eq('is_read', false)
      .neq('sender_id', user.id);

    const unreadCount = unreadMessages?.length || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        activeOrders,
        completedOrders,
        pendingOrders,
        unreadMessages: unreadCount,
      },
      recentOrders,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}