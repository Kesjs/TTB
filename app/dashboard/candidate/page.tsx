'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Share2, User, Award, MapPin, LogOut, TrendingUp, Sparkles, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { db } from '@/lib/supabase';
import type { Candidate } from '@/lib/supabase';

export default function CandidateDashboard() {
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadCandidateData();
  }, []);

  // Évite le crash au build lors de la génération statique (SSR)
  useEffect(() => {
    if (candidate && typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/?candidate=${candidate.id}`);
    }
  }, [candidate]);

  const loadCandidateData = async () => {
    try {
      if (!supabase) {
        window.location.href = '/candidature?view=login';
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUserId = sessionData.session?.user.id;

      if (!sessionUserId) {
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_role');
        window.location.href = '/candidature?view=login';
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', sessionUserId)
        .single();

      if (profile?.role !== 'candidate') {
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_role');
        window.location.href = '/candidature?view=login';
        return;
      }

      localStorage.setItem('user_id', sessionUserId);
      localStorage.setItem('user_role', profile.role);
      const cookieOptions = 'path=/; max-age=604800; SameSite=Lax; Secure';
      document.cookie = `user_id=${sessionUserId}; ${cookieOptions}`;
      document.cookie = `user_role=${profile.role}; ${cookieOptions}`;

      // Récupération optimisée et sécurisée via le filtrage serveur (profileId)
      const candidates = await db.getCandidates({ profileId: sessionUserId });
      const userCandidate = candidates[0];

      if (!userCandidate) {
        setError('Aucune candidature trouvée pour votre compte.');
      } else {
        setCandidate(userCandidate);
      }
    } catch (err) {
      console.error('Erreur chargement candidat:', err);
      setError('Erreur lors du traitement de vos données de scène.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = '/';
  };

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e5c47f] mx-auto mb-4"></div>
          <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">Ouverture des coulisses...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center border border-slate-100 p-8 bg-slate-50/50 rounded-xl shadow-sm">
          <p className="text-slate-600 mb-6 text-sm font-medium">{error || 'Données momentanément indisponibles.'}</p>
          <button
            onClick={() => router.push('/candidature')}
            className="w-full px-6 py-3 bg-[#050505] text-white font-semibold rounded-lg hover:bg-[#e5c47f] hover:text-black transition-all text-xs uppercase tracking-wider"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-slate-900 antialiased selection:bg-[#e5c47f]/20">
      
      {/* BARRE DE NAVIGATION ÉPURÉE */}
      <header className="border-b border-slate-100 px-4 sm:px-8 py-4 flex justify-between items-center bg-white sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="flex flex-col leading-none tracking-tighter">
            <span className="font-heading font-black text-xs uppercase tracking-[0.15em] text-[#050505]">
              Top Talent du Bénin
            </span>
            <span className="text-[#e5c47f] font-heading font-semibold text-[9px] uppercase tracking-[0.25em] mt-0.5">
              Espace Candidat
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-[9px] uppercase tracking-[0.2em] text-slate-500 hover:text-slate-950 border border-slate-200 px-3 py-1.5 rounded bg-white hover:bg-slate-50 transition-all flex items-center gap-2 font-semibold"
        >
          <LogOut className="w-3 h-3 text-[#e5c47f]" /> 
          <span className="inline">Déconnexion</span>
        </button>
      </header>

      {/* ZONE CENTRALE DU DASHBOARD */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        
        {/* TITRE DE BIENVENUE */}
        <div className="mb-8 border-l-2 border-[#e5c47f] pl-4 sm:pl-5">
          <h1 className="font-heading font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#050505] mb-1.5">
            Bienvenue, {candidate.stage_name}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Suivez l&apos;évolution de votre performance, l&apos;état des votes de l&apos;audience et vos détails d&apos;inscription en temps réel.
          </p>
        </div>

        {/* GRILLE DE KPI MINI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          
          {/* STATUT CARD */}
          <div className={`p-5 rounded-xl border ${
            candidate.status === 'approved' ? 'text-emerald-800 bg-emerald-50/40 border-emerald-100/80' : 
            candidate.status === 'rejected' ? 'text-slate-700 bg-slate-50 border-slate-200/80' : 
            'text-amber-800 bg-amber-50/40 border-amber-100/80'
          }`}>
            <span className="text-[9px] uppercase tracking-widest font-bold mb-2.5 block opacity-70">État du Profil</span>
            <div className="flex items-center gap-2.5">
              {candidate.status === 'approved' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {candidate.status === 'rejected' && <XCircle className="w-5 h-5 text-slate-400" />}
              {candidate.status === 'pending_review' && <Clock className="w-5 h-5 text-amber-600 animate-pulse" />}
              
              <span className="text-sm sm:text-base font-bold uppercase tracking-wide">
                {candidate.status === 'approved' ? 'Validé & En Scène' : 
                 candidate.status === 'rejected' ? 'Session Clôturée' : 'En Coulisses'}
              </span>
            </div>
          </div>

          {/* VOTES CARD */}
          <div className="bg-slate-50/60 border border-slate-200/60 p-5 rounded-xl">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2.5 block">Soutiens de l&apos;Audience</span>
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-[#e5c47f]" />
              <span className="text-xl font-black font-mono text-[#050505]">{candidate.votes_count || 0} <span className="text-xs font-sans text-slate-400 font-normal">votes</span></span>
            </div>
          </div>

          {/* DISCIPLINE CARD */}
          <div className="bg-slate-50/60 border border-slate-200/60 p-5 rounded-xl">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2.5 block">Discipline Artistique</span>
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-slate-400" />
              <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-700">{candidate.discipline}</span>
            </div>
          </div>
        </div>

        {/* BLOC PRINCIPAL RECAP & FEEDBACK */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-8 shadow-sm">
          <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-[#050505] mb-6 border-b border-slate-100 pb-4">
            Détails de votre enregistrement
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center gap-3 py-0.5">
              <User className="w-4 h-4 text-[#e5c47f]" />
              <span>Nom de scène : <strong className="text-slate-900 uppercase tracking-wide">{candidate.stage_name}</strong></span>
            </div>
            <div className="flex items-center gap-3 py-0.5">
              <Award className="w-4 h-4 text-[#e5c47f]" />
              <span>Catégorie : <strong className="text-slate-900 uppercase tracking-wide">{candidate.discipline}</strong></span>
            </div>
            <div className="flex items-center gap-3 py-0.5">
              <MapPin className="w-4 h-4 text-[#e5c47f]" />
              <span>Zone / Département : <strong className="text-slate-900 uppercase tracking-wide">{candidate.region}</strong></span>
            </div>
            <div className="flex items-center gap-3 py-0.5">
              <Clock className="w-4 h-4 text-[#e5c47f]" />
              <span>Date d&apos;inscription : <strong className="text-slate-900">
                {new Date(candidate.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </strong></span>
            </div>
          </div>

          {/* DYNAMIQUE STATUT 1 : CANDIDATURE VALIDÉE (APPROVED) */}
          {candidate.status === 'approved' && shareUrl && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="mb-4">
                <h3 className="font-heading font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#e5c47f]" /> Mobilisez votre communauté
                </h3>
                <p className="text-xs text-slate-500">Votre profil est officiellement visible. Utilisez ce lien unique pour propager votre univers et accumuler les votes de l&apos;audience.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-lg text-xs font-mono text-slate-700 focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="px-6 py-3 bg-[#050505] text-white font-semibold rounded-lg hover:bg-[#e5c47f] hover:text-black transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" /> 
                  <span>{copied ? 'Lien copié !' : 'Copier le lien'}</span>
                </button>
              </div>
            </div>
          )}

          {/* DYNAMIQUE STATUT 2 : CANDIDATURE EN ATTENTE (PENDING) */}
          {candidate.status === 'pending_review' && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="bg-slate-50/80 border border-amber-100 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-500 shrink-0">
                  <Sparkles className="w-4 h-4 animate-pulse text-[#e5c47f]" />
                </div>
                <div>
                  <h4 className="text-slate-900 font-bold text-sm tracking-wide mb-1">
                    Étape 1 validée — Performance en cours d&apos;analyse
                  </h4>
                  <p className="text-slate-600 text-xs leading-relaxed max-w-2xl">
                    Votre show est bien entré dans les coulisses de <strong className="text-slate-950 font-semibold">Top Talent du Bénin</strong>. Notre comité artistique visionne actuellement votre vidéo avec la plus grande attention. Restez connectés, les projecteurs s&apos;allument bientôt.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIQUE STATUT 3 : CANDIDATURE TERMINÉE (REJECTED) */}
          {candidate.status === 'rejected' && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4">
                <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 shrink-0">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-slate-800 font-bold text-sm tracking-wide mb-1">Session Clôturée</h4>
                  <p className="text-slate-500 text-xs leading-relaxed max-w-2xl">
                    Votre dossier n&apos;a pas été retenu pour l&apos;affichage final de cette édition. Merci d&apos;avoir partagé votre art avec la communauté Top Talent du Bénin. Nous vous encourageons à perfectionner votre show pour revenir encore plus fort lors des prochaines sessions.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}