import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateDisplayName, isDisplayNameUnique } from '@/lib/display-name';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || '',
        display_name: user.user_metadata?.display_name || '',
        user_type: user.user_metadata?.user_type || 'customer',
        avatar_url: user.user_metadata?.avatar_url || null,
      },
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, display_name } = body;

    // If display_name is being updated, validate it
    if (display_name !== undefined && display_name !== user.user_metadata?.display_name) {
      // Validate format
      const validation = validateDisplayName(display_name);
      if (!validation.valid) {
        return NextResponse.json({ 
          error: validation.errors[0] 
        }, { status: 400 });
      }

      // Check uniqueness
      const isUnique = await isDisplayNameUnique(display_name, user.id);
      if (!isUnique) {
        return NextResponse.json({ 
          error: 'This display name is already taken. Please choose another.' 
        }, { status: 400 });
      }
    }

    // Update user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      email: email || user.email,
      data: {
        ...user.user_metadata,
        name: name || user.user_metadata?.name,
        display_name: display_name !== undefined ? display_name : user.user_metadata?.display_name,
      },
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}