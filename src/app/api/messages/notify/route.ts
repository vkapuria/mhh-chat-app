import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      orderTitle,
      recipientEmail,
      recipientName,
      senderName,
      messageContent,
    } = body;

    console.log('📧 Sending notification email:', {
      to: recipientEmail,
      from: senderName,
      order: orderTitle,
    });

    // Send email notification
    const { data, error } = await resend.emails.send({
      from: 'orders@myhomeworkhelp.com',
      to: [recipientEmail],
      subject: `New message from ${senderName} - ${orderTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #f8f9fa;
                padding: 30px;
                border: 1px solid #e9ecef;
              }
              .message-box {
                background: white;
                padding: 20px;
                border-left: 4px solid #667eea;
                margin: 20px 0;
                border-radius: 4px;
              }
              .button {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                color: #6c757d;
                font-size: 12px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>💬 New Message</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName},</p>
              <p><strong>${senderName}</strong> sent you a new message regarding:</p>
              <p><strong>${orderTitle}</strong></p>
              
              <div class="message-box">
                <p style="margin: 0; white-space: pre-wrap;">${messageContent}</p>
              </div>
              
              <center>
                <a href="https://chat.myhomeworkhelp.com/messages?order=${orderId}" class="button">
                  View & Reply
                </a>
              </center>
              
              <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
                This is an automated notification. You're receiving this because you have an active order with MyHomeworkHelp.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} MyHomeworkHelp. All rights reserved.</p>
              <p>Order ID: ${orderId}</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Email send error:', error);
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      );
    }

    console.log('✅ Notification email sent:', data?.id);

    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (error) {
    console.error('💥 Notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}