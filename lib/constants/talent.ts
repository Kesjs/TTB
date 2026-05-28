import type { Candidate } from '@/lib/supabase/types';

export const DISCIPLINES: Candidate['discipline'][] = ['Musique', 'Danse', 'Humour', 'Art_Oratoire', 'Digital', 'Cirque', 'Sport', 'Arts_Visuels'];

export const REGIONS: Candidate['region'][] = ['Alibori', 'Atacora', 'Atlantique', 'Borgou', 'Collines', 'Donga', 'Kouffo', 'Littoral', 'Mono', 'Ouémé', 'Plateau', 'Zou'];

export const DISCIPLINE_FILTERS = ['Tous', ...DISCIPLINES] as const;

export const REGION_FILTERS = ['Tous', ...REGIONS] as const;

export const VOTE_VALUE_FCFA = 100;
