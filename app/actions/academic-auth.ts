'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface SignInResult {
  error?: string;
  success?: boolean;
  redirectUrl?: string;
}

export async function signInAcademic(state: SignInResult | null, formData: FormData): Promise<SignInResult> {
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

  console.log('Sign-in académique réussi, session:', data.session ? 'active' : 'null', 'user:', data.user?.id);

  // Get user role from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.session.user.id)
    .single();

  console.log('Profile:', profile, 'Error:', profileError);

  if (!profile) {
    console.error('Profil non trouvé pour user ID:', data.session.user.id);
    return { error: 'Profil non trouvé' };
  }

  console.log('Role trouvé:', profile.role);

  // Restrict access to admin and jury only
  if (profile.role !== 'admin' && profile.role !== 'jury') {
    console.error('Accès refusé - rôle:', profile.role);
    return { error: 'Accès refusé. Cette page est réservée aux membres du jury et au staff administratif.' };
  }

  // Return redirect URL for client-side handling
  const redirectUrl = profile.role === 'admin' ? '/dashboard/admin' : '/dashboard/jury';
  console.log('Redirection vers:', redirectUrl);
  return { success: true, redirectUrl };
}
