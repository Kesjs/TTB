-- Fix RLS policies on candidates table to ensure admins can see all candidates
-- including those with pending_review status

-- Drop existing policies on candidates
DROP POLICY IF EXISTS "Tout le monde peut voir les candidats approuvés" ON public.candidates;
DROP POLICY IF EXISTS "Les candidats voient leurs propres candidatures" ON public.candidates;
DROP POLICY IF EXISTS "Création de sa candidature" ON public.candidates;
DROP POLICY IF EXISTS "Les admins peuvent voir toutes les candidatures" ON public.candidates;
DROP POLICY IF EXISTS "Les admins peuvent modifier les candidatures" ON public.candidates;
DROP POLICY IF EXISTS "Les admins peuvent supprimer les candidatures" ON public.candidates;

-- Recreate policies with proper priority

-- 1. Public can only see approved candidates (most restrictive)
CREATE POLICY "Tout le monde peut voir les candidats approuvés" ON public.candidates 
FOR SELECT 
USING (status = 'approved');

-- 2. Candidates can see their own candidatures (including pending_review)
CREATE POLICY "Les candidats voient leurs propres candidatures" ON public.candidates 
FOR SELECT 
USING (profile_id = auth.uid());

-- 3. Admins can see ALL candidates regardless of status (overrides public policy)
CREATE POLICY "Les admins peuvent voir toutes les candidatures" ON public.candidates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Candidates can create their own candidature
CREATE POLICY "Création de sa candidature" ON public.candidates 
FOR INSERT 
WITH CHECK (profile_id = auth.uid());

-- 5. Admins can update candidates
CREATE POLICY "Les admins peuvent modifier les candidatures" ON public.candidates 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 6. Admins can delete candidates
CREATE POLICY "Les admins peuvent supprimer les candidatures" ON public.candidates 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
