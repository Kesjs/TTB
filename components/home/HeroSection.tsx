'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Flame, ArrowRight, Timer, Users, Award, Radio } from 'lucide-react';

interface HeroSectionProps {
  currentPhase?: 'PRESELECTION' | 'VOTES_TOP_40' | 'SEMIFINAL' | 'FINAL' | 'ARCHIVED';
  isVotingOpen?: boolean;
}

export default function HeroSection({ currentPhase = 'PRESELECTION', isVotingOpen = false }: HeroSectionProps) {
  const isPreselectionOpen = currentPhase === 'PRESELECTION';
  const isFinal = currentPhase === 'FINAL';
  const isArchived = currentPhase === 'ARCHIVED';
  
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [totalInscrits, setTotalInscrits] = useState(0);

  // Configuration centralisée du contenu par Phase
  const phaseContent = {
    PRESELECTION: {
      badgeClass: "text-emerald-700",
      badgeIcon: <Flame className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />,
      badgeText: "Candidatures Ouvertes",
      showInscriptionsCloses: false,
      title: (
        <>
          LE <span className="text-[#e5c47f] font-black">PROCHAIN TALENT</span>, <br />
          C'EST VOUS
        </>
      ),
      description: "Ouverture officielle de la session de recrutement 2026 pour les 12 départements. Déposez vos dossiers artistiques en quelques minutes.",
      ctaText: "Postuler",
    },
    VOTES_TOP_40: {
      badgeClass: "text-amber-700",
      badgeIcon: <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse" />,
      badgeText: "Votes en Direct",
      showInscriptionsCloses: true,
      title: (
        <>
          LE <span className="text-[#e5c47f] font-black drop-shadow-[0_2px_10px_rgba(229,196,127,0.2)]">TOP 40</span> EST ENTRE VOS MAINS
        </>
      ),
      description: "Le jury a fait son choix. Les 40 meilleurs talents du Bénin sont désormais en compétition. Regardez leurs vidéos, consultez les notes des juges et votez pour qualifier vos préférés !",
      ctaText: "Voter",
    },
    SEMIFINAL: {
      badgeClass: "text-[#e5c47f]",
      badgeIcon: <Flame className="w-3.5 h-3.5 text-[#e5c47f] animate-pulse" />,
      badgeText: " DEMI-FINALES",
      showInscriptionsCloses: true,
      title: "EN ROUTE POUR LA FINALE.",
      description: "20 demi-finalistes sur la ligne de départ. Seulement 8 places pour l'ultime étape. Ne laissez pas votre favori se faire éliminer, votez !",
      ctaText: "Voter",
    },
    FINAL: {
      badgeClass: "text-red-700",
      badgeIcon: <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />,
      badgeText: "Grande Finale en Direct",
      showInscriptionsCloses: true,
      title: (
        <span className="block relative">
          <span className="block text-[0.4em] font-mono tracking-[0.3em] text-zinc-400 mb-2">L'ultime face-à-face</span>
          QUI SERA <br/>
          <span className="bg-gradient-to-r from-red-600 via-[#e5c47f] to-red-600 bg-clip-text text-transparent drop-shadow-[0_10px_20px_rgba(220,38,38,0.2)] font-black">
            L'ICÔNE ?
          </span>
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></span>
        </span>
      ),
      description: "L'ultime face-à-face ! Les 8 grands finalistes s'affrontent pour le titre national. Suivez les scores en direct et votez dès maintenant pour élire l'Icône 2026.",
      ctaText: "Voter",
    },
    ARCHIVED: {
      badgeClass: "text-zinc-500",
      badgeIcon: <Award className="w-3.5 h-3.5 text-zinc-400" />,
      badgeText: "ÉDITION 2026 TERMINÉE",
      showInscriptionsCloses: false,
      title: (
        <span className="block">
          <span className="bg-gradient-to-b from-[#e5c47f] via-[#b08a3c] to-[#e5c47f] bg-clip-text text-transparent font-black drop-shadow-md">
            PALMARÈS OFFICIEL <br/> 
            <span className="text-[0.6em] tracking-[0.2em]">ÉDITION 2026</span>
          </span>
        </span>
      ),
      description: "Félicitations aux 3 grands lauréats qui ont marqué cette édition par leur talent exceptionnel. Découvrez le podium final.",
      ctaText: "Voir les résultats",
    }
  };

  const currentContent = phaseContent[currentPhase];

  // Simulation inscriptions (Phase Preselection)
  useEffect(() => {
    if (isPreselectionOpen) {
      setTotalInscrits(142); 
    }
  }, [isPreselectionOpen]);

  // Logique du Compte à rebours
  useEffect(() => {
    if (isPreselectionOpen || isArchived) return;

    const targetDate = new Date('2026-06-15T23:59:59');

    const timer = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPreselectionOpen, isArchived]);

  const handleMainCTA = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPreselectionOpen) {
      window.location.href = '/candidature';
    } else {
      document.getElementById('talents-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="relative flex items-center px-4 sm:px-6 lg:px-12 overflow-hidden bg-white min-h-[calc(100vh-120px)] border-b border-zinc-100 pt-8 sm:pt-16 lg:pt-20">

      {/* Conteneur Central */}
      <div className="max-w-3xl mx-auto text-center space-y-6 relative z-20 flex flex-col items-center py-2 sm:py-6 w-full">

        {/* 1. GLASSMORPHIC STATUS BAR */}
        <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/40 backdrop-blur-md border border-zinc-200/50 rounded-none">
          {currentContent.showInscriptionsCloses && (
            <>
              <div className="flex items-center gap-2 text-zinc-900">
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
                <span className="font-mono text-[10px] font-medium uppercase tracking-wider">Inscriptions Closes</span>
              </div>
              <span className="w-px h-3 bg-zinc-300" />
            </>
          )}
          <div className={`flex items-center gap-2 ${currentContent.badgeClass}`}>
            {currentContent.badgeIcon}
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
              {currentContent.badgeText}
            </span>
          </div>
        </div>

        {/* 2. TYPOGRAPHIE ACADÉMIQUE */}
        <h1 className="font-heading font-black text-2xl sm:text-5xl lg:text-6xl tracking-tight leading-none text-[#050505] uppercase">
          {currentContent.title}
        </h1>

        {/* 3. PARAGRAPHE DESCRIPTIF */}
        <p className="max-w-xl mx-auto text-xs sm:text-sm leading-relaxed text-zinc-500 font-body px-2">
          {currentContent.description}
        </p>

        {/* 4. MAIN CTA BUTTON */}
        <div className="pt-2 flex justify-center w-full sm:w-auto px-4 sm:px-0">
          {isArchived ? (
            <div className="px-8 py-4 bg-zinc-100 text-zinc-400 font-heading font-bold text-[10px] uppercase tracking-widest border border-zinc-200 cursor-default">
              {currentContent.ctaText}
            </div>
          ) : (
            <button
              onClick={handleMainCTA}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#050505] text-white font-heading font-bold text-[10px] uppercase tracking-widest rounded-none border border-transparent transition-all hover:ring-2 hover:ring-[#e5c47f] hover:ring-offset-4 active:scale-[0.98]"
            >
              <span>{currentContent.ctaText}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* 4.5 LIVE STATISTICS PANEL (Uniquement en phase PRESELECTION) */}
        {isPreselectionOpen && (
          <div className="w-full max-w-xl mt-6 animate-fadeIn px-2">
            <div className="grid grid-cols-3 border border-zinc-200/60 bg-transparent divide-x divide-zinc-200/60 rounded-none">
              <div className="p-3 text-center flex flex-col items-center justify-center">
                <Users className="w-3.5 h-3.5 text-zinc-400 mb-1" />
                <span className="font-heading font-black text-sm sm:text-base text-zinc-900 tabular-nums uppercase">
                  {totalInscrits}
                </span>
                <span className="font-mono text-[8px] text-zinc-400 tracking-widest uppercase mt-1">
                  Artistes Inscrits
                </span>
              </div>

              <div className="p-3 text-center flex flex-col items-center justify-center">
                <Award className="w-3.5 h-3.5 text-zinc-400 mb-1" />
                <span className="font-heading font-black text-sm sm:text-base text-zinc-900 uppercase">
                  Toutes
                </span>
                <span className="font-mono text-[8px] text-zinc-400 tracking-widest uppercase mt-1">
                  Disciplines
                </span>
              </div>

              <div className="p-3 text-center flex flex-col items-center justify-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Radio className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <span className="font-heading font-black text-[10px] text-emerald-600 tracking-wider uppercase">
                  LIVE SYNC
                </span>
                <span className="font-mono text-[8px] text-zinc-400 tracking-widest uppercase mt-0.5">
                  12 Départements
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 5. COUNTDOWN TIMER */}
        {!isPreselectionOpen && !isArchived && (
          <div className="pt-4 flex items-center justify-center gap-4 font-mono text-[10px] text-zinc-400 tracking-wider uppercase w-full">
            <Timer className="w-3 h-3 text-zinc-400" />
            <div className="flex items-center gap-2 tabular-nums">
              <span className="text-zinc-900 font-bold">{String(timeLeft.days).padStart(2, '0')}</span>
              <span>j</span>
              <span className="text-zinc-900 font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span>h</span>
              <span className="text-zinc-900 font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span>m</span>
              <span className="text-zinc-900 font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span>s</span>
            </div>
          </div>
        )}

        {/* 6. LIENS TECHNIQUES SANS CHICHI */}
        <div className="pt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-[9px] text-zinc-400 tracking-widest uppercase border-t border-zinc-100 w-full max-w-xs justify-center">
          <span>12 Départements</span>
          <span>•</span>
          <span>Toutes Disciplines</span>
          <span>•</span>
          <span>Édition 2026</span>
        </div>

      </div>
    </header>
  );
}