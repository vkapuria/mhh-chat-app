import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
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

    // Get order IDs for batch queries
    const completedOrderIds = completedOrders.map((o: any) => o.id);

    console.log('🔍 Starting payroll fetch for', completedOrderIds.length, 'completed orders');
    console.log('👤 Expert ID from auth:', expertId);
    console.log('👤 Expert ID type:', typeof expertId);

    // ✅ FETCH PAYROLL DATA for payment status
    let payrollMap = new Map<string, any>();

    if (completedOrderIds.length > 0) {
      // Step 1: Get payroll items
      console.log('🔍 Searching for these order IDs:', completedOrderIds.slice(0, 5));
      
      // First, let's check if ANY payroll items exist for this expert
      const allPayrollItemsTest = await supabaseAdmin
        .from('expert_payroll_items')
        .select('order_id, expert_id, status')
        .eq('expert_id', expertId)
        .limit(5);
      
      console.log('🧪 Test query - All payroll items for this expert:', {
        found: allPayrollItemsTest.data?.length || 0,
        items: allPayrollItemsTest.data,
        error: allPayrollItemsTest.error
      });
      
      const payrollResult = await trackAsync('payroll.fetchItems', async () => {
        return await supabaseAdmin
          .from('expert_payroll_items')
          .select('order_id, status, approved_at, rejection_reason, payroll_period_id')
          .in('order_id', completedOrderIds);
      }, { completedOrderCount: completedOrderIds.length });

      const { data: payrollItems, error: payrollError } = payrollResult as any;

      console.log('📊 Payroll items query result:', {
        itemsFound: payrollItems?.length || 0,
        error: payrollError,
        searchedFor: completedOrderIds.length,
        sampleSearchIds: completedOrderIds.slice(0, 3),
        sampleFoundItems: payrollItems?.slice(0, 3)
      });

      if (payrollItems && payrollItems.length > 0) {
        // Step 2: Get unique period IDs
        const periodIds = [...new Set(payrollItems.map((item: any) => item.payroll_period_id).filter(Boolean))];

        console.log('🔍 Fetching', periodIds.length, 'payroll periods');

        // Step 3: Fetch period statuses in bulk
        const periodsResult = await trackAsync('payroll.fetchPeriods', async () => {
          return await supabaseAdmin
            .from('expert_payroll_periods')
            .select('id, status, month, year, paid_at, approved_at')  // ← Should have paid_at, approved_at
            .in('id', periodIds);
        }, { periodCount: periodIds.length });

        const { data: periods, error: periodsError } = periodsResult as any;

        console.log('📊 Payroll periods query result:', {
          periodsFound: periods?.length || 0,
          error: periodsError,
          samplePeriods: periods?.slice(0, 3),
          allFields: periods?.[0] // Show ALL fields from first period
        });

        // Create period lookup map
        const periodMap = new Map();
        periods?.forEach((period: any) => {
          periodMap.set(period.id, period);
        });

        // DEBUG: Check what's in periodMap
        console.log('🔍 Period map sample:', Array.from(periodMap.entries())[0]);

        // Step 4: Combine data into payroll map
        payrollItems.forEach((item: any) => {
          const period = periodMap.get(item.payroll_period_id);
          payrollMap.set(item.order_id, {
            payment_status: item.status,
            approved_at: item.approved_at,
            rejection_reason: item.rejection_reason,
            period_status: period?.status,
            period_month: period?.month,
            period_year: period?.year,
            period_paid_at: period?.paid_at,       // ✅ ADD THIS
            period_approved_at: period?.approved_at, // ✅ ADD THIS
          });
        });

        console.log('💰 Payroll data loaded:', {
          totalItems: payrollItems.length,
          mappedOrders: payrollMap.size,
          completedOrderIds: completedOrderIds.slice(0, 5),
          mapEntries: Array.from(payrollMap.entries()).slice(0, 3).map(([orderId, data]) => ({
            orderId,
            payment_status: data.payment_status,
            period_status: data.period_status,
            period_paid_at: data.period_paid_at,
            period_approved_at: data.period_approved_at
          }))
        });
      } else {
        console.warn('⚠️ No payroll items found for completed orders');
      }
    }

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
      const payrollInfo = payrollMap.get(order.id);

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
        payment_status: payrollInfo?.payment_status,
        period_status: payrollInfo?.period_status,
        rejected_reason: payrollInfo?.rejected_reason,
        period_paid_at: payrollInfo?.period_paid_at,
        period_approved_at: payrollInfo?.period_approved_at,
      };
    });

    perfLogger.end('earnings.enrichment', {
      orderCount: completedOrders.length,
      strategy: 'batch-query'
    });

    console.log('📦 Final response preview:', {
      orderCount: ordersWithRatings.length,
      firstOrderId: ordersWithRatings[0]?.id,
      firstOrderPaymentStatus: ordersWithRatings[0]?.payment_status,
      firstOrderPeriodStatus: ordersWithRatings[0]?.period_status,
      sampleOrders: ordersWithRatings.slice(0, 3).map((o: any) => ({
        id: o.id,
        payment_status: o.payment_status,
        period_status: o.period_status
      }))
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