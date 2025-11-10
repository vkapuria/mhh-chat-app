import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateDisplayName, isDisplayNameUnique } from '@/lib/display-name';
import { createClient } from '@supabase/supabase-js';

// Admin client for user updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

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
  console.log('📝 === PATCH /api/profile called ===');
  
  try {
    const authHeader = request.headers.get('authorization');
    console.log('🔑 Auth header:', authHeader ? 'EXISTS' : 'MISSING');
    
    if (!authHeader) {
      console.log('❌ No auth header - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🎫 Token extracted, length:', token.length);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('👤 User lookup result:', user ? `Found user: ${user.id}` : 'No user found');
    console.log('⚠️ Auth error:', authError?.message || 'None');

    if (authError || !user) {
      console.log('❌ Auth failed - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📦 Request body:', JSON.stringify(body));
    console.log('👤 Current user metadata:', JSON.stringify(user.user_metadata));
    
    const { name, email, display_name, avatar_url } = body;

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const updatedMetadata: any = { ...user.user_metadata };

    // If display_name is being updated, validate it
    if (display_name !== undefined && display_name !== user.user_metadata?.display_name) {
      console.log('🏷️ Display name change detected:', user.user_metadata?.display_name, '→', display_name);
      
      // Check 30-day restriction
      const lastChange = user.user_metadata?.last_display_name_change;
      console.log('📅 Last display name change:', lastChange || 'Never');
      
      if (lastChange) {
        const timeSinceChange = now - new Date(lastChange).getTime();
        console.log('⏱️ Time since last change (ms):', timeSinceChange);
        
        if (timeSinceChange < THIRTY_DAYS_MS) {
          const daysRemaining = Math.ceil((THIRTY_DAYS_MS - timeSinceChange) / (24 * 60 * 60 * 1000));
          console.log('⛔ 30-day restriction hit - days remaining:', daysRemaining);
          return NextResponse.json({
            error: `You can change your display name again in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`
          }, { status: 400 });
        }
      }

      // Validate format
      console.log('✅ Validating display name format...');
      const validation = validateDisplayName(display_name);
      console.log('📋 Validation result:', validation);
      
      if (!validation.valid) {
        console.log('❌ Validation failed:', validation.errors[0]);
        return NextResponse.json({
          error: validation.errors[0]
        }, { status: 400 });
      }

      // Check uniqueness
      console.log('🔍 Checking display name uniqueness...');
      const isUnique = await isDisplayNameUnique(display_name, user.id);
      console.log('🎯 Is unique:', isUnique);
      
      if (!isUnique) {
        console.log('❌ Display name already taken');
        return NextResponse.json({
          error: 'This display name is already taken. Please choose another.'
        }, { status: 400 });
      }

      updatedMetadata.display_name = display_name;
      updatedMetadata.last_display_name_change = new Date().toISOString();
      console.log('✅ Display name will be updated');
    }

    // If avatar_url is being updated, check 30-day restriction
    if (avatar_url !== undefined && avatar_url !== user.user_metadata?.avatar_url) {
      console.log('🖼️ Avatar change detected:', user.user_metadata?.avatar_url, '→', avatar_url);
      
      const lastChange = user.user_metadata?.last_avatar_change;
      console.log('📅 Last avatar change:', lastChange || 'Never');
      
      if (lastChange) {
        const timeSinceChange = now - new Date(lastChange).getTime();
        console.log('⏱️ Time since last change (ms):', timeSinceChange);
        
        if (timeSinceChange < THIRTY_DAYS_MS) {
          const daysRemaining = Math.ceil((THIRTY_DAYS_MS - timeSinceChange) / (24 * 60 * 60 * 1000));
          console.log('⛔ 30-day restriction hit - days remaining:', daysRemaining);
          return NextResponse.json({
            error: `You can change your profile picture again in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`
          }, { status: 400 });
        }
      }

      updatedMetadata.avatar_url = avatar_url;
      updatedMetadata.last_avatar_change = new Date().toISOString();
      console.log('✅ Avatar will be updated');
    }

    // Update name if provided
    if (name !== undefined) {
      console.log('📝 Name will be updated to:', name);
      updatedMetadata.name = name;
    }

    console.log('💾 Updating user metadata:', JSON.stringify(updatedMetadata));

    // Update user metadata
    // Update user metadata using Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        email: email || user.email,
        user_metadata: updatedMetadata,
      }
    );
    if (updateError) {
      console.log('❌ Supabase update error:', updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    console.log('✅ Profile updated successfully!');
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('💥 Profile PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
