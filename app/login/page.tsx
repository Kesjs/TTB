'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { signInStaff } from '@/app/actions/staff-auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [signInStaffState, signInStaffFormAction] = useFormState(signInStaff, null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nettoyer la session fantôme avant l'authentification
  const handleCleanLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. Nettoyer la session côté client
      if (supabase) {
        await supabase.auth.signOut();
      }
      
      // 2. Effacer manuellement les cookies de rôle
      document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      // 3. Nettoyer localStorage
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
      
      console.log('🧹 Session fantôme nettoyée, tentative d\'authentification...');
      
      // 4. Créer et soumettre le formulaire manuellement
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      
      // 5. Exécuter l'action serveur
      await signInStaffFormAction(formData);
      
    } catch (error) {
      console.error('Erreur lors du nettoyage de session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle initial hydration and session check
  useEffect(() => {
    setIsHydrated(true);
    const checkSession = async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      
      // If a session exists, we show a choice instead of auto-redirecting
      // to avoid getting "stuck" in a role (Admin/Jury conflict)
      if (data.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', data.session.user.id)
          .single();
        
        if (profile) {
          // Store existing profile to show "Continue as..." option if we wanted to be fancy
          // For now, we just stay on the login page but don't force redirect
          console.log('[Login] Active session detected for:', profile.full_name, '(', profile.role, ')');
        }
      }
    };
    void checkSession();
  }, [router]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e5c47f]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#050505] flex items-center justify-center selection:bg-[#e5c47f] selection:text-black">
      <div className="w-full max-w-md px-4">
        {/* Back to home button */}
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-heading uppercase tracking-[0.15em] text-zinc-500 hover:text-white transition-colors mb-6">
          ← Retour à l'accueil
        </Link>

        {/* Corporate Login Card */}
        <div className="bg-[#0c0c0e] border border-zinc-900 p-8 sm:p-10 rounded-none space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Lock className="w-8 h-8 text-zinc-500" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl uppercase tracking-tight text-white">
                Accès Académique
              </h1>
              <p className="text-zinc-400 text-sm font-body">
                Espace réservé aux membres du jury et au staff administratif pour accéder aux tableaux de bord.
              </p>
            </div>

            <form onSubmit={handleCleanLogin} className="space-y-4">
              {signInStaffState?.error && (
                <div className="bg-red-900/20 border border-red-900/50 rounded-none p-3 text-sm text-red-400">
                  {signInStaffState.error}
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full bg-zinc-900 border border-zinc-800 p-3 text-sm text-white font-heading tracking-wide focus:outline-none focus:border-[#e5c47f] rounded-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900 border border-zinc-800 p-3 text-sm text-white font-heading tracking-wide focus:outline-none focus:border-[#e5c47f] rounded-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#e5c47f] text-black font-heading font-bold text-[10px] uppercase tracking-widest rounded-none border border-transparent transition-all hover:bg-[#d4b36f] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    Connexion en cours...
                    <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-zinc-800 text-center">
              <p className="text-zinc-600 text-[10px] uppercase tracking-wider">
                Accès sécurisé • Top Talent Bénin 2026
              </p>
            </div>
          </div>
      </div>
    </div>
  );
}
