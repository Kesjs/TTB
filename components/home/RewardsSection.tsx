'use client';

import { Award, Trophy, Crown, Check, Sparkles } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function RewardsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const rewards = [
    {
      rank: 1,
      title: 'Lauréat Majeur',
      amount: '1 000 000 FCFA',
      subtitle: 'La distinction suprême de l\'édition 2026',
      benefits: ['Contrat d\'enregistrement & production professionnel', 'Tournée nationale managée', 'Accompagnement structurel et juridique'],
      icon: Crown,
      featured: true,
    },
    {
      rank: 2,
      title: 'Finaliste National',
      amount: '500 000 FCFA',
      subtitle: 'La reconnaissance de l\'excellence',
      benefits: ['Diffusion et scènes sur les festivals majeurs', 'Bourses de formation artistique et technique'],
      icon: Trophy,
      featured: false,
    },
    {
      rank: 3,
      title: 'Demi-Finaliste',
      amount: '200 000 FCFA',
      subtitle: 'Le tremplin des talents émergents',
      benefits: ['Bourses de formation artistique avancée', 'Mentorat personnalisé par les membres du jury'],
      icon: Award,
      featured: false,
    },
  ];

  return (
    <section ref={ref} className="bg-white px-6 py-24 sm:py-32 border-b border-zinc-100 selection:bg-[#e5c47f] selection:text-black">
      <div className="max-w-7xl mx-auto">

        {/* En-tête de section minimaliste */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-20"
        >
          <span className="font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-[#e5c47f] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> Dotations de Prestige
          </span>
          <h2 className="font-heading text-3xl sm:text-5xl font-medium tracking-tight text-[#050505] mt-4 uppercase">
            La Consécration <br />
            <span className="font-bold">Méritée.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-4 max-w-lg font-body">
            L&apos;Édition 2026 récompense l&apos;excellence avec des dotations qui symbolisent l&apos;engagement institutionnel envers l&apos;émancipation artistique au Bénin.
          </p>
        </motion.div>

        {/* Grille des Prix avec traitement asymétrique */}
        <div className="grid grid-cols-1 md:flex md:gap-6 items-stretch">
          {rewards.map((reward, index) => {
            const IconComponent = reward.icon;

            return (
              <motion.div
                key={reward.rank}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: 0.2 + (index * 0.2) }}
                className={`rounded-sm transition-all duration-300 flex flex-col justify-between p-8 sm:p-10 ${
                  reward.featured
                    ? 'md:flex-[1.5] bg-[#050505] text-white border border-[#050505] shadow-[0_20px_50px_rgba(0,0,0,0.15)]'
                    : 'md:flex-1 bg-slate-50/50 border border-slate-100 hover:border-slate-200 text-[#050505]'
                }`}
              >
                <div>
                  {/* Badge de Rang & Icône */}
                  <div className="flex items-center justify-between border-b pb-6 mb-6 border-slate-100/10">
                    <span className={`font-mono text-xs uppercase tracking-widest ${reward.featured ? 'text-[#e5c47f]' : 'text-slate-400'}`}>
                      RANG 0{reward.rank}
                    </span>
                    <IconComponent className={`w-5 h-5 ${reward.featured ? 'text-[#e5c47f]' : 'text-[#050505]/40'}`} />
                  </div>

                  {/* Titre & Description */}
                  <div className="space-y-1 mb-8">
                    <h3 className="font-heading font-bold text-lg sm:text-xl uppercase tracking-tight">
                      {reward.title}
                    </h3>
                    <p className={`text-[11px] font-body ${reward.featured ? 'text-slate-400' : 'text-slate-500'}`}>
                      {reward.subtitle}
                    </p>
                  </div>

                  {/* Montant Financier */}
                  <div className="mb-8">
                    <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Dotation Globale</span>
                    <p className={`font-heading font-extrabold text-2xl sm:text-3xl tracking-tight ${reward.featured ? 'text-[#e5c47f]' : 'text-[#050505]'}`}>
                      {reward.amount}
                    </p>
                  </div>

                  {/* Liste des Avantages */}
                  <div className="space-y-4 pt-4 border-t border-dashed border-slate-100/10">
                    <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold">Avantages Inclus</span>
                    <ul className="space-y-3">
                      {reward.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3 text-xs font-body leading-relaxed">
                          <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${reward.featured ? 'text-[#e5c47f]' : 'text-emerald-600'}`} />
                          <span className={reward.featured ? 'text-slate-200' : 'text-slate-600'}>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bouton d'ancrage discret pour le 1er prix */}
                {reward.featured && (
                  <div className="mt-8 pt-6 border-t border-slate-100/10 text-center lg:text-left">
                    <span className="text-[9px] font-heading tracking-widest text-[#e5c47f] font-bold uppercase">
                      Objectif Ultime de la Compétition
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        
      </div>
    </section>
  );
}
