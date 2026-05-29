-- ==========================================
-- MIGRATION: Ajouter le champ téléphone à la table candidates
-- ==========================================

-- Ajouter la colonne phone à la table candidates
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN public.candidates.phone IS 'Numéro de téléphone du candidat (format: +229 01 XX XX XX XX)';
