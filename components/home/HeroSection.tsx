'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Flame, ArrowRight, Timer, Users, Award, Radio, Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
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

      {/* Animated Gradient Background */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(229, 196, 127, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, rgba(229, 196, 127, 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 40% 80%, rgba(229, 196, 127, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(229, 196, 127, 0.1) 0%, transparent 50%)",
          ]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Floating Decorative Elements */}
      <motion.div
        className="absolute top-20 left-10 w-2 h-2 bg-[#e5c47f] rounded-full opacity-40"
        animate={{
          y: [0, -20, 0],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-40 right-20 w-3 h-3 bg-[#e5c47f] rounded-full opacity-30"
        animate={{
          y: [0, 30, 0],
          x: [0, -10, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      <motion.div
        className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-[#e5c47f] rounded-full opacity-50"
        animate={{
          y: [0, -15, 0],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 w-2 h-2 bg-zinc-300 rounded-full opacity-30"
        animate={{
          y: [0, 25, 0],
          x: [0, 15, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      {/* Conteneur Central */}
      <motion.div
        className="max-w-3xl mx-auto text-center space-y-6 relative z-20 flex flex-col items-center py-2 sm:py-6 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >

        {/* 1. GLASSMORPHIC STATUS BAR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/40 backdrop-blur-md border border-zinc-200/50 rounded-none"
        >
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
        </motion.div>

        {/* 2. TYPOGRAPHIE ACADÉMIQUE avec Text Reveal et Shimmer */}
        <motion.h1
          className="font-heading font-black text-2xl sm:text-5xl lg:text-6xl tracking-tight leading-none text-[#050505] uppercase relative inline-block"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.span
            className="relative"
            animate={{
              backgroundPosition: ["0%", "200%"]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              background: "linear-gradient(90deg, #050505 0%, #050505 50%, #e5c47f 100%, #050505 50%, #050505 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            {currentContent.title}
          </motion.span>
        </motion.h1>

        {/* 3. PARAGRAPHE DESCRIPTIF */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-xl mx-auto text-xs sm:text-sm leading-relaxed text-zinc-500 font-body px-2"
        >
          {currentContent.description}
        </motion.p>

        {/* 4. MAIN CTA BUTTON */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="pt-2 flex justify-center w-full sm:w-auto px-4 sm:px-0"
        >
          <motion.button
            onClick={handleMainCTA}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#050505] text-white font-heading font-bold text-[10px] uppercase tracking-widest rounded-none border border-transparent relative overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-[#e5c47f] to-[#e5c47f] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={{ x: "-100%" }}
              whileHover={{ x: "0%" }}
              transition={{ duration: 0.3 }}
            />
            <span className="relative z-10">{currentContent.ctaText}</span>
            <motion.span
              className="relative z-10"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowRight className="w-3 h-3" />
            </motion.span>
          </motion.button>
        </motion.div>


        {/* 5. COUNTDOWN TIMER */}
        {!isPreselectionOpen && !isArchived && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="pt-4 flex items-center justify-center gap-4 font-mono text-[10px] text-zinc-400 tracking-wider uppercase w-full"
          >
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
          </motion.div>
        )}

        {/* 6. CARTES DE STATISTIQUES */}
        {!isArchived && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <StatsCards
              totalInscrits={totalInscrits}
              departements={12}
              disciplines="Toutes"
              edition="2026"
            />
          </motion.div>
        )}

      </motion.div>
    </header>
  );
}