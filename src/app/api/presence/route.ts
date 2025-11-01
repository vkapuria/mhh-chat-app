import { NextRequest, NextResponse } from 'next/server';

// This is a placeholder for presence tracking
// Actual presence is handled via Supabase Realtime in the frontend
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'Presence handled via Supabase Realtime' 
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'Presence handled via Supabase Realtime' 
  });
}