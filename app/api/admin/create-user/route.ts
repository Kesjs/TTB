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
      console.error('Unauthorized: No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      console.error('Forbidden: User is not an admin');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, password, fullName, phone, avatarUrl } = await request.json();

    if (!email || !password || !fullName) {
      console.error('Missing required fields');
      return NextResponse.json({ error: 'Email, password, and fullName are required' }, { status: 400 });
    }

    console.log('Attempting to create jury user:', email);

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured');
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
      console.error('Error creating auth user:', authError);
      return NextResponse.json({ error: 'Failed to create auth user: ' + (authError?.message || 'Unknown error') }, { status: 500 });
    }

    console.log('Auth user created successfully:', authData.user.id);

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
      console.error('Error creating profile:', upsertError);
      return NextResponse.json({ error: 'Failed to create profile: ' + upsertError.message }, { status: 500 });
    }

    console.log('Profile created successfully');

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      }
    });
  } catch (error) {
    console.error('Error in create-user API:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error as Error).message }, { status: 500 });
  }
}
