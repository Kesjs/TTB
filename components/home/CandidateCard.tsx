'use client';

import { useState } from 'react';
import { Play, X, Info, Radio, Eye } from 'lucide-react';
import type { Candidate } from '@/lib/supabase';

// Fonction utilitaire pour formater les nombres (ex: 1250 -> 1.3K)
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

interface CandidateCardProps {
  candidate: Candidate;
  currentRole?: string;
  rank?: number;
  votesCount?: number;
  viewsCount?: number;
  selectedVideo?: string | null;
  liveCandidateId?: string | null;
  isVotingOpen?: boolean;
  onSelectVideo?: (candidateId: string | null) => void;
  onVote?: (candidate: Candidate) => void;
  onViewIncrement?: (candidateId: string) => void;
  onShowBio?: (candidate: Candidate) => void;
}

export default function CandidateCard({
  candidate,
  currentRole = 'Visiteur',
  rank,
  votesCount = 0,
  viewsCount = 0,
  selectedVideo,
  liveCandidateId = null,
  isVotingOpen = false,
  onSelectVideo,
  onVote,
  onViewIncrement,
  onShowBio
}: CandidateCardProps) {
  const isLive = liveCandidateId === candidate.id;
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = () => { setIsPlaying(true); onViewIncrement?.(candidate.id); onSelectVideo?.(candidate.id); };
  const handleCloseVideo = () => { setIsPlaying(false); onSelectVideo?.(null); };
  const handleVideoEnded = () => { setIsPlaying(false); onSelectVideo?.(null); };
  const handleVoteClick = (e: React.MouseEvent) => { e.stopPropagation(); onVote?.(candidate); };

  return (
    <div className="group relative bg-zinc-950 text-white rounded-2xl overflow-hidden aspect-[3/4] shadow-xl border border-white/5 transition-all duration-300">
      
      {/* Badges */}
      <div className="absolute top-3 left-3 z-30 flex gap-2">
        {rank && <div className="px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 font-black text-[#e5c47f] text-[10px]">#{rank}</div>}
        {isLive && <div className="px-2 py-1 bg-red-600/90 backdrop-blur-md rounded-lg text-white font-black text-[9px] animate-pulse flex items-center gap-1"><Radio className="w-2.5 h-2.5" /> LIVE</div>}
      </div>

      {selectedVideo === candidate.id && isPlaying ? (
        <div className="relative w-full h-full bg-black">
          <video src={candidate.video_url} autoPlay playsInline controls className="w-full h-full object-cover" onEnded={handleVideoEnded} />
          <button onClick={handleCloseVideo} className="absolute top-3 right-3 z-40 p-1.5 bg-black/50 rounded-full"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <>
          <div className="absolute inset-0">
            <img src={candidate.cover_image_url} alt={candidate.stage_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
          
          <button onClick={handlePlayClick} className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hover:scale-110 transition-transform">
            <Play className="w-10 h-10 sm:w-14 sm:h-14 text-white drop-shadow-2xl fill-white/20" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 z-20 space-y-1 sm:space-y-2">
            <div className="flex justify-between items-end mb-1">
              <div>
                <h4 className="font-heading font-black text-lg sm:text-xl text-white uppercase tracking-tight truncate">{candidate.stage_name}</h4>
                <p className="text-[9px] sm:text-[11px] font-mono text-zinc-300 uppercase tracking-widest">{candidate.discipline}</p>
              </div>
              <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md border border-white/5 backdrop-blur-sm">
                <Eye className="w-3 h-3 text-zinc-400" />
                <span className="text-[10px] font-mono text-zinc-300">{formatNumber(viewsCount)}</span>
              </div>
            </div>

            <div className="flex items-end justify-between border-t border-white/10 pt-2 sm:pt-3">
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-black text-[#e5c47f] font-mono">{votesCount.toLocaleString()}</span>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase text-zinc-400">Votes</span>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                <button onClick={(e) => { e.stopPropagation(); onShowBio?.(candidate); }} className="p-2 sm:p-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20">
                  <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                {currentRole !== 'Administrateur' && (
                  <button 
                    onClick={handleVoteClick} 
                    disabled={!isVotingOpen} 
                    className={`px-3 sm:px-5 py-2 sm:py-2.5 font-black text-[8px] sm:text-[9px] uppercase rounded-full transition-all ${
                      isVotingOpen ? 'bg-white text-zinc-950 hover:bg-[#e5c47f]' : 'bg-zinc-700 text-zinc-400'
                    }`}
                  >
                    Voter
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}