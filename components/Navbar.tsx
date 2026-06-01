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
  const [scrolled, setScrolled] = useState<boolean>(false);

  const isHomePage = pathname === '/';

  // Navbar toujours blanche, peu importe le scroll
  const navScrolled = true;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
      setShowCta(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (propPhase) {
      setSystemPhase(propPhase);
      setLoading(propLoading);
      return;
    }
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
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      window.location.href = '/';
    }
  };

  const navItems = [
    { name: 'ÉDITION 2026', href: '/' },
    { name: 'SÉLECTIONS', href: '/selections' },
    { name: 'ALLIANCES', href: '/alliances' },
  ];

  // Couleurs selon état
  const textPrimary   = navScrolled ? 'text-[#050509]'      : 'text-white';
  const textMuted     = navScrolled ? 'text-[#050509]/70'   : 'text-white/80';
  const borderColor   = navScrolled ? 'border-zinc-200'     : 'border-white/15';
  const separatorBg   = navScrolled ? 'bg-zinc-300'         : 'bg-white/30';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 w-full z-50 px-4 sm:px-6 py-3 transition-all duration-300
        ${navScrolled
          ? 'bg-white border-b border-zinc-200 shadow-sm'
          : 'bg-transparent border-b border-white/10'
        }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

        {/* LOGO */}
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

          <div className={`font-sans text-[10px] xs:text-xs sm:text-sm font-bold tracking-wider uppercase whitespace-nowrap cursor-default transition-colors duration-300 ${textPrimary}`}>
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
                  className={`font-sans text-xs uppercase tracking-[0.15em] transition-all duration-200 relative px-2 sm:px-3 py-1
                    ${isActive
                      ? 'text-[#e5c47f] font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#e5c47f]'
                      : `${textMuted} hover:text-[#e5c47f]`
                    }`}
                >
                  {item.name}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* BOUTONS D'ACTION */}
        <div className="flex items-center gap-2 sm:gap-4">
          {loading ? (
            <div className={`animate-pulse w-24 sm:w-32 h-9 rounded-none border ${navScrolled ? 'bg-zinc-100 border-zinc-200' : 'bg-white/10 border-white/10'}`} />
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
              className={`hidden lg:block px-4 sm:px-5 py-2 font-sans font-bold text-[10px] uppercase tracking-[0.2em] rounded-none transition-all duration-300
                ${showCta ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}
                ${navScrolled
                  ? 'bg-[#050509] text-white hover:bg-[#e5c47f] hover:text-[#050509]'
                  : 'bg-[#e5c47f] text-[#050509] hover:bg-white hover:text-[#050509]'
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
              className={`hidden lg:block px-4 sm:px-5 py-2 font-sans font-bold text-[10px] uppercase tracking-[0.2em] rounded-none transition-all duration-300
                ${navScrolled
                  ? 'bg-[#e5c47f] text-zinc-950 hover:bg-zinc-900 hover:text-white'
                  : 'bg-white/10 text-white border border-white/25 hover:bg-[#e5c47f] hover:text-[#050509]'
                }`}
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
              className={`hidden lg:block px-4 sm:px-5 py-2 font-sans font-bold text-[10px] uppercase tracking-[0.2em] rounded-none transition-all duration-300
                ${navScrolled
                  ? 'bg-white border-2 border-[#050509] text-[#050509] hover:bg-[#050509] hover:text-white'
                  : 'bg-transparent text-white border border-white/30 hover:bg-[#e5c47f] hover:text-[#050509] hover:border-[#e5c47f]'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Voir les Candidats
            </motion.button>
          )}

          {/* Burger Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 transition-colors flex-shrink-0 hover:text-[#e5c47f] ${textPrimary}`}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MENU MOBILE — toujours fond noir pour lisibilité */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-4 pt-4 border-t border-white/10 bg-[#0a0a0a]">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-sans text-sm uppercase tracking-[0.1em] transition-all duration-200 px-3 py-2
                    ${isActive
                      ? 'text-[#e5c47f] font-bold border-l-2 border-[#e5c47f] bg-white/5'
                      : 'text-white/70 hover:text-[#e5c47f]'
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}

            <div className="pt-2 mt-2 border-t border-white/10">
              {loading ? (
                <div className="animate-pulse bg-white/10 w-full h-10 rounded-none" />
              ) : isDashboard ? (
                <button
                  onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2 bg-red-600 text-white font-sans font-bold text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-red-500 transition-all"
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              ) : isPreselectionOpen ? (
                <Link
                  href="/candidature"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full px-5 py-2 bg-[#e5c47f] text-[#050509] font-sans font-bold text-[10px] uppercase tracking-[0.2em] rounded-none text-center"
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
                  className="block w-full px-5 py-2 bg-[#e5c47f] text-zinc-950 font-sans font-bold text-[10px] uppercase tracking-[0.2em] rounded-none text-center"
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
                  className="block w-full px-5 py-2 bg-transparent text-white border border-white/20 font-sans font-bold text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-[#e5c47f] hover:text-[#050509] transition-all text-center"
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