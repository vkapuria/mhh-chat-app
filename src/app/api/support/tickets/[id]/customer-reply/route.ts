import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedUser } from '@/lib/cached-auth';
import { withPerformanceLogging } from '@/lib/api-timing';
import { sendEmail } from '@/lib/email';
import { postReplyToSlackThread } from '@/lib/slack';

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
      const ticketNumber = `TKT-${ticketId.substring(0, 8).toUpperCase()}`;
      const adminEmail = 'orders@myhomeworkhelp.com';
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .ticket-info { background-color: white; padding: 15px; border-left: 4px solid #4F46E5; margin: 15px 0; }
            .reply-box { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">🔔 New Reply on Support Ticket</h2>
            </div>
            <div class="content">
              <div class="ticket-info">
                <p style="margin: 5px 0;"><strong>Ticket:</strong> ${ticketNumber}</p>
                <p style="margin: 5px 0;"><strong>Order ID:</strong> ${ticket.order_id}</p>
                <p style="margin: 5px 0;"><strong>From:</strong> ${ticket.user_display_name} (${ticket.user_email})</p>
                <p style="margin: 5px 0;"><strong>Issue Type:</strong> ${ticket.issue_type}</p>
              </div>
              
              <h3>New Reply:</h3>
              <div class="reply-box">
                <p style="white-space: pre-wrap;">${message.trim()}</p>
              </div>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://chat.myhomeworkhelp.com'}/admin/support/${ticketId}" class="button">
                View Ticket in Admin Panel
              </a>
            </div>
            <div class="footer">
              <p>This is an automated notification from Homework Hub Support System</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: adminEmail,
        subject: `New Reply: ${ticket.issue_type} - ${ticketNumber}`,
        html: emailHtml,
      });

      console.log('✅ Admin notification email sent');
    } catch (emailError) {
      console.error('❌ Failed to send admin notification email:', emailError);
      // Don't fail the whole request if email fails
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