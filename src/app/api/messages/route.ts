import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';


// GET: Fetch messages for an order
// GET: Fetch messages for an order
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    console.log('📬 GET Messages - Order ID:', orderId);

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get auth token from header (for client-side requests)
    const authHeader = request.headers.get('authorization');
    
    let queryClient = supabase; // Default to service role

    // If auth header present, use authenticated client
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      queryClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
      console.log('🔐 Using authenticated client for GET');
    } else {
      console.log('🔓 Using service role client for GET');
    }

    const { data, error } = await queryClient
      .from('chat_messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    console.log('✅ Fetched messages:', data?.length || 0);

    return NextResponse.json({ success: true, messages: data || [] });
  } catch (error) {
    console.error('💥 Messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Send a new message
export async function POST(request: NextRequest) {
  try {
    console.log('📨 POST Message - Starting...');

    const body = await request.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));

    const { order_id, sender_type, sender_id, sender_name, message_content, send_notification } = body;

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    console.log('🔐 Auth header present:', !!authHeader);

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No auth token' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create authenticated Supabase client with user's token
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Verify user with this authenticated client
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('👤 Authenticated user:', {
      id: user.id,
      email: user.email,
      expert_id: user.user_metadata?.expert_id,
    });

    // Validate required fields
    if (!order_id || !sender_type || !sender_id || !sender_name || !message_content) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if order exists
    console.log('🔍 Checking order:', order_id);
    const { data: orderData, error: orderError } = await supabaseAuth
      .from('orders')
      .select('id, customer_email, expert_id, expert_name, customer_name')
      .eq('id', order_id)
      .single();

    if (orderError || !orderData) {
      console.error('❌ Order not found:', orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('📋 Order details:', orderData);

    // Prepare message data
    const messageData = {
      order_id,
      sender_type,
      sender_id,
      sender_name,
      message_content: message_content.trim(),
      notification_sent: send_notification || false,
      is_read: false,
    };

    console.log('💾 Attempting to insert message with authenticated client');

    // Insert using authenticated client (RLS will now work!)
    const { data, error } = await supabaseAuth
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('❌ Insert error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      return NextResponse.json(
        { 
          error: 'Failed to send message',
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ Message inserted successfully:', data?.id);

    return NextResponse.json({ success: true, message: data });
  } catch (error) {
    console.error('💥 Send message error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}