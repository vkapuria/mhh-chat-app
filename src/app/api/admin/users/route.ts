import { NextRequest, NextResponse } from 'next/server';
import { createUserAccount, listUsers, sendWelcomeEmailToUser } from '@/lib/admin';

// GET: List all users with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType') as 'customer' | 'expert' | 'admin' | null;
    const search = searchParams.get('search');

    const result = await listUsers({
      userType: userType || undefined,
      search: search || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      users: result.users,
    });
  } catch (error) {
    console.error('List users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, userType, expertId, sendEmail: shouldSendEmail } = body;

    // Validate required fields
    if (!email || !name || !userType) {
      return NextResponse.json(
        { error: 'Email, name, and user type are required' },
        { status: 400 }
      );
    }

    if (userType === 'expert' && !expertId) {
      return NextResponse.json(
        { error: 'Expert ID is required for expert accounts' },
        { status: 400 }
      );
    }

    // Create user
    const result = await createUserAccount({
      email,
      name,
      userType,
      expertId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Send welcome email if requested
    let emailSent = false;
    let emailError = null;

    if (shouldSendEmail && result.user) {
      const emailResult = await sendWelcomeEmailToUser(
        result.user.email,
        name,
        result.user.password
      );

      emailSent = emailResult.success;
      emailError = emailResult.error;
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      emailSent,
      emailError,
    });
  } catch (error) {
    console.error('Create user API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}