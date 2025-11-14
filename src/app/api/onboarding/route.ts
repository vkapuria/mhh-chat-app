import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notifyOnboardingCompleted } from '@/lib/slack';

export async function GET(request: NextRequest) {
  try {
    // Pass cookies function directly - Supabase will handle the async
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check onboarding status
    const { data: onboarding } = await supabase
      .from('user_onboarding')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      completed: onboarding?.onboarding_completed || false,
      exists: !!onboarding,
    });
  } catch (error) {
    console.error('Error checking onboarding:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Pass cookies function directly - Supabase will handle the async
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === 'start') {
      // Create onboarding record
      const { error } = await supabase
        .from('user_onboarding')
        .insert({
          user_id: user.id,
          onboarding_started_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error starting onboarding:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'complete') {
      const completedAt = new Date().toISOString();
      
      // Mark onboarding as completed
      const { error } = await supabase
        .from('user_onboarding')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: completedAt,
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error completing onboarding:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Get user metadata for Slack notification
      const userName = (user as any).user_metadata?.display_name || user.email?.split('@')[0] || 'Unknown User';
      const userType = (user as any).user_metadata?.user_type || 'customer';

      console.log('📤 Sending Slack notification for onboarding completion...');
      
      // Post to Slack
      await notifyOnboardingCompleted({
        userId: user.id,
        userEmail: user.email || 'no-email',
        userName: userName,
        userType: userType,
        completedAt: completedAt,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in onboarding POST:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}