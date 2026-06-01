'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Flame, ArrowRight, Timer, Users, Award, Radio } from 'lucide-react';
import StatsCards from './StatsCards';

interface HeroSectionProps {
  currentPhase?: 'PRESELECTION' | 'VOTES_TOP_40' | 'SEMIFINAL' | 'FINAL' | 'ARCHIVED';
  isVotingOpen?: boolean;
  totalInscrits?: number;
}

export default function HeroSection({ currentPhase = 'PRESELECTION', isVotingOpen = false, totalInscrits: propTotalInscrits = 0 }: HeroSectionProps) {
  const isPreselectionOpen = currentPhase === 'PRESELECTION';
  const isFinal = currentPhase === 'FINAL';
  const isArchived = currentPhase === 'ARCHIVED';
  
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [totalInscrits, setTotalInscrits] = useState(propTotalInscrits);

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
      badgeText: "DEMI-FINALES",
      showInscriptionsCloses: true,
      title: <>LE <span className="text-[#e5c47f] font-black">TOP 20</span> EST LÀ. <br /> LA COURSE S'ACCÉLÈRE !</>,
      description: "Ils ne sont plus que 20 en demi-finale, mais seulement 8 iront en finale. Les compteurs sont ouverts, votez pour votre artiste préféré !",
      ctaText: "Voter pour le Top 20",
    },
    FINAL: {
      badgeClass: "text-red-700",
      badgeIcon: <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />,
      badgeText: "Grande Finale en Direct",
      showInscriptionsCloses: true,
      title: <>QUI SERA <span className="text-[#e5c47f] font-black">L'ICÔNE</span> ?</>,
      description: "L'ultime face-à-face ! Les 8 grands finalistes s'affrontent pour le titre national. Suivez les scores en direct et votez dès maintenant.",
      ctaText: "Voter pour l'Icône",
    },
    ARCHIVED: {
      badgeClass: "text-zinc-500",
      badgeIcon: <Award className="w-3.5 h-3.5 text-zinc-400" />,
      badgeText: "Clôturé",
      showInscriptionsCloses: false,
      title: <>CÉLÉBRONS NOS <span className="text-[#e5c47f] font-black">LAURÉATS</span></>,
      description: "L'Édition 2026 s'achève en beauté. Merci au Bénin d'avoir vibré au rythme de ses artistes et félicitations aux vainqueurs.",
      ctaText: "Découvrir le Podium",
    }
  };

  const currentContent = phaseContent[currentPhase];

  // Mettre à jour totalInscrits quand la prop change
  useEffect(() => {
    setTotalInscrits(propTotalInscrits);
  }, [propTotalInscrits]);

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
          <button
            onClick={handleMainCTA}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#050505] text-white font-heading font-bold text-[10px] uppercase tracking-widest rounded-none border border-transparent transition-all hover:ring-2 hover:ring-[#e5c47f] hover:ring-offset-4 active:scale-[0.98]"
          >
            <span>{currentContent.ctaText}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>


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

        {/* 6. CARTES DE STATISTIQUES */}
        {!isArchived && (
          <StatsCards 
            totalInscrits={totalInscrits}
            departements={12}
            disciplines="Toutes"
            edition="2026"
          />
        )}

      </div>
    </header>
  );
}