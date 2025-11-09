import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedUser } from '@/lib/cached-auth';
import { withPerformanceLogging } from '@/lib/api-timing';
import { sendEmail } from '@/lib/email';
import { postReplyToSlackThread } from '@/lib/slack';
import { trackTicketRepliedServer } from '@/lib/analytics-server';

async function customerReplyHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: ticketId } = await params;

    // Create authenticated Supabase client
    const supabase = createClient(
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

    // Verify ticket belongs to user
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('user_id', user.id) // Important: only their own tickets
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get user avatar
    const userAvatar = user.user_metadata?.avatar_url || null;

    // Create reply from customer
    const { data: reply, error: insertError } = await supabase
      .from('ticket_replies')
      .insert({
        ticket_id: ticketId,
        admin_id: user.id,
        admin_name: ticket.user_display_name,
        admin_avatar: userAvatar,
        message: message.trim(),
        reply_type: 'user',
      })
      .select()
      .single();

      // Track ticket reply (customer/expert)
      if (!insertError && reply) {
        const userType = user.user_metadata?.user_type || 'customer';
        trackTicketRepliedServer({
          ticketId: ticketId,
          repliedBy: userType,
          userType: userType,
        });
      }

    if (insertError) {
      console.error('Insert reply error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    
    // Update ticket timestamp + last_reply_by
    await supabase
      .from('support_tickets')
      .update({ 
        updated_at: new Date().toISOString(),
        last_reply_by: 'user',
      })
      .eq('id', ticketId);

    // Send email notification to admin
    try {
      const { formatTicketNumber } = await import('@/lib/ticket-utils');
      const { generateAdminTicketReplyEmail } = await import('@/lib/email');
      
      const ticketNumber = formatTicketNumber(ticketId);
      const adminEmail = 'orders@myhomeworkhelp.com';
      const adminPanelUrl = `https://chat.myhomeworkhelp.com/admin/support/${ticketId}`;
      
      const emailHtml = generateAdminTicketReplyEmail({
        ticketId,
        ticketNumber,
        orderId: ticket.order_id,
        issueType: ticket.issue_type,
        userName: ticket.user_display_name,
        userEmail: ticket.user_email,
        replyMessage: message.trim(),
        replySource: 'portal',
        adminPanelUrl,
      });

      await sendEmail({
        to: adminEmail,
        subject: `💬 New Reply: ${ticket.issue_type} - ${ticketNumber}`,
        html: emailHtml,
      });

      console.log('✅ Admin notification email sent');
    } catch (emailError) {
      console.error('❌ Failed to send admin notification email:', emailError);
    }

    // Post to Slack thread if ticket has one
if (ticket.slack_thread_ts) {
  try {
    await postReplyToSlackThread(ticket.slack_thread_ts, {
      sender: ticket.user_display_name,
      senderType: 'user',
      message: message.trim(),
      created_at: new Date().toISOString(),
    });
    console.log('✅ Posted user reply to Slack thread');
  } catch (slackError) {
    console.error('❌ Failed to post to Slack:', slackError);
  }
}

    // Reopen ticket if it was resolved
    if (ticket.status === 'resolved') {
      await supabase
        .from('support_tickets')
        .update({ 
          status: 'in_progress',
          resolved_at: null,
        })
        .eq('id', ticketId);
    }

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error('Customer reply API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withPerformanceLogging(
  '/api/support/tickets/[id]/customer-reply',
  customerReplyHandler
);