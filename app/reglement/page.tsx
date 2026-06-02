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
                <p>Le concours Top Talent Bénin est organisé par l'administration de la plateforme académique. L'édition 2026 vise à révéler, évaluer et propulser les talents artistiques les plus prometteurs du Bénin à travers un parcours transparent, équitable et entièrement numérisé.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 2 - Participation et Conditions d'Âge</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Le concours est ouvert à toute personne de nationalité béninoise, sans aucune limite d'âge. Les inscriptions sont accueillies au sein des 12 départements du Bénin. Chaque candidat ne peut s'inscrire que dans une seule discipline artistique et doit certifier l'authenticité de son identité ainsi que des médias soumis.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 3 - Disciplines acceptées</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Les disciplines acceptées au sein de la plateforme sont au nombre de huit (8) :</p>
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
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 4 - Inscription et Dépôt des Dossiers</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Les inscriptions se font exclusivement en ligne via l'interface publique officielle <code>toptalentbenin.vercel.app/candidature</code>. Chaque candidat doit compléter le parcours d'inscription en 3 étapes, incluant la validation des informations de contact et le dépôt d'une vidéo de prestation respectant les critères demandés. Tout dossier incomplet ou non validé par l'administrateur système sera rejeté.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 5 - Le Parcours d'Élimination (Les 4 Phases)</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Le concours s'organise autour de quatre (4) phases strictes et progressives :</p>
                <ul className="list-decimal list-inside space-y-3 ml-4">
                  <li>
                    <strong>Phase 01 - Auditions Nationales (Sélection Initiale) :</strong> 
                    Ouverture des dossiers dans les 12 départements. Après validation administrative, le jury professionnel analyse les candidatures et sélectionne rigoureusement les <strong>40 meilleurs profils</strong> pour rejoindre la phase nationale.
                  </li>
                  <li>
                    <strong>Phase 02 - Quarts de Finale (Le Top 40) :</strong> 
                    La compétition devient publique. Les 40 artistes s'affrontent et sont soumis au vote. L'avis du jury et le vote public éliminent 20 candidats pour ne conserver que <strong>20 artistes</strong>.
                  </li>
                  <li>
                    <strong>Phase 03 - Demi-Finales (Le Top 20) :</strong> 
                    Les compteurs de notation sont remis à zéro. Sous la double pression des votes du public et de l'expertise du jury, la sélection se resserre drastiquement pour retenir uniquement les <strong>12 grands finalistes</strong>.
                  </li>
                  <li>
                    <strong>Phase 04 - Grande Finale (Le Top 12) :</strong> 
                    L'apothéose de la compétition. Les 8 artistes d'élite s'affrontent en direct. Le vote souverain détermine le trio de tête ainsi que le vainqueur ultime.
                  </li>
                </ul>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 6 - Mécanisme de Vote et Pondération</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Pour garantir une équité absolue et valoriser l'excellence, les votes lors des phases publiques (Quarts, Demis, et Finale) sont régis par un système de double validation à parts égales :</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>50% de la note :</strong> Attribuée par l'évaluation et l'expertise du Jury Professionnel.</li>
                  <li><strong>50% de la note :</strong> Issue des votes payants sécurisés du Public.</li>
                </ul>
                <p className="mt-2">Les votes du public s'effectuent par paiement mobile ou carte bancaire. Toute tentative de fraude ou manipulation technique des flux de vote entraînera la disqualification immédiate et sans recours du candidat concerné.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 7 - Collège du Jury Académique</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Un collège de trois (3) jurés professionnels est nommé pour évaluer de manière indépendante les prestations. Chaque juré dispose d'un espace d'évaluation numérique strictement isolé et sécurisé par identifiant unique en base de données Supabase. Les critères portent sur la technique, l'originalité et la présence scénique. Les décisions et délibérations consolidées du jury sont souveraines et sans appel.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 8 - Récompenses et Dotations</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Des dotations de franchissement et des distinctions honorifiques sont octroyées selon les paliers atteints :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>À l'issue des Quarts de Finale (Top 20) :</strong> Attribution d'une Certification Officielle de l'Édition 2026.</li>
                  <li><strong>À l'issue des Demi-Finales (Top 12) :</strong> Octroi d'une campagne de visibilité majeure sur les réseaux nationaux de la plateforme.</li>
                  <li><strong>Au vainqueur de la Grande Finale :</strong> Le titre prestigieux d'Icône 2026, accompagné du Grand Prix d'une valeur de <strong>1 000 000 FCFA</strong> et d'un accompagnement professionnel d'un an pour le développement de sa carrière.</li>
                </ul>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 9 - Droits d'Image</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Du fait de leur inscription et de leur participation aux phases publiques, les candidats accordent à la plateforme Top Talent Bénin le droit non exclusif d'utiliser leur nom, image, descriptif et captations vidéo de prestation. Cette autorisation s'applique dans le cadre strict de la diffusion, de la promotion et de la valorisation de l'événement sur l'ensemble des canaux numériques et médias officiels.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Article 10 - Sécurité et Protection des Données</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Les données personnelles, documents d'identité et médias collectés lors de l'inscription font l'objet d'un traitement informatique hautement sécurisé par le protocole de sécurité Supabase au niveau de la base de données. L'accès aux informations sensibles est restreint à l'administrateur système et aux membres du jury pour les besoins exclusifs et stricts du processus de notation et de contrôle du concours.</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}