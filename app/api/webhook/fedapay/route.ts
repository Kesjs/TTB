import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

// Secret de validation webhook FedaPay (optionnel en dev, recommandé en prod)
const FEDAPAY_WEBHOOK_SECRET = process.env.FEDAPAY_WEBHOOK_SECRET || '';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const event = JSON.parse(rawBody);

    console.log('Webhook FedaPay Reçu:', event);

    // En production, il conviendrait de vérifier la signature de FedaPay pour des raisons de sécurité
    // Exemple de vérification de signature :
    // const signature = request.headers.get('X-Feedapay-Signature');
    // if (FEDAPAY_WEBHOOK_SECRET && !verifySignature(rawBody, signature, FEDAPAY_WEBHOOK_SECRET)) {
    //   return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
    // }

    // Traiter les événements FedaPay (ex: 'transaction.approved', 'transaction.declined')
    if (event.event === 'transaction.approved') {
      const transaction = event.data;
      const transactionRef = transaction.reference;
      
      // Rechercher les votes correspondants dans notre base de données locale ou distante
      const allVotes = await db.getVotes();
      const pendingVote = allVotes.find(v => v.transaction_ref === transactionRef);

      if (pendingVote) {
        // Mettre à jour le statut du vote à 'success'
        // Si Supabase était connecté directement, nous ferions une requête UPDATE
        // Dans notre client hybride, addVote ou saveVote gère cela.
        // Simulons la validation du vote
        console.log(`Paiement approuvé pour la transaction ${transactionRef}. Enregistrement officiel...`);
      }
    } else if (event.event === 'transaction.declined') {
      const transaction = event.data;
      const transactionRef = transaction.reference;
      console.log(`Transaction FedaPay refusée : ${transactionRef}`);
    }

    return NextResponse.json({ success: true, message: 'Webhook FedaPay traité avec succès.' });

  } catch (error) {
    console.error('Erreur Webhook FedaPay Parser:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors du traitement du Webhook.' },
      { status: 500 }
    );
  }
}
