'use client';

import { useState, useMemo } from 'react';
import type { Candidate } from '@/lib/supabase';
import CandidateCard from '@/components/home/CandidateCard';
import CandidateFilters from '@/components/home/CandidateFilters';
import { Flame, Play, Radio, Search, Trophy } from 'lucide-react';

interface CandidateGridProps {
  candidates: Candidate[];
  title?: string;
  currentRole?: string;
  selectedVideo?: string | null;
  liveCandidateId?: string | null;
  isVotingOpen?: boolean;
  currentPhase?: string;
  calculateHybridScore?: (candidateId: string) => number;
  getJuryScore?: (candidateId: string) => number;
  getCandidateVoteCount?: (candidateId: string) => number;
  onSelectVideo?: (candidateId: string | null) => void;
  onVote?: (candidate: Candidate) => void;
}

export default function CandidateGrid({
  candidates,
  title,
  currentRole = 'Visiteur',
  selectedVideo = null,
  liveCandidateId = null,
  isVotingOpen = false,
  currentPhase,
  calculateHybridScore,
  getJuryScore,
  getCandidateVoteCount,
  onSelectVideo,
  onVote
}: CandidateGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [visibleCount, setVisibleCount] = useState(12);

  // Filter candidates based on search and category
  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const matchesSearch = candidate.stage_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Tous' || candidate.discipline === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [candidates, searchQuery, selectedCategory]);

  // Pagination
  const visibleCandidates = filteredCandidates.slice(0, visibleCount);
  const hasMore = filteredCandidates.length > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 8);
  };

  if (currentPhase === 'FINAL' || currentPhase === 'ARCHIVED') {
    const finalists = candidates.slice(0, 8);
    const top3 = finalists.slice(0, 3);
    const others = currentPhase === 'FINAL' ? finalists.slice(3, 8) : [];
    
    const leaderScore = top3[0] ? calculateHybridScore?.(top3[0].id) ?? 0 : 0;
    const challengerScore = top3[1] ? calculateHybridScore?.(top3[1].id) ?? 0 : 0;
    const isGapTight = currentPhase === 'FINAL' && top3.length > 1 && Math.abs(leaderScore - challengerScore) <= 2;
    
    const podiumSlots = [
      { candidate: top3[1], rank: 2, label: currentPhase === 'ARCHIVED' ? '2ÈME PLACE' : 'CHALLENGER', height: 'h-64 sm:h-72', tone: 'border-zinc-300 bg-zinc-50', accent: 'text-zinc-500', order: 'order-2 sm:order-1' },
      { candidate: top3[0], rank: 1, label: currentPhase === 'ARCHIVED' ? 'VAINQUEUR' : 'LEADER', height: 'h-80 sm:h-96', tone: 'border-[#e5c47f] bg-[#e5c47f]/10 shadow-2xl shadow-[#e5c47f]/20', accent: 'text-[#b08a3c]', order: 'order-1 sm:order-2' },
      { candidate: top3[2], rank: 3, label: currentPhase === 'ARCHIVED' ? '3ÈME PLACE' : 'OUTSIDER', height: 'h-56 sm:h-64', tone: 'border-orange-200 bg-orange-50/60', accent: 'text-orange-500', order: 'order-3' },
    ];

    return (
      <div className="space-y-12">
        <div className={`mx-auto max-w-3xl border px-4 py-3 text-center ${isGapTight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-zinc-50 border-zinc-200 text-zinc-600'}`}>
          <div className="flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em]">
            {currentPhase === 'ARCHIVED' ? <Trophy className="w-4 h-4" /> : isGapTight ? <Flame className="w-4 h-4 animate-pulse" /> : <Radio className="w-4 h-4" />}
            <span>
              {currentPhase === 'ARCHIVED' 
                ? 'Palmarès Officiel - Les 3 Lauréats de l’Édition 2026' 
                : isGapTight 
                  ? 'Écart serré dans le TOP 3 — La tension monte !' 
                  : 'Grande finale — Voici le TOP 8 National'}
            </span>
          </div>
        </div>

        {/* Podium Principal (Top 3) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-end gap-4 sm:gap-6 max-w-5xl mx-auto">
          {podiumSlots.map(({ candidate, rank, label, height, tone, accent, order }) => (
            <div key={rank} className={`${order} ${height} ${tone} border-2 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:rotate-1`}>
              {candidate ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className={`font-heading font-black text-4xl ${accent}`}>#{rank}</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">{label}</span>
                  </div>

                  <div className="space-y-4 text-center">
                    <div className="relative mx-auto w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl bg-zinc-200">
                      {candidate.cover_image_url ? (
                        <img src={candidate.cover_image_url} alt={candidate.stage_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 font-heading font-black">
                          {candidate.stage_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-lg uppercase text-zinc-950 truncate">{candidate.stage_name}</h3>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{candidate.discipline} • {candidate.region}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 border border-zinc-200 rounded-full">
                      <Trophy className="w-3.5 h-3.5 text-[#e5c47f]" />
                      <span className="font-mono text-xs font-black text-zinc-900">{calculateHybridScore?.(candidate.id)?.toFixed(1) ?? '0.0'} / 20</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectVideo?.(candidate.id)}
                    className="w-full py-3 bg-zinc-950 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#e5c47f] hover:text-zinc-950 transition-all"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Voir la prestation
                  </button>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-400 font-mono uppercase">En attente...</div>
              )}
            </div>
          ))}
        </div>

        {/* Reste du TOP 8 (Rangs 4 à 8) */}
        {others.length > 0 && (
          <div className="max-w-5xl mx-auto space-y-6">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400 text-center">Finalistes (Rangs 4 à 8)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {others.map((candidate, idx) => (
                <div key={candidate.id} className="flex items-center gap-4 p-3 bg-white border border-zinc-100 rounded-xl hover:border-[#e5c47f]/30 transition-all group">
                  <span className="font-heading font-black text-xl text-zinc-300 group-hover:text-[#e5c47f] transition-colors">#{idx + 4}</span>
                  <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden flex-shrink-0">
                    {candidate.cover_image_url ? (
                      <img src={candidate.cover_image_url} alt={candidate.stage_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 font-heading text-xs">
                        {candidate.stage_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-heading font-black text-xs uppercase text-zinc-950 truncate">{candidate.stage_name}</h5>
                    <p className="font-mono text-[8px] uppercase text-zinc-500 truncate">{candidate.discipline} • {candidate.region}</p>
                  </div>
                  <button 
                    onClick={() => onSelectVideo?.(candidate.id)}
                    className="p-2 text-zinc-400 hover:text-zinc-950 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Discipline Filters */}
      <CandidateFilters
        selectedDiscipline={selectedCategory}
        onDisciplineChange={setSelectedCategory}
      />

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Rechercher un talent..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-none text-sm focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-all"
        />
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 font-mono">
          {filteredCandidates.length} talent{filteredCandidates.length !== 1 ? 's' : ''} trouvé{filteredCandidates.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="text-center py-16 sm:py-20 bg-zinc-50 border border-zinc-200 rounded-2xl">
          <span className="text-zinc-500 text-sm">Aucun candidat ne correspond à vos filtres de recherche.</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {visibleCandidates.map((candidate, index) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                currentRole={currentRole}
                rank={index + 1}
                votesCount={getCandidateVoteCount?.(candidate.id) ?? 0}
                selectedVideo={selectedVideo}
                liveCandidateId={liveCandidateId}
                isVotingOpen={isVotingOpen}
                hybridScore={calculateHybridScore?.(candidate.id)}
                juryScore={getJuryScore?.(candidate.id)}
                onSelectVideo={onSelectVideo}
                onVote={onVote}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                className="px-8 py-3 bg-white border border-zinc-200 text-zinc-700 text-xs font-bold uppercase tracking-wider rounded-none hover:bg-zinc-50 hover:border-zinc-300 transition-all"
              >
                Afficher plus de talents
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
