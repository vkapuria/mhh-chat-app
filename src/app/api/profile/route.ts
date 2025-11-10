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
        last_display_name_change: user.user_metadata?.last_display_name_change || null,
        last_avatar_change: user.user_metadata?.last_avatar_change || null,
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
    const { name, email, display_name, avatar_url } = body;

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const updatedMetadata: any = { ...user.user_metadata };

    // If display_name is being updated, validate it
    if (display_name !== undefined && display_name !== user.user_metadata?.display_name) {
      // Check 30-day restriction
      const lastChange = user.user_metadata?.last_display_name_change;
      if (lastChange) {
        const timeSinceChange = now - new Date(lastChange).getTime();
        if (timeSinceChange < THIRTY_DAYS_MS) {
          const daysRemaining = Math.ceil((THIRTY_DAYS_MS - timeSinceChange) / (24 * 60 * 60 * 1000));
          return NextResponse.json({
            error: `You can change your display name again in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`
          }, { status: 400 });
        }
      }

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

      updatedMetadata.display_name = display_name;
      updatedMetadata.last_display_name_change = new Date().toISOString();
    }

    // If avatar_url is being updated, check 30-day restriction
    if (avatar_url !== undefined && avatar_url !== user.user_metadata?.avatar_url) {
      const lastChange = user.user_metadata?.last_avatar_change;
      if (lastChange) {
        const timeSinceChange = now - new Date(lastChange).getTime();
        if (timeSinceChange < THIRTY_DAYS_MS) {
          const daysRemaining = Math.ceil((THIRTY_DAYS_MS - timeSinceChange) / (24 * 60 * 60 * 1000));
          return NextResponse.json({
            error: `You can change your profile picture again in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`
          }, { status: 400 });
        }
      }

      updatedMetadata.avatar_url = avatar_url;
      updatedMetadata.last_avatar_change = new Date().toISOString();
    }

    // Update name if provided
    if (name !== undefined) {
      updatedMetadata.name = name;
    }

    // Update user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      email: email || user.email,
      data: updatedMetadata,
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