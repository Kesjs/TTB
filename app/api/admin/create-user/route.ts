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

    const { email, password, fullName, phone, avatarUrl } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Email, password, and fullName are required' }, { status: 400 });
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

    // Create auth user with service role (bypasses email confirmation)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'jury',
        full_name: fullName,
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Failed to create auth user: ' + (authError?.message || 'Unknown error') }, { status: 500 });
    }

    // Create profile
    const { error: upsertError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        full_name: fullName,
        phone,
        role: 'jury',
        avatar_url: avatarUrl,
      });

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to create profile: ' + upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error: ' + (error as Error).message }, { status: 500 });
  }
}
