import { isClient, supabase } from '@/lib/supabase/client';
import { DEFAULT_CANDIDATES, DEFAULT_JURY_RATINGS, DEFAULT_PROFILES, DEFAULT_SYSTEM_CONTROL, DEFAULT_VOTES } from '@/lib/supabase/mock';
import type { Candidate, JuryAverage, JuryRating, Profile, SystemControl, Vote, CandidateVoteCount } from '@/lib/supabase/types';
import { toSqlPhase } from '@/lib/supabase/types';
import { getSessionId } from '@/lib/utils/session';

const initLocalStorage = () => {
  if (!isClient) return;
  if (!localStorage.getItem('ttb_system_control')) localStorage.setItem('ttb_system_control', JSON.stringify(DEFAULT_SYSTEM_CONTROL));
  if (!localStorage.getItem('ttb_profiles')) localStorage.setItem('ttb_profiles', JSON.stringify(DEFAULT_PROFILES));
  if (!localStorage.getItem('ttb_candidates')) localStorage.setItem('ttb_candidates', JSON.stringify(DEFAULT_CANDIDATES));
  if (!localStorage.getItem('ttb_votes')) localStorage.setItem('ttb_votes', JSON.stringify(DEFAULT_VOTES));
  if (!localStorage.getItem('ttb_jury_ratings')) localStorage.setItem('ttb_jury_ratings', JSON.stringify(DEFAULT_JURY_RATINGS));
};

