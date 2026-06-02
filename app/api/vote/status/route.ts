import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
