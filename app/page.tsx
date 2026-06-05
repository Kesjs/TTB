'use client';



import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';

import Link from 'next/link';

import { useSearchParams } from 'next/navigation';

import { Database } from 'lucide-react';

import { PageLoader } from '@/components/ui/PageLoader';

import Navbar from '@/components/Navbar';

import CallForApplications from '@/components/home/CallForApplications';

import CandidateGrid from '@/components/home/CandidateGrid';

import HeroSection from '@/components/home/HeroSection';

import HowItWorks from '@/components/home/HowItWorks';

import JurySection from '@/components/home/JurySection';

import RewardsSection from '@/components/home/RewardsSection';

import RoleSimulator from '@/components/home/RoleSimulator';

import SiteFooter from '@/components/home/SiteFooter';

import EventDiscovery from '@/components/home/EventDiscovery';

import ScrollToTop from '@/components/ScrollToTop';

import VoteModal from '@/components/VoteModal';

import CandidateBioModal from '@/components/CandidateBioModal';

import { db } from '@/lib/supabase';

import { supabase } from '@/lib/supabase/client';

import type { Candidate, SystemControl } from '@/lib/supabase';

import { JuryAverage, CandidateVoteCount } from '@/lib/supabase/types';

// In-memory fallback configuration (SSR-safe, no localStorage dependency)

const FALLBACK_SYSTEM: SystemControl = {

  id: 1,

  current_phase: 'PRESELECTION',

  live_voting_candidate_id: null,

  is_voting_open: false,

  forced_tie_breaker_candidate_id: null,

  created_at: new Date().toISOString(),

  updated_at: new Date().toISOString(),

};



