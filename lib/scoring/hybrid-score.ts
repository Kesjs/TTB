import type { Candidate, JuryAverage, SystemControl, Vote } from '@/lib/supabase/types';

export function getCandidateVotes(votes: Vote[], candidateId: string) {
  return votes
    .filter((vote) => vote.candidate_id === candidateId && vote.payment_status === 'success')
    .reduce((sum, vote) => sum + vote.vote_count, 0);
}

export function calculateHybridScore(candidateId: string, votes: Vote[], juryAverages: Record<string, JuryAverage>, candidates: Candidate[]) {
  const maxVotes = Math.max(1, ...candidates.map((candidate) => getCandidateVotes(votes, candidate.id)));
  const avgJury = juryAverages[candidateId]?.total_jury_average ?? 10;
  const normalizedPublic = (getCandidateVotes(votes, candidateId) / maxVotes) * 20;
  const finalScore = 0.5 * avgJury + 0.5 * normalizedPublic;

  return Math.round(finalScore * 100) / 100;
}

export function rankCandidatesByHybridScore(candidates: Candidate[], votes: Vote[], juryAverages: Record<string, JuryAverage>, systemControl: SystemControl | null) {
  return [...candidates].sort((a, b) => {
    const scoreA = calculateHybridScore(a.id, votes, juryAverages, candidates);
    const scoreB = calculateHybridScore(b.id, votes, juryAverages, candidates);

    if (scoreA === scoreB) {
      if (systemControl?.forced_tie_breaker_candidate_id === a.id) return -1;
      if (systemControl?.forced_tie_breaker_candidate_id === b.id) return 1;
    }

    return scoreB - scoreA;
  });
}
