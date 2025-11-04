import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCachedUser } from '@/lib/cached-auth';
import { withPerformanceLogging } from '@/lib/api-timing';
import { perfLogger, trackAsync } from '@/lib/performance-logger';

async function dashboardHandler(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Track auth query with CACHING
    const authResult = await trackAsync('auth.getUser', async () => {
      return await getCachedUser(token);
    });

    const { data: { user }, error: authError } = authResult as any;

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userType = user.user_metadata?.user_type;
    const expertId = user.user_metadata?.expert_id;

    let query = supabase.from('orders').select('*');

    if (userType === 'customer') {
      query = query.eq('customer_email', user.email);
    } else if (userType === 'expert') {
      query = query.eq('expert_id', expertId);
    }

    // Track main orders query
    const ordersResult = await trackAsync('orders.fetch', async () => {
      return await query;
    }, { userType });

    const { data: orders, error } = ordersResult as any;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats
    const totalOrders = orders?.length || 0;
    const activeOrders = orders?.filter((o: any) => 
      o.status === 'Assigned' || o.status === 'In Progress' || o.status === 'Pending' || o.status === 'Revision'
    ).length || 0;
    const completedOrders = orders?.filter((o: any) => o.status === 'Completed').length || 0;
    const pendingOrders = orders?.filter((o: any) => o.status === 'Pending').length || 0;

    // Get recent orders (last 5)
    const sortedOrders = orders
      ?.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5) || [];

    // ✅ FIX: Get ALL unread counts in ONE query instead of 5
    const orderIds = sortedOrders.map((o: any) => o.id);
    
    const unreadCountsResult = await trackAsync('unreadCounts.batch', async () => {
      return await supabase
        .from('chat_messages')
        .select('order_id')
        .in('order_id', orderIds)
        .eq('is_read', false)
        .neq('sender_id', user.id);
    });

    const { data: unreadMessagesData } = unreadCountsResult as any;

    // Create a map of order_id -> unread_count
    const unreadCountMap = new Map<string, number>();
    unreadMessagesData?.forEach((msg: any) => {
      const count = unreadCountMap.get(msg.order_id) || 0;
      unreadCountMap.set(msg.order_id, count + 1);
    });

    // ✅ FIX: Get ALL ratings in ONE query instead of 5
    const completedOrderIds = sortedOrders
      .filter((o: any) => o.status === 'Completed')
      .map((o: any) => o.id);

    let feedbackMap = new Map<string, any>();
    
    if (completedOrderIds.length > 0) {
      const feedbackResult = await trackAsync('ratings.batch', async () => {
        return await supabase
          .from('order_feedback')
          .select('order_id, expertise_knowledge, timeliness_delivery, platform_support, overall_experience, submitted_at')
          .in('order_id', completedOrderIds);
      });

      const { data: feedbackData } = feedbackResult as any;
      
      feedbackData?.forEach((feedback: any) => {
        feedbackMap.set(feedback.order_id, feedback);
      });
    }

    perfLogger.start('recentOrders.enrichment');
    
    // ✅ Now build the response WITHOUT database calls
    const recentOrders = sortedOrders.map((order: any) => {
      const unread_count = unreadCountMap.get(order.id) || 0;
      
      let rating = null;
      if (order.status === 'Completed') {
        const feedback = feedbackMap.get(order.id);
        
        if (feedback) {
          const avgRating = (
            feedback.expertise_knowledge +
            feedback.timeliness_delivery +
            feedback.platform_support +
            feedback.overall_experience
          ) / 4;
          rating = {
            average: Math.round(avgRating * 10) / 10,
            count: 1,
            submitted_at: feedback.submitted_at,
          };
        } else {
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
        unread_count,
        rating,
      };
    });
    
    perfLogger.end('recentOrders.enrichment', { 
      orderCount: sortedOrders.length,
      strategy: 'batch-query'
    });

    // Get total unread message count
    const unreadResult = await trackAsync('unreadMessages.total', async () => {
      return await supabase
        .from('chat_messages')
        .select('order_id')
        .eq('is_read', false)
        .neq('sender_id', user.id);
    });

    const { data: allUnreadMessages } = unreadResult as any;
    const unreadCount = allUnreadMessages?.length || 0;

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

export const GET = withPerformanceLogging('/api/dashboard', dashboardHandler);