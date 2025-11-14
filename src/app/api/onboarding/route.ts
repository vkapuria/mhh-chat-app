import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyOnboardingCompleted } from '@/lib/slack';

// Use service role client - bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('🔍 Checking onboarding for user:', userId);

    // Check onboarding status
    const { data: onboarding } = await supabaseAdmin
      .from('user_onboarding')
      .select('onboarding_completed')
      .eq('user_id', userId)
      .single();

    console.log('📊 Onboarding record:', onboarding);

    return NextResponse.json({
      completed: onboarding?.onboarding_completed || false,
      exists: !!onboarding,
    });
  } catch (error) {
    console.error('💥 Error in GET /api/onboarding:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, userName, userEmail, userType } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('📋 Action:', action, 'for user:', userId);

    if (action === 'start') {
      console.log('▶️ Starting onboarding...');
      const { error } = await supabaseAdmin
        .from('user_onboarding')
        .insert({
          user_id: userId,
          onboarding_started_at: new Date().toISOString(),
        });

      if (error) {
        console.error('❌ Error starting onboarding:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      console.log('✅ Onboarding started');
      return NextResponse.json({ success: true });
    }

    if (action === 'complete') {
      console.log('🏁 Completing onboarding...');
      const completedAt = new Date().toISOString();
      
      const { error } = await supabaseAdmin
        .from('user_onboarding')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: completedAt,
        })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error completing onboarding:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      console.log('✅ Onboarding marked complete in DB');

      // Post to Slack
      console.log('📤 Sending Slack notification...');
      const slackResult = await notifyOnboardingCompleted({
        userId,
        userEmail: userEmail || 'no-email',
        userName: userName || 'Unknown',
        userType: userType || 'customer',
        completedAt,
      });

      console.log('✅ Slack notification result:', slackResult);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('💥 Error in POST /api/onboarding:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}