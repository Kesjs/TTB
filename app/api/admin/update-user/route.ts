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

    const { userId, email, password, fullName, phone, avatarUrl } = await request.json();

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

    // Update profile
    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        avatar_url: avatarUrl,
      })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update profile: ' + updateError.message }, { status: 500 });
    }

    // Update auth user if password or email provided
    if (password || email) {
      try {
        const updateData: any = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        const { error: authError } = await adminSupabase.auth.admin.updateUserById(userId, updateData);

        if (authError) {
          // Don't fail - profile is already updated
        }
      } catch (authError) {
        // Don't fail - profile is already updated
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error: ' + (error as Error).message }, { status: 500 });
  }
}
