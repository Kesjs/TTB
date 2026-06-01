'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface CallForApplicationsProps {
  competitionStarted?: boolean;
}

export default function CallForApplications({ competitionStarted = false }: CallForApplicationsProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  // Liste épurée des disciplines
  const disciplines = [
    "Musique", 
    "Danse", 
    "Humour", 
    "Art_Oratoire", 
    "Digital", 
    "Cirque", 
    "Sport", 
    "Arts_Visuels"
  ];

  return (
    <div ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Unique bloc de fond noir structuré */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden bg-gradient-to-b from-zinc-950 to-[#090909] border border-zinc-900/60 rounded-[1.5rem] sm:rounded-[2rem] px-4 sm:px-16 py-10 sm:py-24 shadow-2xl text-center flex flex-col items-center"
      >

        {/* Lueur d'ambiance diffuse en arrière-plan */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-[#e5c47f]/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Incrustation d'un dégradé radial or subtil au sommet */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(229,196,127,0.06),transparent_45%)] pointer-events-none" />

        <div className="relative z-10 max-w-full sm:max-w-4xl space-y-5 sm:space-y-8 flex flex-col items-center w-full">

          {/* Titre Massif et Géométrique */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-title text-2xl sm:text-4xl lg:text-6xl font-black tracking-tight leading-[1.15] sm:leading-[1.1] text-white uppercase max-w-full sm:max-w-4xl px-2"
          >
            Le pays attend sa prochaine <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f3dfb6] to-[#e5c47f]">révélation</span>.
          </motion.h2>

          {/* Description Épurée */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="font-sans text-[11px] sm:text-xs lg:text-sm leading-relaxed sm:leading-7 text-zinc-400 max-w-full sm:max-w-xl font-normal tracking-wide px-4"
          >
            Si vous portez une expression artistique singulière, <strong className="text-zinc-200 font-semibold">Top Talent du Bénin</strong> vous ouvre une scène pensée exclusivement pour propulser votre potentiel.
          </motion.p>

          {/* Tags des Disciplines épurés */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-2 max-w-full sm:max-w-2xl px-2"
          >
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
              {disciplines.map((item, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4, delay: 0.5 + (idx * 0.05) }}
                  className="px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] lg:text-xs font-mono text-zinc-500 border border-zinc-900 rounded-md bg-zinc-950/40 select-none"
                >
                  {item}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Zone d'action : Bouton haut de gamme réactif et uniformisé */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="pt-4 flex justify-center items-center w-full px-4 sm:px-0"
          >
            <Link
              href={!competitionStarted ? "/candidature" : "/selections"}
              className="w-full sm:w-auto text-center px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-black font-heading font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] rounded-sm relative overflow-hidden group transition-all duration-300 hover:bg-[#e5c47f] hover:text-black active:scale-[0.98] shadow-lg hover:shadow-[#e5c47f]/10"
            >
              {/* Effet shimmer lumineux au survol */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

              <span className="relative z-10">
                {!competitionStarted ? "Déposer ma candidature" : "Accéder au Scrutin Live"}
              </span>
            </Link>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}