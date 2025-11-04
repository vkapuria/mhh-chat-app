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
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #1f2937; 
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .wrapper { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
            }
            .header { 
              background: #f9f9f9;
              padding: 30px; 
              border-bottom: 2px solid #e5e7eb;
            }
            .logo {
              width: 150px;
              height: auto;
            }
            @media only screen and (max-width: 600px) {
              .logo {
                width: 100px;
              }
            }
            .content { 
              padding: 30px;
              background: white;
            }
            .greeting {
              font-size: 16px;
              color: #374151;
              margin-bottom: 25px;
              line-height: 1.6;
            }
            .info-card {
              background: white;
              border: 2px solid #d1d5db;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #6b7280;
              min-width: 130px;
              font-size: 14px;
            }
            .info-value {
              color: #1f2937;
              font-size: 14px;
            }
            .section-title {
              font-size: 17px;
              font-weight: 600;
              color: #1f2937;
              margin: 30px 0 12px 0;
            }
            .message-box {
              background: white;
              border: 2px solid #d1d5db;
              border-radius: 8px;
              padding: 20px;
              margin-top: 12px;
              font-size: 15px;
              line-height: 1.7;
              color: #374151;
            }
            .footer {
              background: #f9f9f9;
              padding: 24px 30px;
              text-align: center;
              border-top: 2px solid #e5e7eb;
            }
            .footer p {
              margin: 6px 0;
              font-size: 13px;
              color: #6b7280;
            }
            .reply-cta {
              background: #2563eb;
              color: white;
              padding: 12px 24px;
              border-radius: 6px;
              text-decoration: none;
              display: inline-block;
              margin: 15px 0 10px 0;
              font-weight: 500;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            
            <!-- Header with Logo -->
            <div class="header">
              <img src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png" alt="MyHomeworkHelp" class="logo" />
            </div>
            
            <!-- Content -->
            <div class="content">
              
              <!-- Greeting -->
              <div class="greeting">
                A support request has been submitted for order <strong>${taskCode}</strong>. Please review the details below and respond promptly.
              </div>
              
              <!-- 1. Request Information -->
              <div class="section-title">📩 Request Information</div>
              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">Issue Type</span>
                  <span class="info-value">${issueType}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Submitted By</span>
                  <span class="info-value">${userType === 'customer' ? 'Customer' : 'Expert'}: ${userName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Contact Email</span>
                  <span class="info-value">${userEmail}</span>
                </div>
              </div>
              
              <!-- 2. Customer/Expert Message -->
              <div class="section-title">💬 ${userType === 'customer' ? 'Customer' : 'Expert'} Message</div>
              <div class="message-box">
                ${message.replace(/\n/g, '<br>')}
              </div>
              
              <!-- 3. Related Order -->
              <div class="section-title">📦 Related Order Details</div>
              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">Order ID</span>
                  <span class="info-value"><strong>${taskCode}</strong></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Title</span>
                  <span class="info-value">${orderTitle}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Customer</span>
                  <span class="info-value">${customerName}</span>
                </div>
                ${expertName ? `
                <div class="info-row">
                  <span class="info-label">Expert</span>
                  <span class="info-value">${expertName}</span>
                </div>
                ` : ''}
                <div class="info-row">
                  <span class="info-label">Order Value</span>
                  <span class="info-value">$${amount}${expertFee ? ` / ₹${expertFee}` : ''}</span>
                </div>
              </div>
              
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <a href="mailto:${userEmail}" class="reply-cta">Reply to ${userName}</a>
              <p style="margin-top: 15px; color: #9ca3af;">
                This support request was sent via MyHomeworkHelp Support System
              </p>
              <p style="color: #9ca3af;">
                Simply reply to this email to respond directly to the ${userType === 'customer' ? 'customer' : 'expert'}
              </p>
            </div>
            
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'MHH Support <support@myhomeworkhelp.com>',
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