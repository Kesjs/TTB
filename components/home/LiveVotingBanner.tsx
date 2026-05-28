'use client';

import { Flame } from 'lucide-react';
import type { Candidate } from '@/lib/supabase';

interface LiveVotingBannerProps {
  candidate: Candidate;
  onVote: (candidate: Candidate) => void;
}

export default function LiveVotingBanner({ candidate, onVote }: LiveVotingBannerProps) {
  return (
    <div className="bg-red-50 border-b border-red-100 py-6 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white font-title font-black text-xs uppercase rounded-full animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-white" />
            Vote En Direct
          </span>
          <div>
            <h2 className="font-title font-extrabold text-xl md:text-2xl text-slate-950 tracking-tight">
              {candidate.stage_name} est sur scène !
            </h2>
            <p className="text-sm text-red-700 font-medium">
              Phase de performance : {candidate.discipline} ({candidate.region})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-700 hidden lg:block">
            Soutenez en direct et doublez l&apos;impact !
          </span>
          <button
            onClick={() => onVote(candidate)}
            className="px-6 py-3 bg-slate-950 text-white font-title font-bold text-sm rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all"
          >
            Voter en direct (500 FCFA)
          </button>
        </div>
      </div>
    </div>
  );
}
