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
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 32px 24px; }
    .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-bottom: 24px; }
    .info-box { background: #f1f5f9; border-left: 4px solid #4f46e5; padding: 16px; margin: 24px 0; border-radius: 4px; }
    .info-box p { margin: 8px 0; font-size: 14px; }
    .info-box strong { color: #1e293b; }
    .message-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin: 24px 0; border-radius: 8px; }
    .message-box h3 { margin: 0 0 12px 0; font-size: 16px; color: #1e293b; }
    .message-box p { margin: 0; color: #475569; white-space: pre-wrap; }
    .cta { text-align: center; margin: 32px 0; }
    .button { display: inline-block; background: #4f46e5; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .footer { padding: 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎫 New Support Ticket from Our Team</h1>
    </div>
    
    <div class="content">
      <div class="badge">PROACTIVE SUPPORT</div>
      
      <p>Hi ${recipient_name},</p>
      
      <p>Our support team has created a ticket regarding your order. We're reaching out proactively to assist you.</p>
      
      <div class="info-box">
        <p><strong>Ticket #:</strong> ${formatTicketNumber(ticket.id)}</p>
        <p><strong>Order:</strong> ${order_id}</p>
        <p><strong>Category:</strong> ${issue_type}</p>
      </div>
      
      <div class="message-box">
        <h3>📋 Subject: ${subject}</h3>
        <p>${message}</p>
      </div>
      
      <p>Please review the ticket and reply with any information or questions you may have. We're here to help!</p>
      
      <div class="cta">
        <a href="${ticketUrl}" class="button">View & Reply to Ticket</a>
      </div>
    </div>
    
    <div class="footer">
      <p>You can reply to this email directly, or visit the ticket page above.</p>
      <p>MyHomeworkHelp Support Team</p>
    </div>
  </div>
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