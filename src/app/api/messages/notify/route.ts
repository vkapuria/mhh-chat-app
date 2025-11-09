import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, generateNewMessageEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      orderTitle,
      recipientEmail,
      recipientName,
      senderName,
      senderType = 'expert', // 'customer' or 'expert'
      messageContent,
    } = body;

    console.log('📧 Sending notification email:', {
      to: recipientEmail,
      from: senderName,
      order: orderTitle,
    });

    // Format the message time
    const sentAt = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago',
    });

    // Generate message URL
    const messageUrl = `https://chat.myhomeworkhelp.com/messages?order=${orderId}`;

    // Generate email HTML using template
    const emailHtml = generateNewMessageEmail({
      recipientName,
      senderName,
      senderType,
      orderId,
      orderTitle,
      messageContent,
      messageUrl,
      sentAt,
    });

    // Send email
    const result = await sendEmail({
      to: recipientEmail,
      subject: `💬 New message from ${senderName} - ${orderTitle}`,
      html: emailHtml,
    });

    if (!result.success) {
      console.error('❌ Email send error:', result.error);
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      );
    }

    console.log('✅ Notification email sent');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 Notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}