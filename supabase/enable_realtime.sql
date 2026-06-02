-- Activer Realtime sur la table system_control
ALTER PUBLICATION supabase_realtime ADD TABLE system_control;

-- Activer Realtime sur la table candidates pour mettre à jour les vues en temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE candidates;
