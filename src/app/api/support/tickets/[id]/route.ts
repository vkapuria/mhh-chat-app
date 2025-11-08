import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedUser } from '@/lib/cached-auth';
import { withPerformanceLogging } from '@/lib/api-timing';
import { sendEmail, generateTicketStatusUpdateEmail } from '@/lib/email';
import { formatTicketNumber } from '@/lib/ticket-utils';
import { getOpenPanel } from '@/lib/openpanel';

async function ticketDetailHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const authResult = await getCachedUser(token);
    const { data: { user }, error: authError } = authResult as any;

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

    // GET: Get ticket details with replies
    if (request.method === 'GET') {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          replies:ticket_replies(*)
        `)
        .eq('id', ticketId)
        .single();

      const { data: ticket, error } = await query;

      if (error) {
        console.error('Fetch ticket error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      // Check permissions: users can only view their own tickets
      if (!isAdmin && ticket.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Sort replies by created_at
      if (ticket.replies) {
        ticket.replies.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }

      return NextResponse.json({
        success: true,
        ticket,
      });
    }

    // PATCH: Update ticket status (admin only)
    if (request.method === 'PATCH') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const body = await request.json();
      const { status } = body;

      if (!status || !['submitted', 'in_progress', 'resolved'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }

      // First, get the old ticket data
      const { data: oldTicket } = await supabase
        .from('support_tickets')
        .select('status')
        .eq('id', ticketId)
        .single();

      const updateData: any = { status };
      
      // Set resolved_at timestamp when marking as resolved
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) {
        console.error('Update ticket error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Track ticket resolved event
      if (ticket && status === 'resolved' && oldTicket?.status !== 'resolved') {
        const createdAt = new Date(ticket.created_at);
        const resolvedAt = new Date(ticket.resolved_at || Date.now());
        const resolutionTimeMinutes = Math.round((resolvedAt.getTime() - createdAt.getTime()) / 60000);
        
        getOpenPanel()?.track('✅ ticket_resolved', {
          ticketId: ticketId,
          resolvedBy: 'admin',
          resolutionTime: resolutionTimeMinutes,
        });
      }

      // Send email notification ONLY for manual status changes
      // Skip email if status changed automatically (e.g., from admin reply)
      const isManualChange = oldTicket && ticket && oldTicket.status !== ticket.status;

      if (isManualChange) {
        const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://chat.myhomeworkhelp.com'}/support`;
        
        const emailHtml = generateTicketStatusUpdateEmail({
          recipientName: ticket.user_display_name,
          ticketId: formatTicketNumber(ticket.id),
          orderId: ticket.order_id,
          issueType: ticket.issue_type,
          oldStatus: oldTicket.status,
          newStatus: ticket.status,
          ticketUrl,
        });

        await sendEmail({
          to: ticket.user_email,
          subject: `Ticket Status Update: ${ticket.status.replace('_', ' ').toUpperCase()} - ${ticket.order_id}`,
          html: emailHtml,
        });
        
        console.log('✅ Status change email sent');
      }

      return NextResponse.json({
        success: true,
        ticket,
      });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Ticket detail API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const GET = withPerformanceLogging(
  '/api/support/tickets/[id]',
  ticketDetailHandler
);
export const PATCH = withPerformanceLogging(
  '/api/support/tickets/[id]',
  ticketDetailHandler
);