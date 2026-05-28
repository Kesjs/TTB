-- Migration script to update system_control phase values
-- Run this in Supabase SQL Editor to update the existing table constraint

-- First, drop the old CHECK constraint
ALTER TABLE public.system_control 
DROP CONSTRAINT IF EXISTS system_control_current_phase_check;

-- Then update any existing records to use new phase values
UPDATE public.system_control 
SET current_phase = 'preselection_open' 
WHERE current_phase = 'preselection';

-- Finally, add the new CHECK constraint with updated values
ALTER TABLE public.system_control 
ADD CONSTRAINT system_control_current_phase_check 
CHECK (current_phase IN ('preselection_open', 'preselection_closed', 'audition', 'semifinal', 'final', 'archived'));
