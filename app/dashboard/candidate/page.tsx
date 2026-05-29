'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, Clock, Share2, User, Award, MapPin, 
  LogOut, TrendingUp, Sparkles, XCircle, Eye, 
  BarChart3, Layout, Megaphone, Flag, ChevronRight,
  Trophy, Star
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { db } from '@/lib/supabase/db';
import { signOut } from '@/app/actions/auth';
import type { Candidate, SystemControl } from '@/lib/supabase/types';

export default function CandidateDashboard() {
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [systemControl, setSystemControl] = useState<SystemControl | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [juryAverage, setJuryAverage] = useState<number | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(0);

  const roadmapSteps = [
    { id: 'PRESELECTION', label: 'Inscription', icon: Flag },
    { id: 'VOTES_TOP_40', label: 'Top 40', icon: Award },
    { id: 'SEMIFINAL', label: 'Top 20', icon: Star },
    { id: 'FINAL', label: 'Finale', icon: Trophy },
  ];

  const currentPhaseIndex = useMemo(() => {
    if (!systemControl) return 0;
    return roadmapSteps.findIndex(step => step.id === systemControl.current_phase);
  }, [systemControl]);

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
    console.log('[CandidateDashboard] Loading candidate data...');
    setLoading(true);
    setError('');

    try {
      // ÉTAPE 1 : Récupérer l'utilisateur depuis la session AVANT toute requête DB
      if (!supabase) {
        setError('Client Supabase non disponible');
        setLoading(false);
        return;
      }
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setError('Session non disponible. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }

      // ÉTAPE 2 : Maintenant que l'utilisateur est validé, récupérer les données
      const [systemControl, candidates] = await Promise.all([
        db.getSystemControl(),
        db.getCandidates({ profileId: user.id })
      ]);

      setSystemControl(systemControl);

      if (!candidates || candidates.length === 0) {
        setError('Aucun dossier de candidature trouvé.');
      } else {
        const userCandidate = candidates.find(c => c.profile_id === user.id);
        
        if (!userCandidate) {
          // L'utilisateur existe mais son dossier candidat n'est pas encore créé
          setError('Votre dossier est en cours de création. Veuillez compléter votre inscription.');
        } else {
          setCandidate(userCandidate);
          
          // Calcul des stats
          if (userCandidate.status === 'approved' && systemControl) {
            try {
              const [allCandidates, juryData] = await Promise.all([
                db.getCandidates({ status: 'approved' }),
                db.getJuryAverages(systemControl.current_phase)
              ]);

              const approved = allCandidates
                .filter(c => c.status === 'approved')
                .sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));
              
              setTotalParticipants(approved.length);
              const currentRank = approved.findIndex(c => c.id === userCandidate.id) + 1;
              setRank(currentRank > 0 ? currentRank : null);

              if (juryData[userCandidate.id]) {
                setJuryAverage(juryData[userCandidate.id].total_jury_average);
              }
            } catch (statsErr) {
              console.error('[CandidateDashboard] Stats loading error:', statsErr);
            }
          }
        }
      }
    } catch (err) {
      console.error('[CandidateDashboard] Unexpected error:', err);
      setError('Erreur lors du chargement de vos données.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
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

  if (error || (!loading && !candidate)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center border border-slate-100 p-8 bg-slate-50/50 rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2 uppercase tracking-tight">Accès restreint</h2>
          <p className="text-slate-600 mb-8 text-sm font-medium leading-relaxed">
            {error || "Nous n'avons pas pu trouver de candidature associée à votre compte. Assurez-vous d'avoir complété votre inscription."}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-[#050505] text-white font-semibold rounded-lg hover:bg-zinc-800 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              Réessayer la connexion
            </button>
            <button
              onClick={() => router.push('/candidature')}
              className="w-full px-6 py-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-all text-xs uppercase tracking-wider"
            >
              Retour à l'accueil
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Support technique</p>
            <p className="text-[10px] font-mono text-slate-300 mt-1">ERR_CANDIDATE_NOT_FOUND_OR_RESTRICTED</p>
          </div>
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
        
        {/* ROADMAP DE LA COMPÉTITION */}
        <div className="mb-10 bg-slate-50 border border-slate-100 p-4 sm:p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Layout className="w-4 h-4 text-[#e5c47f]" />
            <h2 className="font-heading font-black text-xs uppercase tracking-[0.2em] text-slate-900">Parcours de l'Icône</h2>
          </div>
          
          <div className="relative flex justify-between items-start max-w-4xl mx-auto">
            {/* Ligne de fond */}
            <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 -z-0"></div>
            
            {roadmapSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentPhaseIndex;
              const isCurrent = index === currentPhaseIndex;
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center group w-1/4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                    isCompleted ? 'bg-emerald-500 border-emerald-100 text-white' :
                    isCurrent ? 'bg-[#e5c47f] border-white text-white shadow-lg shadow-[#e5c47f]/40 scale-110' :
                    'bg-white border-slate-100 text-slate-300'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`mt-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-tight sm:tracking-wider text-center px-0.5 ${
                    isCurrent ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* TITRE DE BIENVENUE */}
        <div className="mb-8 border-l-2 border-[#e5c47f] pl-4 sm:pl-5">
          <h1 className="font-heading font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#050505] mb-1.5">
            Bienvenue, {candidate?.stage_name || 'Artiste'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Suivez l&apos;évolution de votre performance, l&apos;état des votes de l&apos;audience et vos détails d&apos;inscription en temps réel.
          </p>
        </div>

        {/* GRILLE DE KPI MINI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          
          {/* STATUT CARD */}
          <div className={`p-5 rounded-xl border ${
            candidate?.status === 'approved' ? 'text-emerald-800 bg-emerald-50/40 border-emerald-100/80' : 
            candidate?.status === 'rejected' ? 'text-slate-700 bg-slate-50 border-slate-200/80' : 
            'text-amber-800 bg-amber-50/40 border-amber-100/80'
          }`}>
            <span className="text-[9px] uppercase tracking-widest font-bold mb-2.5 block opacity-70">État du Profil</span>
            <div className="flex items-center gap-2.5">
              {candidate?.status === 'approved' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {candidate?.status === 'rejected' && <XCircle className="w-5 h-5 text-slate-400" />}
              {candidate?.status === 'pending_review' && <Clock className="w-5 h-5 text-amber-600 animate-pulse" />}
              
              <span className="text-sm sm:text-base font-bold uppercase tracking-wide">
                {candidate?.status === 'approved' ? 'Validé & En Scène' : 
                 candidate?.status === 'rejected' ? 'Session Clôturée' : 'En Coulisses'}
              </span>
            </div>
          </div>

          {/* VOTES CARD */}
          <div className="bg-slate-50/60 border border-slate-200/60 p-5 rounded-xl">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2.5 block">Soutiens Certifiés</span>
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-[#e5c47f]" />
              <span className="text-xl font-black font-mono text-[#050505]">{candidate?.votes_count || 0} <span className="text-xs font-sans text-slate-400 font-normal">votes</span></span>
            </div>
          </div>

          {/* RANG CARD */}
          <div className="bg-slate-50/60 border border-slate-200/60 p-5 rounded-xl">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2.5 block">Rang National</span>
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-zinc-400" />
              <span className="text-xl font-black font-mono text-[#050505]">
                {rank ? `#${rank}` : '--'} <span className="text-[10px] font-sans text-slate-400 font-normal uppercase">/ {totalParticipants || '...'}</span>
              </span>
            </div>
          </div>

          {/* JURY CARD */}
          <div className="bg-slate-50/60 border border-slate-200/60 p-5 rounded-xl">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2.5 block">Moyenne Jury</span>
            <div className="flex items-center gap-2.5">
              <Star className="w-5 h-5 text-[#e5c47f]" />
              <span className="text-xl font-black font-mono text-[#050505]">
                {juryAverage ? juryAverage.toFixed(1) : '--'} <span className="text-xs font-sans text-slate-400 font-normal">/ 20</span>
              </span>
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
              <span>Nom de scène : <strong className="text-slate-900 uppercase tracking-wide">{candidate?.stage_name}</strong></span>
            </div>
            <div className="flex items-center gap-3 py-0.5">
              <Award className="w-4 h-4 text-[#e5c47f]" />
              <span>Catégorie : <strong className="text-slate-900 uppercase tracking-wide">{candidate?.discipline}</strong></span>
            </div>
            <div className="flex items-center gap-3 py-0.5">
              <MapPin className="w-4 h-4 text-[#e5c47f]" />
              <span>Zone / Département : <strong className="text-slate-900 uppercase tracking-wide">{candidate?.region}</strong></span>
            </div>
            <div className="flex items-center gap-3 py-0.5">
              <Clock className="w-4 h-4 text-[#e5c47f]" />
              <span>Date d&apos;inscription : <strong className="text-slate-900">
                {candidate?.created_at ? new Date(candidate.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '--'}
              </strong></span>
            </div>
          </div>

          {/* Bio display for candidate */}
          {candidate?.bio && (
            <div className="mt-6 p-5 bg-slate-50/50 border border-slate-100 rounded-xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Sparkles className="w-3.5 h-3.5 text-[#e5c47f]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Votre description officielle</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 italic font-body leading-relaxed relative z-10">
                "{candidate.bio}"
              </p>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#e5c47f]/5 rounded-full blur-xl"></div>
            </div>
          )}

          {/* DYNAMIQUE STATUT 1 : CANDIDATURE VALIDÉE (APPROVED) */}
          {candidate?.status === 'approved' && shareUrl && (
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
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 sm:flex-none px-6 py-3 bg-[#050505] text-white font-semibold rounded-lg hover:bg-[#e5c47f] hover:text-black transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                <Share2 className="w-3.5 h-3.5" /> 
                <span>{copied ? 'Lien copié !' : 'Partager'}</span>
              </button>
              <button
                onClick={() => window.open(shareUrl, '_blank')}
                className="px-4 py-3 bg-white border border-zinc-200 text-zinc-600 rounded-lg hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                title="Voir mon profil public"
              >
                <Eye className="w-4 h-4" />
                <span className="sm:hidden">Profil</span>
              </button>
            </div>
          </div>
            </div>
          )}

          {/* DYNAMIQUE STATUT 2 : CANDIDATURE EN ATTENTE (PENDING) */}
          {candidate?.status === 'pending_review' && (
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
          {candidate?.status === 'rejected' && (
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

        {/* SECTION ANNONCES & INFOS PRODUCTION */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Megaphone className="w-4 h-4 text-[#e5c47f]" />
              <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-[#050505]">Annonces de la Production</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border-l-4 border-[#e5c47f]">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 border border-slate-100">
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-tight text-slate-900 mb-1">Rappel : Phase de Présélection</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Le comité artistique analyse actuellement les candidatures. Restez attentifs à votre boîte mail pour les résultats du TOP 40.</p>
                  <span className="text-[9px] text-slate-400 mt-2 block font-mono">Posté le 20 Mai 2026</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#050505] to-zinc-900 rounded-xl p-6 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <div className="w-10 h-10 bg-[#e5c47f] rounded-lg flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-black" />
              </div>
              <h3 className="font-heading font-black text-lg uppercase tracking-tight mb-2">Objectif : Finale</h3>
              <p className="text-zinc-400 text-xs leading-relaxed mb-6">Préparez-vous à briller. Les 8 finalistes s'affronteront en direct devant la nation pour le titre d'Icône 2026.</p>
              <button 
                onClick={() => window.open('/reglement', '_blank')}
                className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <Layout className="w-3.5 h-3.5" /> Voir le règlement
              </button>
            </div>
            {/* Décoration fond */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#e5c47f]/10 rounded-full blur-2xl"></div>
          </div>
        </div>
      </main>
    </div>
  );
}