'use client';

import Link from 'next/link';
import { motion } from 'framer-motion'; // Assure-toi d'avoir installé framer-motion

export default function SiteFooter() {
  return (
    <footer className="bg-white px-6 sm:px-12 py-24 pt-1 border-t border-zinc-100 relative overflow-hidden">
      {/* Liseré supérieur pour marquer la fin de page */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#e5c47f]/70 to-transparent" />
      
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16 md:gap-24">
        
        {/* BLOC BRANDING & MANIFESTE */}
        <div className="space-y-8 max-w-sm shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="h-12 w-12 rounded-sm overflow-hidden bg-white border border-zinc-200 p-1.5 flex items-center justify-center shadow-sm"
            >
              <img
                src="/logo_ttb.jfif"
                alt="Top Talent du Bénin"
                className="h-full w-auto object-contain grayscale hover:grayscale-0 transition-all duration-500"
              />
            </motion.div>
            <div className="space-y-1">
              <span className="font-mono text-xs font-black uppercase tracking-[0.25em] text-zinc-950 block">
                TOP <span className="text-[#e5c47f]">TALENT</span>
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-400 block">
                ÉDITION 2026
              </span>
            </div>
          </div>
          
          <p className="font-sans text-xs text-zinc-500 leading-relaxed tracking-wide">
            Plateforme de pilotage digitale. Nous orchestrons la mise en lumière des talents béninois à travers une infrastructure de données sécurisée et transparente.
          </p>
        </div>

        {/* LIENS ET INFORMATIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-16 w-full md:max-w-xl">
          
          {/* COLONNE NAVIGATION */}
          <div className="space-y-4">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-400 block">
              — RÈGLEMENTATION
            </span>
            <ul className="flex flex-col gap-3 font-sans text-xs">
              <li><Link href="/mentions-legales" className="text-zinc-600 hover:text-[#e5c47f] transition-all tracking-wide block py-0.5">Mentions légales</Link></li>
              <li><Link href="/politique-fedapay" className="text-zinc-600 hover:text-[#e5c47f] transition-all tracking-wide block py-0.5">Politique FedaPay</Link></li>
              <li><Link href="/reglement" className="text-zinc-600 hover:text-[#e5c47f] transition-all tracking-wide block py-0.5">Règlement du concours</Link></li>
            </ul>
          </div>

          {/* COLONNE INSTITUTIONNELLE */}
          <div className="space-y-4">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-400 block">
              — INSTITUTION
            </span>
            <div className="font-mono text-[10px] uppercase text-zinc-500 tracking-widest leading-loose">
              Ministère du Tourisme, <br />
              de la Culture et des Arts <br />
              <span className="text-[#e5c47f] font-bold">RÉPUBLIQUE DU BÉNIN</span>
            </div>
          </div>
        </div>
      </div>

      {/* ZONE DE COPYRIGHT */}
      <div className="max-w-6xl mx-auto mt-24 pt-8 border-t border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-[0.25em]">
          TTB © 2026 // SYSTEM ARCHITECTURE BY KESJS
        </span>
        
        <Link
          href="/login"
          className="group relative font-mono text-[10px] text-zinc-900 uppercase tracking-[0.2em] px-4 py-2 border border-zinc-300 hover:border-[#e5c47f] transition-all rounded-sm bg-white hover:bg-[#e5c47f]/5 font-bold"
        >
          Espace Académique & Staff
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e5c47f] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e5c47f]"></span>
          </span>
        </Link>
      </div>
    </footer>
  );
}