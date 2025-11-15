import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { getCachedUser } from '@/lib/cached-auth';
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
      return await getCachedUser(token);
    });
    
    const { data: { user }, error: authError } = authResult as any;

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userType = user.user_metadata?.user_type;
    const expertId = user.user_metadata?.expert_id;

    // ✅ OPTIMIZATION: Lean SELECT (only what UI needs)
    let query = supabase.from('orders').select(`
      id,
      title,
      task_code,
      status,
      deadline,
      created_at,
      completed_at,
      updated_at,
      customer_name,
      customer_display_name,
      customer_email,
      expert_id,
      expert_name,
      expert_display_name,
      amount,
      expert_fee
    `);

    // Filter based on user type
    if (userType === 'customer') {
      query = query.eq('customer_email', user.email);
    } else if (userType === 'expert') {
      query = query.eq('expert_id', expertId);
    }

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        query = query.in('status', ['Assigned', 'Revision']);
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

    // ✅ OPTIMIZATION: Pagination (limit to 50 orders)
    // Order by updated_at desc
    query = query
      .order('updated_at', { ascending: false })
      .limit(50);

    const ordersResult = await trackAsync('orders.fetch', async () => {
      return await query;
    }, { userType, status, search, limit: 50 });

    const { data: orders, error } = ordersResult as any;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

     // 🆕 Get display names from auth.users for orders missing them
     const expertIds = [...new Set(orders?.map((o: any) => o.expert_id).filter(Boolean))];
     const customerEmails = [...new Set(orders?.map((o: any) => o.customer_email).filter(Boolean))];
 
     // Fetch all auth users
     const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
 
 // Build display name and avatar maps
 const expertDisplayNameMap = new Map<string, string>();
 const expertAvatarMap = new Map<string, string>();
 const customerDisplayNameMap = new Map<string, string>();
 const customerAvatarMap = new Map<string, string>();

 authUsers?.users.forEach((authUser: any) => {
   const expertId = authUser.user_metadata?.expert_id;
   const displayName = authUser.user_metadata?.display_name;
   const avatarUrl = authUser.user_metadata?.avatar_url;

   // Map expert_id → display_name & avatar
   if (expertId && expertIds.includes(expertId)) {
     if (displayName) expertDisplayNameMap.set(expertId, displayName);
     if (avatarUrl) expertAvatarMap.set(expertId, avatarUrl);
   }

   // Map email → display_name & avatar
   if (authUser.email && customerEmails.includes(authUser.email)) {
     if (displayName) customerDisplayNameMap.set(authUser.email, displayName);
     if (avatarUrl) customerAvatarMap.set(authUser.email, avatarUrl);
   }
 });

     // 🐛 DEBUG LOGS
    console.log('📊 Expert IDs from orders:', expertIds);
    console.log('📊 Expert Display Name Map:', Object.fromEntries(expertDisplayNameMap));
    console.log('📊 Total auth users fetched:', authUsers?.users?.length);
    console.log('📊 Sample auth user:', authUsers?.users?.[0]?.user_metadata);

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
      // 🆕 Use display names and avatars from auth.users
      const expertDisplayName = order.expert_display_name || expertDisplayNameMap.get(order.expert_id) || 'Expert';
      const expertAvatar = expertAvatarMap.get(order.expert_id);
      const customerDisplayName = order.customer_display_name || customerDisplayNameMap.get(order.customer_email) || 'Student';
      const customerAvatar = customerAvatarMap.get(order.customer_email);

            // 🐛 DEBUG LOG
            console.log(`Order ${order.id}: expert_id=${order.expert_id}, mapped_name=${expertDisplayNameMap.get(order.expert_id)}, final_name=${expertDisplayName}`);


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
        expert_display_name: expertDisplayName,
        expert_avatar: expertAvatar,  // ✅ Add avatar
        customer_display_name: customerDisplayName,
        customer_avatar: customerAvatar,  // ✅ Add avatar
        rating,
      };
    });

    perfLogger.end('orders.enrichment', {
      orderCount: orders?.length || 0,
      completedCount: completedOrderIds.length,
      strategy: 'sql-optimized',
      limit: 50
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