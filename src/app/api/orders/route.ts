import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { withPerformanceLogging } from '@/lib/api-timing';
import { trackAsync, perfLogger } from '@/lib/performance-logger';

async function ordersHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const authResult = await trackAsync('auth.getUser', async () => {
      return await supabase.auth.getUser(token);
    });
    
    const { data: { user }, error: authError } = authResult as any;

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

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        query = query.in('status', ['Assigned', 'In Progress']);
      } else if (status === 'pending') {
        query = query.eq('status', 'Pending');
      } else if (status === 'completed') {
        query = query.eq('status', 'Completed');
      }
    }

    // Apply search filter
    if (search) {
      query = query.or(`id.ilike.%${search}%,title.ilike.%${search}%`);
    }

    // Order by updated_at desc
    query = query.order('updated_at', { ascending: false });

    const ordersResult = await trackAsync('orders.fetch', async () => {
      return await query;
    }, { userType, status, search });

    const { data: orders, error } = ordersResult as any;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ✅ FIX: Get ALL ratings in ONE batch query
    const completedOrderIds = orders
      ?.filter((o: any) => o.status === 'Completed')
      .map((o: any) => o.id) || [];

    let feedbackMap = new Map<string, any>();

    if (completedOrderIds.length > 0) {
      const feedbackResult = await trackAsync('ratings.batchFetch', async () => {
        return await supabase
          .from('order_feedback')
          .select('order_id, expertise_knowledge, timeliness_delivery, platform_support, overall_experience, submitted_at')
          .in('order_id', completedOrderIds);
      }, { completedOrderCount: completedOrderIds.length });

      const { data: feedbackData } = feedbackResult as any;

      // Create map for fast lookup
      feedbackData?.forEach((feedback: any) => {
        feedbackMap.set(feedback.order_id, feedback);
      });
    }

    perfLogger.start('orders.enrichment');

    // ✅ Build response WITHOUT database calls
    const ordersWithRatings = (orders || []).map((order: any) => {
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

    perfLogger.end('orders.enrichment', {
      orderCount: orders?.length || 0,
      completedCount: completedOrderIds.length,
      strategy: 'batch-query'
    });

    return NextResponse.json({
      success: true,
      orders: ordersWithRatings,
    });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withPerformanceLogging('/api/orders', ordersHandler);