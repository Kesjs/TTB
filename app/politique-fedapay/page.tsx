import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/home/SiteFooter';
import Link from 'next/link';

export default function PolitiqueFedapay() {
  return (
    <div className="min-h-screen bg-white flex flex-col pt-16">
      <Navbar />
      
      <main className="flex-1 px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-900 transition-colors mb-8">
            ← Retour à l'accueil
          </Link>
          
          <h1 className="font-title text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-950 uppercase leading-none mb-12">
            Politique de Paiement FedaPay
          </h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Introduction</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Top Talent du Bénin utilise FedaPay comme solution de paiement sécurisée pour les votes. Cette politique décrit les modalités de traitement des paiements via cette plateforme.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Moyens de paiement acceptés</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Les paiements sont acceptés via :</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Mobile Money MTN Bénin</li>
                  <li>Mobile Money MOOV Bénin</li>
                  <li>Cartes bancaires (Visa, Mastercard)</li>
                </ul>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Sécurité des transactions</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Toutes les transactions sont sécurisées par FedaPay conformément aux normes PCI-DSS. Aucune information bancaire n'est stockée sur nos serveurs.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Tarification des votes</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Chaque vote est facturé selon le tarif en vigueur affiché sur la plateforme. Le montant total est débité immédiatement lors de la validation du paiement.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Remboursement</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>En cas d'erreur technique ou de paiement non validé, un remboursement automatique est effectué sous 48h. Pour toute demande de remboursement, contactez notre support à l'adresse : support@toptalentbenin.com</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Confirmation de paiement</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Un reçu de paiement est généré automatiquement et envoyé par email après chaque transaction réussie. Ce reçu sert de preuve de participation au vote.</p>
              </div>
            </section>
            
            <section>
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4">Contact FedaPay</h2>
              <div className="text-sm text-zinc-600 leading-relaxed space-y-2">
                <p>Pour toute question relative au traitement de votre paiement, vous pouvez contacter directement FedaPay via leur plateforme ou consulter leurs conditions générales d'utilisation sur fedapay.com</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}
