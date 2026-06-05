import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Verify authentication and admin role
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Ignore errors in server components
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.delete({ name, ...options });
            } catch (error) {
              // Ignore errors in server components
            }
          },
        },
      }
    );

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    // Create Supabase client with service role key for admin operations
    const adminSupabase = createClient(
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
    const { error: deleteError } = await adminSupabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete profile: ' + deleteError.message }, { status: 500 });
    }

    // Then try to delete the auth user (requires service role)
    try {
      const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId);

      if (authError) {
        // Don't fail the request if auth deletion fails - profile is already deleted
        // This prevents the user from logging in as jury
      }
    } catch (authError) {
      // Don't fail - profile is already deleted
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error: ' + (error as Error).message }, { status: 500 });
  }
}
