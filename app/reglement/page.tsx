import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/home/SiteFooter';
import Link from 'next/link';

export default function Reglement() {
  return (
    <div className="min-h-screen bg-white flex flex-col pt-16">
      <Navbar />
      
      <main className="flex-1 px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-900 transition-colors mb-8">
            ← Retour à l'accueil
          </Link>
          
          <h1 className="font-title text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-950 uppercase leading-none mb-12">
            Règlement du Concours
          </h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 1 - Organisation</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Le concours Top Talent du Bénin est organisé par le Ministère du Tourisme, de la Culture et des Arts. L'édition 2026 vise à révéler et propulser les talents artistiques les plus prometteurs du Bénin.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 2 - Participation</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Le concours est ouvert à toute personne de nationalité béninoise âgée d'au moins 18 ans. Chaque candidat ne peut s'inscrire que dans une seule discipline artistique.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 3 - Disciplines acceptées</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Les disciplines acceptées sont :</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Musique</li>
                  <li>Danse</li>
                  <li>Humour</li>
                  <li>Art Oratoire</li>
                  <li>Création Digitale</li>
                  <li>Cirque</li>
                  <li>Sport Artistique</li>
                  <li>Arts Visuels</li>
                </ul>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 4 - Inscription</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Les inscriptions se font exclusivement en ligne via la plateforme toptalentbenin.com. Chaque candidat doit fournir une vidéo de présentation respectant les critères techniques spécifiés (format, durée, qualité). Tout dossier incomplet sera rejeté.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 5 - Sélection</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>La sélection s'effectue en plusieurs phases :</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Présélection :</strong> Le comité artistique sélectionne 40 candidats</li>
                  <li><strong>Quarts de finale :</strong> Le public et le jury éliminent 16 candidats</li>
                  <li><strong>Demi-finales :</strong> 24 candidats s'affrontent, 12 qualifiés</li>
                  <li><strong>Phase Or :</strong> 12 candidats, 6 finalistes</li>
                  <li><strong>Finale :</strong> 6 candidats, 1 lauréat</li>
                </ul>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 6 - Vote du public</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Le vote du public est ouvert via paiement mobile (MTN, MOOV) ou carte bancaire via FedaPay. Chaque vote a un coût fixe. Le vote du public compte pour 50% du score final, les 50% restants étant attribués par le jury professionnel.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 7 - Jury</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Un jury de professionnels du secteur artistique est nommé par le Ministère. Les membres du jury évaluent les candidats sur des critères techniques, d'originalité et de présence scénique. Les décisions du jury sont souveraines et sans appel.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 8 - Récompenses</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Les récompenses sont attribuées selon le classement final :</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Lauréat Majeur :</strong> Grand Prix + Accompagnement professionnel d'un an</li>
                  <li><strong>Finalistes :</strong> Bourses et opportunités de visibilité</li>
                  <li><strong>Demi-finalistes :</strong> Certifications officielles</li>
                </ul>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 9 - Droits d'image</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Par leur participation, les candidats autorisent l'organisation à utiliser leur image, leur nom et leurs prestations à des fins promotionnelles, sans contrepartie financière, pour toute la durée du concours et pendant une période de 5 ans après la finale.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 10 - Litiges</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Tout litige relatif à l'interprétation ou à l'exécution du présent règlement sera soumis à la compétence exclusive des tribunaux béninois. Le règlement est disponible sur demande auprès du Ministère du Tourisme, de la Culture et des Arts.</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}
