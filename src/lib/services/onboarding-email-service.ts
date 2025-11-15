import { createClient } from '@supabase/supabase-js';
import { 
  sendEmail, 
  generateOnboardingReminder1Email,
  generateOnboardingReminder2Email,
  generateOnboardingWelcomeEmail
} from '../email';

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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://chat.myhomeworkhelp.com';
const LOGIN_URL = `${APP_URL}/login`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;

// =====================================================
// SEND REMINDER EMAIL #1 (Day 2 - FOMO)
// =====================================================

export async function sendOnboardingReminder1(params: {
  userId: string;
  userEmail: string;
  userName: string;
}) {
  const { userId, userEmail, userName } = params;
  
  console.log('📧 Sending Reminder #1 to:', userEmail);

  try {
    // Generate email HTML
    const emailHtml = generateOnboardingReminder1Email({
      name: userName,
      email: userEmail,
      loginUrl: LOGIN_URL,
    });

    // Send email via Resend
    const result = await sendEmail({
      to: userEmail,
      subject: '🚨 Your MyHomeworkHelp account is ready - Don\'t miss out!',
      html: emailHtml,
      from: 'MyHomeworkHelp <orders@myhomeworkhelp.com>',
    });

    if (!result.success) {
      console.error('❌ Failed to send Reminder #1:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ Reminder #1 sent successfully to:', userEmail);

    // Update database - mark reminder 1 as sent
    const { error: updateError } = await supabaseAdmin
      .from('user_onboarding')
      .update({ 
        reminder_email_1_sent_at: new Date().toISOString() 
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Failed to update reminder_email_1_sent_at:', updateError);
      // Email was sent, but tracking failed - still return success
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('💥 Error in sendOnboardingReminder1:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// =====================================================
// SEND REMINDER EMAIL #2 (Day 5 - Urgency)
// =====================================================

export async function sendOnboardingReminder2(params: {
  userId: string;
  userEmail: string;
  userName: string;
}) {
  const { userId, userEmail, userName } = params;
  
  console.log('📧 Sending Reminder #2 to:', userEmail);

  try {
    // Generate email HTML
    const emailHtml = generateOnboardingReminder2Email({
      name: userName,
      email: userEmail,
      loginUrl: LOGIN_URL,
    });

    // Send email via Resend
    const result = await sendEmail({
      to: userEmail,
      subject: '⏰ Final reminder: Your homework help account is waiting',
      html: emailHtml,
      from: 'MyHomeworkHelp <orders@myhomeworkhelp.com>',
    });

    if (!result.success) {
      console.error('❌ Failed to send Reminder #2:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ Reminder #2 sent successfully to:', userEmail);

    // Update database - mark reminder 2 as sent
    const { error: updateError } = await supabaseAdmin
      .from('user_onboarding')
      .update({ 
        reminder_email_2_sent_at: new Date().toISOString() 
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Failed to update reminder_email_2_sent_at:', updateError);
      // Email was sent, but tracking failed - still return success
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('💥 Error in sendOnboardingReminder2:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// =====================================================
// SEND WELCOME EMAIL (1 Hour Post-Onboarding)
// =====================================================

export async function sendOnboardingWelcome(params: {
  userId: string;
  userEmail: string;
  userName: string;
}) {
  const { userId, userEmail, userName } = params;
  
  console.log('📧 Sending Welcome Email to:', userEmail);

  try {
    // Generate email HTML
    const emailHtml = generateOnboardingWelcomeEmail({
      name: userName,
      email: userEmail,
      dashboardUrl: DASHBOARD_URL,
    });

    // Send email via Resend
    const result = await sendEmail({
      to: userEmail,
      subject: '🎉 Welcome to MyHomeworkHelp Chat! Here\'s what you can do',
      html: emailHtml,
      from: 'MyHomeworkHelp <orders@myhomeworkhelp.com>',
    });

    if (!result.success) {
      console.error('❌ Failed to send Welcome Email:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ Welcome Email sent successfully to:', userEmail);

    // Update database - mark welcome email as sent
    const { error: updateError } = await supabaseAdmin
      .from('user_onboarding')
      .update({ 
        welcome_email_sent_at: new Date().toISOString() 
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Failed to update welcome_email_sent_at:', updateError);
      // Email was sent, but tracking failed - still return success
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('💥 Error in sendOnboardingWelcome:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// =====================================================
// HELPER: GET USER INFO FOR EMAILS
// =====================================================

export async function getUserInfoForEmail(userId: string): Promise<{
  email: string;
  name: string;
} | null> {
  try {
    // Get user from auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !authUser) {
      console.error('❌ Failed to get user from auth:', authError);
      return null;
    }

    const email = authUser.user.email || '';
    const name = authUser.user.user_metadata?.display_name || 
                 authUser.user.user_metadata?.name || 
                 email.split('@')[0] || 
                 'User';

    return { email, name };
  } catch (error) {
    console.error('💥 Error in getUserInfoForEmail:', error);
    return null;
  }
}