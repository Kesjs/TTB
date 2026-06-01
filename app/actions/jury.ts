'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Candidate } from '@/lib/supabase/types';

export async function toggleJurySelection(candidateId: string, isSelected: boolean): Promise<Candidate | null> {
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

  console.log('[Server Action] toggleJurySelection - Attempting to toggle selection for candidate:', candidateId, 'is_selected:', isSelected);

  // Check if jury selection is already submitted
  const { data: systemControl } = await supabase
    .from('system_control')
    .select('jury_selection_submitted')
    .eq('id', 1)
    .single();

  if (systemControl?.jury_selection_submitted) {
    console.error('[Server Action] toggleJurySelection - Error: Jury selection already submitted');
    return null;
  }

  const { data, error } = await supabase
    .from('candidates')
    .update({ status: isSelected ? 'jury_selected' : 'pre_approved' })
    .eq('id', candidateId)
    .select()
    .single();

  if (error) {
    console.error('[Server Action] toggleJurySelection - Error:', error);
    return null;
  }

  console.log('[Server Action] toggleJurySelection - Success:', data);
  return data as Candidate;
}

export async function submitJurySelection(): Promise<boolean> {
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

  console.log('[Server Action] submitJurySelection - Attempting to submit jury selection');

  // Check if exactly 40 candidates are selected
  const { data: selectedCandidates, error: countError } = await supabase
    .from('candidates')
    .select('id')
    .eq('status', 'jury_selected');

  if (countError) {
    console.error('[Server Action] submitJurySelection - Error counting selected candidates:', countError);
    return false;
  }

  if (!selectedCandidates || selectedCandidates.length !== 40) {
    console.error('[Server Action] submitJurySelection - Error: Must select exactly 40 candidates, got:', selectedCandidates?.length);
    return false;
  }

  // Update system_control to lock jury selection
  const { error } = await supabase
    .from('system_control')
    .update({
      jury_selection_submitted: true,
      jury_submitted_at: new Date().toISOString()
    })
    .eq('id', 1);

  if (error) {
    console.error('[Server Action] submitJurySelection - Error:', error);
    return false;
  }

  console.log('[Server Action] submitJurySelection - Success');
  return true;
}

export async function getJurySelectionCount(): Promise<number> {
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

  const { data, error } = await supabase
    .from('candidates')
    .select('id')
    .eq('status', 'jury_selected');

  if (error) {
    console.error('[Server Action] getJurySelectionCount - Error:', error);
    return 0;
  }

  return data?.length || 0;
}
