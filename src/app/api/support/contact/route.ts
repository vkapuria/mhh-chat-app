import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userName, 
      userEmail, 
      userType,
      orderId,
      orderTitle,
      taskCode,
      customerName,
      customerEmail,
      expertName,
      expertEmail,
      amount,
      expertFee,
      issueType,
      message 
    } = body;

    // Validation
    if (!userName || !userEmail || !orderId || !issueType || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build email content
    const emailSubject = `Support Request: ${taskCode} - ${issueType}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; color: #4b5563; }
            .value { color: #1f2937; margin-left: 10px; }
            .message-box { background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; margin-top: 10px; }
            .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">🆘 Support Request</h2>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">from ${userName}</p>
            </div>
            
            <div class="content">
              <div class="section">
                <p><span class="label">Issue Type:</span><span class="value">${issueType}</span></p>
                <p><span class="label">User Type:</span><span class="value">${userType === 'customer' ? 'Customer' : 'Expert'}</span></p>
                <p><span class="label">User Email:</span><span class="value">${userEmail}</span></p>
              </div>
              
              <div class="section">
                <h3 style="color: #1f2937; margin-top: 0;">📋 Order Details</h3>
                <p><span class="label">Order ID:</span><span class="value">${taskCode}</span></p>
                <p><span class="label">Title:</span><span class="value">${orderTitle}</span></p>
                <p><span class="label">Customer:</span><span class="value">${customerName} (${customerEmail})</span></p>
                <p><span class="label">Expert:</span><span class="value">${expertName || 'Not assigned'} ${expertEmail ? `(${expertEmail})` : ''}</span></p>
                <p><span class="label">Amount:</span><span class="value">$${amount} ${expertFee ? `/ ₹${expertFee}` : ''}</span></p>
              </div>
              
              <div class="section">
                <h3 style="color: #1f2937;">💬 Message</h3>
                <div class="message-box">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>Sent from MyHomeworkHelp Support System</p>
              <p>Reply to this email to respond directly to ${userName}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'MyHomeworkHelp Support <support@myhomeworkhelp.com>',
      to: 'orders@myhomeworkhelp.com',
      replyTo: userEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send support request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Support request sent successfully',
      emailId: data?.id,
    });

  } catch (error) {
    console.error('Support contact error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}