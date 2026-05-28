'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Award, UserCheck, Flame, Loader2, Sparkles, Check, Plus, Minus,
  LogOut, AlertCircle, ExternalLink, History, ClipboardList, BarChart3,
  User, Layout, ChevronRight, CheckCircle2, TrendingUp, Flag, Trophy,
  Eye, X, ChevronLeft
} from 'lucide-react';
import { Candidate, SystemControl, db } from '@/lib/supabase';
import { Profile } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';
import { auth } from '@/lib/supabase/auth';

type TabType = 'selection' | 'evaluation' | 'history' | 'stats';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function JuryDashboard() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [systemControl, setSystemControl] = useState<SystemControl | null>(null);
  const [juryId, setJuryId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('evaluation');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [juryProfile, setJuryProfile] = useState<Profile | null>(null);
  const [existingRatings, setExistingRatings] = useState<any[]>([]);

  // Modals & Confirmation states
  const [showCandidateModal, setShowCandidateModal] = useState<boolean>(false);
  const [candidateForModal, setCandidateForModal] = useState<Candidate | null>(null);
  const [confirmRatingMode, setConfirmRatingMode] = useState<boolean>(false);

  const roadmapSteps = [
    { id: 'PRESELECTION', label: 'Sélection', icon: Flag },
    { id: 'VOTES_TOP_40', label: 'Top 40', icon: Award },
    { id: 'SEMIFINAL', label: 'Top 20', icon: Star },
    { id: 'FINAL', label: 'Finale', icon: Trophy },
  ];

  const currentPhaseIndex = useMemo(() => {
    if (!systemControl) return 0;
    return roadmapSteps.findIndex(step => step.id === systemControl.current_phase);
  }, [systemControl]);

  const stats = useMemo(() => {
    const phase = systemControl?.current_phase;
    if (!phase) return { evaluated: 0, total: 0 };
    
    const filtered = candidates.filter(c => {
      if (c.status !== 'approved') return false;
      if (phase === 'VOTES_TOP_40') return c.is_top_40;
      if (phase === 'SEMIFINAL') return c.is_semifinalist;
      if (phase === 'FINAL') return c.is_finalist;
      return true;
    });
    
    const evaluatedCount = filtered.filter(c => 
      existingRatings.some(r => r.candidate_id === c.id && r.phase === phase)
    ).length;
    
    return { evaluated: evaluatedCount, total: filtered.length };
  }, [candidates, existingRatings, systemControl]);

  const filteredCandidates = useMemo(() => {
    const phase = systemControl?.current_phase;
    if (!phase) return [];

    return candidates.filter(c => {
      // Le jury ne voit que les candidats approuvés par l'admin
      if (c.status !== 'approved') return false;

      // Filtrage selon la phase
      if (phase === 'VOTES_TOP_40') return c.is_top_40;
      if (phase === 'SEMIFINAL') return c.is_semifinalist;
      if (phase === 'FINAL') return c.is_finalist;
      
      // En phase PRESELECTION, il voit tout ce qui est approuvé
      return true;
    });
  }, [candidates, systemControl]);

  const getCandidateRatingDetails = (candidateId: string) => {
    const rating = existingRatings.find(
      r => r.candidate_id === candidateId && r.phase === systemControl?.current_phase
    );
    if (!rating) return null;
    return {
      average: (Number(rating.score_technique) + Number(rating.score_originalite) + Number(rating.score_presence)) / 3,
      details: {
        t: rating.score_technique,
        o: rating.score_originalite,
        p: rating.score_presence
      }
    };
  };

  // Selection state for PRESELECTION phase
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());

  // Candidat sélectionné pour la notation
  const [activeCandidateId, setActiveCandidateId] = useState<string>('');
  const [scoreTechnique, setScoreTechnique] = useState<number>(10);
  const [scoreOriginalite, setScoreOriginalite] = useState<number>(10);
  const [scorePresence, setScorePresence] = useState<number>(10);
  const [isApprovedPreselection, setIsApprovedPreselection] = useState<boolean>(false);

  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = '/login';
  };

  const handleToggleSelection = (candidateId: string) => {
    setSelectedCandidateIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  };

  const handleConfirmSelection = async () => {
    if (selectedCandidateIds.size === 0) {
      addToast('error', 'Vous devez sélectionner au moins un candidat');
      return;
    }

    try {
      // Update all selected candidates to is_top_40 = true
      for (const candidateId of selectedCandidateIds) {
        if (supabase) {
          await supabase.from('candidates').update({ is_top_40: true }).eq('id', candidateId);
        }
      }
      addToast('success', `${selectedCandidateIds.size} candidat(s) sélectionné(s) avec succès`);
      // Reload data to reflect changes
      void loadData();
    } catch (err) {
      addToast('error', 'Erreur lors de la confirmation de la sélection');
    }
  };

  const loadData = async () => {
    console.log('[Jury Dashboard] Loading data (middleware handles auth)');
    setLoading(true);
    try {
      // Get jury ID from localStorage (set by login)
      const userId = localStorage.getItem('user_id');
      if (userId) {
        setJuryId(userId);
      }

      // Load data with individual error handling
      const [allCandidates, sc, ratings, allProfiles] = await Promise.all([
        db.getCandidates({}).catch(err => {
          console.error('[Jury Dashboard] Error loading candidates:', err);
          return [];
        }),
        db.getSystemControl().catch(err => {
          console.error('[Jury Dashboard] Error loading system control:', err);
          return null;
        }),
        db.getJuryRatings().catch(err => {
          console.error('[Jury Dashboard] Error loading jury ratings:', err);
          return [];
        }),
        (async () => {
          if (!supabase) return [];
          try {
            const { data } = await supabase.from('profiles').select('*');
            return data || [];
          } catch (err) {
            console.error('[Jury Dashboard] Error loading profiles:', err);
            return [];
          }
        })(),
      ]);

      setCandidates(allCandidates);
      setSystemControl(sc);

      // Build profiles map
      const profilesMap: Record<string, Profile> = {};
      if (Array.isArray(allProfiles)) {
        allProfiles.forEach((p: Profile) => {
          profilesMap[p.id] = p;
        });
      }
      setProfiles(profilesMap);

      if (userId && profilesMap[userId]) {
        setJuryProfile(profilesMap[userId]);
      }

      // Si l'admin a défini un candidat actif sur scène, le sélectionner par défaut
      if (sc?.live_voting_candidate_id) {
        setActiveCandidateId(sc.live_voting_candidate_id);
      } else if (allCandidates.length > 0 && !activeCandidateId) {
        setActiveCandidateId(allCandidates[0].id);
      }

      // Filtrer les évaluations de ce jury
      setExistingRatings(ratings.filter(r => r.jury_id === juryId));
    } catch (err) {
      console.error('[Jury Dashboard] Unexpected error loading data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Prevent memory leak by tracking mounted state
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadData();

    // Realtime subscription for system_control
    if (supabase) {
      const channel = supabase
        .channel('jury_system_control')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_control' }, (payload) => {
          if (!isMounted.current) return;
          const newControl = payload.new as SystemControl;
          setSystemControl(newControl);
          // Auto-select the live candidate if admin changes it
          if (newControl.live_voting_candidate_id) {
            setActiveCandidateId(newControl.live_voting_candidate_id);
          }
        })
        .subscribe();

      return () => {
        isMounted.current = false;
        channel.unsubscribe();
      };
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Mettre à jour les sliders si le candidat sélectionné a déjà une note
  useEffect(() => {
    if (!activeCandidateId || !systemControl) return;
    const currentPhase = systemControl.current_phase;
    const rating = existingRatings.find(
      r => r.candidate_id === activeCandidateId && r.phase === currentPhase
    );

    if (rating) {
      setScoreTechnique(Number(rating.score_technique) || 10);
      setScoreOriginalite(Number(rating.score_originalite) || 10);
      setScorePresence(Number(rating.score_presence) || 10);
      setIsApprovedPreselection(!!rating.is_approved_preselection);
    } else {
      setScoreTechnique(10);
      setScoreOriginalite(10);
      setScorePresence(10);
      setIsApprovedPreselection(false);
    }
  }, [activeCandidateId, existingRatings, systemControl]);

  const activeCandidate = candidates.find(c => c.id === activeCandidateId);

  // Helper to render candidature type badge
  const renderCandidatureBadge = (candidate: Candidate) => {
    if (candidate.candidature_type === 'group') {
      return (
        <span className="text-[9px] px-2 py-0.5 bg-[#e5c47f]/10 text-[#e5c47f] border border-[#e5c47f]/30 rounded font-bold uppercase">
          Groupe ({candidate.member_count})
        </span>
      );
    }
    return (
      <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded font-bold uppercase">
        Solo
      </span>
    );
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate || !systemControl || !juryId) return;

    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      await db.saveJuryRating({
        jury_id: juryId,
        candidate_id: activeCandidate.id,
        score_technique: scoreTechnique,
        score_originalite: scoreOriginalite,
        score_presence: scorePresence,
        is_approved_preselection: isApprovedPreselection,
        phase: systemControl.current_phase as any,
      });

      setSuccess(true);
      setConfirmRatingMode(false);
      setShowCandidateModal(false);
      addToast('success', `Note enregistrée pour ${activeCandidate.stage_name}`);
      setTimeout(() => setSuccess(false), 3000);
      await loadData();
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la sauvegarde de la note.');
    } finally {
      setLoading(false);
    }
  };

  const adjustScore = (setter: (val: number) => void, current: number, delta: number) => {
    const newValue = Math.max(0, Math.min(20, current + delta));
    setter(newValue);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-400 font-mono flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#e5c47f] mr-3" />
        CHARGEMENT DU PANNEL JURY...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col text-white">
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex items-center justify-center">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Erreur</h2>
            <p className="text-zinc-400 mb-4">{error}</p>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-[#e5c47f] text-black font-bold rounded-lg hover:bg-[#d4b469] transition-colors flex items-center gap-2 mx-auto"
            >
              <LogOut className="w-4 h-4" /> Déconnexion
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans flex flex-col">
      {/* Compact Technical Header */}
      <header className="bg-[#050505] border-b border-zinc-800 px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          {/* Left: Brand + Badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white uppercase tracking-wider">Top Talent Bénin</span>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 hidden sm:inline">
              PANNEL JURY v1.0
            </span>
          </div>

          {/* Center: Live Status Feed */}
          <div className="flex items-center gap-3 sm:gap-4 text-[10px] font-mono text-zinc-400">
            <span>Phase: <span className="text-zinc-100">{systemControl?.current_phase || 'Chargement...'}</span></span>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <span className="hidden sm:inline">Candidats: <span className="text-zinc-100">{candidates.length}</span></span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voir le site public</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 hover:text-red-400 transition-colors bg-zinc-900/50 sm:bg-transparent px-2 py-1 sm:p-0 rounded border border-zinc-800 sm:border-transparent"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left Column - Workspace (70% on desktop, 100% on mobile) */}
        <div className="w-full lg:w-[70%] p-4 sm:p-6 overflow-y-auto">
          
          {/* ROADMAP & JURY PROFILE SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 sm:mb-8">
            <div className="md:col-span-8 bg-zinc-950 border border-zinc-900 p-4 sm:p-5 rounded-2xl">
              <div className="flex items-center gap-3 mb-5">
                <Layout className="w-3.5 h-3.5 text-[#e5c47f]" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Progression de l'Édition</h2>
              </div>
              <div className="relative flex justify-between items-start max-w-2xl mx-auto px-2">
                <div className="absolute top-4 left-0 w-full h-0.5 bg-zinc-900 -z-0"></div>
                {roadmapSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index < currentPhaseIndex;
                  const isCurrent = index === currentPhaseIndex;
                  return (
                    <div key={step.id} className="relative z-10 flex flex-col items-center w-1/4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500 border-emerald-950 text-white' :
                        isCurrent ? 'bg-[#e5c47f] border-zinc-950 text-black shadow-lg shadow-[#e5c47f]/20 scale-110' :
                        'bg-zinc-900 border-zinc-950 text-zinc-600'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span className={`mt-2 text-[8px] font-bold uppercase tracking-tight text-center ${
                        isCurrent ? 'text-white' : 'text-zinc-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-4 bg-zinc-950 border border-zinc-900 p-4 sm:p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-3.5 h-3.5 text-[#e5c47f]" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Expert Jury</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e5c47f]/10 border border-[#e5c47f]/30 flex items-center justify-center text-[#e5c47f] font-heading font-black text-sm">
                  {juryProfile?.full_name?.charAt(0) || 'J'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white uppercase truncate">{juryProfile?.full_name || 'Chargement...'}</p>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{juryProfile?.phone || 'Expert Technique'}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-900 flex justify-between items-center">
                <span className="text-[9px] text-zinc-500 uppercase font-mono">Sessions validées</span>
                <span className="text-[10px] font-black text-emerald-400 font-mono">{stats.evaluated} / {stats.total}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex gap-2 mb-6 sm:mb-8 bg-zinc-950 p-1 border border-zinc-800 rounded-xl overflow-x-auto">
            {[
              { id: 'selection' as TabType, label: 'Sélection', icon: Check, showInPhase: 'PRESELECTION' },
              { id: 'evaluation' as TabType, label: 'Évaluation', icon: Star, showInPhase: null },
              { id: 'history' as TabType, label: 'Historique', icon: History, showInPhase: null },
              { id: 'stats' as TabType, label: 'Statistiques', icon: BarChart3, showInPhase: null },
            ].filter(tab => !tab.showInPhase || systemControl?.current_phase === tab.showInPhase).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-[10px] sm:text-xs font-medium uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-zinc-900 border border-zinc-700 text-white'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#e5c47f]' : ''}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Tab Content */}
          {activeTab === 'selection' && (
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 sm:p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#e5c47f] uppercase tracking-widest mb-1">
                      <Check className="w-3.5 h-3.5" />
                      Sélection Top 40
                    </span>
                    <h2 className="font-heading font-black text-lg sm:text-xl text-white uppercase tracking-tight">Candidats Confirmés</h2>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Sélectionnez les candidats pour le Top 40.</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2">
                    <span className="text-xs font-bold text-white">{selectedCandidateIds.size}</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {candidates.filter(c => c.is_confirmed_by_admin).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleToggleSelection(c.id)}
                      className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                        selectedCandidateIds.has(c.id)
                          ? 'bg-zinc-900 text-white border-[#e5c47f]'
                          : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                          selectedCandidateIds.has(c.id) ? 'bg-[#e5c47f] border-[#e5c47f]' : 'border-zinc-600'
                        }`}>
                          {selectedCandidateIds.has(c.id) && <Check className="w-3 h-3 text-zinc-900" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-heading font-bold text-sm text-white">{c.stage_name}</span>
                            {renderCandidatureBadge(c)}
                          </div>
                          <span className="text-[10px] text-zinc-500 block">
                            {c.discipline} • {c.region}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <button
                    onClick={handleConfirmSelection}
                    disabled={selectedCandidateIds.size === 0}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                      selectedCandidateIds.size > 0
                        ? 'bg-[#e5c47f] text-zinc-900 hover:bg-[#d4b36f]'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    {selectedCandidateIds.size > 0 ? `Confirmer la Sélection (${selectedCandidateIds.size})` : 'Sélectionnez au moins un candidat'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'evaluation' && (
            <div className="flex flex-col gap-6 sm:gap-8">
              {/* Section Mobile : Sélecteur de Candidat (Horizontal sur mobile) */}
              <div className="lg:hidden bg-zinc-950 border border-zinc-900 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-[#e5c47f]" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-white">Candidats en Scène</h2>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    {(() => {
                      if (systemControl?.current_phase === 'VOTES_TOP_40') return candidates.filter(c => c.is_top_40).length;
                      if (systemControl?.current_phase === 'SEMIFINAL') return candidates.filter(c => c.is_semifinalist).length;
                      if (systemControl?.current_phase === 'FINAL') return candidates.filter(c => c.is_finalist).length;
                      return candidates.length;
                    })()} Artistes
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                  {filteredCandidates.map((c) => {
                    const isLive = systemControl?.live_voting_candidate_id === c.id;
                    const ratingInfo = getCandidateRatingDetails(c.id);
                    const isActive = activeCandidateId === c.id;

                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveCandidateId(c.id);
                          setCandidateForModal(c);
                          setShowCandidateModal(true);
                        }}
                        className={`flex-shrink-0 min-w-[140px] p-3 rounded-xl border transition-all relative ${
                          isActive ? 'bg-zinc-900 border-[#e5c47f] ring-1 ring-[#e5c47f]/50' : 
                          isLive ? 'bg-red-900/10 border-red-500/50' : 'bg-zinc-900/40 border-zinc-800'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-bold uppercase truncate ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                              {c.stage_name}
                            </span>
                            {isLive && <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              <span className="text-[7px] text-red-500 font-bold uppercase">LIVE</span>
                            </span>}
                          </div>
                          <span className="text-[8px] text-zinc-500 uppercase tracking-tighter truncate">{c.discipline}</span>
                          
                          {ratingInfo && (
                            <div className="mt-1 flex gap-1 font-mono text-[7px] text-zinc-500">
                              <span>T:{ratingInfo.details.t}</span>
                              <span>O:{ratingInfo.details.o}</span>
                              <span>P:{ratingInfo.details.p}</span>
                            </div>
                          )}
                        </div>
                        {ratingInfo && (
                          <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full px-1.5 py-0.5 shadow-lg border border-emerald-400 text-[8px] font-black font-mono">
                            {ratingInfo.average.toFixed(1)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Section Desktop : Liste des Candidats (Masquée sur mobile) */}
                <div className="hidden lg:block bg-zinc-950 border border-zinc-900 rounded-2xl p-6 h-fit space-y-6 shadow-2xl sticky top-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#e5c47f] uppercase tracking-widest mb-1">
                        <ClipboardList className="w-3.5 h-3.5" />
                        Évaluation en Cours
                      </span>
                      <h2 className="font-heading font-black text-xl text-white uppercase tracking-tight">Candidats en Scène</h2>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {filteredCandidates.map((c) => {
                      const isLive = systemControl?.live_voting_candidate_id === c.id;
                      const ratingInfo = getCandidateRatingDetails(c.id);

                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setActiveCandidateId(c.id);
                            setCandidateForModal(c);
                            setShowCandidateModal(true);
                          }}
                          className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                            activeCandidateId === c.id
                              ? 'bg-zinc-900 text-white border-[#e5c47f]'
                              : isLive 
                              ? 'bg-red-900/10 border-red-500/50'
                              : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-heading font-bold text-sm text-white">{c.stage_name}</span>
                              {isLive && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500 rounded text-[7px] font-black text-white animate-pulse">
                                  SUR SCÈNE
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500 block">{c.discipline} • {c.region}</span>
                            
                            {ratingInfo && (
                              <div className="mt-1.5 flex gap-2 font-mono text-[9px] text-zinc-500 bg-zinc-900/50 px-2 py-0.5 rounded-md border border-zinc-800 w-fit">
                                <span className="flex gap-1"><span className="text-zinc-600">T:</span>{ratingInfo.details.t}</span>
                                <span className="flex gap-1"><span className="text-zinc-600">O:</span>{ratingInfo.details.o}</span>
                                <span className="flex gap-1"><span className="text-zinc-600">P:</span>{ratingInfo.details.p}</span>
                              </div>
                            )}
                          </div>
                          {ratingInfo ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black font-mono text-emerald-400">{ratingInfo.average.toFixed(1)}</span>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section Centrale : Sliders de Notation */}
                <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-2xl p-4 sm:p-8 shadow-2xl flex flex-col justify-between min-h-[500px]">
                {activeCandidate ? (
                  <form onSubmit={handleSaveScore} className="space-y-6 sm:space-y-8">

                    {/* Entête du candidat actif */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-zinc-900">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-bold text-[#e5c47f] uppercase tracking-widest bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
                            {activeCandidate.discipline}
                          </span>
                          <span className="text-[10px] font-semibold text-zinc-500">
                            {activeCandidate.region}
                          </span>
                          {renderCandidatureBadge(activeCandidate)}
                        </div>
                        <h3 className="font-heading font-black text-xl sm:text-2xl text-white uppercase tracking-tight">
                          {activeCandidate.stage_name}
                        </h3>
                      </div>

                      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex items-center gap-2 sm:gap-3 shadow-lg">
                        <div className="text-right">
                          <span className="text-[9px] text-zinc-500 block uppercase tracking-wider">Phase Active</span>
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            {systemControl?.current_phase === 'PRESELECTION' ? 'Présélection' :
                             systemControl?.current_phase === 'VOTES_TOP_40' ? 'Votes Top 40' :
                             systemControl?.current_phase === 'SEMIFINAL' ? 'Demi-Finale' :
                             systemControl?.current_phase === 'FINAL' ? 'Finale' : 'Archivé'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sliders */}
                    <div className="space-y-6 sm:space-y-8 py-4">
                      {/* 1. Technique */}
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                          <label className="text-xs sm:text-sm font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-[#e5c47f]/10 flex items-center justify-center">
                              <Sparkles className="w-3.5 h-3.5 text-[#e5c47f]" />
                            </div>
                            Technique Artistique
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => adjustScore(setScoreTechnique, scoreTechnique, -0.5)}
                              className="w-10 h-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all active:scale-90"
                            >
                              <Minus className="w-4 h-4 text-zinc-400" />
                            </button>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 min-w-[100px] text-center shadow-inner">
                              <span className="font-mono font-black text-lg text-white">{scoreTechnique}</span>
                              <span className="text-[10px] text-zinc-600 ml-1">/20</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => adjustScore(setScoreTechnique, scoreTechnique, 0.5)}
                              className="w-10 h-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all active:scale-90"
                            >
                              <Plus className="w-4 h-4 text-zinc-400" />
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="0.5"
                          value={scoreTechnique}
                          onChange={(e) => setScoreTechnique(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#e5c47f] border border-zinc-800"
                        />
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed italic border-l-2 border-zinc-800 pl-3">
                          Précision de l'exécution, justesse vocale, rythme, complexité technique.
                        </p>
                      </div>

                      {/* 2. Originalité */}
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                          <label className="text-xs sm:text-sm font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-[#e5c47f]/10 flex items-center justify-center">
                              <Sparkles className="w-3.5 h-3.5 text-[#e5c47f]" />
                            </div>
                            Originalité & Créativité
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => adjustScore(setScoreOriginalite, scoreOriginalite, -0.5)}
                              className="w-10 h-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all active:scale-90"
                            >
                              <Minus className="w-4 h-4 text-zinc-400" />
                            </button>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 min-w-[100px] text-center shadow-inner">
                              <span className="font-mono font-black text-lg text-white">{scoreOriginalite}</span>
                              <span className="text-[10px] text-zinc-600 ml-1">/20</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => adjustScore(setScoreOriginalite, scoreOriginalite, 0.5)}
                              className="w-10 h-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all active:scale-90"
                            >
                              <Plus className="w-4 h-4 text-zinc-400" />
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="0.5"
                          value={scoreOriginalite}
                          onChange={(e) => setScoreOriginalite(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#e5c47f] border border-zinc-800"
                        />
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed italic border-l-2 border-zinc-800 pl-3">
                          Créativité, innovation, arrangement unique, identité culturelle béninoise.
                        </p>
                      </div>

                      {/* 3. Présence scénique */}
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                          <label className="text-xs sm:text-sm font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-[#e5c47f]/10 flex items-center justify-center">
                              <Sparkles className="w-3.5 h-3.5 text-[#e5c47f]" />
                            </div>
                            Présence Scénique & Charisme
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => adjustScore(setScorePresence, scorePresence, -0.5)}
                              className="w-10 h-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all active:scale-90"
                            >
                              <Minus className="w-4 h-4 text-zinc-400" />
                            </button>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 min-w-[100px] text-center shadow-inner">
                              <span className="font-mono font-black text-lg text-white">{scorePresence}</span>
                              <span className="text-[10px] text-zinc-600 ml-1">/20</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => adjustScore(setScorePresence, scorePresence, 0.5)}
                              className="w-10 h-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all active:scale-90"
                            >
                              <Plus className="w-4 h-4 text-zinc-400" />
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="0.5"
                          value={scorePresence}
                          onChange={(e) => setScorePresence(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#e5c47f] border border-zinc-800"
                        />
                        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed italic border-l-2 border-zinc-800 pl-3">
                          Charisme, connexion avec l'audience, occupation spatiale, émotion partagée.
                        </p>
                      </div>
                    </div>

                    {/* Barre de soumission */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 sm:pt-6 border-t border-zinc-900 gap-4">
                        {success ? (
                          <div className="text-emerald-400 text-sm font-bold flex items-center gap-2 bg-emerald-950/20 border border-emerald-900/50 px-4 py-2 rounded-lg">
                            <Check className="w-4 h-4" /> Note enregistrée avec succès !
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-500">La note globale sera automatiquement calculée sur la moyenne des 3 critères.</span>
                        )}

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-[#e5c47f] to-[#d4b36f] text-black font-heading font-black text-xs sm:text-sm uppercase rounded-xl tracking-wider hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#e5c47f]/20"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sauvegarde...
                            </>
                          ) : (
                            <>
                              <Award className="w-4 h-4" />
                              <span className="hidden sm:inline">Enregistrer la Note</span>
                              <span className="sm:hidden">Enregistrer</span>
                            </>
                          )}
                        </button>
                      </div>

                    </form>
                  ) : (
                    <div className="text-center py-20">
                      <span className="text-zinc-500">Aucun candidat disponible pour l'évaluation.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'history' && (
            <div className="text-center py-20">
              <span className="text-zinc-500">Historique des évaluations - À venir</span>
            </div>
          )}
          {activeTab === 'stats' && (
            <div className="text-center py-20">
              <span className="text-zinc-500">Statistiques - À venir</span>
            </div>
          )}
        </div>

        {/* Right Column - Activity & Feed (30% on desktop, hidden on mobile) */}
        <div className="hidden lg:block lg:w-[30%] bg-[#050505] border-l border-zinc-800 p-6 overflow-y-auto">
          <div className="space-y-8">
            {/* Live Feed Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Activité Live</h3>
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Dernières notes attribuées</p>
            </div>

            {/* Evaluation Stats Mini */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl">
                <span className="text-[9px] text-zinc-500 uppercase block mb-1">Total Archivés</span>
                <span className="text-lg font-black text-white font-mono">{existingRatings.length}</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl">
                <span className="text-[9px] text-zinc-500 uppercase block mb-1">Moy. Phase</span>
                <span className="text-lg font-black text-[#e5c47f] font-mono">
                  {existingRatings.length > 0 
                    ? (existingRatings.reduce((acc, r) => acc + (Number(r.score_technique) + Number(r.score_originalite) + Number(r.score_presence)) / 3, 0) / existingRatings.length).toFixed(1)
                    : '--'}
                </span>
              </div>
            </div>

            {/* History Feed */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-900 pb-2">Journal de bord</h4>
              <div className="space-y-3">
                {existingRatings.slice(0, 5).map((rating, i) => {
                  const candidate = candidates.find(c => c.id === rating.candidate_id);
                  const avg = (Number(rating.score_technique) + Number(rating.score_originalite) + Number(rating.score_presence)) / 3;
                  return (
                    <div key={i} className="group p-3 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-800 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-white uppercase truncate max-w-[120px]">
                          {candidate?.stage_name || 'Artiste'}
                        </span>
                        <span className="text-[10px] font-black text-[#e5c47f] font-mono">{avg.toFixed(1)}</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div key={s} className={`h-1 flex-1 rounded-full ${s <= Math.round(avg/4) ? 'bg-[#e5c47f]' : 'bg-zinc-800'}`} />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {existingRatings.length === 0 && (
                  <div className="text-center py-10">
                    <span className="text-[10px] text-zinc-600 uppercase font-mono tracking-widest italic">Aucune donnée</span>
                  </div>
                )}
              </div>
            </div>

            {/* System Info */}
            <div className="pt-8 border-t border-zinc-900">
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Flag className="w-3.5 h-3.5" />
                  <span className="text-[9px] uppercase font-bold tracking-wider">Infos Système</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-500">Statut Votes</span>
                    <span className={systemControl?.is_voting_open ? 'text-emerald-500' : 'text-red-500'}>
                      {systemControl?.is_voting_open ? 'OUVERTS' : 'FERMÉS'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-500">Server Time</span>
                    <span className="text-zinc-300 font-mono">{new Date().toLocaleTimeString('fr-FR', { hour12: false })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-[100] ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      ))}

      {/* MODALE D'ÉVALUATION COMPLÈTE */}
      <AnimatePresence>
        {showCandidateModal && candidateForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            >
              {/* Header de la modale */}
              <div className="p-4 border-b border-zinc-900 flex items-center justify-between sticky top-0 bg-zinc-950 z-10">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowCandidateModal(false)}
                    className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-zinc-400" />
                  </button>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">{candidateForModal.stage_name}</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{candidateForModal.discipline} • {candidateForModal.region}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCandidateModal(false)}
                  className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Corps de la modale */}
              <div className="flex flex-col lg:flex-row overflow-y-auto">
                {/* Gauche : Vidéo et Infos */}
                <div className="lg:w-3/5 p-6 border-r border-zinc-900 space-y-6">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-inner">
                    {candidateForModal.video_url ? (
                      <video 
                        src={candidateForModal.video_url} 
                        poster={candidateForModal.cover_image_url}
                        controls 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700 font-mono text-xs">
                        FLUX VIDÉO INDISPONIBLE
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-[#e5c47f] uppercase tracking-[0.2em] border-b border-zinc-900 pb-2">Détails Artistiques</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                      {candidateForModal.stage_name} représente fièrement le département du {candidateForModal.region} dans la catégorie {candidateForModal.discipline}.
                    </p>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                        <span className="text-[8px] text-zinc-500 uppercase block mb-1">Candidature</span>
                        <span className="text-[10px] font-bold text-white uppercase">
                          {candidateForModal.candidature_type === 'group' ? `Groupe (${candidateForModal.member_count} membres)` : 'Artiste Solo'}
                        </span>
                      </div>
                      <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                        <span className="text-[8px] text-zinc-500 uppercase block mb-1">Inscrit le</span>
                        <span className="text-[10px] font-bold text-white uppercase">
                          {new Date(candidateForModal.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Droite : Notation */}
                <div className="lg:w-2/5 p-6 bg-zinc-900/20 space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="w-4 h-4 text-[#e5c47f]" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Grille de Notation</h3>
                  </div>

                  {confirmRatingMode ? (
                    <div className="h-full flex flex-col justify-center items-center text-center space-y-6 py-10 animate-fadeIn">
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-emerald-500/20">
                        <Check className="w-10 h-10 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold uppercase tracking-tight mb-2">Note prête à être certifiée</h4>
                        <p className="text-xs text-zinc-500">
                          Moyenne calculée : <span className="text-emerald-400 font-black font-mono text-lg">
                            {((scoreTechnique + scoreOriginalite + scorePresence) / 3).toFixed(1)}/20
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-col w-full gap-3">
                        <button 
                          onClick={handleSaveScore}
                          className="w-full py-4 bg-emerald-500 text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          CONFIRMER ET ENREGISTRER
                        </button>
                        <button 
                          onClick={() => setConfirmRatingMode(false)}
                          className="w-full py-3 text-zinc-500 font-bold uppercase text-[10px] hover:text-white transition-all"
                        >
                          MODIFIER LES SCORES
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-8">
                        {/* Technique */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Technique</label>
                            <span className="text-lg font-black font-mono text-[#e5c47f]">{scoreTechnique}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => adjustScore(setScoreTechnique, scoreTechnique, -0.5)}
                              className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input 
                              type="range" min="0" max="20" step="0.5" 
                              value={scoreTechnique} 
                              onChange={(e) => setScoreTechnique(parseFloat(e.target.value))}
                              className="flex-1 h-1.5 bg-zinc-800 rounded-full appearance-none accent-[#e5c47f]" 
                            />
                            <button 
                              type="button"
                              onClick={() => adjustScore(setScoreTechnique, scoreTechnique, 0.5)}
                              className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Originalité */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Originalité</label>
                            <span className="text-lg font-black font-mono text-[#e5c47f]">{scoreOriginalite}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => adjustScore(setScoreOriginalite, scoreOriginalite, -0.5)}
                              className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input 
                              type="range" min="0" max="20" step="0.5" 
                              value={scoreOriginalite} 
                              onChange={(e) => setScoreOriginalite(parseFloat(e.target.value))}
                              className="flex-1 h-1.5 bg-zinc-800 rounded-full appearance-none accent-[#e5c47f]" 
                            />
                            <button 
                              type="button"
                              onClick={() => adjustScore(setScoreOriginalite, scoreOriginalite, 0.5)}
                              className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Présence */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Présence</label>
                            <span className="text-lg font-black font-mono text-[#e5c47f]">{scorePresence}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => adjustScore(setScorePresence, scorePresence, -0.5)}
                              className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input 
                              type="range" min="0" max="20" step="0.5" 
                              value={scorePresence} 
                              onChange={(e) => setScorePresence(parseFloat(e.target.value))}
                              className="flex-1 h-1.5 bg-zinc-800 rounded-full appearance-none accent-[#e5c47f]" 
                            />
                            <button 
                              type="button"
                              onClick={() => adjustScore(setScorePresence, scorePresence, 0.5)}
                              className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-zinc-900">
                        <div className="flex justify-between items-center mb-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">Moyenne Globale</span>
                          <span className="text-2xl font-black font-mono text-white">
                            {((scoreTechnique + scoreOriginalite + scorePresence) / 3).toFixed(1)}
                          </span>
                        </div>
                        <button 
                          onClick={() => setConfirmRatingMode(true)}
                          className="w-full py-4 bg-[#e5c47f] text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-[#d4b36f] transition-all shadow-lg shadow-[#e5c47f]/20"
                        >
                          VALIDER CETTE NOTE
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
