'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth } from '@/lib/supabase/auth';
import { db } from '@/lib/supabase';

interface NavbarProps {
  currentPhase?: string;
  isLoading?: boolean;
}

export default function Navbar({ currentPhase: propPhase, isLoading: propLoading = false }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemPhase, setSystemPhase] = useState<string>(propPhase || 'PRESELECTION');
  const [loading, setLoading] = useState<boolean>(!propPhase || propLoading);
  const [showCta, setShowCta] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 400) {
        setShowCta(true);
      } else {
        setShowCta(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Si la phase est déjà fournie via les props (ex: sur la home), on l'utilise
    if (propPhase) {
      setSystemPhase(propPhase);
      setLoading(propLoading);
      return;
    }

    // Sinon, on la récupère nous-mêmes (ex: sur les pages Alliances, Sélections...)
    const fetchPhase = async () => {
      try {
        const sc = await db.getSystemControl();
        if (sc) setSystemPhase(sc.current_phase);
      } catch (err) {
        console.error('Navbar: Error fetching phase:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPhase();
  }, [propPhase, propLoading]);

  const isDashboard = pathname?.startsWith('/dashboard');
  const isPreselectionOpen = systemPhase === 'PRESELECTION';
  const isArchived = systemPhase === 'ARCHIVED';

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

        {/* ZONE LOGO (CLIQUABLE) + TEXTE (STATIQUE) */}
        <div className="flex items-center gap-2 sm:gap-3 select-none">
          <Link 
            href="/" 
            className="transition-opacity hover:opacity-80 active:scale-95 flex-shrink-0"
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <img 
              src="/logo_ttb.jfif" 
              alt="Top Talent du Bénin" 
              className="h-8 sm:h-10 lg:h-12 w-auto object-contain" 
            />
          </Link>
          
          {/* Titre aligné sur une ligne avec gestion de taille responsive pour éviter les collisions avec le burger */}
          <div className="font-sans text-[10px] xs:text-xs sm:text-sm font-bold tracking-wider text-[#050509] uppercase whitespace-nowrap cursor-default">
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
              <motion.div
                key={item.href}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href={item.href}
                  className={`font-sans text-xs uppercase tracking-[0.15em] transition-all duration-200 relative px-2 sm:px-3 py-1 ${
                    isActive
                      ? 'text-[#e5c47f] font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#e5c47f]'
                      : 'text-[#050509]/80 hover:text-[#e5c47f]'
                  }`}
                >
                  {item.name}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* BOUTONS D'ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-4">
          {loading ? (
            <div className="animate-pulse bg-zinc-100 border border-zinc-200 w-24 sm:w-32 h-9 rounded-none" />
          ) : isDashboard ? (
            <motion.button
              onClick={handleSignOut}
              className="hidden lg:flex items-center gap-2 px-4 sm:px-5 py-2 bg-red-600 text-white font-sans font-bold text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-red-500 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-4 h-4" /> Déconnexion
            </motion.button>
          ) : isPreselectionOpen ? (
            <motion.div
              className={`hidden lg:block px-4 sm:px-5 py-2 bg-[#050509] text-white font-sans font-bold text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-[#e5c47f] transition-all duration-300 ${
                showCta
                  ? 'opacity-100 translate-y-0 pointer-events-auto duration-300 ease-out transition-all'
                  : 'opacity-0 translate-y-[-10px] pointer-events-none'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/candidature">Postuler</Link>
            </motion.div>
          ) : isArchived ? (
            <motion.button
              onClick={() => {
                if (pathname === '/') {
                  document.getElementById('talents-section')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  router.push('/?scroll=talents');
                }
              }}
              className="hidden lg:block px-4 sm:px-5 py-2 bg-[#e5c47f] text-zinc-950 font-sans font-bold text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-zinc-900 hover:text-white transition-all duration-300 shadow-lg shadow-[#e5c47f]/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Le Palmarès
            </motion.button>
          ) : (
            <motion.button
              onClick={() => {
                if (pathname === '/') {
                  document.getElementById('talents-section')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  router.push('/?scroll=talents');
                }
              }}
              className="hidden lg:block px-4 sm:px-5 py-2 bg-white border-2 border-[#050509] text-[#050509] font-sans font-bold text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-[#050509] hover:text-white transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Voir les Candidats
            </motion.button>
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
                  className={`font-sans text-sm uppercase tracking-[0.1em] transition-all duration-200 relative px-3 py-2 ${
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
              {loading ? (
                <div className="animate-pulse bg-zinc-100 border border-zinc-200 w-full h-10 rounded-none" />
              ) : isDashboard ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2 bg-red-600 text-white font-sans font-bold text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-red-500 transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              ) : isPreselectionOpen ? (
                <Link
                  href="/candidature"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full px-5 py-2 bg-[#050509] text-white font-sans font-bold text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-[#e5c47f] transition-all duration-300 text-center"
                >
                  Postuler
                </Link>
              ) : isArchived ? (
                <button
                  onClick={() => {
                    if (pathname === '/') {
                      document.getElementById('talents-section')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      router.push('/?scroll=talents');
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full px-5 py-2 bg-[#e5c47f] text-zinc-950 font-sans font-bold text-[10px] uppercase tracking-[0.2em] rounded-none text-center shadow-lg shadow-[#e5c47f]/10"
                >
                  Le Palmarès
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (pathname === '/') {
                      document.getElementById('talents-section')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      router.push('/?scroll=talents');
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full px-5 py-2 bg-white border-2 border-[#050509] text-[#050509] font-sans font-bold text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-[#050509] hover:text-white transition-all duration-300 text-center"
                >
                  Voir les Candidats
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}