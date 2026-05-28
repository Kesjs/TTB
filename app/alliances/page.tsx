'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase/client';
import type { Partner } from '@/lib/supabase/types';

export default function AlliancesPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      if (supabase) {
        const { data, error } = await supabase
          .from('partners')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setPartners(data);
        }
      }
      setLoading(false);
    };

    fetchPartners();
  }, []);

  const institutionalPartners = partners.filter(p => p.category === 'institutionnel');
  const innovationPartners = partners.filter(p => p.category === 'innovation');

  return (
    <div className="min-h-screen bg-white text-[#050505] pt-16">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-32 sm:py-40">
        <div className="mb-16">
          <h1 className="font-heading text-4xl sm:text-5xl font-black text-[#050505] mb-6 tracking-tight">
            LES ALLIANCES STRATÉGIQUES
          </h1>
          <p className="text-lg sm:text-xl text-[#050505]/70 max-w-3xl leading-relaxed">
            Les institutions, mécènes et entreprises leaders qui s'engagent à bâtir l'écosystème culturel de demain au Bénin.
          </p>
          <div className="w-24 h-0.5 bg-[#e5c47f] mt-8"></div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e5c47f]"></div>
          </div>
        ) : partners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-full max-w-2xl p-12 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-lg text-center">
              <h2 className="font-heading text-2xl font-bold text-[#050505] mb-4 tracking-tight">
                REJOINDRE L'ALLIANCE
              </h2>
              <p className="text-[#050505]/70 leading-relaxed mb-8 max-w-md mx-auto">
                Devenez un pilier majeur de l'Édition 2026. Associez votre institution ou votre marque à la consécration des plus grands talents du Bénin.
              </p>
              <a
                href="mailto:contact@toptalent.bj"
                className="inline-block px-8 py-4 bg-[#050505] text-white font-heading font-bold text-xs uppercase tracking-[0.2em] rounded hover:bg-[#e5c47f] transition-colors"
              >
                DEVENIR MÉCÈNE
              </a>
            </div>
          </div>
        ) : (
          <>
            {institutionalPartners.length > 0 && (
              <section className="mb-20">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#050505] mb-8 tracking-tight">
                  Mécènes Institutionnels
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {institutionalPartners.map((partner) => (
                    <a
                      key={partner.id}
                      href={partner.website_url || '#'}
                      target={partner.website_url ? '_blank' : undefined}
                      rel={partner.website_url ? 'noopener noreferrer' : undefined}
                      className="group p-8 bg-slate-50/40 border border-[#050505]/10 rounded hover:border-[#e5c47f]/30 transition-all duration-300"
                    >
                      <div className="flex items-center justify-center h-32 grayscale group-hover:grayscale-0 transition-all duration-300">
                        <img
                          src={partner.logo_url}
                          alt={partner.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('bg-zinc-100');
                          }}
                        />
                      </div>
                      <p className="text-center text-sm font-medium text-[#050505]/60 mt-4 group-hover:text-[#050505] transition-colors">
                        {partner.name}
                      </p>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {innovationPartners.length > 0 && (
              <section className="mb-20">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#050505] mb-8 tracking-tight">
                  Alliances Innovation & Tech
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {innovationPartners.map((partner) => (
                    <a
                      key={partner.id}
                      href={partner.website_url || '#'}
                      target={partner.website_url ? '_blank' : undefined}
                      rel={partner.website_url ? 'noopener noreferrer' : undefined}
                      className="group p-8 bg-slate-50/40 border border-[#050505]/10 rounded hover:border-[#e5c47f]/30 transition-all duration-300"
                    >
                      <div className="flex items-center justify-center h-32 grayscale group-hover:grayscale-0 transition-all duration-300">
                        <img
                          src={partner.logo_url}
                          alt={partner.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('bg-zinc-100');
                          }}
                        />
                      </div>
                      <p className="text-center text-sm font-medium text-[#050505]/60 mt-4 group-hover:text-[#050505] transition-colors">
                        {partner.name}
                      </p>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
