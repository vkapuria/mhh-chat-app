import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { updateSlackTicketStatus } from '@/lib/slack';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const payload = JSON.parse(new URLSearchParams(body).get('payload')!);

    if (payload.type === 'block_actions') {
      const action = payload.actions[0];
      const valueParts = action.value.split('_');
      const newStatus = valueParts[0];
      const ticketId = valueParts.slice(1).join('_');

      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (updateError) {
        console.error('Error updating ticket:', updateError);
        return NextResponse.json({ text: '❌ Failed to update status' });
      }

      await updateSlackTicketStatus(
        payload.message.ts,
        ticketId,
        newStatus
      );

      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (ticket) {
        try {
          const { sendEmail, generateTicketStatusChangeEmail } = await import('@/lib/email');
          const { formatTicketNumber } = await import('@/lib/ticket-utils');

          let statusText = 'Open';
          if (newStatus === 'in_progress') {
            statusText = 'In Progress';
          } else if (newStatus === 'resolved') {
            statusText = 'Resolved';
          }

          const emailHtml = generateTicketStatusChangeEmail({
            recipientName: ticket.user_display_name,
            ticketId: formatTicketNumber(ticket.id),
            orderId: ticket.order_id,
            issueType: ticket.issue_type,
            oldStatus: ticket.status,
            newStatus: statusText,
            ticketUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support/${ticket.id}`,
          });

          await sendEmail({
            to: ticket.user_email,
            subject: `Ticket Status Updated - ${ticket.order_id}`,
            html: emailHtml,
          });

          console.log('✅ Status change email sent');
        } catch (emailError) {
          console.error('❌ Failed to send email:', emailError);
        }
      }

      return NextResponse.json({
        text: `✅ Status changed to: ${newStatus.replace('_', ' ')}`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Slack interactions error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}