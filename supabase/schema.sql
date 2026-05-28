-- ==========================================
-- SCHEMA DE BASE DE DONNEES - TOP TALENT BENIN
-- ==========================================

-- Désactiver les RLS temporairement si besoin (ou les activer par défaut)
-- 1. EXTENDED PROFILES (RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT DEFAULT 'visitor' CHECK (role IN ('visitor', 'candidate', 'jury', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. CANDIDATES SCHEMA (Avec statut strict de modération)
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    stage_name TEXT NOT NULL,
    discipline TEXT NOT NULL CHECK (discipline IN ('Chant', 'Danse', 'Humour', 'Théâtre', 'Magie', 'Acrobaties', 'Poésie', 'Arts Visuels')),
    region TEXT NOT NULL CHECK (region IN ('Alibori', 'Atacora', 'Atlantique', 'Borgou', 'Collines', 'Donga', 'Kouffo', 'Littoral', 'Mono', 'Ouémé', 'Plateau', 'Zou')),
    video_url TEXT NOT NULL, -- Lien direct vers Supabase Storage Bucket
    candidature_type TEXT DEFAULT 'solo' CHECK (candidature_type IN ('solo', 'group')),
    member_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending_review' NOT NULL CHECK (status IN ('pending_review', 'approved', 'rejected')),
    votes_count INT DEFAULT 0, -- Total votes received (aggregated from votes table)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TRANSACTIONAL REAL-TIME VOTES (Aucune auth requise pour voter)
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    vote_count INT NOT NULL DEFAULT 1,
    amount_fcfa NUMERIC NOT NULL,
    phone_payer TEXT NOT NULL, -- Numéro de paiement Mobile Money
    network TEXT NOT NULL CHECK (network IN ('MTN', 'MOOV')),
    transaction_ref TEXT UNIQUE NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
    phase TEXT NOT NULL CHECK (phase IN ('preselection', 'semifinal', 'final')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. JURY RATINGS SCHEMA (Phases 2, 3, 4)
CREATE TABLE IF NOT EXISTS public.jury_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    jury_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    score_technique NUMERIC CHECK (score_technique BETWEEN 0 AND 20),
    score_originalite NUMERIC CHECK (score_originalite BETWEEN 0 AND 20),
    score_presence NUMERIC CHECK (score_presence BETWEEN 0 AND 20),
    is_approved_preselection BOOLEAN DEFAULT false, -- Approbation spécifique du Jury après vote populaire
    phase TEXT NOT NULL CHECK (phase IN ('preselection', 'audition', 'semifinal', 'final')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(jury_id, candidate_id, phase)
);

-- 5. SYSTEM CONTROL ENVIRONMENT (Admin Remote Control)
CREATE TABLE IF NOT EXISTS public.system_control (
    id INT PRIMARY KEY DEFAULT 1,
    current_phase TEXT DEFAULT 'preselection_open' CHECK (current_phase IN ('preselection_open', 'preselection_closed', 'audition', 'semifinal', 'final', 'archived')),
    live_voting_candidate_id UUID REFERENCES public.candidates(id) NULL, -- Pour le vote en direct de la Phase 3
    is_voting_open BOOLEAN DEFAULT false,
    forced_tie_breaker_candidate_id UUID REFERENCES public.candidates(id) NULL -- Override manuel admin
);

-- 6. PARTNERS (Strategic Alliances)
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('institutionnel', 'innovation')),
    website_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- VUES ET FONCTIONS DE SCORE
-- ==========================================

-- Vue d'agrégation des scores du jury
CREATE OR REPLACE VIEW public.candidate_jury_averages AS
SELECT 
    candidate_id,
    phase,
    COUNT(jury_id) as jury_count,
    ROUND(AVG(score_technique), 2) as avg_technique,
    ROUND(AVG(score_originalite), 2) as avg_originalite,
    ROUND(AVG(score_presence), 2) as avg_presence,
    ROUND(AVG((score_technique + score_originalite + score_presence) / 3.0), 2) as total_jury_average
FROM 
    public.jury_ratings
GROUP BY 
    candidate_id, phase;

-- Function to increment candidate vote count (used by webhook)
CREATE OR REPLACE FUNCTION public.increment_candidate_votes(candidate_uuid UUID, vote_increment INT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.candidates
    SET votes_count = votes_count + vote_increment
    WHERE id = candidate_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update candidate status (admin only, bypasses RLS)
CREATE OR REPLACE FUNCTION public.update_candidate_status(candidate_uuid UUID, new_status TEXT)
RETURNS JSON AS $$
DECLARE
    user_id UUID;
    user_role TEXT;
BEGIN
    -- Get current user ID
    user_id := auth.uid();
    
    -- Debug: return user info if no user
    IF user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No authenticated user', 'user_id', user_id);
    END IF;
    
    -- Get user role
    SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
    
    -- Debug: return role info if not found
    IF user_role IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User profile not found', 'user_id', user_id);
    END IF;
    
    -- Verify user is admin
    IF user_role != 'admin' THEN
        RETURN json_build_object('success', false, 'error', 'User is not admin', 'user_id', user_id, 'role', user_role);
    END IF;
    
    -- Update candidate status
    UPDATE public.candidates
    SET status = new_status
    WHERE id = candidate_uuid;
    
    -- Check if row was updated
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Candidate not found', 'candidate_id', candidate_uuid);
    END IF;
    
    -- Return success
    RETURN json_build_object('success', true, 'candidate_id', candidate_uuid, 'new_status', new_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update candidate is_confirmed_by_admin (admin only, bypasses RLS)
CREATE OR REPLACE FUNCTION public.confirm_candidate_by_admin(candidate_uuid UUID, is_confirmed BOOLEAN)
RETURNS JSON AS $$
DECLARE
    user_id UUID;
    user_role TEXT;
BEGIN
    -- Get current user ID
    user_id := auth.uid();
    
    -- Debug: return user info if no user
    IF user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No authenticated user', 'user_id', user_id);
    END IF;
    
    -- Get user role
    SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
    
    -- Debug: return role info if not found
    IF user_role IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User profile not found', 'user_id', user_id);
    END IF;
    
    -- Verify user is admin
    IF user_role != 'admin' THEN
        RETURN json_build_object('success', false, 'error', 'User is not admin', 'user_id', user_id, 'role', user_role);
    END IF;
    
    -- Update candidate is_confirmed_by_admin
    UPDATE public.candidates
    SET is_confirmed_by_admin = is_confirmed
    WHERE id = candidate_uuid;
    
    -- Check if row was updated
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Candidate not found', 'candidate_id', candidate_uuid);
    END IF;
    
    -- Return success
    RETURN json_build_object('success', true, 'candidate_id', candidate_uuid, 'is_confirmed', is_confirmed);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get aggregated vote counts per candidate (optimized for dashboard)
CREATE OR REPLACE FUNCTION public.get_candidate_vote_counts()
RETURNS TABLE (
  candidate_id UUID,
  total_votes INT,
  total_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.candidate_id,
    COALESCE(SUM(v.vote_count), 0) as total_votes,
    COALESCE(SUM(v.amount_fcfa), 0) as total_amount
  FROM public.votes v
  WHERE v.payment_status = 'success'
  GROUP BY v.candidate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- TRIGGER: Sync profiles.role to auth.users.app_metadata
-- ==========================================

-- Function to update app_metadata when profile role changes
CREATE OR REPLACE FUNCTION public.handle_profile_role_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb),
        '{role}',
        to_jsonb(NEW.role)
    )
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration: Remove candidature_type and member_count from profiles if they exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'candidature_type'
    ) THEN
        ALTER TABLE public.profiles DROP COLUMN IF EXISTS candidature_type;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'member_count'
    ) THEN
        ALTER TABLE public.profiles DROP COLUMN IF EXISTS member_count;
    END IF;
END $$;

-- ==========================================
-- RPC FUNCTIONS
-- ==========================================

-- Function to get candidate vote counts
CREATE OR REPLACE FUNCTION public.get_candidate_vote_counts()
RETURNS TABLE (
    candidate_id UUID,
    total_votes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.candidate_id,
        COALESCE(SUM(v.vote_count), 0) as total_votes
    FROM public.votes v
    WHERE v.payment_status = 'success'
    GROUP BY v.candidate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on profiles INSERT and UPDATE
CREATE TRIGGER on_profile_role_change
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_role_update();

-- ==========================================
-- ROW LEVEL SECURITY (RLS) & POLITIQUES
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jury_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
DROP POLICY IF EXISTS "Lecture publique des profils" ON public.profiles;
DROP POLICY IF EXISTS "Modification par l'utilisateur de son profil" ON public.profiles;
DROP POLICY IF EXISTS "Création de son profil" ON public.profiles;

CREATE POLICY "Lecture publique des profils" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Modification par l'utilisateur de son profil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Création de son profil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Candidates
DROP POLICY IF EXISTS "Tout le monde peut voir les candidats approuvés" ON public.candidates;
DROP POLICY IF EXISTS "Les candidats voient leurs propres candidatures" ON public.candidates;
DROP POLICY IF EXISTS "Création de sa candidature" ON public.candidates;
DROP POLICY IF EXISTS "Les admins lisent et modèrent les candidatures" ON public.candidates;
DROP POLICY IF EXISTS "Les admins peuvent voir toutes les candidatures" ON public.candidates;
DROP POLICY IF EXISTS "Les admins peuvent modifier les candidatures" ON public.candidates;
DROP POLICY IF EXISTS "Les admins peuvent supprimer les candidatures" ON public.candidates;

CREATE POLICY "Tout le monde peut voir les candidats approuvés" ON public.candidates FOR SELECT USING (status = 'approved');
CREATE POLICY "Les candidats voient leurs propres candidatures" ON public.candidates FOR SELECT USING (
    profile_id = auth.uid()
);
CREATE POLICY "Création de sa candidature" ON public.candidates FOR INSERT WITH CHECK (
    profile_id = auth.uid()
);
CREATE POLICY "Les admins peuvent voir toutes les candidatures" ON public.candidates FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Les admins peuvent modifier les candidatures" ON public.candidates FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Les admins peuvent supprimer les candidatures" ON public.candidates FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 3. Votes (SECURITY FIX: No public insert allowed)
CREATE POLICY "Lecture publique des votes réussis" ON public.votes FOR SELECT USING (payment_status = 'success');
CREATE POLICY "Insertion uniquement via service_role" ON public.votes FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
);
CREATE POLICY "Modification uniquement via service_role" ON public.votes FOR UPDATE USING (
    auth.role() = 'service_role'
);

-- 4. Jury Ratings
CREATE POLICY "Lecture par les membres du jury et admin" ON public.jury_ratings FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('jury', 'admin'))
);
CREATE POLICY "Insertion et modification par le jury" ON public.jury_ratings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'jury')
);

