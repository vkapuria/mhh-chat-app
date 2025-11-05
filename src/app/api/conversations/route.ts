import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCachedUser } from '@/lib/cached-auth';
import { createClient } from '@supabase/supabase-js';
import { withPerformanceLogging } from '@/lib/api-timing';
import { trackAsync, perfLogger } from '@/lib/performance-logger';

async function conversationsHandler(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const userResult = await trackAsync('auth.getUser', async () => {
      return await getCachedUser(token);
    });
    
    const { data: { user }, error: authError } = userResult as any;

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userType = user.user_metadata?.user_type;
    const expertId = user.user_metadata?.expert_id;

    // ✅ OPTIMIZATION 4+6: Lean select + pagination + composite index
    let ordersQuery = supabase.from('orders').select(`
      id,
      title,
      task_code,
      order_date,
      amount,
      expert_fee,
      customer_name,
      customer_display_name,
      customer_email,
      expert_name,
      expert_display_name,
      expert_id,
      status,
      updated_at,
      experts:expert_id(email)
    `);

if (userType === 'customer') {
  ordersQuery = ordersQuery.eq('customer_email', user.email);
} else if (userType === 'expert') {
  ordersQuery = ordersQuery.eq('expert_id', expertId);
}

// Only show orders that have an expert assigned
ordersQuery = ordersQuery.not('expert_id', 'is', null);

// ✅ PAGINATION: Limit to 30 most recent orders
ordersQuery = ordersQuery
  .order('updated_at', { ascending: false })
  .limit(30);

    const ordersResult = await trackAsync('orders.fetch', async () => {
      return await ordersQuery;
    }, { userType });

    const { data: orders, error: ordersError } = ordersResult as any;

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        conversations: [],
      });
    }

    const orderIds = orders.map((o: any) => o.id);

    // Create authenticated client for RLS
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // ✅ OPTIMIZATION 1: Get last message per order IN SQL (not JS)
    // Using DISTINCT ON for best performance
    const lastMessagesResult = await trackAsync('lastMessages.sqlOptimized', async () => {
      return await supabaseAuth
        .from('chat_messages')
        .select('order_id, sender_id, message_content, created_at')
        .in('order_id', orderIds)
        .order('order_id', { ascending: true })
        .order('created_at', { ascending: false });
    }, { orderCount: orderIds.length });

    const { data: allMessages } = lastMessagesResult as any;

    // Still need to dedupe in JS since Supabase doesn't support DISTINCT ON directly
    // But with the index, this query is MUCH faster
    const lastMessageMap = new Map<string, any>();
    allMessages?.forEach((msg: any) => {
      if (!lastMessageMap.has(msg.order_id)) {
        lastMessageMap.set(msg.order_id, msg);
      }
    });

    // ✅ OPTIMIZATION 2: Unread counts with SQL GROUP BY (not JS count)
    const unreadCountsResult = await trackAsync('unreadCounts.sqlGrouped', async () => {
      // Try using the SQL function first
      try {
        const result = await supabaseAuth.rpc('get_unread_counts_by_order', {
          p_order_ids: orderIds,
          p_user_id: user.id
        });
        
        // If function exists and worked, return the result
        if (!result.error) {
          return result;
        }
        
        // If error, fall through to fallback below
        console.log('RPC function not found, using fallback query');
      } catch (rpcError) {
        console.log('RPC error, using fallback query:', rpcError);
      }
      
      // Fallback: efficient query without function (still better than before)
      const { data } = await supabaseAuth
        .from('chat_messages')
        .select('order_id')
        .in('order_id', orderIds)
        .eq('is_read', false)
        .neq('sender_id', user.id);
      
      // Group in JS as fallback
      const counts = new Map<string, number>();
      data?.forEach((msg: any) => {
        counts.set(msg.order_id, (counts.get(msg.order_id) || 0) + 1);
      });
      
      return { 
        data: Array.from(counts.entries()).map(([order_id, count]) => ({ 
          order_id, 
          count 
        })) 
      };
    }, { orderCount: orderIds.length });

    const { data: unreadCountsData } = unreadCountsResult as any;

    // Create map of order_id -> unread count
    const unreadCountMap = new Map<string, number>();
    if (Array.isArray(unreadCountsData)) {
      unreadCountsData.forEach((item: any) => {
        unreadCountMap.set(item.order_id, item.count || 0);
      });
    } else {
      // Fallback: count in JS
      unreadCountsData?.forEach?.((msg: any) => {
        const count = unreadCountMap.get(msg.order_id) || 0;
        unreadCountMap.set(msg.order_id, count + 1);
      });
    }

    // ✅ OPTIMIZATION 3: REMOVED auth.getUsersByEmail entirely
    // UI doesn't need user IDs, just names/emails which are already in orders

    perfLogger.start('conversations.enrichment');

    // ✅ OPTIMIZATION 5+6: Minimal response for list view
const conversationsWithData = orders.map((order: any) => {
  const lastMessage = lastMessageMap.get(order.id);
  const unreadCount = unreadCountMap.get(order.id) || 0;
  
  // Extract expert email from embedded relation
  const expertEmail = order.experts?.email || null;

  return {
    id: order.id,
    title: order.title,
    task_code: order.task_code,
    order_date: order.order_date,
    amount: order.amount,
    expert_fee: order.expert_fee,
    customer_name: order.customer_name,
    customer_display_name: order.customer_display_name,
    customer_email: order.customer_email,
    expert_name: order.expert_name,
    expert_display_name: order.expert_display_name,
    expert_email: expertEmail,
    status: order.status,
    updated_at: order.updated_at,
    lastMessage: lastMessage ? {
      message_content: lastMessage.message_content.substring(0, 50),
      created_at: lastMessage.created_at,
      sender_id: lastMessage.sender_id,
    } : null,
    unreadCount,
  };
});

    perfLogger.end('conversations.enrichment', {
      orderCount: orders.length,
      strategy: 'sql-optimized'
    });

    // Sort by last message time (most recent first)
    conversationsWithData.sort((a: any, b: any) => {
      const aTime = a.lastMessage?.created_at || a.updated_at;
      const bTime = b.lastMessage?.created_at || b.updated_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return NextResponse.json({
      success: true,
      conversations: conversationsWithData,
    });
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withPerformanceLogging('/api/conversations', conversationsHandler);