export const db = {
  getSystemControl: async (): Promise<SystemControl> => {
    if (supabase) {
      const { data, error } = await supabase.from('system_control').select('*').single();
      if (!error && data) {
        // Map current_phase_new back to current_phase for the response
        const result = { ...data };
        if (result.current_phase_new) {
          result.current_phase = result.current_phase_new;
        }
        return result;
      }
    }

    initLocalStorage();
    const systemControl = localStorage.getItem('ttb_system_control');
    return systemControl ? JSON.parse(systemControl) : DEFAULT_SYSTEM_CONTROL;
  },

  updateSystemControl: async (updates: Partial<SystemControl>): Promise<SystemControl> => {
    if (supabase) {
      console.log('Supabase updateSystemControl called with:', updates);
      
      // Map current_phase to current_phase_new for database
      const dbUpdates: any = { ...updates };
      if ('current_phase' in dbUpdates) {
        dbUpdates.current_phase_new = dbUpdates.current_phase;
        delete dbUpdates.current_phase;
      }
      
      const { data: updateData, error: updateError, count } = await supabase
        .from('system_control')
        .update(dbUpdates)
        .eq('id', 1)
        .select();
      console.log('Update error:', updateError);
      console.log('Update count:', count);
      console.log('Update data:', updateData);
      if (!updateError && count && count > 0) {
        // Map current_phase_new back to current_phase for the response
        if (updateData && updateData[0]) {
          const result = { ...updateData[0] };
          if (result.current_phase_new) {
            result.current_phase = result.current_phase_new;
          }
          return result;
        }
      } else {
        console.error('Update failed or no rows affected:', updateError);
      }
    }

    initLocalStorage();
    const current = JSON.parse(localStorage.getItem('ttb_system_control') || '{}');
    const updated = { ...current, ...updates };
    localStorage.setItem('ttb_system_control', JSON.stringify(updated));

    if (isClient) window.dispatchEvent(new CustomEvent('ttb_system_control_update', { detail: updated }));

    return updated;
  },

  getCandidates: async (options?: { status?: Candidate['status']; profileId?: string }): Promise<Candidate[]> => {
    if (supabase) {
      try {
        let query = supabase.from('candidates').select('*');
        if (options?.status) query = query.eq('status', options.status);
        if (options?.profileId && options.profileId !== undefined && options.profileId !== null && options.profileId !== '') {
          console.log('[DB] Filtering candidates by profile_id:', options.profileId);
          query = query.eq('profile_id', options.profileId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('[DB] Error fetching candidates from Supabase:', error);
          console.error('[DB] Query details:', {
            status: options?.status,
            profileId: options?.profileId,
            errorMessage: error.message,
            errorDetails: error.details
          });

          // Si l'erreur est liée à la colonne views_count manquante, utiliser localStorage
          if (error.message && error.message.includes('views_count')) {
            console.warn('[DB] Column views_count not found, falling back to localStorage');
            throw new Error('views_count_column_missing');
          }

          // Don't fallback to local storage if there's a real database error
          // to avoid showing empty results when the DB is just busy/restricted
          throw error;
        }

        console.log('[DB] Candidates query success:', {
          resultsCount: data?.length || 0,
          status: options?.status,
          profileId: options?.profileId
        });

        if (data) return data;
      } catch (err: any) {
        // Si l'erreur est liée à views_count manquant, utiliser localStorage
        if (err.message === 'views_count_column_missing') {
          console.warn('[DB] Falling back to localStorage due to missing views_count column');
          initLocalStorage();
          const candidates: Candidate[] = JSON.parse(localStorage.getItem('ttb_candidates') || '[]');
          let filtered = candidates;
          if (options?.status) filtered = filtered.filter((candidate) => candidate.status === options.status);
          if (options?.profileId && options.profileId !== undefined && options.profileId !== null && options.profileId !== '') filtered = filtered.filter((candidate) => candidate.profile_id === options.profileId);
          return filtered;
        }
        throw err;
      }
    }

    initLocalStorage();
    const candidates: Candidate[] = JSON.parse(localStorage.getItem('ttb_candidates') || '[]');
    let filtered = candidates;
    if (options?.status) filtered = filtered.filter((candidate) => candidate.status === options.status);
    if (options?.profileId && options.profileId !== undefined && options.profileId !== null && options.profileId !== '') filtered = filtered.filter((candidate) => candidate.profile_id === options.profileId);
    return filtered;
  },

  getCandidateById: async (id: string): Promise<Candidate | null> => {
    if (supabase) {
      const { data, error } = await supabase.from('candidates').select('*').eq('id', id).single();
      if (!error && data) return data;
    }

    initLocalStorage();
    const candidates: Candidate[] = JSON.parse(localStorage.getItem('ttb_candidates') || '[]');
    return candidates.find((candidate) => candidate.id === id) || null;
  },

  createCandidate: async (candidate: Omit<Candidate, 'id' | 'created_at'>): Promise<Candidate> => {
    const tempId = 'cand-' + Math.random().toString(36).substr(2, 9);
    const newCandidate: any = {
      ...candidate,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      // Don't provide ID to let Supabase generate a proper UUID
      const { data, error } = await supabase.from('candidates').insert(newCandidate).select().single();
      if (!error && data) return data;
      if (error) console.error('[DB] Supabase error creating candidate:', error);
    }

    initLocalStorage();
    const candidates: Candidate[] = JSON.parse(localStorage.getItem('ttb_candidates') || '[]');
    const finalCandidate = { ...newCandidate, id: tempId };
    candidates.push(finalCandidate);
    localStorage.setItem('ttb_candidates', JSON.stringify(candidates));
    return finalCandidate;
  },

  updateCandidateStatus: async (id: string, status: Candidate['status']): Promise<Candidate | null> => {
    if (supabase) {
      console.log('updateCandidateStatus - Attempting to update candidate:', id, 'to status:', status);
      // Use RPC function to bypass RLS
      const { data, error } = await supabase.rpc('update_candidate_status', {
        candidate_uuid: id,
        new_status: status
      });
      console.log('updateCandidateStatus - Result:', { data, error });
      
      if (error) {
        console.error('updateCandidateStatus - RPC Error:', error);
        return null;
      }
      
      // Parse JSON response
      const result = data as { success: boolean; error?: string; candidate_id?: string; new_status?: string };
      console.log('updateCandidateStatus - Parsed result:', result);
      
      if (result?.success) {
        // Fetch the updated candidate to return full object
        const { data: candidate, error: fetchError } = await supabase.from('candidates').select('*').eq('id', id).single();
        if (!fetchError && candidate) return candidate;
      } else {
        console.error('updateCandidateStatus - Function error:', result?.error);
      }
    }

    initLocalStorage();
    const candidates: Candidate[] = JSON.parse(localStorage.getItem('ttb_candidates') || '[]');
    const index = candidates.findIndex((candidate) => candidate.id === id);

    if (index !== -1) {
      candidates[index].status = status;
      localStorage.setItem('ttb_candidates', JSON.stringify(candidates));
      return candidates[index];
    }

    return null;
  },

  confirmCandidateByAdmin: async (id: string, isConfirmed: boolean): Promise<Candidate | null> => {
    if (supabase) {
      console.log('confirmCandidateByAdmin - Attempting to confirm candidate:', id, 'is_confirmed:', isConfirmed);
      // Use RPC function to bypass RLS
      const { data, error } = await supabase.rpc('confirm_candidate_by_admin', {
        candidate_uuid: id,
        is_confirmed: isConfirmed
      });
      console.log('confirmCandidateByAdmin - Result:', { data, error });
      
      if (error) {
        console.error('confirmCandidateByAdmin - RPC Error:', error);
        return null;
      }
      
      // Parse JSON response
      const result = data as { success: boolean; error?: string; candidate_id?: string; is_confirmed?: boolean };
      console.log('confirmCandidateByAdmin - Parsed result:', result);
      
      if (result?.success) {
        // Fetch the updated candidate to return full object
        const { data: candidate, error: fetchError } = await supabase.from('candidates').select('*').eq('id', id).single();
        if (!fetchError && candidate) return candidate;
      } else {
        console.error('confirmCandidateByAdmin - Function error:', result?.error);
      }
    }

    initLocalStorage();
    const candidates: Candidate[] = JSON.parse(localStorage.getItem('ttb_candidates') || '[]');
    const index = candidates.findIndex((candidate) => candidate.id === id);

    if (index !== -1) {
      candidates[index].is_confirmed_by_admin = isConfirmed;
      localStorage.setItem('ttb_candidates', JSON.stringify(candidates));
      return candidates[index];
    }

    return null;
  },

  deleteCandidate: async (id: string): Promise<boolean> => {
    if (supabase) {
      // First try standard delete
      const { error } = await supabase.from('candidates').delete().eq('id', id);
      if (!error) return true;

      // If that fails (RLS), try RPC if we have one
      const { data: rpcData, error: rpcError } = await supabase.rpc('delete_candidate', {
        candidate_uuid: id
      });
      if (!rpcError) return true;
      
      console.error('Error deleting candidate:', error || rpcError);
      return false;
    }

    initLocalStorage();
    const candidates: Candidate[] = JSON.parse(localStorage.getItem('ttb_candidates') || '[]');
    const filtered = candidates.filter((c) => c.id !== id);
    localStorage.setItem('ttb_candidates', JSON.stringify(filtered));
    return true;
  },

  updateCandidateSelection: async (id: string, field: 'is_top_40' | 'is_semifinalist' | 'is_finalist', value: boolean): Promise<Candidate | null> => {
    if (supabase) {
      console.log(`updateCandidateSelection - Updating ${field} for candidate ${id} to ${value}`);
      const { data, error } = await supabase
        .from('candidates')
        .update({ [field]: value })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`updateCandidateSelection - Error:`, error);
        return null;
      }
      return data;
    }

    initLocalStorage();
    const candidates: Candidate[] = JSON.parse(localStorage.getItem('ttb_candidates') || '[]');
    const index = candidates.findIndex((candidate) => candidate.id === id);

    if (index !== -1) {
      (candidates[index] as any)[field] = value;
      localStorage.setItem('ttb_candidates', JSON.stringify(candidates));
      return candidates[index];
    }

    return null;
  },

  getVotes: async (): Promise<Vote[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('votes').select('*');
      if (!error && data) return data;
    }

    initLocalStorage();
    return JSON.parse(localStorage.getItem('ttb_votes') || '[]');
  },

  addVote: async (vote: Omit<Vote, 'id' | 'created_at'>): Promise<Vote> => {
    const tempId = 'v-' + Math.random().toString(36).substr(2, 9);
    const newVote: any = {
      ...vote,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      // Don't provide ID to let Supabase generate a proper UUID
      const { data, error } = await supabase.from('votes').insert(newVote).select().single();
      if (!error && data) return data;
      if (error) console.error('[DB] Supabase error adding vote:', error);
    }

    initLocalStorage();
    const votes: Vote[] = JSON.parse(localStorage.getItem('ttb_votes') || '[]');
    const finalVote = { ...newVote, id: tempId };
    votes.push(finalVote);
    localStorage.setItem('ttb_votes', JSON.stringify(votes));

    if (isClient) window.dispatchEvent(new CustomEvent('ttb_vote_added', { detail: finalVote }));

    return finalVote;
  },

  getJuryRatings: async (): Promise<JuryRating[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('jury_ratings').select('*');
      if (!error && data) return data;
    }

    initLocalStorage();
    return JSON.parse(localStorage.getItem('ttb_jury_ratings') || '[]');
  },

  saveJuryRating: async (rating: Omit<JuryRating, 'id' | 'created_at'>): Promise<JuryRating> => {
    const tempId = 'r-' + Math.random().toString(36).substr(2, 9);
    
    // Convert phase to lowercase to match SQL CHECK constraint
    const ratingToSave: any = {
      ...rating,
      phase: toSqlPhase(rating.phase),
      created_at: new Date().toISOString(),
    };

    console.log('[DB] saveJuryRating called with:', rating);
    console.log('[DB] Phase converted to SQL format:', ratingToSave.phase);

    if (supabase) {
      console.log('[DB] Attempting Supabase upsert...');
      // Don't provide ID to let Supabase handle UUID or match existing by conflict columns
      const { data, error } = await supabase.from('jury_ratings').upsert(ratingToSave, { onConflict: 'jury_id,candidate_id,phase' }).select().single();
      
      if (error) {
        console.error('[DB] Supabase error during saveJuryRating:', error);
        throw new Error(`Erreur lors de l'enregistrement de la note: ${error.message}`);
      }

      if (!error && data) {
        console.log('[DB] Supabase save successful:', data);
        return data;
      }
    }

    console.log('[DB] Falling back to LocalStorage save...');
    initLocalStorage();
    const ratings: JuryRating[] = JSON.parse(localStorage.getItem('ttb_jury_ratings') || '[]');
    const index = ratings.findIndex((existingRating) => existingRating.jury_id === rating.jury_id && existingRating.candidate_id === rating.candidate_id && existingRating.phase === rating.phase);

    if (index !== -1) {
      ratings[index] = { ...ratings[index], ...rating };
      localStorage.setItem('ttb_jury_ratings', JSON.stringify(ratings));
      console.log('[DB] LocalStorage update successful');
      return ratings[index];
    }

    const finalRating = { ...ratingToSave, id: tempId };
    ratings.push(finalRating);
    localStorage.setItem('ttb_jury_ratings', JSON.stringify(ratings));
    console.log('[DB] LocalStorage insert successful');
    return finalRating;
  },

  getProfiles: async (): Promise<Profile[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) return data;
    }

    initLocalStorage();
    return JSON.parse(localStorage.getItem('ttb_profiles') || '[]');
  },

  getCurrentUserProfile: async (): Promise<Profile | null> => {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (!error && data) return data;
      }
    }
    return null;
  },

  updateProfileRole: async (id: string, role: Profile['role']): Promise<Profile | null> => {
    if (supabase) {
      const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select().single();
      if (!error && data) return data;
    }

    initLocalStorage();
    const profiles: Profile[] = JSON.parse(localStorage.getItem('ttb_profiles') || '[]');
    const index = profiles.findIndex((profile) => profile.id === id);

    if (index !== -1) {
      profiles[index].role = role;
      localStorage.setItem('ttb_profiles', JSON.stringify(profiles));
      return profiles[index];
    }

    return null;
  },

  getJuryAverages: async (phase: string): Promise<Record<string, JuryAverage>> => {
    initLocalStorage();
    const ratings: JuryRating[] = JSON.parse(localStorage.getItem('ttb_jury_ratings') || '[]');
    const phaseRatings = ratings.filter((rating) => rating.phase === phase);
    const aggregates: Record<string, { tech: number[]; orig: number[]; pres: number[] }> = {};

    phaseRatings.forEach((rating) => {
      if (!aggregates[rating.candidate_id]) aggregates[rating.candidate_id] = { tech: [], orig: [], pres: [] };
      if (rating.score_technique !== null) aggregates[rating.candidate_id].tech.push(Number(rating.score_technique));
      if (rating.score_originalite !== null) aggregates[rating.candidate_id].orig.push(Number(rating.score_originalite));
      if (rating.score_presence !== null) aggregates[rating.candidate_id].pres.push(Number(rating.score_presence));
    });

    const result: Record<string, JuryAverage> = {};

    Object.keys(aggregates).forEach((candidateId) => {
      const tech = aggregates[candidateId].tech;
      const orig = aggregates[candidateId].orig;
      const pres = aggregates[candidateId].pres;
      const count = tech.length;

      if (count > 0) {
        const avgTech = tech.reduce((a, b) => a + b, 0) / count;
        const avgOrig = orig.reduce((a, b) => a + b, 0) / count;
        const avgPres = pres.reduce((a, b) => a + b, 0) / count;

        result[candidateId] = {
          avg_technique: Math.round(avgTech * 100) / 100,
          avg_originalite: Math.round(avgOrig * 100) / 100,
          avg_presence: Math.round(avgPres * 100) / 100,
          total_jury_average: Math.round(((avgTech + avgOrig + avgPres) / 3) * 100) / 100,
          count,
        };
      }
    });

    return result;
  },

  createJuryUser: async (email: string, password: string, fullName: string, phone: string, avatarUrl?: string): Promise<{ user: any; profile: Profile } | null> => {
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone,
          avatarUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error creating user:', error);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  },

  getJuryProfiles: async (): Promise<Profile[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'jury');
      if (!error && data) return data;
    }

    initLocalStorage();
    const profiles: Profile[] = JSON.parse(localStorage.getItem('ttb_profiles') || '[]');
    return profiles.filter((p) => p.role === 'jury');
  },

  deleteJuryUser: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: id }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error deleting user:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  },

  updateJuryUser: async (id: string, email: string, password: string, fullName: string, phone: string, avatarUrl?: string): Promise<boolean> => {
    try {
      // Update profile first
      const response = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: id,
          email,
          password,
          fullName,
          phone,
          avatarUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error updating user:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  },

  getCandidateVoteCounts: async (): Promise<CandidateVoteCount[]> => {
    if (supabase) {
      const { data, error } = await supabase.rpc('get_candidate_vote_counts');
      if (!error && data) return data;
    }

    // Fallback to client-side aggregation for mock mode
    initLocalStorage();
    const votes: Vote[] = JSON.parse(localStorage.getItem('ttb_votes') || '[]');
    const successfulVotes = votes.filter(v => v.payment_status === 'success');
    const aggregated: Record<string, CandidateVoteCount> = {};

    successfulVotes.forEach(vote => {
      if (!aggregated[vote.candidate_id]) {
        aggregated[vote.candidate_id] = {
          candidate_id: vote.candidate_id,
          total_votes: 0,
          total_amount: 0,
        };
      }
      aggregated[vote.candidate_id].total_votes += vote.vote_count;
      aggregated[vote.candidate_id].total_amount += Number(vote.amount_fcfa);
    });

    return Object.values(aggregated);
  },

  incrementCandidateViews: async (candidateId: string): Promise<boolean> => {
    if (supabase) {
      try {
        // Get current user ID if authenticated
        let userId = null;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id || null;
        } catch (err) {
          // User not authenticated, that's fine
        }

        // Get session ID for anonymous visitors
        const sessionId = getSessionId();

        // Try to use the RPC function with tracking
        const { data, error } = await supabase.rpc('increment_candidate_views_with_tracking', {
          p_candidate_id: candidateId,
          p_user_id: userId,
          p_session_id: sessionId
        });

        if (!error && data === true) {
          return true; // View was incremented
        }

        if (error) {
          console.error('Error incrementing views with tracking:', error);
          
          // Fallback to simple increment if RPC doesn't exist yet
          const { data: currentData, error: selectError } = await supabase
            .from('candidates')
            .select('views_count')
            .eq('id', candidateId)
            .single();

          if (!selectError && currentData) {
            const { error: updateError } = await supabase
              .from('candidates')
              .update({ views_count: (currentData?.views_count || 0) + 1 })
              .eq('id', candidateId);

            if (!updateError) return true;
          }
        }
      } catch (err) {
        console.error('Error in incrementCandidateViews:', err);
      }
    }

    // Fallback to localStorage with session tracking
    initLocalStorage();
    const candidates: Candidate[] = JSON.parse(localStorage.getItem('ttb_candidates') || '[]');
    const index = candidates.findIndex((candidate) => candidate.id === candidateId);

    // Get session ID for localStorage tracking
    const sessionId = getSessionId();
    const viewedCandidatesKey = 'ttb_viewed_candidates';
    const viewedCandidates = JSON.parse(localStorage.getItem(viewedCandidatesKey) || '[]');

    if (index !== -1) {
      // Check if this candidate was already viewed by this session
      const alreadyViewed = viewedCandidates.some((v: { candidateId: string; sessionId: string }) => 
        v.candidateId === candidateId && v.sessionId === sessionId
      );

      if (!alreadyViewed) {
        candidates[index].views_count = (candidates[index].views_count || 0) + 1;
        localStorage.setItem('ttb_candidates', JSON.stringify(candidates));
        
        // Track this view
        viewedCandidates.push({ candidateId, sessionId, viewedAt: new Date().toISOString() });
        localStorage.setItem(viewedCandidatesKey, JSON.stringify(viewedCandidates));
        
        return true;
      }
      
      // Already viewed, don't increment
      return false;
    }

    return false;
  },
};