-- 5. System Control
CREATE POLICY "Lecture publique du contrôle système" ON public.system_control FOR SELECT USING (true);
CREATE POLICY "Modification réservée aux admins" ON public.system_control FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. RPC Functions Security
GRANT EXECUTE ON FUNCTION public.get_candidate_vote_counts() TO anon, authenticated;

-- 6. Partners
CREATE POLICY "Lecture publique des partenaires" ON public.partners FOR SELECT USING (true);
CREATE POLICY "Modification réservée aux admins" ON public.partners FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ==========================================
-- DONNEES DE TEST (SEEDS)
-- ==========================================

-- Profils Mock (Pour Jury, Admin et Candidats)
-- UUIDs générés de façon stable pour le mock
-- admin_id = '00000000-0000-0000-0000-000000000001'
-- jury_id_1 = '00000000-0000-0000-0000-000000000002'
-- jury_id_2 = '00000000-0000-0000-0000-000000000003'
-- candidate_user_1 = '00000000-0000-0000-0000-000000000010'
-- candidate_user_2 = '00000000-0000-0000-0000-000000000011'
-- candidate_user_3 = '00000000-0000-0000-0000-000000000012'

-- Remarque: Dans un environnement Supabase local, les profils dépendent d'auth.users.
-- Ce script sert de référence de schéma. Pour le développement sans Supabase opérationnelle,
-- l'application gèrera un mock local fluide basé sur localStorage et state React.

