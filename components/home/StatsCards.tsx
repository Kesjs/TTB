'use client';

import React, { useState, useEffect } from 'react';
import { Users, MapPin, Music, Award } from 'lucide-react';

interface StatsCardsProps {
  totalInscrits: number;
  departements?: number;
  disciplines?: string;
  edition?: string;
}

export default function StatsCards({ totalInscrits, departements = 12, disciplines = "Toutes", edition = "2026" }: StatsCardsProps) {
  const [counts, setCounts] = useState({ inscrits: 0, departements: 0 });

  useEffect(() => {
    const duration = 2000;
    const steps = 80;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCounts({
        inscrits: Math.round(totalInscrits * easeOut),
        departements: Math.round(departements * easeOut)
      });
      if (step >= steps) {
        clearInterval(timer);
        setCounts({ inscrits: totalInscrits, departements: departements });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [totalInscrits, departements]);

  const cards = [
    {
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#e5c47f]" />,
      value: counts.inscrits,
      label: "Artistes inscrits",
    },
    {
      icon: <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#e5c47f]" />,
      value: counts.departements,
      label: "Départements",
    },
    {
      icon: <Music className="w-4 h-4 sm:w-5 sm:h-5 text-[#e5c47f]" />,
      value: disciplines,
      label: "Disciplines",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto pt-8">

      {/* Badge Édition */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#e5c47f]/20 to-[#d4a84b]/20 border border-[#e5c47f]/30 rounded-full">
          <Award className="w-3.5 h-3.5 text-[#e5c47f]" />
          <span className="font-mono text-[10px] font-bold text-[#e5c47f] uppercase tracking-wider">
            Édition {edition}
          </span>
        </div>
      </div>

      {/* 
        CHANGEMENT CLÉ :
        - Mobile  : flex-row  → 3 cartes côte à côte horizontalement
        - Desktop : grid 3 cols → comportement identique à avant
        - min-w-0 sur chaque carte pour éviter le débordement
      */}
      <div className="flex flex-row gap-3 sm:grid sm:grid-cols-3 sm:gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className="group relative flex-1 min-w-0 bg-white/80 backdrop-blur-sm border border-zinc-200/80 rounded-xl p-3 sm:p-6
                       shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]
                       transition-all duration-500 ease-out hover:border-[#e5c47f]/40 hover:-translate-y-1"
          >
            <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-zinc-50 to-zinc-100/50 rounded-xl group-hover:from-[#e5c47f]/10 group-hover:to-[#d4a84b]/10 transition-all duration-500">
                {card.icon}
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <p className="font-heading font-black text-xl sm:text-3xl text-[#050505] tabular-nums tracking-tight">
                  {card.value}
                </p>
                <p className="font-mono text-[9px] sm:text-[11px] text-zinc-500 uppercase tracking-widest font-medium leading-tight">
                  {card.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}