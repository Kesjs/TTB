'use client';

import { useRef, useState } from 'react';
import { Play, Star, Trophy, Radio, Eye, Info, Sparkles, X } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
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
  onViewIncrement,
}: CandidateCardProps) {
  const isLive = liveCandidateId === candidate.id;
  const viewsCount = candidate.views_count || 0;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // Parallax effect
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -20]);

  const handlePlayClick = () => {
    setIsPlaying(true);
    onViewIncrement?.(candidate.id);
    onSelectVideo?.(candidate.id);
  };

  const handleCloseVideo = () => {
    setIsPlaying(false);
    onSelectVideo?.(null);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    onSelectVideo?.(null);
  };

  const handleVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVote?.(candidate);
  };

  const handleFlip = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className={`group relative bg-white text-white rounded-xl overflow-hidden transition-all duration-300 border border-white/10 aspect-[3/4] ${
        isLive ? 'ring-2 ring-[#e5c47f]/50' : 'hover:shadow-2xl hover:shadow-zinc-900/20'
      }`}
      style={{ perspective: '1000px' }}
    >
      {/* Rank Badge */}
      {rank && (
        <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-950/60 backdrop-blur-md rounded-lg border border-white/10">
          <span className="font-heading font-black text-xs text-[#e5c47f]">#{rank}</span>
        </div>
      )}

      {/* Live Badge */}
      {isLive && (
        <div className="absolute top-3 right-14 z-30 flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600/90 backdrop-blur-md text-white rounded-lg animate-pulse">
          <Radio className="w-3 h-3" />
          <span className="font-heading font-black text-[10px] uppercase tracking-wider">LIVE</span>
        </div>
      )}

      {/* Jury Score Badge */}
      {juryScore !== undefined && juryScore > 0 && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-950/80 backdrop-blur-md text-[#e5c47f] rounded-lg border border-[#e5c47f]/30">
          <Star className="w-3 h-3 fill-[#e5c47f]" />
          <div className="flex flex-col leading-none">
            <span className="font-heading font-black text-[10px] tracking-tight">{juryScore.toFixed(1)}</span>
            <span className="text-[6px] uppercase font-bold text-zinc-500 tracking-tighter">Jury</span>
          </div>
        </div>
      )}

      {/* Card Flip Container */}
      <motion.div
        className="relative w-full aspect-[3/4]"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ==================== FRONT FACE ==================== */}
        <div
          ref={ref}
          className="absolute inset-0 overflow-hidden"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {selectedVideo === candidate.id && isPlaying ? (
            <div className="relative w-full h-full">
              <video
                src={candidate.video_url}
                autoPlay
                playsInline
                controls
                className="w-full h-full object-cover"
                onEnded={handleVideoEnded}
              />
              <button
                onClick={handleCloseVideo}
                className="absolute top-3 right-3 z-30 p-2 bg-zinc-950/80 backdrop-blur-md rounded-full border border-white/20 hover:bg-zinc-950 transition-all"
                aria-label="Fermer la vidéo"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <>
              {/* Cover Image */}
              {candidate.cover_image_url ? (
                <motion.div style={{ y }}>
                  <img
                    src={candidate.cover_image_url}
                    alt={candidate.stage_name}
                    className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                </motion.div>
              ) : (
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                  <span className="text-zinc-500 text-xs font-mono">Image non disponible</span>
                </div>
              )}

              {/* Views Counter */}
              <div className="absolute bottom-14 right-4 z-40 flex items-center gap-1.5 px-2 py-1 bg-zinc-950/60 backdrop-blur-md rounded-lg border border-white/10">
                <Eye className="w-4 h-4 text-white" />
                <span className="text-[10px] font-mono tracking-wider">
                  {viewsCount.toLocaleString()}
                </span>
              </div>

              {/* Top Right Actions */}
              {currentRole !== 'Administrateur' && (
                <div className="absolute top-3 right-3 z-30 flex flex-col gap-2">
                  <button
                    onClick={handleFlip}
                    className="p-2.5 rounded-full backdrop-blur-md border border-white/20 bg-zinc-950/60 hover:bg-zinc-950 transition-all"
                    aria-label="Voir la biographie"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Play Button */}
              <button
                onClick={handlePlayClick}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 transition-transform hover:scale-110 active:scale-95"
                aria-label={`Lire la vidéo de ${candidate.stage_name}`}
              >
                <Play className="w-14 h-14 text-white drop-shadow-2xl" />
              </button>

              {/* Bottom Info */}
              <div className="absolute bottom-16 left-0 right-0 p-4 z-20">
                <h4 className="font-heading font-bold text-sm sm:text-base uppercase tracking-tight mb-1">
                  {candidate.stage_name}
                </h4>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-white/70">
                  <span>{candidate.discipline}</span>
                  <span className="text-white/30">•</span>
                  <span>{candidate.region}</span>
                </div>

                {juryScore !== undefined && juryScore > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Star className="w-3.5 h-3.5 text-[#e5c47f] fill-current" />
                    <span className="text-[10px] font-bold text-[#e5c47f]">
                      Jury : {juryScore.toFixed(1)}/20
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Actions Bar */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-30">
                {currentRole !== 'Administrateur' && (
                  <button
                    onClick={handleVoteClick}
                    disabled={!isVotingOpen}
                    className={`px-5 py-2.5 font-heading font-bold text-xs uppercase tracking-widest rounded-lg transition-all ${
                      isVotingOpen
                        ? 'bg-[#e5c47f] text-zinc-950 hover:bg-white'
                        : 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    VOTER
                  </button>
                )}

                <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-md border border-white/20">
                  <span className="text-[9px] font-mono uppercase tracking-wider">
                    {candidate.candidature_type === 'solo' ? 'Solo' : `Groupe (${candidate.member_count})`}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ==================== BACK FACE - BIO ==================== */}
        <div
          className="absolute inset-0 bg-zinc-950 p-6 flex flex-col overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#e5c47f]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e5c47f]">
                PARCOURS & VISION
              </span>
            </div>
            <button
              onClick={handleFlip}
              className="p-2 bg-zinc-900/80 backdrop-blur-md rounded-full border border-white/20 hover:bg-zinc-800"
              aria-label="Fermer la biographie"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            <p className="text-sm text-zinc-200 leading-relaxed">
              {candidate.bio || "Ce talent n'a pas encore partagé son parcours, mais sa prestation parle pour lui !"}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-white/60">
              <span>{candidate.discipline}</span>
              <span className="text-white/20">•</span>
              <span>{candidate.region}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Admin Bar */}
      {currentRole === 'Administrateur' && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-zinc-950/90 backdrop-blur-md border-t border-white/10 z-30">
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs uppercase tracking-wider rounded-lg transition-colors">
              APPROUVER
            </button>
            <button className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-heading font-bold text-xs uppercase tracking-wider rounded-lg transition-colors">
              REFUSER
            </button>
          </div>
        </div>
      )}
    </div>
  );
}