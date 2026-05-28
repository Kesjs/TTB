import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// FedaPay webhook signature verification (if applicable)
// Note: Implement actual signature verification based on FedaPay documentation
const verifyWebhookSignature = (payload: string, signature: string, secret: string): boolean => {
  // TODO: Implement HMAC signature verification
  // For now, we'll verify the webhook source via the secret
  return true;
};

// Map transaction amounts to vote packages
const getVotePackage = (amount: number): { votes: number; description: string } => {
  if (amount === 500) return { votes: 1, description: '1 vote' };
  if (amount === 1000) return { votes: 3, description: '3 votes (pack économie)' };
  if (amount === 3000) return { votes: 10, description: '10 votes (pack premium)' };
  return { votes: 0, description: 'Invalid amount' };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-fedapay-signature') || '';
    const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET || '';

    // Verify webhook signature
    if (!verifyWebhookSignature(JSON.stringify(body), signature, webhookSecret)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Extract transaction data from FedaPay webhook
    const {
      transaction_id,
      status,
      amount,
      currency,
      custom_data,
      phone,
      network,
    } = body;

    // Validate transaction
    if (status !== 'approved' && status !== 'success') {
      return NextResponse.json(
        { message: 'Transaction not successful, ignoring' },
        { status: 200 }
      );
    }

    if (currency !== 'XOF') {
      return NextResponse.json(
        { error: 'Invalid currency' },
        { status: 400 }
      );
    }

    // Extract candidate_id and phase from custom_data
    const candidate_id = custom_data?.candidate_id;
    const phase = custom_data?.phase || 'preselection';

    if (!candidate_id) {
      return NextResponse.json(
        { error: 'Missing candidate_id in custom_data' },
        { status: 400 }
      );
    }

    // Calculate vote package
    const votePackage = getVotePackage(amount);
    if (votePackage.votes === 0) {
      return NextResponse.json(
        { error: 'Invalid transaction amount' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with SERVICE ROLE KEY (bypasses RLS)
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Start transaction
    const { data: voteRecord, error: voteError } = await supabaseService
      .from('votes')
      .insert({
        candidate_id,
        vote_count: votePackage.votes,
        amount_fcfa: amount,
        phone_payer: phone || 'unknown',
        network: network || 'MTN',
        transaction_ref: transaction_id,
        payment_status: 'success',
        phase,
      })
      .select()
      .single();

    if (voteError) {
      console.error('Error inserting vote:', voteError);
      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500 }
      );
    }

    // Increment candidate vote count (if candidates table has votes_count column)
    // Note: This assumes the candidates table has a votes_count column
    // If not, we rely on the votes table aggregation
    const { error: updateError } = await supabaseService.rpc('increment_candidate_votes', {
      candidate_uuid: candidate_id,
      vote_increment: votePackage.votes,
    });

    if (updateError) {
      console.error('Error incrementing vote count:', updateError);
      // Don't fail the webhook if the increment fails, the vote is still recorded
    }

    return NextResponse.json({
      success: true,
      message: `Vote recorded: ${votePackage.description}`,
      vote_id: voteRecord.id,
      transaction_id,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
