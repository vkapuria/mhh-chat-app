import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCachedUser } from '@/lib/cached-auth';
import { withPerformanceLogging } from '@/lib/api-timing';
import { trackAsync, perfLogger } from '@/lib/performance-logger';

async function earningsHandler(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const authResult = await trackAsync('auth.getUser', async () => {
      return await getCachedUser(token);
    });
    
    const { data: { user }, error: authError } = authResult as any;

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userType = user.user_metadata?.user_type;
    if (userType !== 'expert') {
      return NextResponse.json({ error: 'Only experts can view earnings' }, { status: 403 });
    }

    const expertId = user.user_metadata?.expert_id;

    // ✅ OPTIMIZATION: Fetch all orders in ONE query (not two separate queries)
    const allOrdersResult = await trackAsync('orders.fetchAll', async () => {
      return await supabase
        .from('orders')
        .select('*')
        .eq('expert_id', expertId)
        .order('updated_at', { ascending: false });
    }, { expertId });

    const { data: allOrders, error } = allOrdersResult as any;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter completed orders in-memory (faster than separate DB query)
    const completedOrders = allOrders?.filter((o: any) => o.status === 'Completed') || [];

    // Calculate earnings (use expert_fee, NOT amount!)
    const totalEarnings = completedOrders.reduce((sum: number, order: any) => sum + (order.expert_fee || 0), 0);

    // This month (actual calendar month - Nov 1 to today)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEarnings = completedOrders.filter(
      (order: any) => {
        const completedDate = order.completed_at ? new Date(order.completed_at) : new Date(order.updated_at);
        return completedDate >= startOfMonth && completedDate <= now;
      }
    ).reduce((sum: number, order: any) => sum + (order.expert_fee || 0), 0);

    const totalOrders = allOrders?.length || 0;
    const completedCount = completedOrders.length;
    const completionRate = totalOrders > 0 ? Math.round((completedCount / totalOrders) * 100) : 0;

    // Average earnings per order
    const avgEarningsPerOrder = completedCount > 0 ? Math.round(totalEarnings / completedCount) : 0;

    // ✅ FIX: Get ALL ratings in ONE batch query
    const completedOrderIds = completedOrders.map((o: any) => o.id);

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

    perfLogger.start('earnings.enrichment');

    // ✅ Build response WITHOUT database calls
    const ordersWithRatings = completedOrders.map((order: any) => {
      const feedback = feedbackMap.get(order.id);

      let rating = null;
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

      return {
        ...order,
        rating,
      };
    });

    perfLogger.end('earnings.enrichment', {
      orderCount: completedOrders.length,
      strategy: 'batch-query'
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalEarnings,
        thisMonthEarnings,
        completedOrders: completedCount,
        totalOrders,
        completionRate,
        avgEarningsPerOrder,
      },
      orders: ordersWithRatings,
    });
  } catch (error) {
    console.error('Earnings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withPerformanceLogging('/api/earnings', earningsHandler);