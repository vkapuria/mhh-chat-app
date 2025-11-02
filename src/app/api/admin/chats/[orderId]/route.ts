import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { orderId } = await context.params;

    // Fetch order info
    const { data: order, error: orderError } = await supabaseServer
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch messages (bypasses RLS with service role)
    const { data: messages, error: messagesError } = await supabaseServer
      .from('chat_messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json(
        { error: messagesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
      messages: messages || [],
    });
  } catch (error) {
    console.error('Admin chat fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}