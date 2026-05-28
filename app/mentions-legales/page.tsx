import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/home/SiteFooter';
import Link from 'next/link';

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-white flex flex-col pt-16">
      <Navbar />
      
      <main className="flex-1 px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-900 transition-colors mb-8">
            ← Retour à l'accueil
          </Link>
          
          <h1 className="font-title text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-950 uppercase leading-none mb-12">
            Mentions Légales
          </h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Éditeur du site</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p><strong>Top Talent du Bénin</strong></p>
                <p>Ministère du Tourisme, de la Culture et des Arts</p>
                <p>Cotonou, Bénin</p>
                <p>Email: contact@toptalentbenin.com</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Hébergement</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p><strong>Supabase Inc.</strong></p>
                <p>San Francisco, Californie, États-Unis</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Propriété intellectuelle</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>L'ensemble du contenu de ce site (textes, images, vidéos, logos) est protégé par le droit d'auteur. Toute reproduction, même partielle, est interdite sans autorisation préalable.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Protection des données personnelles</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Les données collectées sont utilisées exclusivement dans le cadre du concours Top Talent du Bénin. Conformément à la loi n°2017-20 du 20 juin 2018 relative à la protection des données personnelles au Bénin, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Cookies</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Ce site utilise des cookies à des fins statistiques et d'amélioration de l'expérience utilisateur. Vous pouvez configurer votre navigateur pour refuser les cookies.</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}
