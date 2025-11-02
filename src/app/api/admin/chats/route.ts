import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    // Get all orders with their latest message info
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

    const { data: orders, error: ordersError } = await query.order('created_at', { ascending: false });

    if (ordersError) {
      return NextResponse.json(
        { error: ordersError.message },
        { status: 500 }
      );
    }

    // Get message counts and latest message for each order
    const chatsWithMessages = await Promise.all(
      orders.map(async (order) => {
        // Get message count
        const { count: messageCount } = await supabaseServer
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('order_id', order.id);

        // Get latest message
        const { data: latestMessage } = await supabaseServer
          .from('chat_messages')
          .select('message_content, created_at, sender_name, sender_type')
          .eq('order_id', order.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabaseServer
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('order_id', order.id)
          .eq('is_read', false);

        // Get flagged status (we'll add this to orders table later)
        const { data: flagData } = await supabaseServer
          .from('chat_flags')
          .select('*')
          .eq('order_id', order.id)
          .limit(1)
          .maybeSingle();

        return {
          ...order,
          messageCount: messageCount || 0,
          latestMessage: latestMessage || null,
          unreadCount: unreadCount || 0,
          isFlagged: !!flagData,
          flagReason: flagData?.reason,
        };
      })
    );

    // Filter by search if provided
    let filteredChats = chatsWithMessages;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredChats = chatsWithMessages.filter(
        (chat) =>
          chat.customer_name?.toLowerCase().includes(searchLower) ||
          chat.customer_email?.toLowerCase().includes(searchLower) ||
          chat.expert_name?.toLowerCase().includes(searchLower) ||
          chat.title?.toLowerCase().includes(searchLower) ||
          chat.id?.toLowerCase().includes(searchLower)
      );
    }

    // Only return chats that have at least one message
    const activeChats = filteredChats.filter((chat) => chat.messageCount > 0);

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