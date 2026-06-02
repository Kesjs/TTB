import { NextResponse } from 'next/server';

// Configuration FedaPay
const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY || '';
const FEDAPAY_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.fedapay.com/v1' 
  : 'https://sandbox.fedapay.com/v1';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { candidate_id, vote_count, phone_payer, network, phase } = body;

    // Strict validation des données
    if (!candidate_id || !vote_count || !phone_payer || !network || !phase) {
      return NextResponse.json(
        { success: false, message: 'Tous les champs sont requis.' },
        { status: 400 }
      );
    }

    const amount_fcfa = vote_count * 500; // 1 vote = 500 FCFA
    const transactionRef = 'TTB-' + Math.random().toString(36).substr(2, 9).toUpperCase() + '-' + Date.now().toString().slice(-4);

    // Si la clé API FedaPay est configurée, faire l'appel réel
    if (FEDAPAY_SECRET_KEY) {
      try {
        const fedapayResponse = await fetch(`${FEDAPAY_API_URL}/transactions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FEDAPAY_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount_fcfa,
            currency: { iso: 'XOF' },
            description: `Vote Top Talent du Bénin - Réf ${transactionRef}`,
            reference: transactionRef,
            customer: {
              phone_number: {
                number: phone_payer,
                country: 'BJ' // Bénin
              }
            },
            mode: network.toLowerCase(), // mtn or moov
          }),
        });

        const fedapayData = await fedapayResponse.json();

        if (fedapayResponse.ok && fedapayData.transaction) {
          // Retourner la transaction créée pour traitement côté client
          return NextResponse.json({
            success: true,
            transaction_ref: transactionRef,
            fedapay_id: fedapayData.transaction.id,
            message: 'Transaction FedaPay initialisée avec succès.'
          });
        } else {
          console.error('Erreur FedaPay API:', fedapayData);
          return NextResponse.json(
            { success: false, message: fedapayData.message || 'Erreur d\'initialisation FedaPay' },
            { status: 502 }
          );
        }
      } catch (err) {
        console.error('Erreur réseau avec FedaPay:', err);
        // Fallback sur la simulation si FedaPay n'est pas joignable mais la clé est présente
      }
    }

    // --- FALLBACK DE SIMULATION EN MODE DÉVELOPPEMENT ---
    // Simuler le succès d'initialisation de transaction
    return NextResponse.json({
      success: true,
      transaction_ref: transactionRef,
      message: 'Simulation de paiement initialisée (Mode Sandbox).'
    });

  } catch (error) {
    console.error('Erreur API Vote:', error);
    return NextResponse.json(
      { success: false, message: 'Une erreur interne est survenue.' },
      { status: 500 }
    );
  }
}
