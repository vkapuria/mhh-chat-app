import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedUser } from '@/lib/cached-auth';
import { sendEmail } from '@/lib/email';
import { formatTicketNumber } from '@/lib/ticket-utils';
import { postTicketToSlack } from '@/lib/slack';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await getCachedUser(token) as any;

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const userType = user.user_metadata?.user_type;
    if (userType !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

     const body = await request.json();
    
    console.log('📝 Admin ticket creation request:', {
      order_id: body.order_id,
      recipient_type: body.recipient_type,
      recipient_id: body.recipient_id,
      recipient_email: body.recipient_email,
      recipient_name: body.recipient_name,
      issue_type: body.issue_type,
      subject: body.subject,
      message: body.message?.substring(0, 50) + '...',
    });
    
    const {
      order_id,
      recipient_type,
      recipient_id,
      recipient_email,
      recipient_name,
      issue_type,
      subject,
      message,
    } = body;

    if (!order_id || !recipient_type || !recipient_email || !issue_type || !subject || !message) {
      const missing = [];
      if (!order_id) missing.push('order_id');
      if (!recipient_type) missing.push('recipient_type');
      if (!recipient_email) missing.push('recipient_email');
      if (!issue_type) missing.push('issue_type');
      if (!subject) missing.push('subject');
      if (!message) missing.push('message');
      
      console.error('❌ Missing required fields:', missing);
      return NextResponse.json({ 
        error: `Missing required fields: ${missing.join(', ')}` 
      }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('title, task_code')
      .eq('id', order_id)
      .single();

    if (orderError) {
      console.error('Failed to fetch order:', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const adminName = user.user_metadata?.display_name || user.user_metadata?.name || 'Support Team';

    // Get actual auth user_id for both customer and expert
    let actualUserId = recipient_id;
    
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    
    if (recipient_type === 'customer') {
      // For customers, look up user_id by email
      const customerUser = authUsers?.users.find(u => u.email === recipient_email);
      
      if (customerUser) {
        actualUserId = customerUser.id;
        console.log('✅ Found customer auth user:', customerUser.id);
      } else {
        console.error('❌ Customer user not found in auth:', recipient_email);
        return NextResponse.json({ 
          error: 'Customer account not found. Please ensure the customer has logged in at least once.' 
        }, { status: 404 });
      }
    } else {
      // For experts, recipient_id is expert_id from user_metadata
      // We need to find the auth user ID
      const expertUser = authUsers?.users.find(u => u.user_metadata?.expert_id === recipient_id);
      
      if (expertUser) {
        actualUserId = expertUser.id;
        console.log('✅ Found expert auth user:', expertUser.id, 'for expert_id:', recipient_id);
      } else {
        console.error('❌ Expert user not found in auth for expert_id:', recipient_id);
        return NextResponse.json({ 
          error: 'Expert account not found. Please ensure the expert has logged in at least once.' 
        }, { status: 404 });
      }
    }

    // Create ticket
// Create ticket - Recipient is the user (so they see it), but marked as admin-initiated
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: actualUserId, // Recipient's user ID (expert/customer)
        user_email: recipient_email, // Recipient's email
        user_display_name: recipient_name, // Recipient's name
        user_type: recipient_type, // Recipient's type (expert/customer)
        order_id,
        order_title: order.title,
        task_code: order.task_code,
        issue_type: `[ADMIN INITIATED] ${issue_type}`,
        message: `**🎯 Proactive Support from ${adminName}**\n\n**Subject:** ${subject}\n\n${message.trim()}\n\n---\n*This ticket was created by our support team to assist you proactively.*`,
        status: 'submitted',
        created_by_admin_id: user.id, // Track admin who created it
        created_by_admin_name: adminName, // Admin's name
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Ticket creation error:', ticketError);
      return NextResponse.json({ error: ticketError.message }, { status: 500 });
    }

    // Post to Slack
    try {
      const slackThreadTs = await postTicketToSlack({
        id: ticket.id,
        user_display_name: `${adminName} (Admin) → ${recipient_name} (${recipient_type})`,
        user_email: user.email!,
        user_type: 'admin',
        order_id,
        order_title: order.title,
        issue_type: `🎯 Proactive: ${issue_type}`,
        message: `**Created by Admin for ${recipient_type}**\n**To:** ${recipient_name} (${recipient_email})\n\n**Subject:** ${subject}\n\n${message.trim()}`,
        created_at: ticket.created_at,
      });

      if (slackThreadTs) {
        await supabase
          .from('support_tickets')
          .update({ slack_thread_ts: slackThreadTs })
          .eq('id', ticket.id);
        
        console.log('✅ Posted admin ticket to Slack');
      }
    } catch (slackError) {
      console.error('❌ Failed to post to Slack:', slackError);
    }

    // Send email to recipient
    try {
      const ticketUrl = `https://chat.myhomeworkhelp.com/support/${ticket.id}`;
      
      const emailHtml = `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>New Support Ticket Created for You</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f7fafc;
      color: #111827;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji';
      -webkit-font-smoothing: antialiased;
    }

    a {
      color: #4f46e5;
      text-decoration: none;
    }

    img {
      border: 0;
      outline: none;
      text-decoration: none;
      max-width: 100%;
    }

    table {
      border-collapse: collapse;
    }

    .wrap {
      width: 100%;
      padding: 28px 0;
    }

    .email-wrapper {
      width: 100%;
      max-width: 640px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.05);
      border-top: 4px solid #4f46e5;
      border-left: 1px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }

    .inner {
      padding: 40px 36px 32px 36px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 22px;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 24px;
      gap: 10px;
    }

    .logo {
      display: block;
      height: auto;
    }

    .date {
      font-size: 13px;
      color: #6b7280;
      text-align: right;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #fef3c7;
      color: #92400e;
      padding: 6px 12px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 12px;
      border: 1px solid #fde68a;
      margin-bottom: 18px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .badge span {
      font-size: 14px;
    }

    .h1 {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 14px 0;
      color: #111827;
    }

    .content {
      font-size: 15px;
      line-height: 1.7;
      color: #111827;
    }

    .content p {
      margin: 0 0 16px 0;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
      margin: 22px 0 10px 0;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .info-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px 16px;
      margin: 10px 0 18px 0;
      font-size: 14px;
    }

    .info-row {
      display: flex;
      padding: 6px 0;
      border-bottom: 1px solid #e5e7eb;
      gap: 10px;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 500;
      color: #6b7280;
      min-width: 110px;
    }

    .info-value {
      color: #111827;
      font-weight: 600;
    }

    .message-box {
      background: #f9fafb;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      padding: 14px 16px;
      margin: 10px 0 22px 0;
      font-size: 14px;
      color: #374151;
    }

    .message-subject {
      font-weight: 600;
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #111827;
    }

    .message-body {
      margin: 0;
      white-space: pre-wrap;
      line-height: 1.6;
    }

    .info-note {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 13px;
      color: #1e40af;
      margin-bottom: 20px;
    }

    .info-note strong {
      color: #1d4ed8;
    }

    .cta {
      text-align: center;
      margin: 26px 0 18px 0;
    }

    .btn {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
      transition: all 0.2s ease;
    }

    .btn:hover {
      background: #4338ca;
      box-shadow: 0 6px 12px rgba(79, 70, 229, 0.3);
    }

    .footer {
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      padding: 0 12px 20px 12px;
    }

    .footer p {
      margin: 0 0 6px 0;
    }

    @media (max-width: 620px) {
      .inner {
        padding: 28px 22px 24px 22px;
      }
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }
      .date {
        text-align: left;
      }
      .info-row {
        flex-direction: column;
        align-items: flex-start;
      }
      .info-label {
        min-width: 0;
      }
    }
  </style>
</head>
<body>
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Our support team has opened a ticket for your order. Review the details and reply if needed.
  </div>

  <table role="presentation" class="wrap" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" class="email-wrapper" cellspacing="0" cellpadding="0">
          <tr>
            <td class="inner">
              <!-- Header -->
              <div class="header">
                <img
                  class="logo"
                  src="https://i.ibb.co/5xj5Pvc8/final-files-mhh-copy-3.png"
                  alt="MyHomeworkHelp"
                  width="150"
                  height="auto"
                />
                <div class="date">
                  ${new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>

              <div class="content">
                <div class="badge">
                  <span>•</span> PROACTIVE SUPPORT
                </div>

                <h1 class="h1">We’ve opened a support ticket for you</h1>

                <p>Hi <strong>${recipient_name}</strong>,</p>

                <p>
                  Our support team has created a ticket related to your order. We’re reaching out proactively
                  so we can assist you and keep everything on track.
                </p>

                <div class="section-title">Ticket summary</div>
                <div class="info-box">
                  <div class="info-row">
                    <span class="info-label">Ticket #</span>
                    <span class="info-value">${formatTicketNumber(ticket.id)}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Order</span>
                    <span class="info-value">${order_id}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Category</span>
                    <span class="info-value">${issue_type}</span>
                  </div>
                </div>

                <div class="section-title">Message from our team</div>
                <div class="message-box">
                  <div class="message-subject">📋 Subject: ${subject}</div>
                  <p class="message-body">${message}</p>
                </div>

                <div class="info-note">
                  <strong>How to respond:</strong>
                  You can reply directly to this email, and your response will be added to the ticket conversation.
                  You can also view the ticket in your dashboard using the button below.
                </div>

                <div class="cta">
                  <a href="${ticketUrl}" class="btn">View &amp; Reply to Ticket</a>
                </div>

                <p style="font-size: 13px; color: #6b7280; margin-top: 16px;">
                  If something doesn’t look right or you have more details to share, just reply —
                  our team will take it from there.
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td class="footer">
              <p>MyHomeworkHelp Support Team</p>
              <p>
                Need additional help? Email us at
                <a href="mailto:orders@myhomeworkhelp.com" style="color:#4f46e5;">orders@myhomeworkhelp.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      await sendEmail({
        to: recipient_email,
        replyTo: `support+${ticket.id}@chueulkoia.resend.app`,
        subject: `🎫 Support Ticket Created: ${formatTicketNumber(ticket.id)} - ${subject}`,
        html: emailHtml,
      });

      console.log('✅ Recipient notification email sent');
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError);
    }

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error('Admin create ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}