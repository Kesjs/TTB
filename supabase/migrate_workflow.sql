-- ==========================================
-- MIGRATION WORKFLOW COMPLET - TOP TALENT BENIN
-- ==========================================

-- 1. Modifier le CHECK constraint sur candidates.status pour ajouter les nouveaux statuts
ALTER TABLE public.candidates 
DROP CONSTRAINT IF EXISTS candidates_status_check;

ALTER TABLE public.candidates 
ADD CONSTRAINT candidates_status_check 
CHECK (status IN ('pending_review', 'pre_approved', 'jury_selected', 'approved', 'rejected'));

-- 2. Ajouter les champs de tracking dans candidates
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS jury_selection_submitted BOOLEAN DEFAULT false;

ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS jury_submitted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS admin_confirmed_at TIMESTAMP WITH TIME ZONE;

-- 3. Ajouter les champs de tracking dans system_control (garder les phases existantes)
ALTER TABLE public.system_control 
ADD COLUMN IF NOT EXISTS jury_selection_submitted BOOLEAN DEFAULT false;

ALTER TABLE public.system_control 
ADD COLUMN IF NOT EXISTS jury_submitted_at TIMESTAMP WITH TIME ZONE;

-- 4. Créer la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('new_candidate', 'ready_for_jury', 'jury_submitted', 'published')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index pour optimiser les requêtes de notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 5. Activer RLS sur notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour notifications
DROP POLICY IF EXISTS "Les utilisateurs voient leurs propres notifications" ON public.notifications;
CREATE POLICY "Les utilisateurs voient leurs propres notifications" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Les utilisateurs peuvent marquer leurs notifications comme lues" ON public.notifications;
CREATE POLICY "Les utilisateurs peuvent marquer leurs notifications comme lues" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Le système peut créer des notifications" ON public.notifications;
CREATE POLICY "Le système peut créer des notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

-- 6. Fonction pour créer une notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (p_user_id, p_type, p_title, p_message)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fonction pour marquer une notification comme lue
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = true
    WHERE id = p_notification_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Fonction pour obtenir les notifications non lues d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_unread_notifications(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT n.id, n.type, n.title, n.message, n.created_at
    FROM public.notifications n
    WHERE n.user_id = p_user_id AND n.is_read = false
    ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Activer Realtime sur candidates (pour mise à jour automatique site public)
-- Note: Cette commande doit être exécutée dans le dashboard Supabase ou via API
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;

-- 10. Trigger pour créer automatiquement une notification quand un candidat soumet
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_candidate()
RETURNS TRIGGER AS $$
BEGIN
    -- Notifier tous les admins
    INSERT INTO public.notifications (user_id, type, title, message)
    SELECT p.id, 'new_candidate', 'Nouveau candidat en attente',
           'Un nouveau candidat a soumet sa vidéo et attend votre validation.'
    FROM public.profiles p
    WHERE p.role = 'admin';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_admin_on_new_candidate ON public.candidates;
CREATE TRIGGER trigger_notify_admin_on_new_candidate
AFTER INSERT ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_on_new_candidate();

-- 11. Trigger pour créer notification quand admin envoie au jury
CREATE OR REPLACE FUNCTION public.notify_jury_on_submission()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_phase = 'VOTES_TOP_40' AND OLD.current_phase != 'VOTES_TOP_40' THEN
        -- Notifier tous les jurés
        INSERT INTO public.notifications (user_id, type, title, message)
        SELECT p.id, 'ready_for_jury', 'Candidats prêts pour évaluation',
               'Les candidats pré-approuvés sont prêts pour votre évaluation.'
        FROM public.profiles p
        WHERE p.role = 'jury';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_jury_on_submission ON public.system_control;
CREATE TRIGGER trigger_notify_jury_on_submission
AFTER UPDATE OF current_phase ON public.system_control
FOR EACH ROW
EXECUTE FUNCTION public.notify_jury_on_submission();

-- 12. Trigger pour créer notification quand jury soumet sa sélection
CREATE OR REPLACE FUNCTION public.notify_admin_on_jury_submission()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.jury_selection_submitted = true AND OLD.jury_selection_submitted = false THEN
        -- Notifier tous les admins
        INSERT INTO public.notifications (user_id, type, title, message)
        SELECT p.id, 'jury_submitted', 'Sélection du jury soumise', 
           'Le jury a soumis sa sélection de 40 candidats. En attente de votre confirmation.'
        FROM public.profiles p
        WHERE p.role = 'admin';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Ce trigger sera ajouté après la mise à jour des actions server
-- CREATE TRIGGER trigger_notify_admin_on_jury_submission
-- AFTER UPDATE OF jury_selection_submitted ON public.candidates
-- FOR EACH ROW
-- EXECUTE FUNCTION public.notify_admin_on_jury_submission();

-- 13. Trigger pour créer notification quand admin publie
CREATE OR REPLACE FUNCTION public.notify_jury_on_publication()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_phase = 'SEMIFINAL' AND OLD.current_phase != 'SEMIFINAL' THEN
        -- Notifier tous les jurés
        INSERT INTO public.notifications (user_id, type, title, message)
        SELECT p.id, 'published', 'Sélection publiée ✅',
               'Votre sélection a été publiée sur le site public.'
        FROM public.profiles p
        WHERE p.role = 'jury';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_jury_on_publication ON public.system_control;
CREATE TRIGGER trigger_notify_jury_on_publication
AFTER UPDATE OF current_phase ON public.system_control
FOR EACH ROW
EXECUTE FUNCTION public.notify_jury_on_publication();
