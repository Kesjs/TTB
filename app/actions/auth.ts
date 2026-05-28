'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signIn(state: { error: string } | null, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Veuillez entrer email et mot de passe.' };
  }

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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("Erreur détaillée de Supabase Sign-In:", error.message, error.status);
    // Translate error messages to French
    const errorMsg = error.message.toLowerCase();
    
    // Invalid credentials errors
    if (errorMsg.includes('invalid') && (errorMsg.includes('credential') || errorMsg.includes('login') || errorMsg.includes('password'))) {
      return { error: 'Adresse email ou mot de passe incorrect. Veuillez réessayer.' };
    }
    
    // Email confirmation errors
    if (errorMsg.includes('email') && errorMsg.includes('confirm')) {
      return { error: 'Veuillez confirmer votre adresse email avant de vous connecter.' };
    }
    
    // User not found errors
    if (errorMsg.includes('not found') || errorMsg.includes('user not found')) {
      return { error: 'Compte introuvable. Veuillez vérifier votre adresse email.' };
    }
    
    // Default fallback
    return { error: 'Erreur de connexion. Veuillez vérifier vos identifiants.' };
  }

  if (!data.session) {
    return { error: 'Erreur de connexion' };
  }

  console.log('Sign-in réussi, session:', data.session ? 'active' : 'null', 'user:', data.user?.id);

  // Get user role from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.session.user.id)
    .single();

  console.log('Profile:', profile, 'Error:', profileError);

  if (!profile) {
    return { error: 'Profil non trouvé' };
  }

  console.log('Role trouvé:', profile.role);

  cookieStore.set('user_id', data.session.user.id, {
    path: '/',
    maxAge: 604800,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  cookieStore.set('user_role', profile.role, {
    path: '/',
    maxAge: 604800,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  // Redirect based on role
  switch (profile.role) {
    case 'admin':
      redirect('/dashboard/admin');
    case 'jury':
      redirect('/dashboard/jury');
    case 'candidate':
      redirect('/dashboard/candidate');
    default:
      redirect('/candidature');
  }
}
