import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET: Fetch messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('chat_messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, messages: data });
  } catch (error) {
    console.error('Test API GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST: Send message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabaseServer
      .from('chat_messages')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: data });
  } catch (error) {
    console.error('Test API POST error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}