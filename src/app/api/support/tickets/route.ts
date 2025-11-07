import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedUser } from '@/lib/cached-auth';
import { withPerformanceLogging } from '@/lib/api-timing';
import { sendEmail, generateTicketConfirmationEmail } from '@/lib/email';
import { formatTicketNumber } from '@/lib/ticket-utils';
import { postTicketToSlack } from '@/lib/slack';

async function ticketsHandler(request: NextRequest) {
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

    if (request.method === 'POST') {
      const body = await request.json();
      const { order_id, issue_type, message } = body;

      if (!order_id || !issue_type || !message) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
      const userType = user.user_metadata?.user_type || 'customer';
      const userAvatarUrl = user.user_metadata?.avatar_url || null;

      // Get order details
      // Get order details (column is 'title' and 'id', not 'order_title' and 'order_id')
const { data: order, error: orderError } = await supabase
.from('orders')
.select('title')
.eq('id', order_id)
.single();

if (orderError) {
console.error('Failed to fetch order title:', orderError);
}

console.log('Order fetched:', order);

      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_display_name: displayName,
          user_type: userType,
          user_avatar_url: userAvatarUrl,
          order_id,
          order_title: order?.title || '',
          issue_type,
          message: message.trim(),
          status: 'submitted',
        })
        .select()
        .single();

      if (ticketError) {
        console.error('Ticket creation error:', ticketError);
        return NextResponse.json({ error: ticketError.message }, { status: 500 });
      }

      if (ticket) {
        // Post to Slack
        try {
          const slackThreadTs = await postTicketToSlack({
            id: ticket.id,
            user_display_name: displayName,
            user_email: user.email!,
            user_type: userType,
            order_id: order_id,
            order_title: order?.title || '',
            issue_type,
            message: message.trim(),
            created_at: ticket.created_at,
          });

          if (slackThreadTs) {
            // Use service role for update
            const serviceSupabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            
            const { error: updateError } = await serviceSupabase
              .from('support_tickets')
              .update({ slack_thread_ts: slackThreadTs })
              .eq('id', ticket.id);
            
            if (updateError) {
              console.error('❌ Failed to save slack_thread_ts:', updateError);
            } else {
              console.log('✅ Posted ticket to Slack with thread_ts:', slackThreadTs);
            }
          }
        } catch (slackError) {
          console.error('❌ Failed to post to Slack:', slackError);
        }

        // Send confirmation email
        try {
          const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mhh-chat-app.vercel.app'}/support/${ticket.id}`;
          
          const emailHtml = generateTicketConfirmationEmail({
            recipientName: displayName,
            ticketId: formatTicketNumber(ticket.id),
            orderId: order_id,
            issueType: issue_type,
            ticketUrl,
          });

          await sendEmail({
            to: user.email!,
            replyTo: `support+${ticket.id}@chueulkoia.resend.app`,
            subject: `Support Ticket Created - ${order_id}`,
            html: emailHtml,
          });

          console.log('✅ Confirmation email sent');
        } catch (emailError) {
          console.error('❌ Failed to send email:', emailError);
        }
      }

      return NextResponse.json({
        success: true,
        ticket,
      });
    }

    if (request.method === 'GET') {
      const userType = user.user_metadata?.user_type;

      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (userType !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      const { data: tickets, error: fetchError } = await query;

      if (fetchError) {
        console.error('Fetch tickets error:', fetchError);
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        tickets: tickets || [],
      });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Tickets API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withPerformanceLogging('/api/support/tickets', ticketsHandler);
export const POST = withPerformanceLogging('/api/support/tickets', ticketsHandler);