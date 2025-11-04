import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { withPerformanceLogging } from '@/lib/api-timing';
import { trackAsync, perfLogger } from '@/lib/performance-logger';

async function adminChatsHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    // Get all orders
    let query = supabaseServer
      .from('orders')
      .select(`
        id,
        title,
        customer_name,
        customer_email,
        expert_name,
        status,
        created_at,
        experts:expert_id (
          name,
          email
        )
      `)
      .in('status', ['Assigned', 'In Progress', 'Under Review', 'Completed']);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const ordersResult = await trackAsync('orders.fetch', async () => {
      return await query.order('created_at', { ascending: false });
    }, { status });

    const { data: orders, error: ordersError } = ordersResult as any;

    if (ordersError) {
      return NextResponse.json(
        { error: ordersError.message },
        { status: 500 }
      );
    }

    const orderIds = orders.map((o: any) => o.id);

    // ✅ FIX 1: Get ALL message counts in ONE query using aggregation
    const messageCountsResult = await trackAsync('messageCounts.batchFetch', async () => {
      return await supabaseServer
        .from('chat_messages')
        .select('order_id')
        .in('order_id', orderIds);
    }, { orderCount: orderIds.length });

    const { data: allMessages } = messageCountsResult as any;

    // Create map of order_id -> message count
    const messageCountMap = new Map<string, number>();
    allMessages?.forEach((msg: any) => {
      const count = messageCountMap.get(msg.order_id) || 0;
      messageCountMap.set(msg.order_id, count + 1);
    });

    // ✅ FIX 2: Get ALL latest messages in ONE query
    const latestMessagesResult = await trackAsync('latestMessages.batchFetch', async () => {
      return await supabaseServer
        .from('chat_messages')
        .select('order_id, message_content, created_at, sender_name, sender_type')
        .in('order_id', orderIds)
        .order('created_at', { ascending: false });
    }, { orderCount: orderIds.length });

    const { data: allMessagesForLatest } = latestMessagesResult as any;

    // Create map of order_id -> latest message (first occurrence)
    const latestMessageMap = new Map<string, any>();
    allMessagesForLatest?.forEach((msg: any) => {
      if (!latestMessageMap.has(msg.order_id)) {
        latestMessageMap.set(msg.order_id, msg);
      }
    });

    // ✅ FIX 3: Get ALL unread counts in ONE query
    const unreadCountsResult = await trackAsync('unreadCounts.batchFetch', async () => {
      return await supabaseServer
        .from('chat_messages')
        .select('order_id')
        .in('order_id', orderIds)
        .eq('is_read', false);
    }, { orderCount: orderIds.length });

    const { data: allUnreadMessages } = unreadCountsResult as any;

    // Create map of order_id -> unread count
    const unreadCountMap = new Map<string, number>();
    allUnreadMessages?.forEach((msg: any) => {
      const count = unreadCountMap.get(msg.order_id) || 0;
      unreadCountMap.set(msg.order_id, count + 1);
    });

    // ✅ FIX 4: Get ALL flags in ONE query
    const flagsResult = await trackAsync('flags.batchFetch', async () => {
      return await supabaseServer
        .from('chat_flags')
        .select('*')
        .in('order_id', orderIds);
    }, { orderCount: orderIds.length });

    const { data: allFlags } = flagsResult as any;

    // Create map of order_id -> flag data
    const flagDataMap = new Map<string, any>();
    allFlags?.forEach((flag: any) => {
      flagDataMap.set(flag.order_id, flag);
    });

    perfLogger.start('chats.enrichment');

    // ✅ Now build response WITHOUT any database calls
    const chatsWithMessages = orders.map((order: any) => {
      const messageCount = messageCountMap.get(order.id) || 0;
      const latestMessage = latestMessageMap.get(order.id) || null;
      const unreadCount = unreadCountMap.get(order.id) || 0;
      const flagData = flagDataMap.get(order.id);

      return {
        ...order,
        messageCount,
        latestMessage,
        unreadCount,
        isFlagged: !!flagData,
        flagReason: flagData?.reason,
      };
    });

    perfLogger.end('chats.enrichment', {
      orderCount: orders.length,
      strategy: 'batch-query',
      queriesTotal: 4
    });

    // Filter by search if provided
    let filteredChats = chatsWithMessages;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredChats = chatsWithMessages.filter(
        (chat: any) =>
          chat.customer_name?.toLowerCase().includes(searchLower) ||
          chat.customer_email?.toLowerCase().includes(searchLower) ||
          chat.expert_name?.toLowerCase().includes(searchLower) ||
          chat.title?.toLowerCase().includes(searchLower) ||
          chat.id?.toLowerCase().includes(searchLower)
      );
    }

    // Only return chats that have at least one message
    const activeChats = filteredChats.filter((chat: any) => chat.messageCount > 0);

    return NextResponse.json({
      success: true,
      chats: activeChats,
      total: activeChats.length,
    });
  } catch (error) {
    console.error('Chat monitoring API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withPerformanceLogging('/api/admin/chats', adminChatsHandler);