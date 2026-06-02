'use client';

import { useState } from 'react';
import { Play, Star, X, Info, Radio, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Candidate } from '@/lib/supabase';

interface CandidateCardProps {
  candidate: Candidate;
  currentRole?: string;
  rank?: number;
  votesCount?: number;
  selectedVideo?: string | null;
  liveCandidateId?: string | null;
  isVotingOpen?: boolean;
  juryScore?: number;
  onSelectVideo?: (candidateId: string | null) => void;
  onVote?: (candidate: Candidate) => void;
  onViewIncrement?: (candidateId: string) => void;
  onShowBio?: (candidate: Candidate) => void; // Nouvelle prop pour la modale
}

export default function CandidateCard({
  candidate,
  currentRole = 'Visiteur',
  rank,
  votesCount = 0,
  selectedVideo,
  liveCandidateId = null,
  isVotingOpen = false,
  juryScore,
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
    <div className="group relative bg-zinc-950 text-white rounded-2xl overflow-hidden aspect-[9/16] shadow-xl border border-white/5">
      
      {/* Badges */}
      <div className="absolute top-4 left-4 z-30 flex gap-2">
        {rank && <div className="px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 font-black text-[#e5c47f] text-xs">#{rank}</div>}
        {isLive && <div className="px-3 py-1.5 bg-red-600/90 backdrop-blur-md rounded-lg text-white font-black text-[10px] animate-pulse flex items-center gap-1"><Radio className="w-3 h-3" /> LIVE</div>}
      </div>

      {selectedVideo === candidate.id && isPlaying ? (
        <div className="relative w-full h-full bg-black">
          <video src={candidate.video_url} autoPlay playsInline controls className="w-full h-full object-cover" onEnded={handleVideoEnded} />
          <button onClick={handleCloseVideo} className="absolute top-4 right-4 z-40 p-2 bg-black/50 rounded-full"><X className="w-5 h-5" /></button>
        </div>
      ) : (
        <>
          {/* Image */}
          <div className="absolute inset-0">
            <img src={candidate.cover_image_url} alt={candidate.stage_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
          
          {/* Action Centrale */}
          <button onClick={handlePlayClick} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hover:scale-110 transition-transform">
            <Play className="w-16 h-16 text-white drop-shadow-2xl fill-white/20" />
          </button>

          {/* Info & Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20 space-y-4">
            <div>
              <h4 className="font-heading font-black text-2xl text-white uppercase tracking-tight">{candidate.stage_name}</h4>
              <p className="text-xs font-mono text-zinc-300 uppercase tracking-widest">{candidate.discipline} • {candidate.region}</p>
            </div>

            <div className="flex items-end justify-between border-t border-white/10 pt-4">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-[#e5c47f] font-mono">{votesCount.toLocaleString()}</span>
                <span className="text-[10px] font-bold uppercase text-zinc-400">Votes</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onShowBio?.(candidate)} className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20">
                  <Info className="w-4 h-4" />
                </button>
                {currentRole !== 'Administrateur' && (
                  <button onClick={handleVoteClick} disabled={!isVotingOpen} className={`px-6 py-3 font-black text-[10px] uppercase rounded-full transition-all ${isVotingOpen ? 'bg-white text-zinc-950 hover:bg-[#e5c47f]' : 'bg-zinc-700 text-zinc-400'}`}>
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