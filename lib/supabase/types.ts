export interface Profile {
  id: string;
  email?: string;
  full_name: string;
  phone: string;
  role: 'visitor' | 'candidate' | 'jury' | 'admin';
  avatar_url?: string;
  created_at: string;
}

export interface Candidate {
  id: string;
  profile_id: string;
  stage_name: string;
  discipline: 'Musique' | 'Danse' | 'Humour' | 'Art_Oratoire' | 'Digital' | 'Cirque' | 'Sport' | 'Arts_Visuels';
  region: 'Alibori' | 'Atacora' | 'Atlantique' | 'Borgou' | 'Collines' | 'Donga' | 'Kouffo' | 'Littoral' | 'Mono' | 'Ouémé' | 'Plateau' | 'Zou';
  video_url: string;
  cover_image_url?: string;
  candidature_type?: 'solo' | 'group';
  member_count?: number;
  status: 'pending_review' | 'approved' | 'rejected';
  votes_count?: number;
  views_count?: number;
  is_confirmed_by_admin?: boolean;
  is_top_40?: boolean;
  is_semifinalist?: boolean;
  is_finalist?: boolean;
  bio?: string;
  created_at: string;
}

export interface Vote {
  id: string;
  candidate_id: string;
  vote_count: number;
  amount_fcfa: number;
  phone_payer: string;
  network: 'MTN' | 'MOOV';
  transaction_ref: string;
  payment_status: 'pending' | 'success' | 'failed';
  phase: 'PRESELECTION' | 'VOTES_TOP_40' | 'SEMIFINAL' | 'FINAL';
  created_at: string;
}

export interface JuryRating {
  id: string;
  jury_id: string;
  candidate_id: string;
  score_technique: number;
  score_originalite: number;
  score_presence: number;
  is_approved_preselection: boolean;
  phase: 'PRESELECTION' | 'VOTES_TOP_40' | 'SEMIFINAL' | 'FINAL';
  created_at: string;
}

export interface SystemControl {
  id: number;
  current_phase: 'PRESELECTION' | 'VOTES_TOP_40' | 'SEMIFINAL' | 'FINAL' | 'ARCHIVED'; // Maps to current_phase_new in DB
  current_phase_old?: string; // Keep old phase for compatibility during transition
  live_voting_candidate_id: string | null;
  is_voting_open: boolean;
  forced_tie_breaker_candidate_id: string | null;
  is_maintenance_mode?: boolean;
  created_at: string;
  updated_at: string;
}

export interface JuryAverage {
  avg_technique: number;
  avg_originalite: number;
  avg_presence: number;
  total_jury_average: number;
  count: number;
}

export interface CandidateVoteCount {
  candidate_id: string;
  total_votes: number;
  total_amount: number;
}

export interface Partner {
  id: string;
  name: string;
  logo_url: string;
  category: 'institutionnel' | 'innovation';
  website_url?: string;
  created_at: string;
}
