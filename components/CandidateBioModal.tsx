'use client';

import React from 'react';
import { X, MapPin, Music, Calendar, Award } from 'lucide-react';
import type { Candidate } from '@/lib/supabase';

interface CandidateBioModalProps {
  candidate: Candidate;
  onClose: () => void;
}

export default function CandidateBioModal({ candidate, onClose }: CandidateBioModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0D111A] border border-white/10 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-[#0D111A] z-10">
          <div>
            <h3 className="font-title font-bold text-lg text-white">{candidate.stage_name}</h3>
            <p className="text-xs text-slate-400">Biographie du talent</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Image */}
          <div className="flex items-center gap-4">
            {candidate.cover_image_url && (
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#e5c47f] flex-shrink-0">
                <img src={candidate.cover_image_url} alt={candidate.stage_name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-heading font-black text-2xl text-white uppercase tracking-tight">{candidate.stage_name}</h4>
              <p className="text-sm text-[#e5c47f] font-medium">{candidate.discipline}</p>
              {candidate.region && (
                <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
                  <MapPin className="w-3 h-3" />
                  {candidate.region}
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {candidate.bio && (
            <div className="space-y-2">
              <h5 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <Music className="w-4 h-4" />
                Biographie
              </h5>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{candidate.bio}</p>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4">
            {candidate.discipline && (
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-1">
                  <Music className="w-3 h-3" />
                  Discipline
                </div>
                <p className="text-white font-semibold">{candidate.discipline}</p>
              </div>
            )}
            {candidate.region && (
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-1">
                  <MapPin className="w-3 h-3" />
                  Région
                </div>
                <p className="text-white font-semibold">{candidate.region}</p>
              </div>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            {candidate.is_finalist && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-[#e5c47f]/10 border border-[#e5c47f]/20 rounded-full text-[#e5c47f] text-xs font-bold uppercase">
                <Award className="w-3 h-3" />
                Finaliste
              </div>
            )}
            {candidate.is_top_40 && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white text-xs font-bold uppercase">
                <Calendar className="w-3 h-3" />
                Top 40
              </div>
            )}
            {candidate.is_semifinalist && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white text-xs font-bold uppercase">
                <Award className="w-3 h-3" />
                Demi-finaliste
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
