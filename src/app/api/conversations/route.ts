import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { withPerformanceLogging } from '@/lib/api-timing';
import { trackAsync, perfLogger } from '@/lib/performance-logger';

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function conversationsHandler(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const userResult = await trackAsync('auth.getUser', async () => {
      return await supabase.auth.getUser(token);
    });
    
    const { data: { user }, error: authError } = userResult as any;

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userType = user.user_metadata?.user_type;
    const expertId = user.user_metadata?.expert_id;

    // Get orders based on user type
    let ordersQuery = supabase.from('orders').select('*');

    if (userType === 'customer') {
      ordersQuery = ordersQuery.eq('customer_email', user.email);
    } else if (userType === 'expert') {
      ordersQuery = ordersQuery.eq('expert_id', expertId);
    }

    // Only show orders that have an expert assigned
    ordersQuery = ordersQuery.not('expert_id', 'is', null);

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

    // Get expert emails for all unique expert IDs
    const expertIds = [...new Set(orders.map((order: any) => order.expert_id).filter(Boolean))];
    
    const expertsResult = await trackAsync('experts.fetchEmails', async () => {
      return await supabase
        .from('experts')
        .select('id, email')
        .in('id', expertIds);
    }, { expertCount: expertIds.length });

    const { data: experts } = expertsResult as any;

    // Create a map of expert_id -> email
    const expertEmailMap = new Map(
      experts?.map((expert: any) => [expert.id, expert.email]) || []
    );

    // ✅ FIX 1: Batch fetch ALL last messages in ONE query
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

    // Use a subquery approach to get the latest message per order
    const lastMessagesResult = await trackAsync('lastMessages.batchFetch', async () => {
      // Fetch ALL messages for these orders and we'll filter client-side
      return await supabaseAuth
        .from('chat_messages')
        .select('order_id, sender_id, message_content, created_at')
        .in('order_id', orderIds)
        .order('created_at', { ascending: false });
    }, { orderCount: orderIds.length });

    const { data: allMessages } = lastMessagesResult as any;

    // Create a map of order_id -> last message
    const lastMessageMap = new Map<string, any>();
    allMessages?.forEach((msg: any) => {
      if (!lastMessageMap.has(msg.order_id)) {
        lastMessageMap.set(msg.order_id, msg);
      }
    });

    // ✅ FIX 2: Batch fetch ALL unread counts in ONE query
    const unreadMessagesResult = await trackAsync('unreadMessages.batchFetch', async () => {
      return await supabaseAuth
        .from('chat_messages')
        .select('order_id')
        .in('order_id', orderIds)
        .eq('is_read', false)
        .neq('sender_id', user.id);
    }, { orderCount: orderIds.length });

    const { data: allUnreadMessages } = unreadMessagesResult as any;

    // Create a map of order_id -> unread count
    const unreadCountMap = new Map<string, number>();
    allUnreadMessages?.forEach((msg: any) => {
      const count = unreadCountMap.get(msg.order_id) || 0;
      unreadCountMap.set(msg.order_id, count + 1);
    });

    // ✅ FIX 3: Get user IDs more efficiently
    // Only fetch the specific users we need, not ALL users
    const allEmails = [
      ...experts?.map((e: any) => e.email).filter(Boolean) || [],
      ...orders.map((o: any) => o.customer_email).filter(Boolean)
    ];
    const uniqueEmails = [...new Set(allEmails)];

    const usersResult = await trackAsync('auth.getUsersByEmail', async () => {
  // Fetch all users ONCE, then filter
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const users = data.users || [];
  
  // Create a map for fast lookup
  const usersByEmail = new Map(
    users.map((u: any) => [u.email, u.id])
  );
  
  // Filter to only needed emails
  return uniqueEmails
    .map((email) => {
      const userId = usersByEmail.get(email);
      return userId ? { email, id: userId } : null;
    })
    .filter(Boolean);
}, { emailCount: uniqueEmails.length, totalUsers: 'fetched-once' });

    // For now, let's just skip the user ID mapping since it's causing issues
    // The frontend doesn't strictly need these IDs
    const emailToUserIdMap = new Map(
      (usersResult as any[]).map((u: any) => [u?.email, u?.id])
    );

    perfLogger.start('conversations.enrichment');

    // ✅ Now build response WITHOUT database calls
    const conversationsWithData = orders.map((order: any) => {
      const lastMessage = lastMessageMap.get(order.id) || null;
      const unreadCount = unreadCountMap.get(order.id) || 0;
      const expertEmail = order.expert_id ? expertEmailMap.get(order.expert_id) : null;
      const expertUserId = expertEmail ? emailToUserIdMap.get(expertEmail) : undefined;
      const customerUserId = order.customer_email ? emailToUserIdMap.get(order.customer_email) : undefined;

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
        expert_user_id: expertUserId,
        customer_user_id: customerUserId,
        expert_id: order.expert_id,
        status: order.status,
        updated_at: order.updated_at,
        lastMessage,
        unreadCount,
      };
    });

    perfLogger.end('conversations.enrichment', {
      orderCount: orders.length,
      strategy: 'batch-query'
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