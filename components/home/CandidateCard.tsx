'use client';

import { useRef, useState } from 'react';
import { Play, Star, Trophy, Radio, Eye, Heart, Flame, X } from 'lucide-react';
import Image from 'next/image';
import type { Candidate } from '@/lib/supabase';

interface CandidateCardProps {
  candidate: Candidate;
  currentRole?: string;
  rank?: number;
  votesCount?: number;
  selectedVideo?: string | null;
  liveCandidateId?: string | null;
  isVotingOpen?: boolean;
  hybridScore?: number;
  juryScore?: number;
  onSelectVideo?: (candidateId: string | null) => void;
  onVote?: (candidate: Candidate) => void;
  onViewIncrement?: (candidateId: string) => void;
}

export default function CandidateCard({
  candidate,
  currentRole = 'Visiteur',
  rank,
  votesCount = 0,
  selectedVideo,
  liveCandidateId = null,
  isVotingOpen = false,
  hybridScore,
  juryScore,
  onSelectVideo,
  onVote,
  onViewIncrement
}: CandidateCardProps) {
  const isLive = liveCandidateId === candidate.id;
  const viewsCount = candidate.views_count || 0;
  const [isPlaying, setIsPlaying] = useState(false);

  // Debug logs for video and image URLs
  console.log('CandidateCard - Candidate:', candidate.stage_name);
  console.log('CandidateCard - video_url:', candidate.video_url);
  console.log('CandidateCard - cover_image_url:', candidate.cover_image_url);

  const handlePlayClick = () => {
    console.log('Play button clicked for candidate:', candidate.id);
    setIsPlaying(true);
    // Increment views when opening video
    onViewIncrement?.(candidate.id);
    onSelectVideo?.(candidate.id);
  };

  const handleCloseVideo = () => {
    console.log('Closing video for candidate:', candidate.id);
    setIsPlaying(false);
    onSelectVideo?.(null);
  };

  const handleVideoEnded = () => {
    console.log('Video ended for candidate:', candidate.id);
    setIsPlaying(false);
    onSelectVideo?.(null);
  };

  const handleVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVote?.(candidate);
  };

  return (
    <div
      className={`group relative bg-zinc-900 text-white rounded-xl overflow-hidden transition-all duration-300 border border-white/10 ${
        isLive ? 'ring-2 ring-[#e5c47f]/50' : 'hover:shadow-2xl hover:shadow-zinc-900/20'
      }`}
    >
      {/* Rank Badge */}
      {rank && (
        <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-950/60 backdrop-blur-md rounded-lg border border-white/10">
          <span className="font-heading font-black text-xs text-[#e5c47f]">#{rank}</span>
        </div>
      )}

      {/* Qualified Badge */}
      {candidate.is_top_40 && (
        <div className="absolute top-14 left-3 z-30 flex items-center gap-1.5 px-2.5 py-1.5 bg-[#e5c47f] text-zinc-950 rounded-lg shadow-xl animate-in fade-in zoom-in duration-500">
          <Trophy className="w-3 h-3 fill-zinc-950" />
          <span className="font-heading font-black text-[9px] uppercase tracking-wider">QUALIFIÉ TOP 40</span>
        </div>
      )}

      {/* Live Badge */}
      {isLive && (
        <div className="absolute top-3 right-14 z-30 flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600/90 backdrop-blur-md text-white rounded-lg animate-pulse">
          <Radio className="w-3 h-3" />
          <span className="font-heading font-black text-[10px] uppercase tracking-wider">LIVE</span>
        </div>
      )}

      {/* Main Image/Video Container */}
      <div className="relative aspect-[3/4] bg-zinc-800 overflow-hidden">
        {selectedVideo === candidate.id && isPlaying ? (
          <div className="relative w-full h-full">
            <video
              src={candidate.video_url}
              autoPlay
              playsInline
              controls
              className="w-full h-full object-cover"
              onError={(e) => console.error('Video load error:', e)}
              onLoadStart={() => console.log('Video loading started:', candidate.video_url)}
              onEnded={handleVideoEnded}
            />
            {/* Close Button */}
            <button
              onClick={handleCloseVideo}
              className="absolute top-3 right-3 z-30 p-2 bg-zinc-950/80 backdrop-blur-md rounded-full border border-white/20 hover:bg-zinc-950 transition-all"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <>
            {candidate.cover_image_url ? (
              <Image
                src={candidate.cover_image_url}
                alt={candidate.stage_name}
                fill
                className="object-cover transition-all duration-500 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <span className="text-zinc-600 text-xs font-mono uppercase">No cover image</span>
              </div>
            )}

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent pointer-events-none" />

            {/* Views Badge - Above Bottom Actions Bar */}
            <div className="absolute bottom-14 right-4 z-40 flex items-center gap-1.5 px-2 py-1 bg-zinc-950/60 backdrop-blur-md rounded-lg border border-white/10">
              <Eye className="w-4 h-4 text-white" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-white">
                {viewsCount.toLocaleString()}
              </span>
            </div>

            {/* Vote Button - Top Right */}
            {currentRole !== 'Administrateur' && (
              <button
                onClick={handleVoteClick}
                disabled={!isVotingOpen}
                className={`absolute top-3 right-3 z-20 p-2.5 rounded-full backdrop-blur-md border ${
                  isVotingOpen
                    ? 'bg-zinc-950/60 border-white/20'
                    : 'bg-zinc-950/40 border-white/10 opacity-50 cursor-not-allowed'
                }`}
              >
                <Trophy className={`w-4 h-4 ${isVotingOpen ? 'text-white' : 'text-white/50'}`} />
              </button>
            )}

            {/* Play Button Overlay */}
            <button
              onClick={handlePlayClick}
              className="absolute inset-0 z-50 flex items-center justify-center cursor-pointer"
            >
              <Play className="w-8 h-8 text-white drop-shadow-lg transition-transform group-hover:scale-110" />
            </button>

            {/* Bottom Text Overlay */}
            <div className="absolute bottom-16 left-0 right-0 p-4 z-20">
              {/* Candidate Name */}
              <h4 className="font-heading font-bold text-sm sm:text-base uppercase tracking-tight text-white mb-1.5">
                {candidate.stage_name}
              </h4>

              {/* Metadata Line */}
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-white/70">
                <span>{candidate.discipline}</span>
                <span className="text-white/30">•</span>
                <span>{candidate.region}</span>
              </div>

              {/* Jury Score */}
              {juryScore !== undefined && juryScore > 0 && (
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-[#e5c47f] fill-[#e5c47f]/20" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#e5c47f]">
                      Note Jury : {juryScore.toFixed(1)}/20
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-30">
              {/* Vote Button - Left */}
              {currentRole !== 'Administrateur' && (
                <button
                  onClick={handleVoteClick}
                  disabled={!isVotingOpen}
                  className={`px-4 py-2 font-heading font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all ${
                    isVotingOpen
                      ? 'bg-[#e5c47f] text-zinc-950 hover:bg-white hover:text-zinc-950'
                      : 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  VOTER
                </button>
              )}

              {/* Type Badge - Right */}
              <div className="px-2 py-1 bg-white/10 backdrop-blur-md rounded-md border border-white/20">
                <span className="text-[9px] font-mono uppercase tracking-wider text-white/80">
                  {candidate.candidature_type === 'solo' ? 'Solo' : `Groupe (${candidate.member_count})`}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Admin Action Bar - Only for Admin Role */}
      {currentRole === 'Administrateur' && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-zinc-950/90 backdrop-blur-md border-t border-white/10 z-30">
          <div className="flex gap-2">
            <button className="flex-1 py-2 bg-emerald-600 text-white font-heading font-bold text-[9px] uppercase tracking-wider rounded-lg hover:bg-emerald-500 transition-colors">
              Approuver
            </button>
            <button className="flex-1 py-2 bg-rose-600 text-white font-heading font-bold text-[9px] uppercase tracking-wider rounded-lg hover:bg-rose-500 transition-colors">
              Refuser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
