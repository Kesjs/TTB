'use client';

import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function EventDiscovery() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

  const pillars = [
    {
      id: 1,
      title: "L'Éloquence et le Rythme",
      signature: "TTB // VOIX & SCÈNE // EXPRESSION ORALE",
      image: "https://i.lepelerin.com/2000x1125/smart/2026/05/13/angelique-kidjo.jpg",
      disciplines: ["Musique", "Art_Oratoire", "Humour", "Digital"],
      description: "La parole comme instrument, le rythme comme souffle. Une scène où chaque mot résonne et chaque note porte l'émotion brute.",
      reverse: false,
    },
    {
      id: 2,
      title: "L'Énergie en Mouvement",
      signature: "TTB // CORPS & MOUVEMENT // DANSE & ACROBATIE",
      image: "https://lanation.bj/storage/assets/2025/01/S3OdJbPaDi7M4m02_54260935040_2abf318354_k.jpg.webp",
      disciplines: ["Danse Urbaine", "Traditions", "Acrobatie"],
      description: "Le corps comme canvas, le mouvement comme langage. Une fusion explosive entre tradition contemporaine et innovation chorégraphique.",
      reverse: true,
    },
    {
      id: 3,
      title: "La Matière et l'Illusion",
      signature: "TTB // VISION & ILLUSION // CRÉATION VISUELLE",
      image: "https://oukoikan.com/wp-content/uploads/2025/08/mois-de-la-mode.jpg",
      disciplines: ["Stylisme", "Haute Couture", "Magie"],
      description: "L'art de transformer la réalité, de sculpter l'invisible. Entre haute couture et illusionnisme, la créativité défie les limites du possible.",
      reverse: false,
    },
  ];

  return (
    <section ref={ref} className="bg-white px-4 sm:px-6 py-20 sm:py-32 relative overflow-hidden border-b border-zinc-100">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-zinc-100/50 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="mb-16 sm:mb-24 space-y-4 text-center"
        >
          <h2 className="font-title text-3xl sm:text-5xl tracking-tighter text-zinc-950 uppercase leading-none">
  L'Art sous <span className="font-light text-zinc-400 block lowercase italic font-serif pt-2">toutes ses formes</span>
</h2>

          <p className="font-sans text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-2xl mx-auto tracking-wide font-normal">
           Trois dimensions, une seule identité culturelle. Des profondeurs de nos rythmes sacrés jusqu'aux lignes de la haute couture contemporaine, découvrez les disciplines qui font vibrer le Bénin.
          </p>
        </motion.div>

        {/* Pillars Grid */}
        <div className="space-y-16 sm:space-y-24">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, delay: 0.2 + (index * 0.2) }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center ${
                pillar.reverse ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Text Content */}
              <div className={`space-y-6 ${pillar.reverse ? 'lg:order-2' : 'lg:order-1'}`}>
                {/* Title */}
                <h3 className="font-title text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-zinc-950 uppercase leading-tight relative inline-block">
                  {pillar.title}
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-[#e5c47f]"></span>
                </h3>
                
                {/* Description */}
                <p className="font-sans text-xs sm:text-sm text-zinc-600 leading-relaxed tracking-wide font-normal">
                  {pillar.description}
                </p>
                
                {/* Disciplines Tags */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {pillar.disciplines.map((discipline, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 text-[10px] sm:text-xs font-mono text-zinc-600 border border-zinc-200 rounded-md bg-zinc-50 select-none hover:border-zinc-300 hover:bg-zinc-100 transition-colors"
                    >
                      {discipline}
                    </span>
                  ))}
                </div>
              </div>

              {/* Image */}
              <div className={`relative overflow-hidden rounded-2xl sm:rounded-[1.5rem] aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] group ${pillar.reverse ? 'lg:order-1' : 'lg:order-2'}`}>
  <Image
    src={pillar.image}
    alt={pillar.title}
    fill
    sizes="(max-w-7xl) 33vw, 100vw"
    priority={true}
    style={{ objectFit: 'cover' }}
    className="w-full h-full grayscale-0 opacity-100 md:grayscale md:opacity-95 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
  />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
