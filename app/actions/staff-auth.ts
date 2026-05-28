'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function signInStaff(state: { error: string } | null, formData: FormData) {
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
            // Ignorer les erreurs dans les Server Components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignorer les erreurs dans les Server Components
          }
        },
      },
    }
  );

  // Authentification auprès de Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("Erreur détaillée de Supabase Sign-In:", error.message, error.status);
    const errorMsg = error.message.toLowerCase();
    
    if (errorMsg.includes('invalid') && (errorMsg.includes('credential') || errorMsg.includes('login') || errorMsg.includes('password'))) {
      return { error: 'Adresse email ou mot de passe incorrect. Veuillez réessayer.' };
    }
    
    if (errorMsg.includes('email') && errorMsg.includes('confirm')) {
      return { error: 'Veuillez confirmer votre adresse email avant de vous connecter.' };
    }
    
    if (errorMsg.includes('not found') || errorMsg.includes('user not found')) {
      return { error: 'Compte introuvable. Veuillez vérifier votre adresse email.' };
    }
    
    return { error: 'Erreur de connexion. Veuillez vérifier vos identifiants.' };
  }

  if (!data.session) {
    return { error: 'Erreur de connexion' };
  }

  console.log('Sign-in staff réussi, session active pour:', data.user?.id);

  // Récupération du rôle depuis la table 'profiles'
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.session.user.id)
    .single();

  console.log('Profile:', profile, 'Error:', profileError);

  if (!profile) {
    return { error: 'Profil utilisateur introuvable en base de données.' };
  }

  // Filtrage des rôles pour l'accès académique
  if (profile.role === 'candidate') {
    return { error: 'Cet espace est exclusivement réservé au personnel académique.' };
  }

  if (profile.role !== 'admin' && profile.role !== 'jury') {
    return { error: 'Accès non autorisé. Réservé au personnel administratif et jury.' };
  }

  // Écriture explicite des cookies personnalisés pour le middleware proxy
  cookieStore.set('user_id', data.session.user.id, {
    path: '/',
    maxAge: 604800, // 7 jours
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  
  cookieStore.set('user_role', profile.role, {
    path: '/',
    maxAge: 604800,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  // ✅ SOLUTION DU PING-PONG : On renvoie un signal de succès au client au lieu de rediriger ici.
  // Cela permet à Next.js d'envoyer les en-têtes "Set-Cookie" au navigateur avant la navigation.
  return { success: true, role: profile.role };
}