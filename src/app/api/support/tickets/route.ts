import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedUser } from '@/lib/cached-auth';
import { withPerformanceLogging } from '@/lib/api-timing';

async function ticketsHandler(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔍 Token:', token ? 'exists' : 'missing');

    const authResult = await getCachedUser(token);
    console.log('🔍 Auth result structure:', JSON.stringify(authResult, null, 2));

    const { data: { user }, error: authError } = authResult as any;
    console.log('🔍 User:', user?.email, 'Error:', authError);


    if (authError || !user) {
      console.error('Auth error:', authError || 'No user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // GET: List tickets
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');

      // Build base query
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      // Non-admins can only see their own tickets
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      // Filter by status if provided
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: tickets, error: ticketsError } = await query;

      if (ticketsError) {
        console.error('Tickets query error:', ticketsError);
        return NextResponse.json({ error: ticketsError.message }, { status: 500 });
      }

      // Get reply counts for each ticket
      const ticketsWithCount = await Promise.all(
        (tickets || []).map(async (ticket) => {
          const { count } = await supabase
            .from('ticket_replies')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id);

          return {
            ...ticket,
            reply_count: count || 0,
          };
        })
      );

      return NextResponse.json({
        success: true,
        tickets: ticketsWithCount,
      });
    }

    // POST: Create ticket
    if (request.method === 'POST') {
      const body = await request.json();
      const {
        order_id,
        order_title,
        task_code,
        issue_type,
        message,
        amount,
        expert_fee,
        customer_email,
        expert_email,
      } = body;

      // Validation
      if (!order_id || !issue_type || !message) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const userName = user.user_metadata?.name || user.email;
      const displayName = user.user_metadata?.display_name || userName;

      // Insert ticket
      const { data: ticket, error: insertError } = await supabase
        .from('support_tickets')
        .insert({
          order_id,
          order_title,
          task_code,
          user_id: user.id,
          user_email: user.email || '',
          user_name: userName,
          user_display_name: displayName,
          user_type: userType,
          issue_type,
          message,
          amount,
          expert_fee,
          customer_email,
          expert_email,
          status: 'submitted',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert ticket error:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        ticket,
      });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Tickets API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const GET = withPerformanceLogging('/api/support/tickets', ticketsHandler);
export const POST = withPerformanceLogging('/api/support/tickets', ticketsHandler);