'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

const steps = [
  // Modifie juste cette description dans ton tableau 'steps' :
{
  number: '01',
  title: 'Auditions Nationales',
  pool: 'La Grande Quête',
  description: 'Nous parcourons les 12 départements du pays pour dénicher les futurs talents. Les meilleurs profils sont sélectionnés pour rejoindre le Top 40 et entamer l\'aventure officielle.',
  reward: null,
},
  {
    number: '02',
    title: 'Quarts de Finale',
    pool: 'Le Top 40',
    description: 'La compétition devient publique. Les 40 candidats s\'affrontent devant le public. Le vote payant et l\'avis du jury éliminent 20 artistes pour ne garder que l\'élite montante.',
    reward: 'Certification officielle de l\'Édition 2026.',
  },
  {
    number: '03',
    title: 'Demi-Finales',
    pool: 'Le Top 20',
    description: 'Les compteurs sont remis à zéro. Sous la pression du vote public et de l\'expertise du jury, la sélection se resserre : seuls 8 artistes décrocheront leur ticket pour l\'ultime étape.',
    reward: 'Campagne de visibilité sur nos réseaux nationaux.',
  },
  {
    number: '04',
    title: 'Grande Finale',
    pool: 'Le Top 8',
    description: 'L\'apothéose. Les 8 grands finalistes s\'affrontent en direct devant la nation. Le vote du public déterminera le trio de tête qui se partagera les Dotations de Prestige, dont le titre d\'Icône 2026 pour le vainqueur.',
    reward: 'Grand Prix (1.000.000 FCFA) & Accompagnement pro d\'un an.',
  },
];

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section id="parcours-victoire" ref={ref} className="bg-zinc-50/50 px-4 sm:px-6 py-28 border-b border-zinc-100 overflow-hidden">
      <div className="max-w-5xl mx-auto">

        {/* EN-TÊTE ÉPURÉ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-16 space-y-4"
        >
          <h2 className="font-title text-3xl sm:text-5xl font-black tracking-tight text-zinc-950 uppercase leading-none">
            4 Phases. Une seule <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-950 to-zinc-400">Consécration.</span>
          </h2>
          <p className="font-sans text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-lg tracking-wide font-normal">
            Cliquez sur les étapes pour découvrir le mécanisme d&apos;élimination et les opportunités de chaque palier.
          </p>
        </motion.div>

        {/* NAVIGATION PAR NUMÉROS (TABS) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-between items-center border-b border-zinc-200 mb-12 relative"
        >
          {steps.map((step, idx) => (
            <motion.button
              key={step.number}
              onClick={() => setActiveTab(idx)}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.4, delay: 0.3 + (idx * 0.1) }}
              className={`relative pb-6 flex flex-col items-center group transition-all duration-300 ${
                activeTab === idx ? 'opacity-100' : 'opacity-40 hover:opacity-100'
              }`}
            >
              <span className={`font-mono text-sm md:text-xl font-bold transition-colors ${
                activeTab === idx ? 'text-[#e5c47f]' : 'text-zinc-400'
              }`}>
                {step.number}
              </span>

              {/* Indicateur de sélection (Ligne Or) */}
              {activeTab === idx && (
                <motion.div
                  layoutId="activeTabLine"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-[#e5c47f] z-10"
                />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* CONTENU DYNAMIQUE (ANIMÉ) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="min-h-[300px] grid grid-cols-1 md:grid-cols-12 gap-12 items-start"
        >

          {/* Bloc Titre et Pool (Gauche) */}
          <div className="md:col-span-4 space-y-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#e5c47f] font-bold">
              // PHASE ACTUELLE
            </span>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                <h3 className="font-title text-2xl md:text-4xl font-black text-zinc-950 uppercase leading-tight mb-4">
                  {steps[activeTab].title}
                </h3>
                <span className="inline-block px-3 py-1 bg-zinc-950 text-white font-mono text-[9px] uppercase tracking-widest rounded-sm">
                  {steps[activeTab].pool}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bloc Description et Gains (Droite) */}
          <div className="md:col-span-8 bg-white p-8 md:p-12 rounded-[1rem] border border-zinc-200/60 shadow-sm relative overflow-hidden">
             {/* Filigrane de numéro en fond */}
             <span className="absolute -bottom-10 -right-5 font-title text-[120px] font-black text-zinc-50 select-none">
              {steps[activeTab].number}
            </span>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 space-y-8"
              >
                <p className="font-sans text-sm md:text-base text-zinc-600 leading-relaxed max-w-xl">
                  {steps[activeTab].description}
                </p>

                {steps[activeTab].reward && (
                  <div className="pt-6 border-t border-zinc-100 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#e5c47f]/10 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-[#e5c47f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#e5c47f] font-bold block mb-1">
                        Dotation de franchissement
                      </span>
                      <p className="font-title text-sm md:text-md font-bold text-zinc-950">
                        {steps[activeTab].reward}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* PONDÉRATION (FOOTER) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-20 flex flex-col sm:flex-row items-center justify-between gap-8 py-8 border-t border-zinc-200"
        >
           <div className="flex items-center gap-12">
            <div className="text-center">
              <span className="block font-title font-black text-2xl text-zinc-950">50%</span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400">Vote Public</span>
            </div>
            <div className="h-8 w-[1px] bg-zinc-200" />
            <div className="text-center">
              <span className="block font-title font-black text-2xl text-zinc-950">50%</span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400">Expert Jury</span>
            </div>
          </div>
          <p className="font-sans text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] text-center sm:text-right max-w-xs leading-loose">
            Équité absolue. Chaque étape est soumise à une double validation pour garantir l&apos;excellence.
          </p>
        </motion.div>

      </div>
    </section>
  );
}