'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Candidate } from '@/lib/supabase/types';

export async function updateCandidateStatus(candidateId: string, status: Candidate['status']): Promise<Candidate | null> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore errors in server components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            // Ignore errors in server components
          }
        },
      },
    }
  );

  console.log('[Server Action] updateCandidateStatus - Attempting to update candidate:', candidateId, 'to status:', status);

  // Direct update without RPC
  const { data, error } = await supabase
    .from('candidates')
    .update({ status })
    .eq('id', candidateId)
    .select()
    .single();

  if (error) {
    console.error('[Server Action] updateCandidateStatus - Error:', error);
    return null;
  }

  console.log('[Server Action] updateCandidateStatus - Success:', data);
  return data as Candidate;
}

export async function confirmCandidateByAdmin(candidateId: string, isConfirmed: boolean): Promise<Candidate | null> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore errors in server components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            // Ignore errors in server components
          }
        },
      },
    }
  );

  console.log('[Server Action] confirmCandidateByAdmin - Attempting to confirm candidate:', candidateId, 'is_confirmed:', isConfirmed);

  // Direct update without RPC
  const { data, error } = await supabase
    .from('candidates')
    .update({ is_confirmed_by_admin: isConfirmed })
    .eq('id', candidateId)
    .select()
    .single();

  if (error) {
    console.error('[Server Action] confirmCandidateByAdmin - Error:', error);
    return null;
  }

  console.log('[Server Action] confirmCandidateByAdmin - Success:', data);
  return data as Candidate;
}

// Nouvelles actions pour le workflow

export async function preApproveCandidate(candidateId: string, isPreApproved: boolean): Promise<Candidate | null> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore errors in server components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            // Ignore errors in server components
          }
        },
      },
    }
  );

  console.log('[Server Action] preApproveCandidate - Attempting to pre-approve candidate:', candidateId, 'is_pre_approved:', isPreApproved);

  const { data, error } = await supabase
    .from('candidates')
    .update({ status: isPreApproved ? 'pre_approved' : 'pending_review' })
    .eq('id', candidateId)
    .select()
    .single();

  if (error) {
    console.error('[Server Action] preApproveCandidate - Error:', error);
    return null;
  }

  console.log('[Server Action] preApproveCandidate - Success:', data);
  return data as Candidate;
}

export async function rejectCandidate(candidateId: string): Promise<Candidate | null> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore errors in server components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            // Ignore errors in server components
          }
        },
      },
    }
  );

  console.log('[Server Action] rejectCandidate - Attempting to reject candidate:', candidateId);

  const { data, error } = await supabase
    .from('candidates')
    .update({ status: 'rejected' })
    .eq('id', candidateId)
    .select()
    .single();

  if (error) {
    console.error('[Server Action] rejectCandidate - Error:', error);
    return null;
  }

  console.log('[Server Action] rejectCandidate - Success:', data);
  return data as Candidate;
}

export async function submitToJury(): Promise<boolean> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore errors in server components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            // Ignore errors in server components
          }
        },
      },
    }
  );

  console.log('[Server Action] submitToJury - Attempting to submit to jury');

  const { error } = await supabase
    .from('system_control')
    .update({ current_phase: 'VOTES_TOP_40' })
    .eq('id', 1);

  if (error) {
    console.error('[Server Action] submitToJury - Error:', error);
    return false;
  }

  console.log('[Server Action] submitToJury - Success');
  return true;
}

export async function confirmAndPublishCandidates(candidateIds: string[]): Promise<boolean> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore errors in server components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            // Ignore errors in server components
          }
        },
      },
    }
  );

  console.log('[Server Action] confirmAndPublishCandidates - Attempting to confirm and publish candidates:', candidateIds);

  // Update candidates
  const { error: candidatesError } = await supabase
    .from('candidates')
    .update({
      status: 'approved',
      admin_confirmed_at: new Date().toISOString()
    })
    .in('id', candidateIds);

  if (candidatesError) {
    console.error('[Server Action] confirmAndPublishCandidates - Candidates update error:', candidatesError);
    return false;
  }

  // Update system phase
  const { error: phaseError } = await supabase
    .from('system_control')
    .update({ current_phase: 'SEMIFINAL' })
    .eq('id', 1);

  if (phaseError) {
    console.error('[Server Action] confirmAndPublishCandidates - Phase update error:', phaseError);
    return false;
  }

  console.log('[Server Action] confirmAndPublishCandidates - Success');
  return true;
}
