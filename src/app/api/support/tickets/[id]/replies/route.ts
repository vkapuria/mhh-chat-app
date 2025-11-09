import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedUser } from '@/lib/cached-auth';
import { withPerformanceLogging } from '@/lib/api-timing';
import { sendEmail, generateTicketReplyEmail } from '@/lib/email';
import { formatTicketNumber } from '@/lib/ticket-utils';
import { trackTicketRepliedServer } from '@/lib/analytics-server';
import { postReplyToSlackThread } from '@/lib/slack';

async function repliesHandler(
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
    const userType = user.user_metadata?.user_type;
    const isAdmin = userType === 'admin';

    // Create authenticated Supabase client with user's token
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

    // POST: Add reply (admin only)
    if (request.method === 'POST') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const body = await request.json();
      const { message } = body;

      if (!message || !message.trim()) {
        return NextResponse.json(
          { error: 'Message is required' },
          { status: 400 }
        );
      }

      const adminName = user.user_metadata?.display_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Admin';
      const adminTeam = user.user_metadata?.team || 'Admin';
      const adminAvatar = user.user_metadata?.avatar_url || null;

      const { data: reply, error: insertError } = await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: ticketId,
          admin_id: user.id,
          admin_name: adminName,
          admin_team: adminTeam,
          admin_avatar: adminAvatar,
          message: message.trim(),
        })
        .select()
        .single();

        // Track ticket reply (admin)
        if (!insertError && reply) {
          trackTicketRepliedServer({
            ticketId: ticketId,
            repliedBy: 'admin',
            userType: 'admin',
          });
        }

        if (insertError) {
          console.error('Insert reply error:', insertError);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
        
        // Get current ticket to check status
        const { data: currentTicket } = await supabase
          .from('support_tickets')
          .select('status')
          .eq('id', ticketId)
          .single();
        
        // Auto-change status on first reply
        const updateData: any = {
          updated_at: new Date().toISOString(),
          last_reply_by: 'admin',
        };
        
        // If status is submitted, auto-change to in_progress (SILENT - no email)
        if (currentTicket?.status === 'submitted') {
          updateData.status = 'in_progress';
          console.log('✅ Auto-changed status: submitted → in_progress');
        }
        
        await supabase
          .from('support_tickets')
          .update(updateData)
          .eq('id', ticketId);

      // Fetch ticket details for email notification
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      // Send email notification to user
      if (ticket) {
        const ticketUrl = `https://chat.myhomeworkhelp.com/support/${ticket.id}`;
        
        // Format the reply timestamp
        const repliedAt = new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Chicago',
        });
        
        const emailHtml = generateTicketReplyEmail({
          recipientName: ticket.user_display_name,
          ticketId: ticket.id,                        // UUID
          ticketNumber: formatTicketNumber(ticket.id), // TCK-284019
          orderId: ticket.order_id,
          issueType: ticket.issue_type,
          replyMessage: message.trim(),
          adminName: adminName,                        // From line 66
          repliedAt: repliedAt,                        // Just now timestamp
          ticketUrl,
        });

        await sendEmail({
          to: ticket.user_email,
          replyTo: `support+${ticket.id}@chueulkoia.resend.app`,
          subject: `💬 New Reply to Your Ticket - ${ticket.order_id}`,
          html: emailHtml,
        });

        // Post to Slack thread if ticket has one
if (ticket.slack_thread_ts) {
  try {
    await postReplyToSlackThread(ticket.slack_thread_ts, {
      sender: adminName,
      senderType: 'admin',
      message: message.trim(),
      created_at: new Date().toISOString(),
    });
    console.log('✅ Posted admin reply to Slack thread');
  } catch (slackError) {
    console.error('❌ Failed to post to Slack:', slackError);
  } }
      }

      return NextResponse.json({
        success: true,
        reply,
      });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Replies API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withPerformanceLogging(
  '/api/support/tickets/[id]/replies',
  repliesHandler
);