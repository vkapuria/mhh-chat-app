import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase'; // ✅ Changed from supabase to supabaseAdmin
import { getCachedUser } from '@/lib/cached-auth';
import { Resend } from 'resend';
import { generateBatchMessageEmail } from '@/lib/email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    console.log('📧 === Batch Notification API Called ===');

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await getCachedUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { order_id, recipient_email, recipient_name, recipient_display_name, recipient_type } = body;

    console.log('📦 Batch notification request:', {
      order_id,
      recipient_email,
      recipient_type,
      currentUserId: user.id,
      currentUserType: user.user_metadata?.user_type,
    });

    // Fetch order details using service role (bypasses RLS)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, title, task_code, customer_email, expert_id, customer_name, customer_display_name, expert_name, expert_display_name')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log('✅ Order found:', order.title);

    // Debug: Fetch ALL messages for this order (using service role - bypasses RLS)
    const { data: allMessages, error: allMsgError } = await supabaseAdmin
      .from('chat_messages')
      .select('id, sender_id, sender_type, sender_name, sender_display_name, is_read, message_content, created_at')
      .eq('order_id', order_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (allMsgError) {
      console.error('❌ Error fetching ALL messages:', allMsgError);
    } else {
      console.log('🔍 ALL recent messages (last 10):');
      console.log(JSON.stringify(allMessages, null, 2));
    }

    console.log('🔍 Query criteria:');
    console.log('  - order_id:', order_id);
    console.log('  - sender_id:', user.id);
    console.log('  - is_read: false');

    // Fetch unread messages FROM current user (using service role - bypasses RLS)
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('order_id', order_id)
      .eq('sender_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('❌ Error fetching unread messages:', messagesError);
      return NextResponse.json({ 
        error: 'Failed to fetch messages',
        details: messagesError.message 
      }, { status: 500 });
    }

    const messageCount = messages?.length || 0;
    console.log(`📬 Found ${messageCount} unread messages from current user`);

    if (messageCount === 0) {
      console.log('⚠️ No unread messages to send');
      return NextResponse.json({
        success: false,
        error: 'No unread messages to send',
      });
    }

    console.log('📝 Messages to include in email:', messages.map(m => ({
      id: m.id,
      content: m.message_content.substring(0, 50),
      created_at: m.created_at,
    })));

    // Prepare message data for email (limit to 5 messages)
    const messagesToShow = messages.slice(0, 5).map((msg) => ({
      senderName: msg.sender_display_name || msg.sender_name,
      content: msg.message_content,
      sentAt: new Date(msg.created_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    }));

    const hasMoreMessages = messageCount > 5;
    const remainingCount = messageCount - 5;

    // Generate email HTML
    const emailHtml = generateBatchMessageEmail({
      recipientName: recipient_display_name || recipient_name,
      senderDisplayName: user.user_metadata?.display_name || user.user_metadata?.name || 'User',
      senderType: recipient_type === 'customer' ? 'expert' : 'customer',
      orderId: order.task_code || order.id,
      orderTitle: order.title,
      messages: messagesToShow,
      totalMessageCount: messageCount,
      hasMoreMessages,
      remainingCount,
      messageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order_id}`,
    });

    console.log('📧 Sending email to:', recipient_email);
    console.log('📧 Subject:', `💬 ${messageCount} new ${messageCount === 1 ? 'message' : 'messages'}`);

    // Send email
    const emailResult = await resend.emails.send({
      from: 'MyHomeworkHelp Chat <chat@myhomeworkhelp.com>',
      to: recipient_email,
      subject: `💬 ${messageCount} new ${messageCount === 1 ? 'message' : 'messages'} from ${user.user_metadata?.display_name || 'your ' + (recipient_type === 'customer' ? 'expert' : 'customer')}`,
      html: emailHtml,
    });

    console.log('✅ Batch notification email sent:', emailResult);

    // Mark messages as notified (optional - update notification_sent flag)
    await supabaseAdmin
      .from('chat_messages')
      .update({ notification_sent: true })
      .in('id', messages.map(m => m.id));

    return NextResponse.json({
      success: true,
      messageCount,
      emailSent: true,
    });
  } catch (error: any) {
    console.error('💥 Batch notification error:', error);
    return NextResponse.json({
      error: 'Failed to send notification',
      details: error.message,
    }, { status: 500 });
  }
}