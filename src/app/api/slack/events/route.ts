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
    return false;
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

    // Handle URL verification challenge FIRST (before signature check)
    if (payload.type === 'url_verification') {
      console.log('✅ Slack URL verification challenge received');
      return NextResponse.json({ challenge: payload.challenge });
    }

    // Now verify signature for all other events
    const signature = request.headers.get('x-slack-signature');
    const timestamp = request.headers.get('x-slack-request-timestamp');
    
    if (!signature || !timestamp) {
      console.error('❌ Missing Slack headers');
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
    }

    const isValid = verifySlackSignature(
      process.env.SLACK_SIGNING_SECRET!,
      signature,
      timestamp,
      body
    );

    if (!isValid) {
      console.error('❌ Invalid Slack signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Handle message events
    if (payload.event?.type === 'message') {
      const event = payload.event;

      // Ignore bot messages and messages without thread_ts
      if (event.bot_id || event.subtype || !event.thread_ts) {
        return NextResponse.json({ ok: true });
      }

      console.log('📨 Received message in thread:', event.thread_ts);

      // Find ticket by thread_ts
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('slack_thread_ts', event.thread_ts)
        .single();

      if (!ticket) {
        console.log('⚠️ No ticket found for thread:', event.thread_ts);
        return NextResponse.json({ ok: true });
      }

      console.log('🎫 Found ticket:', ticket.id);

      // Use default admin identity for privacy
const adminName = 'Nick Kessler';
const adminTeam = 'Admin';
const adminAvatar = '/avatars/admin/nick-kessler.png';

console.log('Using admin identity:', adminName);

      // Create admin reply in database
const { error: replyError } = await supabase
.from('ticket_replies')
.insert({
  ticket_id: ticket.id,
  admin_id: event.user,
  admin_name: adminName,
  admin_team: adminTeam,
  admin_avatar: adminAvatar,
  message: event.text,
  reply_type: 'admin',
});

      if (replyError) {
        console.error('❌ Error creating reply:', replyError);
        return NextResponse.json({ ok: false });
      }

      console.log('✅ Reply saved to database');

      // Update ticket timestamp
      await supabase
        .from('support_tickets')
        .update({
          updated_at: new Date().toISOString(),
          last_reply_by: 'admin',
        })
        .eq('id', ticket.id);

      // Send email to user
      try {
        const { sendEmail, generateTicketReplyEmail } = await import('@/lib/email');
        const { formatTicketNumber } = await import('@/lib/ticket-utils');

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
          replyMessage: event.text,
          adminName: adminName,                        // Nick Kessler
          repliedAt: repliedAt,                        // Nov 9, 2025 at 3:15 PM
          ticketUrl,
        });

        await sendEmail({
          to: ticket.user_email,
          replyTo: `support+${ticket.id}@chueulkoia.resend.app`,
          subject: `💬 New Reply to Your Ticket - ${ticket.order_id}`,
          html: emailHtml,
        });

        console.log('✅ Email sent to user');
      } catch (emailError) {
        console.error('❌ Failed to send email:', emailError);
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('❌ Slack events error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Add GET handler for testing
export async function GET() {
  return NextResponse.json({ 
    status: 'Slack Events Endpoint',
    message: 'This endpoint only accepts POST requests from Slack'
  });
}