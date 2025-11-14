import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
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
      // Mark onboarding as completed
      const { error } = await supabase
        .from('user_onboarding')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error completing onboarding:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in onboarding POST:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}