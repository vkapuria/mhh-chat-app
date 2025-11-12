import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedUser } from '@/lib/cached-auth';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim() || '';
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Select only columns that exist
    let dbQuery = supabase
      .from('orders')
      .select(`
        id,
        title,
        task_code,
        status,
        customer_name,
        customer_display_name,
        customer_email,
        expert_name,
        expert_display_name,
        expert_id,
        amount,
        expert_fee,
        created_at,
        updated_at
      `)
      .order('updated_at', { ascending: false });

    // Filter for active orders if requested
    if (activeOnly) {
      dbQuery = dbQuery.in('status', ['Assigned', 'Revision']);
    }

    // Search filter - single line, no newlines
    if (query) {
      dbQuery = dbQuery.or(`id.ilike.%${query}%,title.ilike.%${query}%,task_code.ilike.%${query}%,customer_name.ilike.%${query}%,customer_email.ilike.%${query}%,expert_name.ilike.%${query}%`);
    }

    // Limit results
    dbQuery = dbQuery.limit(activeOnly ? 20 : 10);

    const { data: orders, error } = await dbQuery;

    if (error) {
      console.error('Search orders error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with expert emails from auth.users
    const expertIds = orders?.filter(o => o.expert_id).map(o => o.expert_id) || [];
    
    let expertEmailMap = new Map<string, string>();
    
    if (expertIds.length > 0) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      
      console.log('📧 Loading expert emails for IDs:', expertIds);
      console.log('👥 Total auth users:', authUsers?.users?.length);
      
      // Show first few auth users to understand structure
      console.log('👥 Sample auth users:', authUsers?.users?.slice(0, 3).map(u => ({
        id: u.id,
        email: u.email,
        user_type: u.user_metadata?.user_type,
        expert_id: u.user_metadata?.expert_id,
      })));
      
      // Try matching by expert_id in user_metadata
      authUsers?.users.forEach(u => {
        const userExpertId = u.user_metadata?.expert_id;
        
        if (userExpertId && expertIds.includes(userExpertId)) {
          expertEmailMap.set(userExpertId, u.email || '');
          console.log(`  ✅ Expert ${userExpertId} → ${u.email} (via user_metadata.expert_id)`);
        }
        
        // Also try direct ID match (in case some use auth user ID)
        if (u.id && expertIds.includes(u.id)) {
          expertEmailMap.set(u.id, u.email || '');
          console.log(`  ✅ Expert ${u.id} → ${u.email} (via auth user ID)`);
        }
      });
      
      console.log('📧 Expert email map size:', expertEmailMap.size);
    }

    // Add expert emails to results
    const enrichedOrders = orders?.map(order => ({
      ...order,
      expert_email: order.expert_id ? (expertEmailMap.get(order.expert_id) || null) : null,
    })) || [];
    
    console.log('📦 Returning enriched orders:', enrichedOrders.map(o => ({
      id: o.id,
      expert_id: o.expert_id,
      expert_email: o.expert_email,
    })));

    return NextResponse.json({
      success: true,
      orders: enrichedOrders,
    });
  } catch (error) {
    console.error('Admin orders search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}