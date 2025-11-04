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

    // ✅ OPTIMIZATION 1: Lean SELECT with pagination (20 recent orders only)
    let ordersQuery = supabase.from('orders').select(`
      id,
      title,
      task_code,
      status,
      updated_at,
      amount,
      expert_fee,
      customer_display_name,
      expert_display_name
    `);

    if (userType === 'customer') {
      ordersQuery = ordersQuery.eq('customer_email', user.email);
    } else if (userType === 'expert') {
      ordersQuery = ordersQuery.eq('expert_id', expertId);
    }

    // Pagination: Only last 20 orders
    ordersQuery = ordersQuery
      .order('updated_at', { ascending: false })
      .limit(20);

    // Track main orders query
    const ordersResult = await trackAsync('orders.fetch', async () => {
      return await ordersQuery;
    }, { userType, limit: 20 });

    const { data: orders, error } = ordersResult as any;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ✅ OPTIMIZATION 2: One SQL call for ALL tile counts
    const tilesResult = await trackAsync('tiles.sqlFunction', async () => {
      try {
        const result = await supabase.rpc('dashboard_summary', {
          p_user_type: userType,
          p_expert_id: expertId || null,
          p_email: user.email,
          p_current_user_id: user.id
        });

        if (!result.error && result.data && result.data.length > 0) {
          return result;
        }

        // Fallback: compute in JS if function doesn't exist
        console.log('SQL function not found, using fallback');
        throw new Error('Fallback');
      } catch {
        // Fallback computation (less efficient but works)
        const allOrders = orders || [];
        
        const activeCount = allOrders.filter((o: any) => 
          ['Assigned', 'In Progress', 'Revision', 'Pending'].includes(o.status)
        ).length;

        const pendingPaymentCount = allOrders.filter((o: any) =>
          ['Awaiting Payment', 'Payment Due'].includes(o.status)
        ).length;

        const today = new Date().toISOString().split('T')[0];
          const dueTodayCount = allOrders.filter((o: any) =>
            o.deadline?.startsWith(today)
          ).length;

        // Unread messages count
        const { data: unreadData } = await supabase
          .from('chat_messages')
          .select('id')
          .in('order_id', allOrders.map((o: any) => o.id))
          .eq('is_read', false)
          .neq('sender_id', user.id);

        return {
          data: [{
            active_count: activeCount,
            pending_payment_count: pendingPaymentCount,
            due_today_count: dueTodayCount,
            unread_total: unreadData?.length || 0
          }]
        };
      }
    }, { userType });

    const tilesData = tilesResult?.data?.[0] || {
      active_count: 0,
      pending_payment_count: 0,
      due_today_count: 0,
      unread_total: 0
    };

    // Calculate total orders from tiles (more accurate)
    const totalOrders = orders?.length || 0;
    const completedOrders = orders?.filter((o: any) => o.status === 'Completed').length || 0;

    // Get recent orders (last 5 for dashboard widget)
    const recentOrders = orders?.slice(0, 5) || [];

    // ✅ OPTIMIZATION 3: Batch ratings query (if any completed orders in recent 5)
    const completedOrderIds = recentOrders
      .filter((o: any) => o.status === 'Completed')
      .map((o: any) => o.id);

    let feedbackMap = new Map<string, any>();

    if (completedOrderIds.length > 0) {
      const feedbackResult = await trackAsync('ratings.batch', async () => {
        return await supabase
          .from('order_feedback')
          .select('order_id, expertise_knowledge, timeliness_delivery, platform_support, overall_experience, submitted_at')
          .in('order_id', completedOrderIds);
      }, { completedOrderCount: completedOrderIds.length });

      const { data: feedbackData } = feedbackResult as any;

      feedbackData?.forEach((feedback: any) => {
        feedbackMap.set(feedback.order_id, feedback);
      });
    }

    perfLogger.start('recentOrders.enrichment');

    // Build response for recent orders
    const recentOrdersWithData = recentOrders.map((order: any) => {
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
        rating,
      };
    });

    perfLogger.end('recentOrders.enrichment', {
      orderCount: recentOrders.length,
      strategy: 'sql-optimized'
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        activeOrders: Number(tilesData.active_count),
        completedOrders,
        pendingOrders: Number(tilesData.pending_payment_count),
        unreadMessages: Number(tilesData.unread_total),
      },
      recentOrders: recentOrdersWithData,
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