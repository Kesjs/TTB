'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Star, Award, UserCheck, Flame, Loader2, Sparkles, Check, Plus, Minus,
  LogOut, AlertCircle, ExternalLink, History, ClipboardList, BarChart3
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

  const [existingRatings, setExistingRatings] = useState<any[]>([]);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const handleLogout = async () => {
    // Clear localStorage
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    // Clear cookies
    document.cookie = 'user_id=; path=/; max-age=0; SameSite=Lax; Secure';
    document.cookie = 'user_role=; path=/; max-age=0; SameSite=Lax; Secure';
    // Sign out from Supabase
    if (supabase) {
      await supabase.auth.signOut();
    }
    // Redirect to login
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
              className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left Column - Workspace (70% on desktop, 100% on mobile) */}
        <div className="w-full lg:w-[70%] p-4 sm:p-6 overflow-y-auto">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
              {/* Section Gauche : Liste des Candidats & Sélection */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 sm:p-6 h-fit space-y-4 sm:space-y-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#e5c47f] uppercase tracking-widest mb-1">
                      <ClipboardList className="w-3.5 h-3.5" />
                      Évaluation en Cours
                    </span>
                    <h2 className="font-heading font-black text-lg sm:text-xl text-white uppercase tracking-tight">Candidats en Scène</h2>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Sélectionnez le candidat physique présent sur le plateau de l'événement.</p>
                  </div>
                  <div className="hidden sm:block w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                    <span className="text-xs font-bold text-zinc-400">
                      {(() => {
                        if (systemControl?.current_phase === 'VOTES_TOP_40') return candidates.filter(c => c.is_top_40).length;
                        if (systemControl?.current_phase === 'SEMIFINAL') return candidates.filter(c => c.is_semifinalist).length;
                        if (systemControl?.current_phase === 'FINAL') return candidates.filter(c => c.is_finalist).length;
                        return candidates.length;
                      })()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {(() => {
                    // Filter candidates based on phase
                    let filteredCandidates = candidates;
                    if (systemControl?.current_phase === 'VOTES_TOP_40') {
                      filteredCandidates = candidates.filter(c => c.is_top_40);
                    } else if (systemControl?.current_phase === 'SEMIFINAL') {
                      filteredCandidates = candidates.filter(c => c.is_semifinalist);
                    } else if (systemControl?.current_phase === 'FINAL') {
                      filteredCandidates = candidates.filter(c => c.is_finalist);
                    }

                    return filteredCandidates.map((c) => {
                      const isLive = systemControl?.live_voting_candidate_id === c.id;
                      const isRated = existingRatings.some(r => r.candidate_id === c.id && r.phase === systemControl?.current_phase);

                      return (
                      <button
                        key={c.id}
                        onClick={() => setActiveCandidateId(c.id)}
                        className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                          activeCandidateId === c.id
                            ? 'bg-zinc-900 text-white border-[#e5c47f]'
                            : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-heading font-bold text-sm text-white">{c.stage_name}</span>
                            {renderCandidatureBadge(c)}
                            {isLive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="En Direct" />
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500 block">
                            {c.discipline} • {c.region}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isRated && (
                            <span className="p-1 bg-emerald-950/40 text-emerald-400 border border-emerald-900 rounded-full">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                          {isLive && (
                            <span className="text-[9px] px-2 py-0.5 bg-red-600 text-white font-bold rounded uppercase">
                              LIVE
                            </span>
                          )}
                        </div>
                      </button>
                    );
                    });
                  })()}
                </div>
              </div>

              {/* Section Centrale : Sliders de Notation */}
              <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-2xl p-4 sm:p-8 shadow-2xl flex flex-col justify-between">
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
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <label className="text-sm font-semibold tracking-wide text-zinc-300 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#e5c47f]" />
                            Technique Artistique
                          </label>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <button
                                type="button"
                                onClick={() => adjustScore(setScoreTechnique, scoreTechnique, -0.5)}
                                className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:border-zinc-700 transition-colors active:scale-95"
                              >
                                <Minus className="w-4 h-4 text-zinc-400" />
                              </button>
                              <span className="font-heading font-black text-lg sm:text-xl text-[#e5c47f] bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 px-3 sm:px-4 py-1 rounded-lg min-w-[70px] sm:min-w-[80px] text-center shadow-lg">
                                {scoreTechnique} / 20
                              </span>
                              <button
                                type="button"
                                onClick={() => adjustScore(setScoreTechnique, scoreTechnique, 0.5)}
                                className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:border-zinc-700 transition-colors active:scale-95"
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
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#e5c47f]"
                          />
                          <p className="text-[10px] text-zinc-500 leading-relaxed">Précision de l'exécution, justesse vocale, rythme, complexité technique.</p>
                        </div>

                        {/* 2. Originalité */}
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <label className="text-sm font-semibold tracking-wide text-zinc-300 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-[#e5c47f]" />
                              Originalité & Créativité
                            </label>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <button
                                type="button"
                                onClick={() => adjustScore(setScoreOriginalite, scoreOriginalite, -0.5)}
                                className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:border-zinc-700 transition-colors active:scale-95"
                              >
                                <Minus className="w-4 h-4 text-zinc-400" />
                              </button>
                              <span className="font-heading font-black text-lg sm:text-xl text-[#e5c47f] bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 px-3 sm:px-4 py-1 rounded-lg min-w-[70px] sm:min-w-[80px] text-center shadow-lg">
                                {scoreOriginalite} / 20
                              </span>
                              <button
                                type="button"
                                onClick={() => adjustScore(setScoreOriginalite, scoreOriginalite, 0.5)}
                                className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:border-zinc-700 transition-colors active:scale-95"
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
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#e5c47f]"
                          />
                          <p className="text-[10px] text-zinc-500 leading-relaxed">Créativité, innovation, arrangement unique, identité culturelle béninoise.</p>
                        </div>

                        {/* 3. Présence scénique */}
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <label className="text-sm font-semibold tracking-wide text-zinc-300 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-[#e5c47f]" />
                              Présence Scénique & Charisme
                            </label>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <button
                                type="button"
                                onClick={() => adjustScore(setScorePresence, scorePresence, -0.5)}
                                className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:border-zinc-700 transition-colors active:scale-95"
                              >
                                <Minus className="w-4 h-4 text-zinc-400" />
                              </button>
                              <span className="font-heading font-black text-lg sm:text-xl text-[#e5c47f] bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 px-3 sm:px-4 py-1 rounded-lg min-w-[70px] sm:min-w-[80px] text-center shadow-lg">
                                {scorePresence} / 20
                              </span>
                              <button
                                type="button"
                                onClick={() => adjustScore(setScorePresence, scorePresence, 0.5)}
                                className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:border-zinc-700 transition-colors active:scale-95"
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
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#e5c47f]"
                          />
                          <p className="text-[10px] text-zinc-500 leading-relaxed">Charisme, connexion avec l'audience, occupation spatiale, émotion partagée.</p>
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
      </div>

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
