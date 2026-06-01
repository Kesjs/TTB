'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';
import { Shield, User, Loader2 } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function JurySection() {
  const [juryMembers, setJuryMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -15]);

  useEffect(() => {
    const fetchJury = async () => {
      if (supabase) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'jury')
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          setJuryMembers(data);
        }
      }
      setLoading(false);
    };

    fetchJury();

    // Realtime subscription for jury changes
    if (supabase) {
      const channel = supabase
        .channel('jury_changes_public')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
          const profile = payload.new as Profile;
          if (profile.role === 'jury') {
            if (payload.eventType === 'INSERT') {
              setJuryMembers(prev => [...prev, profile]);
            } else if (payload.eventType === 'UPDATE') {
              setJuryMembers(prev => prev.map(p => p.id === profile.id ? profile : p));
            } else if (payload.eventType === 'DELETE') {
              setJuryMembers(prev => prev.filter(p => p.id !== payload.old.id));
            }
          } else if (payload.eventType === 'DELETE' || payload.eventType === 'UPDATE') {
            // If a jury member is removed or role changed
            const oldProfile = payload.old as Profile;
            if (oldProfile.role === 'jury') {
              setJuryMembers(prev => prev.filter(p => p.id !== oldProfile.id));
            }
          }
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, []);

  const placeholderJury = [
    { id: '1', full_name: 'Siège Réservé', role: 'jury' as const, phone: '', created_at: '', avatar_url: '' },
    { id: '2', full_name: 'Siège Réservé', role: 'jury' as const, phone: '', created_at: '', avatar_url: '' },
    { id: '3', full_name: 'Siège Réservé', role: 'jury' as const, phone: '', created_at: '', avatar_url: '' },
  ];

  const displayJury = juryMembers.length > 0 ? juryMembers : placeholderJury;

  return (
    <section ref={ref} className="bg-white px-4 sm:px-6 py-28 relative overflow-hidden border-b border-zinc-100">
      {/* Halo lumineux très subtil en arrière-plan */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#e5c47f]/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">

        {/* EN-TÊTE GÉOMÉTRIQUE SANS BADGE */}
        <div className="max-w-2xl mb-20 space-y-4">
          <h2 className="font-title text-3xl sm:text-5xl font-black tracking-tight text-zinc-950 uppercase leading-none">
            Les Visages de la <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-950 to-zinc-400">Rigueur</span>
          </h2>

          <p className="font-sans text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-lg tracking-wide font-normal">
            Un panel d&apos;experts reconnus, garants de l&apos;équité absolue, du niveau technique et de l&apos;excellence structurelle tout au long du processus.
          </p>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-5 h-5 text-[#e5c47f] animate-spin" />
            <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest">Initialisation du Board...</span>
          </div>
        ) : (
          /* GRILLE DU JURY EN MODE LIGHT */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayJury.map((member, idx) => {
              const isPlaceholder = member.full_name === 'Siège Réservé';
              
              // Vérification de la présence d'une photo de profil
              // @ts-ignore
              const photoUrl = member.avatar_url || member.image_url;
              const hasPhoto = !!photoUrl;

              return (
                <div
                  key={member.id}
                  className="group relative overflow-hidden p-8 bg-zinc-50/50 border border-zinc-200/60 rounded-[1rem] hover:border-zinc-300 hover:bg-white transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md"
                >
                  {/* Index de carte discret (// 01) */}
                  <span className="absolute top-4 right-4 font-mono text-[9px] text-zinc-300 group-hover:text-zinc-400 select-none transition-colors">
                    // 0{idx + 1}
                  </span>

                  <div className="space-y-6">
                    {/* Conteneur de l'image / avatar carré épuré */}
                    <motion.div style={{ y }} className="w-14 h-14 rounded-lg bg-white border border-zinc-200 flex items-center justify-center overflow-hidden transition-colors group-hover:border-[#e5c47f]/40 shadow-sm">
                      {!isPlaceholder && hasPhoto ? (
                        <img
                          src={photoUrl}
                          alt={member.full_name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : !isPlaceholder ? (
                        /* Fallback Initialies */
                        <span className="font-mono font-bold text-zinc-900 text-md tracking-wider">
                          {member.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                        </span>
                      ) : (
                        /* Icône par défaut pour les emplacements réservés */
                        <User className="w-4 h-4 text-zinc-400 group-hover:text-zinc-500 transition-colors" />
                      )}
                    </motion.div>
                    
                    {/* Bloc Identité */}
                    <div className="space-y-1">
                      <h3 className={`font-title font-bold text-md uppercase tracking-wide transition-colors ${
                        isPlaceholder ? 'text-zinc-400 group-hover:text-zinc-600' : 'text-zinc-900'
                      }`}>
                        {member.full_name}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 pt-1">
                        <Shield className={`w-3 h-3 ${isPlaceholder ? 'text-zinc-300' : 'text-[#e5c47f]'}`} />
                        <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-400">
                          {isPlaceholder ? "Sélection en cours" : "Officiel Board Juré"}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}