import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCachedUser } from '@/lib/cached-auth';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateNewMessageEmail } from '@/lib/email';
import { notifyChatInitiated } from '@/lib/slack'; // ← ADD THIS

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const { order_id, sender_type, sender_id, sender_name, sender_display_name, message_content, send_notification } = body;

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

    // Use cached auth for validation
    const { data: { user }, error: authError } = await getCachedUser(token);
    
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

    // Create authenticated Supabase client with user's token (for RLS)
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

    // Validate required fields
    if (!order_id || !sender_type || !sender_id || !sender_name || !sender_display_name || !message_content) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if order exists and get details (INCLUDING chat_initiated status)
    console.log('🔍 Checking order:', order_id);
    const { data: orderData, error: orderError } = await supabaseAuth
      .from('orders')
      .select('id, title, task_code, customer_email, customer_name, customer_display_name, expert_id, expert_name, expert_display_name, chat_initiated')
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
    console.log('💬 Chat initiated?', orderData.chat_initiated);

    // Prepare message data
    const messageData = {
      order_id,
      sender_type,
      sender_id,
      sender_name,
      sender_display_name,
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

    // ✨ NEW: Check if this is the FIRST message (chat initiation)
    if (!orderData.chat_initiated) {
      console.log('🎉 FIRST MESSAGE! Notifying Slack and marking chat as initiated...');
      
      try {
        // Get expert email from auth (for Slack notification)
        let expertEmail = 'no-email';
        if (orderData.expert_id) {
          const { data: expertAuthData } = await supabase.auth.admin.getUserById(orderData.expert_id);
          expertEmail = expertAuthData?.user?.email || 'no-email';
        }

        // Send Slack notification
        await notifyChatInitiated({
          orderId: orderData.task_code || orderData.id,
          orderTitle: orderData.title || 'Untitled Order',
          customerName: orderData.customer_display_name || orderData.customer_name,
          customerEmail: orderData.customer_email,
          expertName: orderData.expert_display_name || orderData.expert_name,
          expertEmail: expertEmail,
          initiatedBy: sender_type as 'customer' | 'expert',
          timestamp: new Date().toISOString(),
        });

        // Mark order as chat_initiated using SERVICE ROLE (bypasses RLS)
        await supabase
          .from('orders')
          .update({
            chat_initiated: true,
            chat_initiated_at: new Date().toISOString(),
            chat_initiated_by: sender_type,
          })
          .eq('id', order_id);

        console.log('✅ Chat initiation notification sent and order updated');
      } catch (slackError) {
        console.error('❌ Error with chat initiation notification:', slackError);
        // Don't fail the message send if Slack fails
      }
    }

    // Send email notification if requested
    let emailSent = false;
    let emailError = null;

    if (send_notification) {
      try {
        console.log('📧 Sending email notification...');
        
        // Determine recipient based on sender type
        const isCustomer = sender_type === 'customer';
        
        // Get recipient details from order
        let recipientEmail: string | null = null;
        let recipientName: string;
        let recipientDisplayName: string;

        if (isCustomer) {
          // Customer sending to Expert
          // Need to get expert's email from auth users
          if (orderData.expert_id) {
            const { data: expertAuthData } = await supabase.auth.admin.getUserById(orderData.expert_id);
            recipientEmail = expertAuthData?.user?.email || null;
          }
          recipientName = orderData.expert_name;
          recipientDisplayName = orderData.expert_display_name || orderData.expert_name;
        } else {
          // Expert sending to Customer
          recipientEmail = orderData.customer_email;
          recipientName = orderData.customer_name;
          recipientDisplayName = orderData.customer_display_name || orderData.customer_name;
        }

        if (!recipientEmail) {
          console.warn('⚠️ No recipient email found');
          emailError = 'No recipient email';
        } else {
          const emailHtml = generateNewMessageEmail({
            recipientName: recipientDisplayName, // Use display name for privacy
            senderName: sender_display_name, // Use display name for privacy
            senderType: sender_type,
            orderId: orderData.task_code || orderData.id,
            orderTitle: orderData.title || 'Your Order',
            messageContent: message_content,
            messageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order_id}`,
            sentAt: new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
          });

          const emailResult = await resend.emails.send({
            from: 'MyHomeworkHelp Chat <chat@myhomeworkhelp.com>',
            to: recipientEmail,
            subject: `💬 New message from ${sender_display_name}`,
            html: emailHtml,
          });

          console.log('✅ Email sent:', emailResult);
          emailSent = true;
        }
      } catch (error: any) {
        console.error('❌ Email send error:', error);
        emailError = error.message;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: data,
      emailSent,
      emailError,
    });
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