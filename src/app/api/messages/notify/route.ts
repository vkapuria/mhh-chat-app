import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendEmail, generateNewMessageEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { orderId, messageId } = await request.json();

    if (!orderId || !messageId) {
      return NextResponse.json(
        { error: 'Order ID and Message ID are required' },
        { status: 400 }
      );
    }

    // Get the message details
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Get the order details to find recipient
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, experts:expert_id(name, email)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Determine recipient based on sender
    let recipientEmail = '';
    let recipientName = '';

    if (message.sender_type === 'customer') {
      // Send to expert
      recipientEmail = order.experts?.email || order.expert_email || '';
      recipientName = order.experts?.name || order.expert_name || 'Expert';
    } else if (message.sender_type === 'expert') {
      // Send to customer
      recipientEmail = order.customer_email;
      recipientName = order.customer_name;
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email not found' },
        { status: 400 }
      );
    }

    // Send email notification
    const chatUrl = `${process.env.NEXT_PUBLIC_APP_URL}/chat/${orderId}`;
    const emailHtml = generateNewMessageEmail({
      recipientName,
      senderName: message.sender_name,
      orderId,
      messagePreview: message.message_content.substring(0, 100) + (message.message_content.length > 100 ? '...' : ''),
      chatUrl,
    });

    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: `New message from ${message.sender_name} - Order ${orderId}`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error('Failed to send notification email:', emailResult.error);
    }

    // Update message to mark notification as sent
    await supabase
      .from('chat_messages')
      .update({ notification_sent: true })
      .eq('id', messageId);

    return NextResponse.json({ 
      success: true, 
      emailSent: emailResult.success 
    });

  } catch (error) {
    console.error('Notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}