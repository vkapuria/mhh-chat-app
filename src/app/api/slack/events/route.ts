import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify Slack signature
function verifySlackSignature(
  signingSecret: string,
  requestSignature: string,
  timestamp: string,
  body: string
): boolean {
  const time = Math.floor(Date.now() / 1000);
  if (Math.abs(time - parseInt(timestamp)) > 300) {
    return false; // Request is older than 5 minutes
  }

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = 'v0=' + 
    crypto.createHmac('sha256', signingSecret)
      .update(sigBasestring)
      .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(requestSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const payload = JSON.parse(body);

    // Verify Slack signature
    const signature = request.headers.get('x-slack-signature');
    const timestamp = request.headers.get('x-slack-request-timestamp');
    
    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
    }

    const isValid = verifySlackSignature(
      process.env.SLACK_SIGNING_SECRET!,
      signature,
      timestamp,
      body
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Handle URL verification challenge
    if (payload.type === 'url_verification') {
      return NextResponse.json({ challenge: payload.challenge });
    }

    // Handle message events
    if (payload.event?.type === 'message') {
      const event = payload.event;

      // Ignore bot messages and messages without thread_ts
      if (event.bot_id || event.subtype || !event.thread_ts) {
        return NextResponse.json({ ok: true });
      }

      // Find ticket by thread_ts
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('slack_thread_ts', event.thread_ts)
        .single();

      if (!ticket) {
        console.log('No ticket found for thread:', event.thread_ts);
        return NextResponse.json({ ok: true });
      }

      // Get Slack user info
      const { data: { user: slackUser } } = await fetch(
        `https://slack.com/api/users.info?user=${event.user}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          },
        }
      ).then(res => res.json());

      const adminName = slackUser?.real_name || slackUser?.name || 'Admin';

      // Create admin reply in database
      const { error: replyError } = await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: ticket.id,
          admin_id: event.user, // Slack user ID
          admin_name: adminName,
          admin_team: 'Support',
          message: event.text,
          reply_type: 'admin',
        });

      if (replyError) {
        console.error('Error creating reply:', replyError);
        return NextResponse.json({ ok: false });
      }

      // Update ticket timestamp
      await supabase
        .from('support_tickets')
        .update({
          updated_at: new Date().toISOString(),
          last_reply_by: 'admin',
        })
        .eq('id', ticket.id);

      // Send email to user (reuse existing email logic)
      try {
        const { sendEmail, generateTicketReplyEmail } = await import('@/lib/email');
        const { formatTicketNumber } = await import('@/lib/ticket-utils');

        const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL}/support/${ticket.id}`;
        
        const emailHtml = generateTicketReplyEmail({
          recipientName: ticket.user_display_name,
          ticketId: formatTicketNumber(ticket.id),
          orderId: ticket.order_id,
          issueType: ticket.issue_type,
          replyMessage: event.text,
          ticketUrl,
        });

        await sendEmail({
          to: ticket.user_email,
          replyTo: `support+${ticket.id}@chueulkoia.resend.app`,
          subject: `Response to Your Support Ticket - ${ticket.order_id}`,
          html: emailHtml,
        });

        console.log('✅ Email sent to user from Slack reply');
      } catch (emailError) {
        console.error('❌ Failed to send email:', emailError);
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Slack events error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}