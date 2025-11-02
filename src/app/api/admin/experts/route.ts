import { NextResponse } from 'next/server';
import { listExperts } from '@/lib/admin';

export async function GET() {
  try {
    const result = await listExperts();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      experts: result.experts,
    });
  } catch (error) {
    console.error('Experts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}