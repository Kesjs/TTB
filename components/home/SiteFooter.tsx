'use client';

import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="bg-white px-6 sm:px-12 py-24 border-t border-zinc-100 relative overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16 md:gap-24">
        
        {/* BLOC BRANDING & MANIFESTE */}
        <div className="space-y-8 max-w-sm shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-none overflow-hidden bg-zinc-50 border border-zinc-200 p-1.5 flex items-center justify-center select-none">
              <img
                src="/logo_ttb.jfif"
                alt="Top Talent du Bénin"
                className="h-full w-auto object-contain grayscale blend-multiply"
              />
            </div>
            <div className="space-y-1">
              <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-zinc-950 block leading-none">
                TOP <span className="text-[#e5c47f]">TALENT</span> DU BÉNIN
              </span>
              <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-zinc-400 block">
                2026
              </span>
            </div>
          </div>
          
          <p className="font-sans text-xs text-zinc-400 leading-relaxed tracking-wide font-normal">
            Plateforme institutionnelle de vote sécurisée. Chaque engagement contribue directement à la valorisation, au déploiement et à la consécration du patrimoine culturel béninois.
          </p>
        </div>

        {/* LIENS ET INFORMATIONS DE DROITE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-16 w-full md:max-w-xl">
          
          {/* COLONNE NAVIGATION / JURIDIQUE */}
          <div className="space-y-4">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-300 block select-none">
              — RÈGLEMENTATION
            </span>
            <ul className="flex flex-col gap-3 font-sans text-xs">
              <li>
                <Link href="/mentions-legales" className="text-zinc-500 hover:text-zinc-950 transition-colors tracking-wide block py-0.5">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/politique-fedapay" className="text-zinc-500 hover:text-zinc-950 transition-colors tracking-wide block py-0.5">
                  Politique FedaPay
                </Link>
              </li>
              <li>
                <Link href="/reglement" className="text-zinc-500 hover:text-zinc-950 transition-colors tracking-wide block py-0.5">
                  Règlement du concours
                </Link>
              </li>
            </ul>
          </div>

          {/* COLONNE INSTITUTIONNELLE */}
          <div className="space-y-4">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-300 block select-none">
              — INSTITUTION
            </span>
            <p className="font-mono text-[10px] uppercase text-zinc-400 tracking-widest leading-loose font-normal">
              Ministère du Tourisme, de la Culture et des Arts <br />
              <span className="text-zinc-300">— République du Bénin</span>
            </p>
          </div>

        </div>

      </div>

      {/* ZONE DE COPYRIGHT ULTRA-BASSE */}
      <div className="max-w-6xl mx-auto mt-24 pt-8 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-[0.25em] select-none">
          TTB © 2026 // TOUS DROITS RÉSERVÉS
        </span>
        <div className="flex items-center gap-6">
          <span className="font-mono text-[9px] text-zinc-300 uppercase tracking-[0.3em] select-none hidden sm:block">
            DESIGNED FOR EXCELLENCE
          </span>
          <Link
            href="/login"
            className="font-mono text-[10px] text-zinc-900 uppercase tracking-[0.2em] hover:text-[#e5c47f] transition-colors select-none font-bold px-3 py-1.5 bg-zinc-100 hover:bg-[#e5c47f]/10 border border-zinc-200 hover:border-[#e5c47f]/30 rounded-sm"
          >
            Espace Académique & Staff
          </Link>
        </div>
      </div>
    </footer>
  );
}