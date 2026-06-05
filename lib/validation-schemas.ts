import { z } from 'zod';

// Schema de validation pour les votes
export const voteSchema = z.object({
  candidate_id: z.string().uuid('Invalid candidate ID'),
  vote_count: z.number().int().min(1, 'At least 1 vote required').max(100, 'Maximum 100 votes per transaction'),
  phone_payer: z.string().regex(/^[0-9]{8,15}$/, 'Invalid phone number'),
  network: z.enum(['mtn', 'moov'], { message: 'Network is required' }),
  phase: z.enum(['top40', 'semifinal', 'final'], { message: 'Phase is required' }),
});

// Schema de validation pour la création d'utilisateur (admin/jury)
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{8,15}$/, 'Invalid phone number').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
});

// Schema de validation pour la mise à jour d'utilisateur
export const updateUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().regex(/^[0-9]{8,15}$/, 'Invalid phone number').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
}).refine(data => data.email || data.password || data.fullName || data.phone || data.avatarUrl, {
  message: 'At least one field must be provided for update',
});

// Schema de validation pour la suppression d'utilisateur
export const deleteUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// Schema de validation pour les candidatures
export const candidateSchema = z.object({
  stage_name: z.string().min(2, 'Stage name must be at least 2 characters'),
  real_name: z.string().min(2, 'Real name must be at least 2 characters'),
  talent: z.string().min(2, 'Talent description must be at least 2 characters'),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(500, 'Bio must be less than 500 characters'),
  phone: z.string().regex(/^[0-9]{8,15}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email address'),
  photo_url: z.string().url('Invalid photo URL'),
  video_url: z.string().url('Invalid video URL').optional(),
});

// Schema de validation pour les scores jury
export const juryScoreSchema = z.object({
  candidate_id: z.string().uuid('Invalid candidate ID'),
  performance: z.number().min(0).max(10, 'Performance score must be between 0 and 10'),
  stage_presence: z.number().min(0).max(10, 'Stage presence score must be between 0 and 10'),
  originality: z.number().min(0).max(10, 'Originality score must be between 0 and 10'),
  technique: z.number().min(0).max(10, 'Technique score must be between 0 and 10'),
  comments: z.string().max(500, 'Comments must be less than 500 characters').optional(),
});

// Types inférés
export type VoteInput = z.infer<typeof voteSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
export type CandidateInput = z.infer<typeof candidateSchema>;
export type JuryScoreInput = z.infer<typeof juryScoreSchema>;
