'use client';



import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';

import { useSearchParams } from 'next/navigation';

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

  const [systemControl, setSystemControl] = useState<SystemControl>(FALLBACK_SYSTEM);

  const [voteCounts, setVoteCounts] = useState<CandidateVoteCount[]>([]);

  const [juryAverages, setJuryAverages] = useState<Record<string, JuryAverage>>({});

  const [currentRole, setCurrentRole] = useState<string>('Visiteur');

  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);



  const loadData = useCallback(async () => {

    try {

      setError(null);

      const [allCandidates, sc, voteCountsData, allRatings] = await Promise.all([

        db.getCandidates({ status: 'approved' }), // Only fetch approved candidates

        db.getSystemControl(),

        db.getCandidateVoteCounts(),

        db.getJuryRatings(),

      ]);



      setCandidates(allCandidates);

      

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

          console.log('Subscription status:', status);

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

          console.log('Candidates subscription status:', status);

        });



      return () => {

        systemChannel.unsubscribe();

        candidatesChannel.unsubscribe();

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

  const isPreselectionOpen = useMemo(() => {

    return systemControl.current_phase === 'PRESELECTION';

  }, [systemControl.current_phase]);



  const showCandidateGrid = useMemo(() => {

    return systemControl.current_phase !== 'PRESELECTION';

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



  const handleSelectVideo = useCallback((candidateId: string | null) => {

    setSelectedVideo(candidateId);

  }, []);



  const rankedCandidates = useMemo(() => {

    return [...candidates].sort((a, b) => calculateHybridScore(b.id) - calculateHybridScore(a.id));

  }, [candidates, calculateHybridScore]);



  // Filter candidates based on phase

  const filteredCandidates = useMemo(() => {
    if (systemControl.current_phase === 'PRESELECTION') return [];

    if (systemControl.current_phase === 'VOTES_TOP_40')
      return rankedCandidates.filter(c => c.is_top_40);

    if (systemControl.current_phase === 'SEMIFINAL')
      return rankedCandidates.filter(c => c.is_semifinalist);

    if (systemControl.current_phase === 'FINAL' || systemControl.current_phase === 'ARCHIVED')
      return rankedCandidates.filter(c => c.is_finalist);

    return rankedCandidates;
  }, [rankedCandidates, systemControl.current_phase]);



  const talentsSectionTitle = useMemo(() => {
    if (systemControl.current_phase === 'FINAL') return 'Le Podium de la Grande Finale';
    if (systemControl.current_phase === 'ARCHIVED') return 'Palmarès de l’Édition 2026';
    return 'Les Talents du Bénin';
  }, [systemControl.current_phase]);



  return (

    <div className="min-h-screen bg-white flex flex-col text-[#050505] antialiased selection:bg-[#e5c47f] selection:text-white pt-12 sm:pt-20">

      <Navbar currentPhase={systemControl.current_phase} />



      {loading ? (

        <div className="flex-1 flex items-center justify-center bg-white">

          <div className="text-center">

            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e5c47f] mx-auto mb-4"></div>

            <p className="text-sm text-slate-600">Chargement...</p>

          </div>

        </div>

      ) : (

        <>

          {error && (

            <div className="bg-amber-50 border border-amber-200 px-4 py-3 text-center">

              <p className="text-sm text-amber-800">{error}</p>

            </div>

          )}



          <HeroSection 

            currentPhase={systemControl.current_phase}

            isVotingOpen={systemControl.is_voting_open}

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
                onSelectVideo={handleSelectVideo}
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

        </>

      )}

    </div>

  );

}



export default function Home() {

  return (

    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Chargement...</div>}>

      <HomeContent />

    </Suspense>

  );

}

