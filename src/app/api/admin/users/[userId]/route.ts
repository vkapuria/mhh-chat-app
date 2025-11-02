import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { generateSecurePassword } from '@/lib/password-generator';
import { sendWelcomeEmailToUser } from '@/lib/admin';

// PATCH: Reset password or disable/enable user
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { userId } = await context.params;
    const body = await request.json();
    const { action } = body;

    if (action === 'reset-password') {
      // Generate new password
      const newPassword = generateSecurePassword(12);

      // Update user password
      const { data: user, error } = await supabaseServer.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      // Optionally send email with new password
      if (body.sendEmail && user.user) {
        await sendWelcomeEmailToUser(
          user.user.email!,
          user.user.user_metadata?.name || 'User',
          newPassword
        );
      }

      return NextResponse.json({
        success: true,
        password: newPassword,
        emailSent: !!body.sendEmail,
      });
    }

    if (action === 'toggle-status') {
      // Disable or enable user
      const { disabled } = body;

      const { data: user, error } = await supabaseServer.auth.admin.updateUserById(
        userId,
        { ban_duration: disabled ? '876000h' : 'none' } // ~100 years or none
      );

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        disabled,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('User action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}