function HomeContent() {

  const searchParams = useSearchParams();

  const previewPhase = searchParams.get('preview_phase') as SystemControl['current_phase'] | null;

  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);

  const [systemControl, setSystemControl] = useState<SystemControl>(FALLBACK_SYSTEM);

  const [voteCounts, setVoteCounts] = useState<CandidateVoteCount[]>([]);

  const [juryAverages, setJuryAverages] = useState<Record<string, JuryAverage>>({});

  const [currentRole, setCurrentRole] = useState<string>('Visiteur');

  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const [selectedCandidateForVote, setSelectedCandidateForVote] = useState<Candidate | null>(null);

  const [selectedCandidateForBio, setSelectedCandidateForBio] = useState<Candidate | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);



  const loadData = useCallback(async () => {

    try {

      setError(null);

      const [approvedCandidates, allCands, sc, voteCountsData, allRatings] = await Promise.all([

        db.getCandidates({ status: 'approved' }), // Only fetch approved candidates for display

        db.getCandidates(), // Fetch all candidates for total count

        db.getSystemControl(),

        db.getCandidateVoteCounts(),

        db.getJuryRatings(),

      ]);



      setCandidates(approvedCandidates);

      setAllCandidates(allCands || []);

      

      // Use preview phase if provided (for admin iframe preview), otherwise use database phase

      const effectiveSystemControl = previewPhase 

        ? { ...sc, current_phase: previewPhase } 

        : sc || FALLBACK_SYSTEM;

      

      setSystemControl(effectiveSystemControl);

      setVoteCounts(voteCountsData);



      const averages = await db.getJuryAverages(effectiveSystemControl.current_phase || 'preselection');

      setJuryAverages(averages);

    } catch (err) {

      console.error('Error loading data:', err);

      setError('Impossible de charger les données. Veuillez réessayer.');

      // Set fallback data to prevent UI freeze

      setSystemControl(FALLBACK_SYSTEM);

      setCandidates([]);

      setAllCandidates([]);

    } finally {

      setLoading(false);

    }

  }, [previewPhase]);



  useEffect(() => {

    void loadData();



    // Supabase Realtime subscription for system_control

    if (supabase) {

      const systemChannel = supabase

        .channel('system_control_public', { config: { broadcast: { self: true } } })

        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_control' }, (payload) => {

          console.log('System control updated:', payload.new);

          const newControl = payload.new as SystemControl;

          setSystemControl(newControl || FALLBACK_SYSTEM);

          // Force reload candidates when phase changes to ensure approved candidates are fetched

          void loadData();

        })

        .subscribe((status) => {

          if (status === 'SUBSCRIBED') {
            console.log('System control realtime subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('System control realtime subscription failed, using polling fallback');
          }
        });



      // Supabase Realtime subscription for candidates (to detect status changes)
      const candidatesChannel = supabase
        .channel('candidates_public')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, (payload) => {
          console.log('Candidates updated:', payload);
          // Reload candidates when status changes or new candidates are added
          void loadData();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Candidates realtime subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('Candidates realtime subscription failed, using polling fallback');
          }
        });

      // Supabase Realtime subscription for jury ratings (to update scores in real-time)
      const ratingsChannel = supabase
        .channel('jury_ratings_public')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'jury_ratings' }, (payload) => {
          console.log('Jury ratings updated:', payload);
          void loadData();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Jury ratings realtime subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('Jury ratings realtime subscription failed, using polling fallback');
          }
        });

      return () => {
        systemChannel.unsubscribe();
        candidatesChannel.unsubscribe();
        ratingsChannel.unsubscribe();
      };

    }



    // Fallback: polling every 5 seconds if realtime fails

    const interval = setInterval(() => {

      void loadData();

    }, 5000);



    return () => {

      clearInterval(interval);

    };

  }, [loadData, previewPhase]);



  // Dynamic phase logic: competition starts when phase moves beyond PRESELECTION

  useEffect(() => {
    // Gérer le scroll automatique si demandé dans l'URL (ex: depuis la Navbar sur une autre page)
    if (!loading && searchParams.get('scroll') === 'talents') {
      const element = document.getElementById('talents-section');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [loading, searchParams]);

  const isPreselectionOpen = useMemo(() => {

    return systemControl.current_phase === 'PRESELECTION';

  }, [systemControl.current_phase]);

  // Calculate hybrid score

  const voteCountMap = useMemo(() => {

    const map: Record<string, number> = {};

    voteCounts.forEach(vc => map[vc.candidate_id] = vc.total_votes);

    return map;

  }, [voteCounts]);

  const maxVotes = Math.max(...Object.values(voteCountMap), 1);

  const calculateHybridScore = useCallback((candidateId: string): number => {

    const votes = voteCountMap[candidateId] || 0;

    const juryData = juryAverages[candidateId];

    const juryScore = juryData ? juryData.total_jury_average : 0;

    const publicScore = (votes / maxVotes) * 20;

    return (juryScore * 0.5) + (publicScore * 0.5);

  }, [voteCountMap, juryAverages, maxVotes]);

  const getJuryScore = useCallback((candidateId: string): number => {
    const juryData = juryAverages[candidateId];
    return juryData ? juryData.total_jury_average : 0;
  }, [juryAverages]);

  const rankedCandidates = useMemo(() => {

    return [...candidates].sort((a, b) => calculateHybridScore(b.id) - calculateHybridScore(a.id));

  }, [candidates, calculateHybridScore]);

  // Filter candidates based on phase

  const filteredCandidates = useMemo(() => {
    // En présélection, afficher tous les candidats approuvés
    if (systemControl.current_phase === 'PRESELECTION') {
      return rankedCandidates;
    }

    if (systemControl.current_phase === 'VOTES_TOP_40')
      return rankedCandidates.filter(c => c.is_top_40);

    if (systemControl.current_phase === 'SEMIFINAL')
      return rankedCandidates.filter(c => c.is_semifinalist);

    if (systemControl.current_phase === 'FINAL' || systemControl.current_phase === 'ARCHIVED')
      return rankedCandidates.filter(c => c.is_finalist);

    return rankedCandidates;
  }, [rankedCandidates, systemControl.current_phase]);

  const showCandidateGrid = useMemo(() => {
    // Ne pas afficher la grille en phase PRESELECTION (contrôlée par l'admin via hero sections)
    if (systemControl.current_phase === 'PRESELECTION') {
      return false;
    }
    // Afficher la grille dans les autres phases s'il y a des candidats
    return filteredCandidates.length > 0;
  }, [filteredCandidates.length, systemControl.current_phase]);

  const handleSelectVideo = useCallback((candidateId: string | null) => {

    setSelectedVideo(candidateId);

  }, []);

  const handleViewIncrement = useCallback(async (candidateId: string) => {
    await db.incrementCandidateViews(candidateId);
    // Recharger les données pour mettre à jour le compteur de vues immédiatement
    void loadData();
  }, [loadData]);

  const handleVote = useCallback((candidate: Candidate) => {
    setSelectedCandidateForVote(candidate);
  }, []);

  const handleShowBio = useCallback((candidate: Candidate) => {
    setSelectedCandidateForBio(candidate);
  }, []);

  const handleVoteSuccess = useCallback(() => {
    // Rafraîchir les données après un vote réussi
    loadData();
  }, [loadData]);



  const talentsSectionTitle = useMemo(() => {
    if (systemControl.current_phase === 'FINAL') return 'Le Podium de la Grande Finale';
    if (systemControl.current_phase === 'ARCHIVED') return 'Palmarès de l’Édition 2026';
    return 'Les Talents du Bénin';
  }, [systemControl.current_phase]);

  if (!loading && (systemControl as any).is_maintenance_mode) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-zinc-950 rounded-full flex items-center justify-center mb-8 animate-pulse">
          <Database className="w-8 h-8 text-[#e5c47f]" />
        </div>
        <h1 className="font-heading font-black text-3xl sm:text-4xl uppercase tracking-tighter text-[#050505] mb-4">
          Maintenance en cours
        </h1>
        <p className="max-w-md text-zinc-500 text-sm sm:text-base leading-relaxed font-body mb-8">
          Nous préparons la plateforme pour la prochaine étape de l&apos;aventure. 
          Revenez très bientôt pour découvrir les nouveaux talents du Bénin.
        </p>
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-full">
          <div className="w-2 h-2 bg-[#e5c47f] rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Édition 2026</span>
        </div>
        <Link 
          href="/login" 
          className="mt-12 text-[10px] uppercase tracking-[0.2em] text-zinc-300 hover:text-zinc-500 transition-colors"
        >
          Accès Admin
        </Link>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-white flex flex-col text-[#050505] antialiased selection:bg-[#e5c47f] selection:text-white pt-12 sm:pt-20">

      <Navbar currentPhase={systemControl.current_phase} isLoading={loading} />

      {loading ? <PageLoader /> : (

        <>
          {error && (

            <div className="bg-amber-50 border border-amber-200 px-4 py-3 text-center">

              <p className="text-sm text-amber-800">{error}</p>

            </div>

          )}



          <HeroSection

            currentPhase={systemControl.current_phase}

            isVotingOpen={systemControl.is_voting_open}

            totalInscrits={allCandidates.length}

          />



          {/* CONDITIONAL SECTION: Candidats Validés (remplace CallForApplications quand phase != preselection_open) */}

          {showCandidateGrid && (

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full bg-slate-50/30" id="talents-section">

              <div className="flex flex-col items-center gap-4 mb-6 sm:mb-8">

                <div className="flex items-center gap-3">

                  <img

                    src="https://images.emojiterra.com/twitter/v14.0/512px/1f1e7-1f1ef.png"

                    alt="Drapeau du Bénin"

                    className="h-8 sm:h-10 w-auto"

                  />

                  <h2 className="font-heading font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#050505] text-center">

                    {talentsSectionTitle}

                  </h2>

                </div>

                {systemControl.is_voting_open && systemControl.current_phase !== 'FINAL' && systemControl.current_phase !== 'ARCHIVED' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#e5c47f]/10 border border-[#e5c47f]/30 rounded-full">
                    <div className="w-2 h-2 bg-[#e5c47f] rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-[#e5c47f] uppercase tracking-wider">Votes Ouverts</span>
                  </div>
                )}

              </div>

              <CandidateGrid
                candidates={filteredCandidates}
                currentRole={currentRole}
                selectedVideo={selectedVideo}
                liveCandidateId={systemControl.live_voting_candidate_id || null}
                isVotingOpen={systemControl.is_voting_open || false}
                currentPhase={systemControl.current_phase}
                calculateHybridScore={calculateHybridScore}
                getJuryScore={getJuryScore}
                onSelectVideo={handleSelectVideo}
                onVote={handleVote}
                onViewIncrement={handleViewIncrement}
                onShowBio={handleShowBio}
              />

            </main>

          )}



          <EventDiscovery />

          <div id="parcours-victoire">

            <HowItWorks />

          </div>

          <RewardsSection />

          <JurySection />



          {/* CallForApplications: affiché en bas avant footer uniquement en phase preselection_open */}

          {isPreselectionOpen && (

            <div id="candidature-section">

              <CallForApplications />

            </div>

          )}



          <SiteFooter />

          <RoleSimulator currentRole={currentRole} setCurrentRole={setCurrentRole} />

          <ScrollToTop />

          {/* Vote Modal */}
          {selectedCandidateForVote && (
            <VoteModal
              candidate={selectedCandidateForVote}
              onClose={() => setSelectedCandidateForVote(null)}
              currentPhase={systemControl.current_phase}
            />
          )}

          {/* Bio Modal */}
          {selectedCandidateForBio && (
            <CandidateBioModal
              candidate={selectedCandidateForBio}
              onClose={() => setSelectedCandidateForBio(null)}
            />
          )}

        </>

      )}

    </div>

  );

}



export default function Home() {

  return (

    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
              <Database className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
          <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
          </div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Chargement en cours...</p>
        </div>
      </div>
    }>

      <HomeContent />

    </Suspense>

  );

}

