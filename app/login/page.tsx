'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { signInStaff } from '@/app/actions/staff-auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // Bloque le rendu pendant la vérification
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fonction de connexion corrigée
  const handleCleanLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      
      const result = await signInStaff(null, formData);
      
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        // Redirection basée sur le rôle retourné
        if (result.role === 'admin') router.push('/dashboard/admin');
        else if (result.role === 'jury') router.push('/dashboard/jury');
        
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur système est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Effet de nettoyage et de vérification de session
  useEffect(() => {
    const initSession = async () => {
      setIsHydrated(true);

      // 1. Vérification de session existante pour éviter le flash
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .maybeSingle();

          if (profile?.role === 'admin') { router.push('/dashboard/admin'); return; }
          if (profile?.role === 'jury') { router.push('/dashboard/jury'); return; }
        }
      }

      // 2. Nettoyage de l'environnement local pour éviter les restes de sessions corrompues
      try {
        localStorage.clear();
        sessionStorage.clear();
        // Suppression propre des cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      } catch (e) {
        console.warn("Cleanup warning", e);
      }
      
      setIsChecking(false);
    };
    
    void initSession();
  }, [router]);

  // Si on attend l'hydratation ou la vérification de session, on affiche le loader
  if (!isHydrated || isChecking) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e5c47f]"></div>
      </div>
    );
  }

  // Rendu de la page de connexion
  return (
    <div className="min-h-screen bg-[#050505] text-[#050505] flex items-center justify-center selection:bg-[#e5c47f] selection:text-black">
      <div className="w-full max-w-md px-4">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-heading uppercase tracking-[0.15em] text-zinc-500 hover:text-white transition-colors mb-6">
          ← Retour à l'accueil
        </Link>

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
            {error && (
              <div className="bg-red-900/20 border border-red-900/50 rounded-none p-3 text-sm text-red-400">
                {error}
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
                  <Loader2 className="w-3 h-3 animate-spin" />
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