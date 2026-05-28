'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('Login already in progress, ignoring duplicate submission');
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);
    setError('');

    try {
      if (!supabase) {
        setError('Erreur de configuration du système. Veuillez réessayer plus tard.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError('Adresse email ou mot de passe incorrect. Veuillez réessayer.');
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError('Impossible de se connecter. Veuillez vérifier vos identifiants.');
        setLoading(false);
        return;
      }

      // Get user role from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .single();

      if (!profile) {
        setError('Compte introuvable. Veuillez contacter l\'administration.');
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      // Store user info in localStorage for dashboard to use
      localStorage.setItem('user_id', data.session.user.id);
      localStorage.setItem('user_role', profile.role);

      // Store user info in cookies for middleware authentication
      const cookieOptions = 'path=/; max-age=604800; SameSite=Lax; Secure'; // 7 days
      document.cookie = `user_id=${data.session.user.id}; ${cookieOptions}`;
      document.cookie = `user_role=${profile.role}; ${cookieOptions}`;

      console.log('Login verification - storedUserId:', data.session.user.id, 'storedUserRole:', profile.role);
      console.log('Cookies set for middleware authentication');

      // Redirect based on role - only admin and jury (candidates use candidature page)
      let redirectUrl = '';
      if (profile.role === 'admin') {
        redirectUrl = '/dashboard/admin';
      } else if (profile.role === 'jury') {
        redirectUrl = '/dashboard/jury';
      } else {
        setError('Accès non autorisé. Cette page est réservée aux membres du jury et au staff administratif. Les candidats doivent utiliser la page de candidature.');
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      console.log('Redirecting to:', redirectUrl);
      // Use router.push for client-side navigation (middleware will handle auth)
      router.push(redirectUrl);
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

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

            <form onSubmit={handleLogin} className="space-y-4">
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
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#e5c47f] text-black font-heading font-bold text-[10px] uppercase tracking-widest rounded-none border border-transparent transition-all hover:bg-[#d4b36f] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Connexion...
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
