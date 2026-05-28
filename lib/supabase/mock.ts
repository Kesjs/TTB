import type { Candidate, JuryRating, Profile, SystemControl, Vote } from '@/lib/supabase/types';

export const DEFAULT_SYSTEM_CONTROL: SystemControl = {
  id: 1,
  current_phase: 'PRESELECTION',
  live_voting_candidate_id: null,
  is_voting_open: false,
  forced_tie_breaker_candidate_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEFAULT_PROFILES: Profile[] = [
  { id: 'usr-admin', full_name: 'Djidjoho Akovi', phone: '+229 97 00 01 02', role: 'admin', created_at: new Date().toISOString() },
  { id: 'usr-jury1', full_name: 'Angélique Kidjo (Jury)', phone: '+229 90 11 22 33', role: 'jury', created_at: new Date().toISOString() },
  { id: 'usr-jury2', full_name: 'Sagbohan Danialou (Jury)', phone: '+229 95 44 55 66', role: 'jury', created_at: new Date().toISOString() },
  { id: 'usr-jury3', full_name: 'Gbégnon le Sage (Jury)', phone: '+229 97 77 88 99', role: 'jury', created_at: new Date().toISOString() },
  { id: 'usr-cand1', full_name: 'Aurelle Sinsin', phone: '+229 90 99 88 77', role: 'candidate', created_at: new Date().toISOString() },
  { id: 'usr-cand2', full_name: 'Fémi Kpanou', phone: '+229 95 88 77 66', role: 'candidate', created_at: new Date().toISOString() },
  { id: 'usr-cand3', full_name: 'Zénabou Bio', phone: '+229 97 66 55 44', role: 'candidate', created_at: new Date().toISOString() },
  { id: 'usr-cand4', full_name: 'Koffi Mensah', phone: '+229 61 22 33 44', role: 'candidate', created_at: new Date().toISOString() },
  { id: 'usr-cand5', full_name: "Sena l'Acrobate", phone: '+229 62 55 66 77', role: 'candidate', created_at: new Date().toISOString() },
  { id: 'usr-cand6', full_name: 'Tola le Conteur', phone: '+229 96 11 22 33', role: 'candidate', created_at: new Date().toISOString() },
];

export const DEFAULT_CANDIDATES: Candidate[] = [
  { id: 'cand-1', profile_id: 'usr-cand1', stage_name: 'Aurelle du Littoral', discipline: 'Musique', region: 'Littoral', video_url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-singing-in-front-of-a-microphone-40615-large.mp4', status: 'approved', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'cand-2', profile_id: 'usr-cand2', stage_name: 'Kpanou Vibration', discipline: 'Danse', region: 'Ouémé', video_url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-dancing-hip-hop-style-40742-large.mp4', status: 'approved', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'cand-3', profile_id: 'usr-cand3', stage_name: 'Zénabou la Voix du Borgou', discipline: 'Art_Oratoire', region: 'Borgou', video_url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-talking-on-stage-with-microphone-40616-large.mp4', status: 'pending_review', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'cand-4', profile_id: 'usr-cand4', stage_name: 'Koffi Rires', discipline: 'Humour', region: 'Zou', video_url: 'https://assets.mixkit.co/videos/preview/mixkit-stand-up-comedian-performing-on-stage-40617-large.mp4', status: 'approved', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'cand-5', profile_id: 'usr-cand5', stage_name: 'Sena le Voltigeur', discipline: 'Cirque', region: 'Mono', video_url: 'https://assets.mixkit.co/videos/preview/mixkit-athletic-man-doing-backflips-40743-large.mp4', status: 'pending_review', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'cand-6', profile_id: 'usr-cand6', stage_name: "Tola d'Abomey", discipline: 'Digital', region: 'Collines', video_url: 'https://assets.mixkit.co/videos/preview/mixkit-actor-performing-on-theatre-stage-40618-large.mp4', status: 'approved', created_at: new Date().toISOString() },
];

export const DEFAULT_VOTES: Vote[] = [
  { id: 'v-1', candidate_id: 'cand-1', vote_count: 320, amount_fcfa: 32000, phone_payer: '97000001', network: 'MTN', transaction_ref: 'TXN-101', payment_status: 'success', phase: 'PRESELECTION', created_at: new Date().toISOString() },
  { id: 'v-2', candidate_id: 'cand-2', vote_count: 245, amount_fcfa: 24500, phone_payer: '90000002', network: 'MOOV', transaction_ref: 'TXN-102', payment_status: 'success', phase: 'PRESELECTION', created_at: new Date().toISOString() },
  { id: 'v-3', candidate_id: 'cand-4', vote_count: 512, amount_fcfa: 51200, phone_payer: '97000003', network: 'MTN', transaction_ref: 'TXN-103', payment_status: 'success', phase: 'PRESELECTION', created_at: new Date().toISOString() },
  { id: 'v-4', candidate_id: 'cand-6', vote_count: 180, amount_fcfa: 18000, phone_payer: '90000004', network: 'MOOV', transaction_ref: 'TXN-104', payment_status: 'success', phase: 'PRESELECTION', created_at: new Date().toISOString() },
];

export const DEFAULT_JURY_RATINGS: JuryRating[] = [
  { id: 'r-1', jury_id: 'usr-jury1', candidate_id: 'cand-1', score_technique: 16, score_originalite: 15, score_presence: 17, is_approved_preselection: true, phase: 'PRESELECTION', created_at: new Date().toISOString() },
  { id: 'r-2', jury_id: 'usr-jury2', candidate_id: 'cand-1', score_technique: 15, score_originalite: 14, score_presence: 18, is_approved_preselection: true, phase: 'PRESELECTION', created_at: new Date().toISOString() },
  { id: 'r-3', jury_id: 'usr-jury1', candidate_id: 'cand-2', score_technique: 14, score_originalite: 17, score_presence: 15, is_approved_preselection: true, phase: 'PRESELECTION', created_at: new Date().toISOString() },
];
