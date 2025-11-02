import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // This is the key!
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

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

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        conversations: [],
      });
    }

    // Get expert emails for all unique expert IDs
    const expertIds = [...new Set(orders.map(order => order.expert_id).filter(Boolean))];
    
    const { data: experts } = await supabase
      .from('experts')
      .select('id, email')
      .in('id', expertIds);

    // Create a map of expert_id -> email
    const expertEmailMap = new Map(
      experts?.map(expert => [expert.id, expert.email]) || []
    );

    console.log('📧 Expert emails fetched:', expertEmailMap.size);

    // Get auth user IDs for all unique emails (experts and customers)
    const expertEmails = experts?.map(e => e.email).filter(Boolean) || [];
    const customerEmails = [...new Set(orders.map(o => o.customer_email).filter(Boolean))];
    const allEmails = [...expertEmails, ...customerEmails];

    // Fetch all auth users using admin client
    const { data: { users: authUsers }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Failed to fetch auth users:', usersError);
    } else {
      console.log('✅ Fetched auth users:', authUsers?.length);
    }

    // Create email -> user_id maps
    const emailToUserIdMap = new Map(
      authUsers
        .filter(u => allEmails.includes(u.email || ''))
        .map(u => [u.email, u.id])
    );

    console.log('👥 User IDs fetched:', emailToUserIdMap.size);

    // Create authenticated client for message queries
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

    // Get last message and unread count for each order
    const conversationsWithData = await Promise.all(
      orders.map(async (order) => {
        // Get last message using authenticated client
        const { data: lastMessage } = await supabaseAuth
          .from('chat_messages')
          .select('sender_id, message_content, created_at')
          .eq('order_id', order.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count using authenticated client
        const { data: unreadMessages } = await supabaseAuth
          .from('chat_messages')
          .select('id')
          .eq('order_id', order.id)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        // Get expert email from map
        const expertEmail = order.expert_id ? expertEmailMap.get(order.expert_id) : null;

        // Get user IDs
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
          customer_email: order.customer_email,
          expert_name: order.expert_name,
          expert_email: expertEmail,
          expert_user_id: expertUserId,     // Add this
          customer_user_id: customerUserId, // Add this
          expert_id: order.expert_id,
          status: order.status,
          updated_at: order.updated_at,
          lastMessage: lastMessage || null,
          unreadCount: unreadMessages?.length || 0,
        };
      })
    );

    // Sort by last message time (most recent first)
    conversationsWithData.sort((a, b) => {
      const aTime = a.lastMessage?.created_at || a.updated_at;
      const bTime = b.lastMessage?.created_at || b.updated_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    console.log('✅ Conversations fetched:', conversationsWithData.length);

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