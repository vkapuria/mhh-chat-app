import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedUser } from '@/lib/cached-auth';
import { withPerformanceLogging } from '@/lib/api-timing';

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

    // Create reply from customer
    const { data: reply, error: insertError } = await supabase
      .from('ticket_replies')
      .insert({
        ticket_id: ticketId,
        admin_id: user.id,
        admin_name: ticket.user_display_name,
        message: message.trim(),
        reply_type: 'user', // Mark as user reply
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert reply error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Update ticket timestamp
    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

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