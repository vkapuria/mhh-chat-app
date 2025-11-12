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
        // Send confirmation email
        try {
          const ticketUrl = `https://chat.myhomeworkhelp.com/support/${ticket.id}`;
          
          // Format the created date
          const createdAt = new Date(ticket.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Chicago', // CST/CDT
          });
          
          const emailHtml = generateTicketConfirmationEmail({
            recipientName: displayName,
            ticketId: ticket.id,                           // UUID for URL
            ticketNumber: formatTicketNumber(ticket.id),   // TCK-284019 for display
            orderId: order_id,
            issueType: issue_type,
            ticketUrl,
            createdAt,                                      // Formatted date
            status: 'submitted',                            // Initial status
          });

          await sendEmail({
            to: user.email!,
            replyTo: `support+${ticket.id}@chueulkoia.resend.app`,
            subject: `🎫 Support Ticket Created: TKT- ${formatTicketNumber(ticket.id)}`,
            html: emailHtml,
          });

          console.log('✅ Confirmation email sent');
          } catch (emailError) {
            console.error('❌ Failed to send email:', emailError);
          }

          // Send admin notification email
          try {
            const { generateAdminTicketCreatedEmail } = await import('@/lib/email');
            
            const adminTicketUrl = `https://chat.myhomeworkhelp.com/admin/support/${ticket.id}`;
            
            const adminEmailHtml = generateAdminTicketCreatedEmail({
              ticketNumber: formatTicketNumber(ticket.id),
              orderId: order_id,
              orderTitle: order?.title || '',
              issueType: issue_type,
              userName: displayName,
              userEmail: user.email!,
              userType: userType,
              message: message.trim(),
              ticketUrl: adminTicketUrl,
            });

            await sendEmail({
              to: 'orders@myhomeworkhelp.com',
              subject: `🎫 New Ticket: ${issue_type} - ${formatTicketNumber(ticket.id)}`,
              html: adminEmailHtml,
            });

            console.log('✅ Admin notification email sent');
          } catch (adminEmailError) {
            console.error('❌ Failed to send admin notification:', adminEmailError);
          }
      }

      return NextResponse.json({
        success: true,
        ticket,
      });
    }

    if (request.method === 'GET') {
      const userType = user.user_metadata?.user_type;
      
      // Get status filter from query params
      const { searchParams } = new URL(request.url);
      const statusFilter = searchParams.get('status');
    
      // Use service role to access auth.users
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Fetch active tickets (submitted + in_progress)
      let activeQuery = supabase
        .from('support_tickets')
        .select(`
          *,
          replies:ticket_replies(id, message, created_at, reply_type, admin_name)
        `)
        .in('status', ['submitted', 'in_progress'])
        .order('updated_at', { ascending: false });
    
      // Non-admin users only see their own tickets
      if (userType !== 'admin') {
        activeQuery = activeQuery.eq('user_id', user.id);
      }
    
      const { data: activeTickets, error: activeError } = await activeQuery;

      if (activeError) {
        console.error('Fetch active tickets error:', activeError);
        return NextResponse.json({ error: activeError.message }, { status: 500 });
      }

// Fetch resolved tickets separately (only recent ones for performance)
      // Load more groups on demand later
      const now = new Date();
      const last30DaysStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let resolvedQuery = supabase
        .from('support_tickets')
        .select(`
          *,
          replies:ticket_replies(id, message, created_at, reply_type, admin_name)
        `)
        .eq('status', 'resolved')
        .gte('resolved_at', last30DaysStart.toISOString()) // Only last 30 days
        .order('resolved_at', { ascending: false })
        .limit(50); // Safety limit
    
      // Non-admin users only see their own tickets
      if (userType !== 'admin') {
        resolvedQuery = resolvedQuery.eq('user_id', user.id);
      }
    
      const { data: resolvedTickets, error: resolvedError } = await resolvedQuery;

      if (resolvedError) {
        console.error('Fetch resolved tickets error:', resolvedError);
        return NextResponse.json({ error: resolvedError.message }, { status: 500 });
      }

      // Combine for processing
      const tickets = [...(activeTickets || []), ...(resolvedTickets || [])];

      // Get unique user IDs
      const userIds = [...new Set(tickets?.map(t => t.user_id).filter(Boolean))];

      // Fetch current user metadata for all users
      const { data: users } = await serviceSupabase.auth.admin.listUsers();
      const userMap = new Map(
        users?.users.map(u => [
          u.id, 
          {
            display_name: u.user_metadata?.display_name || u.email?.split('@')[0] || 'User',
            avatar_url: u.user_metadata?.avatar_url || null,
          }
        ])
      );

      // 🎯 Build admin avatar map
      const adminMap = new Map(
        users?.users
          .filter(u => u.user_metadata?.user_type === 'admin')
          .map(u => [
            u.id,
            {
              name: u.user_metadata?.display_name || u.user_metadata?.name || 'Support Team',
              avatar: u.user_metadata?.avatar_url || null,
            }
          ])
      );

      // Get default admin (Nick or first available)
      const defaultAdmin = Array.from(adminMap.values()).find(a => a.name.includes('Nick')) 
        || Array.from(adminMap.values())[0] 
        || { name: 'Support Team', avatar: '/avatars/admin/nick-kessler.png' };

      console.log('👨‍💼 Admin avatars loaded:', adminMap.size, 'Default:', defaultAdmin.name);

      // Add reply_count and update with current user info
      const ticketsWithCount = tickets?.map(ticket => {
        const currentUser = userMap.get(ticket.user_id);
        
        // Calculate correct last_reply_by from replies array
        let lastReplyBy = ticket.last_reply_by;
        if (ticket.replies && ticket.replies.length > 0) {
          const sortedReplies = [...ticket.replies].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          lastReplyBy = sortedReplies[0].reply_type === 'admin' ? 'admin' : 'user';
        }
        
        // 🎯 Get admin info (use assigned admin or default)
        const assignedAdmin = ticket.assigned_admin_id 
          ? adminMap.get(ticket.assigned_admin_id) 
          : null;
        const adminInfo = assignedAdmin || defaultAdmin;
        
        return {
          ...ticket,
          reply_count: ticket.replies?.length || 0,
          last_reply_by: lastReplyBy,
          // Override with current user data if available
          user_display_name: currentUser?.display_name || ticket.user_display_name,
          user_avatar_url: currentUser?.avatar_url || ticket.user_avatar_url,
          // Add admin info
          admin_avatar: adminInfo.avatar,
          admin_name: adminInfo.name,
        };
      }) || [];

      // Group resolved tickets by time buckets
      const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const resolvedGroups = {
        thisWeek: [] as any[],
        last30Days: [] as any[],
        older: [] as any[],
      };

      ticketsWithCount.forEach(ticket => {
        if (ticket.status === 'resolved') {
          const resolvedDate = new Date(ticket.resolved_at || ticket.updated_at);
          
          if (resolvedDate >= thisWeekStart) {
            resolvedGroups.thisWeek.push(ticket);
          } else if (resolvedDate >= last30DaysStart) {
            resolvedGroups.last30Days.push(ticket);
          } else {
            resolvedGroups.older.push(ticket);
          }
        }
      });

// Get count of older tickets for display (but don't load them yet)
const { count: olderCount } = await supabase
  .from('support_tickets')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'resolved')
  .lt('resolved_at', last30DaysStart.toISOString());

      return NextResponse.json({
        success: true,
        tickets: ticketsWithCount,
        resolved_groups: {
          ...resolvedGroups,
          older_count: olderCount || 0, // Don't load, just show count
        },
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