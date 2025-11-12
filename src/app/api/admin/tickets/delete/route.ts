import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedUser } from '@/lib/cached-auth';

export async function POST(request: NextRequest) {
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

    // Verify admin
    const userType = user.user_metadata?.user_type;
    if (userType !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { ticket_ids } = body;

    if (!ticket_ids || !Array.isArray(ticket_ids) || ticket_ids.length === 0) {
      return NextResponse.json({ error: 'No ticket IDs provided' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete replies first (foreign key constraint)
// Delete replies first (foreign key constraint)
const { error: repliesError } = await supabase
.from('ticket_replies')
.delete()
.in('ticket_id', ticket_ids);

if (repliesError) {
console.error('Failed to delete replies:', repliesError);
return NextResponse.json({ 
  error: 'Failed to delete ticket replies' 
}, { status: 500 });
}

    // Delete tickets
    const { error: ticketsError } = await supabase
      .from('support_tickets')
      .delete()
      .in('id', ticket_ids);

    if (ticketsError) {
      console.error('Failed to delete tickets:', ticketsError);
      return NextResponse.json({ 
        error: 'Failed to delete tickets' 
      }, { status: 500 });
    }

    console.log(`✅ Deleted ${ticket_ids.length} ticket(s) by admin ${user.email}`);

    return NextResponse.json({
      success: true,
      deleted_count: ticket_ids.length,
    });
  } catch (error) {
    console.error('Delete tickets error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}