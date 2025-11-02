import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userType = user.user_metadata?.user_type;
    if (userType !== 'expert') {
      return NextResponse.json({ error: 'Only experts can view earnings' }, { status: 403 });
    }

    const expertId = user.user_metadata?.expert_id;

    // Get all completed orders for this expert
    const { data: completedOrders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('expert_id', expertId)
      .eq('status', 'Completed')
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate earnings (use expert_fee, NOT amount!)
const totalEarnings = completedOrders?.reduce((sum, order) => sum + (order.expert_fee || 0), 0) || 0;

// This month (actual calendar month - Nov 1 to today)
const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const thisMonthEarnings = completedOrders?.filter(
  order => {
    const completedDate = order.completed_at ? new Date(order.completed_at) : new Date(order.updated_at);
    return completedDate >= startOfMonth && completedDate <= now;
  }
).reduce((sum, order) => sum + (order.expert_fee || 0), 0) || 0;

// Remove thisWeekEarnings calculation entirely

    // Get all orders (including in progress) for stats
    const { data: allOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('expert_id', expertId);

    const totalOrders = allOrders?.length || 0;
    const completedCount = completedOrders?.length || 0;
    const completionRate = totalOrders > 0 ? Math.round((completedCount / totalOrders) * 100) : 0;

    // Average earnings per order
    const avgEarningsPerOrder = completedCount > 0 ? Math.round(totalEarnings / completedCount) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalEarnings,
        thisMonthEarnings,
        completedOrders: completedCount,
        totalOrders,
        completionRate,
        avgEarningsPerOrder,
      },
      orders: completedOrders || [],
    });
  } catch (error) {
    console.error('Earnings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}