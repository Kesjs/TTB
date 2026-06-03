import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuration FedaPay
const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY || '';
const FEDAPAY_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.fedapay.com/v1' 
  : 'https://sandbox.fedapay.com/v1';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionRef = searchParams.get('transaction_ref');

    if (!transactionRef) {
      return NextResponse.json(
        { success: false, message: 'transaction_ref est requis' },
        { status: 400 }
      );
    }

    // Initialiser le client Supabase avec la clé de service pour contourner RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Rechercher le vote par transaction_ref
    const { data: vote, error } = await supabase
      .from('votes')
      .select('payment_status, vote_count')
      .eq('transaction_ref', transactionRef)
      .single();

    if (error) {
      // Si le vote n'existe pas encore, retourner 'pending'
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          status: 'pending',
          message: 'Transaction en attente de traitement'
        });
      }
      throw error;
    }

    // Vérification de sécurité : confirmer le statut auprès de FedaPay
    let fedapayStatus = null;
    if (FEDAPAY_SECRET_KEY && vote.payment_status === 'success') {
      try {
        const fedapayResponse = await fetch(`${FEDAPAY_API_URL}/transactions?reference=${transactionRef}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${FEDAPAY_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (fedapayResponse.ok) {
          const fedapayData = await fedapayResponse.json();
          if (fedapayData.transactions && fedapayData.transactions.length > 0) {
            const transaction = fedapayData.transactions[0];
            fedapayStatus = transaction.status;
            
            // Si FedaPay ne confirme pas le statut approved, corriger la base de données
            if (fedapayStatus !== 'approved') {
              console.warn(`Sécurité: Incohérence détectée pour ${transactionRef}. DB: success, FedaPay: ${fedapayStatus}`);
              await supabase
                .from('votes')
                .update({ 
                  payment_status: fedapayStatus === 'declined' ? 'failed' : 'pending' 
                })
                .eq('transaction_ref', transactionRef);
              
              return NextResponse.json({
                success: true,
                status: fedapayStatus === 'declined' ? 'failed' : 'pending',
                vote_count: vote.vote_count,
                message: fedapayStatus === 'declined' 
                  ? 'Paiement échoué (vérifié FedaPay)' 
                  : 'Transaction en attente (vérifié FedaPay)'
              });
            }
          }
        }
      } catch (fedapayError) {
        console.error('Erreur vérification FedaPay:', fedapayError);
        // En cas d'erreur FedaPay, on retourne le statut de la DB mais on log l'erreur
        // En production, vous pourriez vouloir retourner 'pending' par défaut
      }
    }

    // Retourner le statut du paiement
    return NextResponse.json({
      success: true,
      status: vote.payment_status,
      vote_count: vote.vote_count,
      message: vote.payment_status === 'success' 
        ? 'Paiement confirmé' 
        : vote.payment_status === 'failed'
        ? 'Paiement échoué'
        : 'Transaction en attente'
    });

  } catch (error) {
    console.error('Erreur API Vote Status:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la vérification du statut' },
      { status: 500 }
    );
  }
}
