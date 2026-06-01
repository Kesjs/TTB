-- ==========================================
-- MISE À JOUR DES POLITIQUES RLS - WORKFLOW
-- ==========================================

-- 1. Supprimer les anciennes politiques sur candidates
DROP POLICY IF EXISTS "Tout le monde peut voir les candidats approuvés" ON public.candidates;
DROP POLICY IF EXISTS "Les candidats voient leurs propres candidatures" ON public.candidates;
DROP POLICY IF EXISTS "Création de sa candidature" ON public.candidates;
DROP POLICY IF EXISTS "Les admins peuvent voir toutes les candidatures" ON public.candidates;
DROP POLICY IF EXISTS "Les admins peuvent modifier les candidatures" ON public.candidates;
DROP POLICY IF EXISTS "Les admins peuvent supprimer les candidatures" ON public.candidates;

-- 2. Créer les nouvelles politiques RLS pour candidates

-- Public : ne voit que les approved
CREATE POLICY "Public voit les candidats approuvés" ON public.candidates 
FOR SELECT USING (status = 'approved');

-- Candidats : voient leurs propres candidatures (tous statuts)
CREATE POLICY "Les candidats voient leurs propres candidatures" ON public.candidates 
FOR SELECT USING (
    profile_id = auth.uid()
);

-- Création de sa candidature
CREATE POLICY "Création de sa candidature" ON public.candidates 
FOR INSERT WITH CHECK (
    profile_id = auth.uid()
);

-- Admin : voit toutes les candidatures
CREATE POLICY "Les admins peuvent voir toutes les candidatures" ON public.candidates 
FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admin : peut modifier les candidatures
CREATE POLICY "Les admins peuvent modifier les candidatures" ON public.candidates 
FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admin : peut supprimer les candidatures
CREATE POLICY "Les admins peuvent supprimer les candidatures" ON public.candidates 
FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Jury : voit les pre_approved et jury_selected
CREATE POLICY "Le jury voit les candidats pré-approuvés et sélectionnés" ON public.candidates 
FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'jury' 
    AND status IN ('pre_approved', 'jury_selected')
);

-- Jury : peut modifier les pre_approved (pour sélectionner/désélectionner)
-- VERROU : ne peut pas modifier si jury_selection_submitted = true
CREATE POLICY "Le jury peut modifier les pré-approuvés" ON public.candidates 
FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'jury'
    AND status = 'pre_approved'
    AND (SELECT jury_selection_submitted FROM public.system_control WHERE id = 1) = false
) WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'jury'
    AND status IN ('pre_approved', 'jury_selected')
);

-- 3. Mettre à jour les politiques RLS pour jury_ratings (ajouter verrou de soumission)

DROP POLICY IF EXISTS "Lecture par les membres du jury et admin" ON public.jury_ratings;
DROP POLICY IF EXISTS "Insertion et modification par le jury" ON public.jury_ratings;

CREATE POLICY "Lecture par les membres du jury et admin" ON public.jury_ratings 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('jury', 'admin'))
);

CREATE POLICY "Insertion et modification par le jury" ON public.jury_ratings 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'jury')
    AND (SELECT jury_selection_submitted FROM public.system_control WHERE id = 1) = false
);
