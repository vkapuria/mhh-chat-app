import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedUser } from '@/lib/cached-auth';
import { withPerformanceLogging } from '@/lib/api-timing';
import { sendEmail, generateTicketReplyEmail } from '@/lib/email';
import { formatTicketNumber } from '@/lib/ticket-utils';


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

      const adminName = user.user_metadata?.name || user.email;

      const { data: reply, error: insertError } = await supabase
        .from('ticket_replies')
        .insert({
          ticket_id: ticketId,
          admin_id: user.id,
          admin_name: adminName,
          message: message.trim(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert reply error:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Update ticket's updated_at timestamp
      await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

      // Fetch ticket details for email notification
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      // Send email notification to user
      if (ticket) {
        const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://chat.myhomeworkhelp.com'}/support`;
        
        const emailHtml = generateTicketReplyEmail({
          recipientName: ticket.user_display_name,
          ticketId: formatTicketNumber(ticket.id),
          orderId: ticket.order_id,
          issueType: ticket.issue_type,
          replyMessage: message.trim(),
          ticketUrl,
        });

        await sendEmail({
          to: ticket.user_email,
          replyTo: `support+${ticket.id}@chueulkoia.resend.app`, // ← Add this!
          subject: `Response to Your Support Ticket - ${ticket.order_id}`,
          html: emailHtml,
        });
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