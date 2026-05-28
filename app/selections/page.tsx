import Navbar from '@/components/Navbar';
import { Award, ShieldCheck, Users } from 'lucide-react';

export default function SelectionsPage() {
  return (
    <div className="min-h-screen bg-white text-[#050505] antialiased selection:bg-[#e5c47f]/20 pt-16">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
        
        {/* EN-TÊTE DE LA PAGE */}
        <div className="mb-16 sm:mb-24">
          <span className="text-[#e5c47f] font-heading font-black text-xs uppercase tracking-[0.25em] block mb-3">
            Règlement & Vision
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-black text-[#050505] mb-6 tracking-tight uppercase">
            Le Cadre & La Sélection
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl leading-relaxed font-body">
            L&apos;exigence artistique, les critères du grand jury et le système de notation de l&apos;Édition 2026. Un parcours conçu pour révéler la quintessence du talent béninois.
          </p>
          <div className="w-20 h-0.5 bg-[#e5c47f] mt-8"></div>
        </div>

        {/* SECTION 1 : LES CRITÈRES */}
        <section className="mb-16 sm:mb-24 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[#e5c47f]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-black text-[#050505] tracking-tight uppercase">
                L&apos;Excellence pour seul critère
              </h2>
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="text-slate-700 leading-relaxed text-base sm:text-lg font-body">
              L&apos;entrée sur la scène de <strong>Top Talent du Bénin</strong> ne doit rien au hasard. Chaque performance soumise à la plateforme est visionnée et analysée avec la plus grande exigence par notre comité artistique. Pour être validé et accéder au scrutin public, chaque candidat doit démontrer une maîtrise technique affirmée, une identité originale et une passion brute. Les prestations qui ne répondent pas aux standards de l&apos;Édition 2026 ne seront pas retenues.
            </p>
          </div>
        </section>

        {/* SECTION 2 : LE VOTE 50/50 */}
        <section className="mb-16 sm:mb-24 grid grid-cols-1 md:grid-cols-3 gap-8 items-start border-t border-slate-100 pt-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[#e5c47f]">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-black text-[#050505] tracking-tight uppercase">
                L&apos;Équilibre des voix
              </h2>
            </div>
          </div>
          <div className="md:col-span-2">
            <p className="text-slate-700 leading-relaxed text-base sm:text-lg font-body mb-6">
              Afin de garantir une équité absolue, le destin des compétiteurs repose sur un modèle hybride strict qui unit l&apos;œil des experts de l&apos;industrie et la ferveur populaire :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                <span className="font-heading font-black text-lg text-[#050505] block mb-1">Le Grand Jury — 50%</span>
                <span className="text-slate-600 leading-relaxed">Nos professionnels évaluent la technique, la présence scénique et le potentiel d&apos;évolution du projet selon une grille de critères rigoureux.</span>
              </div>
              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                <span className="font-heading font-black text-lg text-[#e5c47f] block mb-1">Le Vote Public — 50%</span>
                <span className="text-slate-600 leading-relaxed">La nation entière exprime son soutien en temps réel. Chaque vote est certifié et enregistré instantanément via notre protocole sécurisé par Mobile Money.</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 : LA CONSÉCRATION */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start border-t border-slate-100 pt-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[#e5c47f]">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-black text-[#050505] tracking-tight uppercase">
                La Consécration
              </h2>
            </div>
          </div>
          <div className="md:col-span-2">
           <p className="text-slate-700 leading-relaxed text-base sm:text-lg font-body">
  Au terme des phases éliminatoires, les notes du Jury et les votes du public sont agrégés par notre algorithme. L&apos;artiste ayant obtenu le score combiné le plus élevé sera sacré <strong>Lauréat Majeur de l&apos;Édition 2026</strong> (accès aux dotations de prestige et accompagnement structurel). 
  <br /><br />
  Parce que chaque palier vers la finale est un exploit, <strong>des distinctions et enveloppes d&apos;encouragement seront également attribuées aux finalistes et demi-finalistes</strong> pour valoriser leur parcours et soutenir le développement de leur art.
</p>
          </div>
        </section>

      </main>
    </div>
  );
}