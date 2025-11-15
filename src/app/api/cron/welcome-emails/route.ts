import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  sendOnboardingWelcome,
  getUserInfoForEmail 
} from '@/lib/services/onboarding-email-service';

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

// Verify cron secret (security)
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // If CRON_SECRET is set, verify it
  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }
  
  // If no CRON_SECRET set, allow (for local testing)
  return true;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  console.log('🎉 CRON: Welcome Emails - Starting...');
  
  // Verify authorization
  if (!verifyCronSecret(request)) {
    console.error('❌ Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // =====================================================
    // WELCOME EMAILS: 1+ hours after onboarding completion
    // =====================================================
    
    console.log('📅 Checking for users who completed onboarding 1+ hours ago...');
    
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Find users who:
    // - Completed onboarding at least 1 hour ago
    // - Haven't received welcome email yet
    const { data: completedUsers, error: fetchError } = await supabaseAdmin
      .from('user_onboarding')
      .select('user_id, onboarding_completed_at')
      .eq('onboarding_completed', true)
      .not('onboarding_completed_at', 'is', null)
      .lte('onboarding_completed_at', oneHourAgo.toISOString())
      .is('welcome_email_sent_at', null);

    if (fetchError) {
      console.error('❌ Error fetching completed users:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${completedUsers?.length || 0} users needing welcome email`);
    
    let welcomeSent = 0;
    let welcomeFailed = 0;

    if (completedUsers && completedUsers.length > 0) {
      for (const record of completedUsers) {
        const userInfo = await getUserInfoForEmail(record.user_id);
        
        if (!userInfo) {
          console.error(`❌ No user info for ${record.user_id}`);
          welcomeFailed++;
          continue;
        }

        const result = await sendOnboardingWelcome({
          userId: record.user_id,
          userEmail: userInfo.email,
          userName: userInfo.name,
        });

        if (result.success) {
          welcomeSent++;
          console.log(`✅ Welcome email sent to ${userInfo.email}`);
        } else {
          welcomeFailed++;
          console.error(`❌ Failed to send welcome email to ${userInfo.email}:`, result.error);
        }

        // Rate limiting: Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`📧 Welcome Email Stats: ${welcomeSent} sent, ${welcomeFailed} failed`);

    // =====================================================
    // FINAL SUMMARY
    // =====================================================

    const duration = Date.now() - startTime;
    const summary = {
      success: true,
      duration: `${duration}ms`,
      welcome: {
        found: completedUsers?.length || 0,
        sent: welcomeSent,
        failed: welcomeFailed,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('✅ CRON: Welcome Emails - Complete', summary);
    
    return NextResponse.json(summary);

  } catch (error) {
    console.error('💥 CRON ERROR:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}