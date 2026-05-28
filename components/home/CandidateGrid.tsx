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
    // Trier les finalistes par votes pour le palmarès
    const sortedFinalists = [...candidates]
      .filter(c => c.is_finalist)
      .sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));
    
    const finalists = sortedFinalists.slice(0, 8);
    const top3 = finalists.slice(0, 3);
    const others = finalists.slice(3, 8);
    const isArchived = currentPhase === 'ARCHIVED';
    
    const podiumSlots = [
      { candidate: top3[1], rank: 2, label: isArchived ? '2ÈME PLACE' : 'CHALLENGER', height: 'h-64 sm:h-72', tone: 'border-zinc-300 bg-zinc-50', accent: 'text-zinc-500', order: 'order-2 sm:order-1' },
      { candidate: top3[0], rank: 1, label: isArchived ? 'VAINQUEUR' : 'LEADER', height: 'h-80 sm:h-96', tone: 'border-[#e5c47f] bg-[#e5c47f]/10 shadow-2xl shadow-[#e5c47f]/20', accent: 'text-[#b08a3c]', order: 'order-1 sm:order-2' },
      { candidate: top3[2], rank: 3, label: isArchived ? '3ÈME PLACE' : 'OUTSIDER', height: 'h-56 sm:h-64', tone: 'border-orange-200 bg-orange-50/60', accent: 'text-orange-500', order: 'order-3' },
    ];

    return (
      <div className="space-y-12">
        <div className={`mx-auto max-w-3xl border px-6 py-4 text-center ${isArchived ? 'bg-zinc-950 border-zinc-800 text-[#e5c47f]' : 'bg-red-600 border-red-500 text-white shadow-xl shadow-red-600/20'}`}>
          <div className="flex items-center justify-center gap-3 font-heading font-black text-xs sm:text-sm uppercase tracking-[0.3em]">
            {isArchived ? <Trophy className="w-5 h-5" /> : <Radio className="w-5 h-5 animate-pulse" />}
            <span>
              {isArchived 
                ? "LIVRE D'OR — LES LAURÉATS 2026" 
                : "⚔️ L'ARÈNE DES FINALISTES"}
            </span>
          </div>
        </div>

        {/* Podium Principal (Top 3) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-end gap-4 sm:gap-6 max-w-5xl mx-auto px-4">
          {podiumSlots.map(({ candidate, rank, label, height, tone, accent, order }) => (
            <div key={rank} className={`${order} ${height} ${tone} border-2 rounded-2xl p-6 flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden`}>
              {candidate ? (
                <>
                  <div className="flex items-center justify-between relative z-10">
                    <span className={`font-heading font-black text-5xl ${accent} opacity-50`}>#{rank}</span>
                    <span className="font-mono text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold bg-white/50 px-2 py-1 rounded">{label}</span>
                  </div>

                  <div className="space-y-4 text-center relative z-10">
                    <div className={`relative mx-auto w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 ${rank === 1 ? 'border-[#e5c47f]' : 'border-white'} shadow-2xl bg-zinc-200`}>
                      {candidate.cover_image_url ? (
                        <img src={candidate.cover_image_url} alt={candidate.stage_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 font-heading font-black text-3xl">
                          {candidate.stage_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-xl sm:text-2xl uppercase text-zinc-950 truncate tracking-tight">{candidate.stage_name}</h3>
                      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-500 font-medium">{candidate.discipline} • {candidate.region}</p>
                    </div>
                    
                    {!isArchived && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-full shadow-sm">
                        <Trophy className="w-3.5 h-3.5 text-[#e5c47f]" />
                        <span className="font-mono text-xs font-black text-zinc-900">{calculateHybridScore?.(candidate.id)?.toFixed(1) ?? '0.0'} / 20</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectVideo?.(candidate.id)}
                    className={`w-full py-4 relative z-10 ${rank === 1 ? 'bg-zinc-950 text-white' : 'bg-white border-2 border-zinc-950 text-zinc-950'} rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#e5c47f] hover:text-zinc-950 hover:border-[#e5c47f] transition-all duration-300`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    Voir la prestation
                  </button>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-300 font-mono uppercase tracking-widest animate-pulse">Sélection en cours...</div>
              )}
            </div>
          ))}
        </div>

        {/* Mentions Honorables (Places 4 à 8) */}
        {others.length > 0 && (
          <div className="max-w-5xl mx-auto space-y-8 px-4 pb-12">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-zinc-200"></div>
              <h4 className="font-heading font-black text-[10px] sm:text-xs uppercase tracking-[0.4em] text-zinc-400 text-center">
                {isArchived ? "MENTIONS HONORABLES — FINALISTES OFFICIELS" : "LES GUERRIERS DE LA FINALE"}
              </h4>
              <div className="h-px flex-1 bg-zinc-200"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {others.map((candidate, idx) => (
                <div key={candidate.id} className="flex items-center gap-4 p-4 bg-white border border-zinc-100 rounded-2xl hover:border-[#e5c47f]/50 hover:shadow-xl hover:shadow-zinc-200/50 transition-all group">
                  <span className="font-heading font-black text-2xl text-zinc-200 group-hover:text-[#e5c47f] transition-colors tabular-nums">#{idx + 4}</span>
                  <div className="w-12 h-12 rounded-full bg-zinc-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-md">
                    {candidate.cover_image_url ? (
                      <img src={candidate.cover_image_url} alt={candidate.stage_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 font-heading text-sm">
                        {candidate.stage_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-heading font-black text-[11px] sm:text-xs uppercase text-zinc-950 truncate tracking-tight">{candidate.stage_name}</h5>
                    <p className="font-mono text-[9px] uppercase text-zinc-500 truncate font-medium">{candidate.discipline} • {candidate.region}</p>
                  </div>
                  <button 
                    onClick={() => onSelectVideo?.(candidate.id)}
                    className="p-3 bg-zinc-50 rounded-xl text-zinc-400 hover:text-[#e5c47f] hover:bg-zinc-950 transition-all duration-300 shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-current" />
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
