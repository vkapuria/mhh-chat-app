import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  sendOnboardingReminder1, 
  sendOnboardingReminder2,
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
  
  console.log('🔔 CRON: Onboarding Reminders - Starting...');
  
  // Verify authorization
  if (!verifyCronSecret(request)) {
    console.error('❌ Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // =====================================================
    // REMINDER #1: Day 2 (48-72 hours after account creation)
    // =====================================================
    
    console.log('📅 Checking for Day 2 reminders...');
    
    // Declare tracking variables at function scope
    let reminder1Sent = 0;
    let reminder1Failed = 0;
    
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setHours(threeDaysAgo.getHours() - 72);

    // Find users created 2-3 days ago who:
    // - Haven't completed onboarding
    // - Haven't received reminder 1
    const { data: day2Users, error: day2Error } = await supabaseAdmin
      .from('user_onboarding')
      .select('user_id, created_at')
      .is('onboarding_completed', false)
      .is('reminder_email_1_sent_at', null)
      .gte('created_at', threeDaysAgo.toISOString())
      .lte('created_at', twoDaysAgo.toISOString());

    if (day2Error) {
      console.error('❌ Error fetching Day 2 users:', day2Error);
    } else {
      console.log(`📊 Found ${day2Users?.length || 0} users needing Reminder #1`);

      if (day2Users && day2Users.length > 0) {
        for (const record of day2Users) {
          const userInfo = await getUserInfoForEmail(record.user_id);
          
          if (!userInfo) {
            console.error(`❌ No user info for ${record.user_id}`);
            reminder1Failed++;
            continue;
          }

          const result = await sendOnboardingReminder1({
            userId: record.user_id,
            userEmail: userInfo.email,
            userName: userInfo.name,
          });

          if (result.success) {
            reminder1Sent++;
            console.log(`✅ Reminder #1 sent to ${userInfo.email}`);
          } else {
            reminder1Failed++;
            console.error(`❌ Failed to send Reminder #1 to ${userInfo.email}:`, result.error);
          }

          // Rate limiting: Small delay between emails (Resend allows 10/sec)
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log(`📧 Reminder #1 Stats: ${reminder1Sent} sent, ${reminder1Failed} failed`);
    }

    // =====================================================
    // REMINDER #2: Day 5 (120-144 hours after account creation)
    // =====================================================
    
    console.log('📅 Checking for Day 5 reminders...');
    
    // Declare tracking variables at function scope
    let reminder2Sent = 0;
    let reminder2Failed = 0;
    
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setHours(fiveDaysAgo.getHours() - 120);
    
    const sixDaysAgo = new Date();
    sixDaysAgo.setHours(sixDaysAgo.getHours() - 144);

    // Find users created 5-6 days ago who:
    // - Haven't completed onboarding
    // - Haven't received reminder 2
    const { data: day5Users, error: day5Error } = await supabaseAdmin
      .from('user_onboarding')
      .select('user_id, created_at')
      .is('onboarding_completed', false)
      .is('reminder_email_2_sent_at', null)
      .gte('created_at', sixDaysAgo.toISOString())
      .lte('created_at', fiveDaysAgo.toISOString());

    if (day5Error) {
      console.error('❌ Error fetching Day 5 users:', day5Error);
    } else {
      console.log(`📊 Found ${day5Users?.length || 0} users needing Reminder #2`);

      if (day5Users && day5Users.length > 0) {
        for (const record of day5Users) {
          const userInfo = await getUserInfoForEmail(record.user_id);
          
          if (!userInfo) {
            console.error(`❌ No user info for ${record.user_id}`);
            reminder2Failed++;
            continue;
          }

          const result = await sendOnboardingReminder2({
            userId: record.user_id,
            userEmail: userInfo.email,
            userName: userInfo.name,
          });

          if (result.success) {
            reminder2Sent++;
            console.log(`✅ Reminder #2 sent to ${userInfo.email}`);
          } else {
            reminder2Failed++;
            console.error(`❌ Failed to send Reminder #2 to ${userInfo.email}:`, result.error);
          }

          // Rate limiting: Small delay between emails
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log(`📧 Reminder #2 Stats: ${reminder2Sent} sent, ${reminder2Failed} failed`);
    }

    // =====================================================
    // FINAL SUMMARY
    // =====================================================

    const duration = Date.now() - startTime;
    const summary = {
      success: true,
      duration: `${duration}ms`,
      reminder1: {
        found: day2Users?.length || 0,
        sent: reminder1Sent,
        failed: reminder1Failed,
      },
      reminder2: {
        found: day5Users?.length || 0,
        sent: reminder2Sent,
        failed: reminder2Failed,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('✅ CRON: Onboarding Reminders - Complete', summary);
    
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