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
    const activeOrders = orders?.filter(o => o.status === 'Assigned' || o.status === 'In Progress' || o.status === 'Pending' || o.status === 'Revision').length || 0;
    const completedOrders = orders?.filter(o => o.status === 'Completed').length || 0;
    const pendingOrders = orders?.filter(o => o.status === 'Pending').length || 0;

    // Get recent orders (last 5) with their unread counts
const sortedOrders = orders
  ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  .slice(0, 5) || [];

const recentOrders = await Promise.all(
  sortedOrders.map(async (order) => {
    const { count } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('order_id', order.id)
      .eq('is_read', false)
      .neq('sender_id', user.id);

    // Fetch rating data if order is completed
    let rating = null;
    if (order.status === 'Completed') {
      const { data: feedback } = await supabase
        .from('order_feedback')
        .select('expertise_knowledge, timeliness_delivery, platform_support, overall_experience, submitted_at')
        .eq('order_id', order.id)
        .single();

      if (feedback) {
        const avgRating = (
          feedback.expertise_knowledge +
          feedback.timeliness_delivery +
          feedback.platform_support +
          feedback.overall_experience
        ) / 4;
        rating = {
          average: Math.round(avgRating * 10) / 10, // Round to 1 decimal
          count: 1,
          submitted_at: feedback.submitted_at,
        };
      } else {
        // Check if rating is pending (< 6 days since completion)
        const completedAt = order.completed_at ? new Date(order.completed_at) : new Date(order.updated_at);
        const daysSinceCompletion = (new Date().getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24);
        rating = {
          status: 'pending',
          days_since_completion: Math.floor(daysSinceCompletion),
        };
      }
    }

    return {
      ...order,
      unread_count: count || 0,
      rating,
    };
  })
);

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