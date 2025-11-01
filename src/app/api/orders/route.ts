import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const userType = searchParams.get('userType');
    const expertId = searchParams.get('expertId');

    if (!userEmail || !userType) {
      return NextResponse.json(
        { error: 'User email and type are required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        experts:expert_id (name, email)
      `)
      .order('created_at', { ascending: false });

    // Filter based on user type
    if (userType === 'customer') {
      query = query.eq('customer_email', userEmail);
    } else if (userType === 'expert' && expertId) {
      query = query
        .eq('expert_id', expertId)
        .neq('status', 'pending');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, orders: data });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}