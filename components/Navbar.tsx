'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { auth } from '@/lib/supabase/auth';

interface NavbarProps {
  currentPhase?: string;
}

export default function Navbar({ currentPhase = 'PRESELECTION' }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDashboard = pathname?.startsWith('/dashboard');
  const isPreselectionOpen = currentPhase === 'PRESELECTION';
  const isArchived = currentPhase === 'ARCHIVED';

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      window.location.href = '/'; // Hard redirect to clear any residual state
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      // Fallback redirect
      window.location.href = '/';
    }
  };

  const navItems = [
    { name: 'ÉDITION 2026', href: '/' },
    { name: 'SÉLECTIONS', href: '/selections' },
    { name: 'ALLIANCES', href: '/alliances' },
  ];

  return (
    /* La navbar prend maintenant toute la largeur et se colle au top-0 sans marges externes pour être hermétique au scroll */
    <nav className="fixed top-0 left-0 right-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 transition-all duration-300 shadow-sm">
      {/* Conteneur interne max-w-7xl pour centrer le contenu comme avant */}
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

        {/* ZONE LOGO + TEXTE SUR UNE SEULE LIGNE (OPTIMISÉE MOBILE) */}
        <div className="flex items-center gap-2 sm:gap-3 select-none cursor-default">
          <img 
            src="/logo_ttb.jfif" 
            alt="Top Talent du Bénin" 
            className="h-8 sm:h-10 lg:h-12 w-auto object-contain" 
          />
          
          {/* Titre aligné sur une ligne avec gestion de taille responsive pour éviter les collisions avec le burger */}
          <div className="font-mono text-[10px] xs:text-xs sm:text-sm font-bold tracking-wider text-[#050509] uppercase whitespace-nowrap">
            <span>TOP </span>
            <span className="text-[#e5c47f] font-normal">TALENT</span>
            <span> DU BÉNIN</span>
          </div>
        </div>

        {/* MENUS DESKTOP */}
        <div className="hidden lg:flex items-center gap-4 sm:gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`font-mono text-xs uppercase tracking-[0.15em] transition-all duration-200 relative px-2 sm:px-3 py-1 ${
                  isActive
                    ? 'text-[#e5c47f] font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#e5c47f]'
                    : 'text-[#050509]/80 hover:text-[#e5c47f]'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* BOUTONS D'ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isDashboard ? (
            <button
              onClick={handleSignOut}
              className="hidden lg:flex items-center gap-2 px-4 sm:px-5 py-2 bg-red-600 text-white font-mono font-bold text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-red-500 transition-all duration-300 transform active:scale-95"
            >
              <LogOut className="w-4 h-4" /> Déconnexion
            </button>
          ) : isPreselectionOpen ? (
            <Link
              href="/candidature"
              className="hidden lg:block px-4 sm:px-5 py-2 bg-[#050509] text-white font-mono font-bold text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-[#e5c47f] transition-all duration-300 transform active:scale-95"
            >
              Postuler
            </Link>
          ) : isArchived ? (
            <span className="hidden lg:block px-4 sm:px-5 py-2 bg-zinc-100 text-zinc-400 border border-zinc-200 font-mono font-bold text-[10px] uppercase tracking-[0.2em] rounded-none cursor-default">
              Édition Clôturée
            </span>
          ) : (
            <a
              href="#talents-section"
              className="hidden lg:block px-4 sm:px-5 py-2 bg-white border-2 border-[#050509] text-[#050509] font-mono font-bold text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-[#050509] hover:text-white transition-all duration-300 transform active:scale-95"
            >
              Voter
            </a>
          )}
          
          {/* Bouton Burger Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#050509] hover:text-[#e5c47f] transition-colors flex-shrink-0"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* MENU DÉROULANT SUR MOBILE */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-4 pt-4 border-t border-slate-200 bg-white">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-mono text-sm uppercase tracking-[0.1em] transition-all duration-200 relative px-3 py-2 ${
                    isActive
                      ? 'text-[#e5c47f] font-bold bg-slate-50 border-l-2 border-[#e5c47f]'
                      : 'text-[#050509]/80 hover:text-[#e5c47f]'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
            
            <div className="pt-2 mt-2 border-t border-slate-200">
              {isDashboard ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2 bg-red-600 text-white font-mono font-bold text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-red-500 transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              ) : isPreselectionOpen ? (
                <Link
                  href="/candidature"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full px-5 py-2 bg-[#050509] text-white font-mono font-bold text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-[#e5c47f] transition-all duration-300 text-center"
                >
                  Postuler
                </Link>
              ) : isArchived ? (
                <span className="block w-full px-5 py-2 bg-zinc-100 text-zinc-400 border border-zinc-200 font-mono font-bold text-[10px] uppercase tracking-[0.2em] rounded-none text-center">
                  Édition Clôturée
                </span>
              ) : (
                <a
                  href="#talents-section"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full px-5 py-2 bg-white border-2 border-[#050509] text-[#050509] font-mono font-bold text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-[#050509] hover:text-white transition-all duration-300 text-center"
                >
                  Voter
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}