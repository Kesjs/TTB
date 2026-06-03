import { NextResponse } from 'next/server';

// Configuration FedaPay
const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY || '';
const FEDAPAY_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.fedapay.com/v1' 
  : 'https://sandbox.fedapay.com/v1';

// Timeout pour éviter les 502 sur Vercel (8 secondes pour rester sous la limite de 10s)
const FETCH_TIMEOUT = 8000;

export async function POST(request: Request) {
  console.log('[Vote API] Début de la requête');
  
  try {
    const body = await request.json();
    const { candidate_id, vote_count, phone_payer, network, phase } = body;

    console.log('[Vote API] Données reçues:', { candidate_id, vote_count, phone_payer, network, phase });

    // Strict validation des données
    if (!candidate_id || !vote_count || !phone_payer || !network || !phase) {
      console.error('[Vote API] Validation échouée: champs manquants');
      return NextResponse.json(
        { success: false, message: 'Tous les champs sont requis.' },
        { status: 400 }
      );
    }

    const amount_fcfa = vote_count * 500; // 1 vote = 500 FCFA
    const transactionRef = 'TTB-' + Math.random().toString(36).substr(2, 9).toUpperCase() + '-' + Date.now().toString().slice(-4);

    console.log('[Vote API] Clé FedaPay configurée:', !!FEDAPAY_SECRET_KEY);
    console.log('[Vote API] Longueur de la clé:', FEDAPAY_SECRET_KEY?.length || 0);
    console.log('[Vote API] URL API FedaPay:', FEDAPAY_API_URL);
    console.log('[Vote API] Environnement:', process.env.NODE_ENV);

    // Si la clé API FedaPay est configurée, faire l'appel réel
    if (FEDAPAY_SECRET_KEY) {
      console.log('[Vote API] Tentative d\'appel à l\'API FedaPay...');
      
      try {
        // Créer un AbortController pour le timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

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
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('[Vote API] Réponse FedaPay reçue, status:', fedapayResponse.status);

        const fedapayData = await fedapayResponse.json();
        console.log('[Vote API] Données FedaPay:', JSON.stringify(fedapayData));

        if (fedapayResponse.ok && fedapayData.transaction) {
          console.log('[Vote API] Transaction FedaPay créée avec succès, ID:', fedapayData.transaction.id);
          // Retourner la transaction créée pour traitement côté client
          return NextResponse.json({
            success: true,
            transaction_ref: transactionRef,
            fedapay_id: fedapayData.transaction.id,
            message: 'Transaction FedaPay initialisée avec succès.'
          });
        } else {
          console.error('[Vote API] Erreur FedaPay API:', fedapayData);
          
          // Erreur d'authentification FedaPay
          if (fedapayResponse.status === 401 || fedapayResponse.status === 403) {
            console.error('[Vote API] ERREUR D\'AUTHENTIFICATION FedaPay - Vérifiez la clé API');
            return NextResponse.json(
              { success: false, message: 'Erreur d\'authentification FedaPay. Vérifiez la clé API.' },
              { status: 401 }
            );
          }
          
          // Autres erreurs API
          const errorMessage = fedapayData.message || fedapayData.error?.message || 'Erreur d\'initialisation FedaPay';
          console.error('[Vote API] Erreur API FedaPay:', errorMessage);
          return NextResponse.json(
            { success: false, message: errorMessage },
            { status: 502 }
          );
        }
      } catch (err: any) {
        console.error('[Vote API] Erreur réseau avec FedaPay:', err);
        
        // Distinguer timeout d'autres erreurs réseau
        if (err.name === 'AbortError') {
          console.error('[Vote API] TIMEOUT: L\'API FedaPay n\'a pas répondu dans les 8 secondes');
          return NextResponse.json(
            { success: false, message: 'Timeout: L\'API FedaPay n\'a pas répondu. Réessayez.' },
            { status: 504 }
          );
        }
        
        console.error('[Vote API] Erreur de connexion:', err.message);
        // Fallback sur la simulation si FedaPay n'est pas joignable mais la clé est présente
        console.log('[Vote API] Fallback vers simulation en raison d\'erreur réseau');
      }
    } else {
      console.warn('[Vote API] Aucune clé FedaPay configurée, utilisation du mode simulation');
    }

    // --- FALLBACK DE SIMULATION EN MODE DÉVELOPPEMENT ---
    console.log('[Vote API] Mode simulation activé');
    // Simuler un délai réaliste avant le succès
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 secondes de délai
    
    return NextResponse.json({
      success: true,
      transaction_ref: transactionRef,
      message: 'Simulation de paiement initialisée (Mode Sandbox).'
    });

  } catch (error) {
    console.error('[Vote API] Erreur API Vote (catch principal):', error);
    return NextResponse.json(
      { success: false, message: 'Une erreur interne est survenue.' },
      { status: 500 }
    );
  }
}