-- ==========================================
-- DONNEES DE TEST POUR DASHBOARD ADMIN
-- ==========================================

-- ==========================================
-- SUPABASE STORAGE POUR VIDEOS
-- ==========================================

-- Create storage bucket for candidate videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-videos', 'candidate-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for candidate videos
-- Allow public read access to videos
CREATE POLICY "Les vidéos sont accessibles publiquement"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'candidate-videos');

-- Allow candidates to upload their own videos
CREATE POLICY "Les candidats peuvent uploader leurs vidéos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'candidate-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow candidates to delete their own videos
CREATE POLICY "Les candidats peuvent supprimer leurs vidéos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'candidate-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- NOTE: Les profiles dépendent de auth.users (Supabase Auth).
-- Pour créer des données de test, utilisez l'inscription réelle via l'application
-- ou créez d'abord les utilisateurs dans auth.users via Supabase Dashboard.

-- Pour tester le dashboard admin rapidement, voici une approche alternative :
-- 1. Créez un compte candidat réel via /candidature
-- 2. Le candidat apparaîtra automatiquement dans l'onglet Modération

-- Si vous voulez quand même créer des données de test manuellement,
-- vous devez d'abord créer l'utilisateur dans auth.users via :
-- https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users

-- Exemple de candidat de test (nécessite un profile_id valide existant)
-- Remplacez VOTRE_PROFILE_ID par un ID réel de profile existant (ex: votre admin)

-- DELETE FROM public.candidates WHERE id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

-- INSERT INTO public.candidates (id, profile_id, stage_name, discipline, region, status, candidature_type, video_url, member_count, created_at)
-- VALUES (
--     'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
--     'VOTRE_PROFILE_ID', -- Remplacez par un ID de profile existant
--     'Alafia Crew',
--     'Danse',
--     'Littoral',
--     'pending_review',
--     'group',
--     'https://www.w3schools.com/html/mov_bbb.mp4',
--     1,
--     NOW()
-- )
-- ON CONFLICT (id) DO NOTHING;
