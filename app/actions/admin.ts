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
