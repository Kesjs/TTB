import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, email, password, fullName, phone, avatarUrl } = await request.json();

    if (!userId) {
      console.error('User ID missing in request');
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('Attempting to update user:', userId);

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured');
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        avatar_url: avatarUrl,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json({ error: 'Failed to update profile: ' + profileError.message }, { status: 500 });
    }

    console.log('Profile updated successfully');

    // Update auth user if password or email provided
    if (password || email) {
      try {
        const updateData: any = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        console.log('Attempting to update auth user with data:', { hasEmail: !!email, hasPassword: !!password });

        const { error: authError } = await supabase.auth.admin.updateUserById(userId, updateData);

        if (authError) {
          console.error('Error updating auth user:', authError);
          // Don't fail - profile is already updated
          console.warn('Auth user update failed, but profile was updated. Error:', authError.message);
        } else {
          console.log('Auth user updated successfully');
        }
      } catch (authError) {
        console.error('Exception during auth user update:', authError);
        // Don't fail - profile is already updated
        console.warn('Auth user update threw exception, but profile was updated.');
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in update-user API:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error as Error).message }, { status: 500 });
  }
}
