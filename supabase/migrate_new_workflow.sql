-- ==========================================
-- MIGRATION SQL - NEW WORKFLOW
-- ==========================================
-- This script adds 4 boolean fields to candidates table
-- without modifying or deleting existing fields
-- ==========================================

-- Add 4 boolean fields to candidates table
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS is_confirmed_by_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_top_40 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_semifinalist BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_finalist BOOLEAN DEFAULT false;

-- Migrate existing data: candidates with status='approved' are considered confirmed by admin
UPDATE public.candidates 
SET is_confirmed_by_admin = true 
WHERE status = 'approved';

-- Add new phase field to system_control (keeping old field for compatibility)
ALTER TABLE public.system_control 
ADD COLUMN IF NOT EXISTS current_phase_new TEXT DEFAULT 'PRESELECTION' 
CHECK (current_phase_new IN ('PRESELECTION', 'VOTES_TOP_40', 'SEMIFINAL', 'FINAL', 'ARCHIVED'));

-- Migrate existing phase data to new format
UPDATE public.system_control 
SET current_phase_new = CASE 
  WHEN current_phase = 'preselection_open' THEN 'PRESELECTION'
  WHEN current_phase IN ('preselection_closed', 'audition') THEN 'VOTES_TOP_40'
  WHEN current_phase = 'semifinal' THEN 'SEMIFINAL'
  WHEN current_phase = 'final' THEN 'FINAL'
  WHEN current_phase = 'archived' THEN 'ARCHIVED'
  ELSE 'PRESELECTION'
END;

-- Verification query (run this to check migration success)
-- SELECT id, stage_name, status, is_confirmed_by_admin, is_top_40, is_semifinalist, is_finalist 
-- FROM public.candidates 
-- LIMIT 10;

-- SELECT id, current_phase, current_phase_new 
-- FROM public.system_control;
