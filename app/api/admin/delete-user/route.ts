import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      console.error('User ID missing in request');
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('Attempting to delete user:', userId);

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured in environment variables');
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

    // First, try to delete the profile (this is the most important part)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      return NextResponse.json({ error: 'Failed to delete profile: ' + profileError.message }, { status: 500 });
    }

    console.log('Profile deleted successfully');

    // Then try to delete the auth user (requires service role)
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Error deleting auth user:', authError);
        // Don't fail the request if auth deletion fails - profile is already deleted
        // This prevents the user from logging in as jury
        console.warn('Auth user deletion failed, but profile was deleted. User will not be able to login as jury.');
      } else {
        console.log('Auth user deleted successfully');
      }
    } catch (authError) {
      console.error('Exception during auth user deletion:', authError);
      // Don't fail - profile is already deleted
      console.warn('Auth user deletion threw exception, but profile was deleted.');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete-user API:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error as Error).message }, { status: 500 });
  }
}
