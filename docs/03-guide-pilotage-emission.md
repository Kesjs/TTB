# Document de Pilotage de l'Émission - Top Talent Benin

## Table des matières
1. [Guide de l'Admin](#guide-de-ladmin)
2. [Guide du Jury](#guide-du-jury)
3. [Schéma de Données](#schéma-de-données)
4. [Dépannage FAQ Technique](#dépannage-faq-technique)

---

## Guide de l'Admin

### Accès au Dashboard Admin

**URL** : `/dashboard/admin`

**Prérequis** :
- Compte admin créé dans Supabase
- Rôle 'admin' dans la table profiles
- Connexion via email/mot de passe

### Structure du Dashboard Admin

Le dashboard admin est divisé en 5 onglets principaux :

#### 1. Onglet JURY
**Objectif** : Gérer les membres du jury

**Fonctionnalités** :
- **Créer un juré** :
  - Email (unique)
  - Mot de passe (généré ou personnalisé)
  - Nom complet
  - Téléphone
  - Avatar URL (optionnel)
  
- **Modifier un juré** :
  - Mise à jour des informations
  - Changement de mot de passe
  
- **Supprimer un juré** :
  - Confirmation requise
  - Suppression cascade des notes associées

**Workflow de création** :
1. Cliquer sur "Ajouter un juré"
2. Remplir le formulaire
3. Cliquer sur "Créer"
4. Le système crée automatiquement :
   - Un utilisateur dans auth.users
   - Un profil dans profiles avec role='jury'
   - Envoie les identifiants par email (optionnel)

#### 2. Onglet MODÉRATION
**Objectif** : Valider les candidatures soumises

**Fonctionnalités** :
- **Filtrage** :
  - Par statut : pending, approved, rejected
  - Par catégorie artistique
  - Par département
  
- **Actions sur candidats** :
  - **Approuver** : Change le statut à 'approved'
  - **Rejeter** : Change le statut à 'rejected'
  - **Confirmer** : Active is_confirmed_by_admin
  - **Supprimer** : Supprime définitivement le candidat
  
- **Visualisation** :
  - Vidéo de performance
  - Image de couverture
  - Informations du candidat
  - Nombre de votes

**Workflow de modération** :
1. Accéder à l'onglet "Modération"
2. Filtrer par "pending"
3. Visualiser la vidéo du candidat
4. Décider : Approuver ou Rejeter
5. Confirmer l'action

**Bonnes pratiques** :
- Vérifier la qualité de la vidéo
- Contrôler le contenu (pas de contenu inapproprié)
- Vérifier les informations du candidat
- Traiter les candidatures dans l'ordre de soumission

#### 3. Onglet PHASES
**Objectif** : Piloter les phases de la compétition

**Phases disponibles** :
1. **PRÉSELECTION** : Période d'inscription
2. **VOTES_TOP_40** : Vote public pour Top 40
3. **SEMIFINAL** : Demi-finale Top 20
4. **FINAL** : Grande finale
5. **ARCHIVED** : Archivage post-compétition

**Contrôles** :
- **Sélection de la phase** : Dropdown avec les 5 phases
- **Ouverture des votes** : Toggle is_voting_open
- **Mode maintenance** : Toggle is_maintenance_mode
- **Candidat en direct** : Sélection pour vote live
- **Tie-breaker** : Candidat prioritaire en cas d'égalité

**Workflow de changement de phase** :
1. Cliquer sur l'onglet "Phases"
2. Sélectionner la nouvelle phase dans le dropdown
3. Confirmer le changement
4. Le système met à jour system_control
5. Tous les utilisateurs sont notifiés en temps réel

**Impact du changement de phase** :
- **Candidats** : Interface adaptée (ex: formulaire fermé hors PRÉSELECTION)
- **Jury** : Liste de candidats filtrée par phase
- **Public** : Vote ouvert/fermé selon is_voting_open
- **Admin** : Dashboard adapté à la phase

**Bonnes pratiques** :
- Prévenir les équipes avant le changement
- Vérifier que toutes les actions de la phase actuelle sont terminées
- Sauvegarder les données avant changement majeur
- Tester en mode maintenance si nécessaire

#### 4. Onglet SETTINGS
**Objectif** : Configuration globale de la plateforme

**Paramètres configurables** :
- **Contact** :
  - Email de support
  - Numéro WhatsApp
- **Réseaux sociaux** :
  - Facebook
  - Instagram
  - YouTube

**Workflow de configuration** :
1. Accéder à l'onglet "Settings"
2. Modifier les champs souhaités
3. Cliquer sur "Sauvegarder"
4. Les modifications sont appliquées immédiatement

#### 5. Onglet PREVIEW
**Objectif** : Aperçu du site public

**Fonctionnalités** :
- Iframe intégrant le site public
- Bouton de rafraîchissement
- Visualisation en temps réel des changements

### Gestion des candidats en temps réel

#### Statistiques disponibles
- **Total candidats** : Nombre total de candidatures
- **Par statut** : pending, approved, rejected
- **Par phase** : Top 40, Top 20, Finalistes
- **Votes** : Nombre total de votes par candidat

#### Actions rapides
- **Recherche** : Par nom de scène
- **Tri** : Par date, par votes, par note jury
- **Export** : Export CSV des candidats (optionnel)

### Surveillance des votes

#### Métriques disponibles
- **Votes totaux** : Somme de tous les votes
- **Votes par candidat** : Détaillé par candidat
- **Montant total** : Somme en FCFA
- **Transactions** : Par statut (pending, success, failed)

#### Alertes
- **Transaction échouée** : Notification en cas d'échec
- **Volume anormal** : Alertes en cas de pic de votes
- **Candidat suspect** : Pattern de votes inhabituel

### Gestion des incidents

#### Procédure en cas de problème
1. **Activer le mode maintenance** : Onglet Phases → Toggle maintenance
2. **Identifier le problème** : Logs, console, feedback utilisateurs
3. **Appliquer la solution** : Fix technique ou workaround
4. **Tester** : Vérifier la résolution
5. **Désactiver maintenance** : Rétablir le service

#### Communication
- **Utilisateurs** : Message sur la page d'accueil
- **Équipe** : Notification via Slack/Email
- **Support** : Mise à jour du statut

---

## Guide du Jury

### Accès au Dashboard Jury

**URL** : `/dashboard/jury`

**Prérequis** :
- Compte jury créé par l'admin
- Rôle 'jury' dans la table profiles
- Connexion via email/mot de passe

### Structure du Dashboard Jury

Le dashboard jury est divisé en 4 onglets :

#### 1. Onglet SÉLECTION (Phase PRÉSELECTION uniquement)
**Objectif** : Sélectionner les Top 40 candidats

**Fonctionnalités** :
- **Liste des candidats approuvés** : Tous les candidats validés par l'admin
- **Sélection multiple** : Checkbox pour sélectionner plusieurs candidats
- **Confirmation** : Bouton pour valider la sélection

**Workflow de sélection** :
1. Visualiser les vidéos des candidats
2. Cocher les candidats à retenir
3. Cliquer sur "Confirmer la sélection"
4. Les candidats sélectionnés passent is_top_40 = true

**Critères de sélection** :
- Qualité technique de la performance
- Originalité du talent
- Potentiel artistique
- Présence scenique

#### 2. Onglet ÉVALUATION
**Objectif** : Noter les candidats selon la phase actuelle

**Fonctionnalités** :
- **Liste des candidats** : Filtrée par phase actuelle
- **Barre de progression** : X/Y candidats évalués
- **Formulaire de notation** :
  - Technique (0-20)
  - Originalité (0-20)
  - Présence (0-20)
- **Historique des notes** : Voir les notes précédentes

**Workflow d'évaluation** :
1. Sélectionner un candidat dans la liste
2. Visionner la vidéo de performance
3. Attribuer une note pour chaque critère
4. Cliquer sur "Enregistrer la note"
5. Confirmer l'enregistrement

**Système de notation** :

| Critère | Description | Échelle |
|---------|-------------|---------|
| **Technique** | Compétence technique, maîtrise de l'art | 0-20 |
| **Originalité** | Créativité, innovation, unicité | 0-20 |
| **Présence** | Charisme, mise en scène, communication | 0-20 |

**Calcul de la moyenne** :
```
Moyenne = (Technique + Originalité + Présence) / 3
```

**Règles** :
- Un juré ne peut noter qu'une fois par candidat par phase
- Les notes sont modifiables jusqu'à confirmation
- La moyenne est calculée automatiquement
- Les notes sont anonymisées pour les autres jurés

#### 3. Onglet HISTORIQUE
**Objectif** : Consulter les notes passées

**Fonctionnalités** :
- **Filtrage par phase** : Voir les notes par phase
- **Détail par candidat** : Voir toutes les notes d'un candidat
- **Comparaison** : Comparer les notes entre phases

#### 4. Onglet STATISTIQUES
**Objectif** : Vue d'ensemble des évaluations

**Métriques disponibles** :
- **Candidats évalués** : X/Y pour la phase actuelle
- **Moyenne par critère** : Moyenne globale du jury
- **Top performers** : Candidats les mieux notés
- **Distribution** : Répartition des notes

### Roadmap des phases

Le dashboard affiche une roadmap visuelle des phases :

```
PRÉSELECTION → VOTES_TOP_40 → SEMIFINAL → FINAL
     ↓              ↓              ↓          ↓
   Sélection      Top 40        Top 20     Gagnant
```

La phase actuelle est mise en évidence.

### Bonnes pratiques pour le jury

#### Avant l'évaluation
- Visionner toutes les vidéos de la phase
- Se familiariser avec les critères de notation
- Préparer un environnement calme

#### Pendant l'évaluation
- Noter de manière objective
- Éviter les biais personnels
- Prendre des notes si nécessaire
- Prendre le temps de bien visionner

#### Après l'évaluation
- Vérifier les notes avant confirmation
- Signaler tout problème technique
- Participer aux débats collectifs (si applicable)

### Communication avec l'admin

#### Signalement de problèmes
- **Candidat absent** : Signaler à l'admin
- **Vidéo défectueuse** : Demander le remplacement
- **Problème technique** : Contacter le support

#### Feedback
- Suggestions d'amélioration du système
- Commentaires sur le processus
- Demandes de clarification

---

## Schéma de Données

### Vue d'ensemble

Le système utilise 6 tables principales dans Supabase PostgreSQL :

```
auth.users (Supabase Auth)
    ↓
profiles (Profils utilisateurs)
    ↓
candidates (Candidatures)
    ↓
jury_ratings (Notes du jury)
    ↓
votes (Votes du public)
    ↓
system_control (Contrôle système)
```

### Tables détaillées

#### 1. profiles
**Description** : Profils utilisateurs étendus

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Référence auth.users (PK) |
| full_name | TEXT | Nom complet |
| phone | TEXT | Numéro de téléphone |
| role | TEXT | 'visitor', 'candidate', 'jury', 'admin' |
| avatar_url | TEXT | URL de l'avatar (optionnel) |
| created_at | TIMESTAMP | Date de création |

**Relations** :
- auth.users (1:1)
- candidates (1:N)

**Contraintes** :
- role IN ('visitor', 'candidate', 'jury', 'admin')

#### 2. candidates
**Description** : Candidatures des talents

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique (PK) |
| profile_id | UUID | Référence profiles (FK) |
| stage_name | TEXT | Nom de scène |
| discipline | TEXT | Discipline artistique |
| region | TEXT | Département du Bénin |
| video_url | TEXT | URL de la vidéo (Supabase Storage) |
| cover_image_url | TEXT | URL de l'image de couverture |
| phone | TEXT | Numéro de téléphone |
| candidature_type | TEXT | 'solo' ou 'group' |
| member_count | INTEGER | Nombre de membres |
| status | TEXT | 'pending_review', 'approved', 'rejected' |
| votes_count | INTEGER | Total des votes (agrégé) |
| is_confirmed_by_admin | BOOLEAN | Confirmation admin |
| is_top_40 | BOOLEAN | Sélectionné Top 40 |
| is_semifinalist | BOOLEAN | Sélectionné Top 20 |
| is_finalist | BOOLEAN | Finaliste |
| bio | TEXT | Biographie courte |
| created_at | TIMESTAMP | Date de création |

**Relations** :
- profiles (N:1)
- votes (1:N)
- jury_ratings (1:N)

**Contraintes** :
- discipline IN ('Musique', 'Danse', 'Humour', 'Art_Oratoire', 'Digital', 'Cirque', 'Sport', 'Arts_Visuels')
- region IN (12 départements du Bénin)
- status IN ('pending_review', 'approved', 'rejected')

#### 3. votes
**Description** : Votes du public via Mobile Money

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique (PK) |
| candidate_id | UUID | Référence candidates (FK) |
| vote_count | INTEGER | Nombre de votes |
| amount_fcfa | NUMERIC | Montant en FCFA |
| phone_payer | TEXT | Numéro du payeur |
| network | TEXT | 'MTN' ou 'MOOV' |
| transaction_ref | TEXT | Référence unique FedaPay |
| payment_status | TEXT | 'pending', 'success', 'failed' |
| phase | TEXT | 'preselection', 'audition', 'semifinal', 'final' |
| created_at | TIMESTAMP | Date du vote |

**Relations** :
- candidates (N:1)

**Contraintes** :
- network IN ('MTN', 'MOOV')
- payment_status IN ('pending', 'success', 'failed')
- phase IN ('preselection', 'audition', 'semifinal', 'final')
- transaction_ref UNIQUE

#### 4. jury_ratings
**Description** : Notes attribuées par le jury

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique (PK) |
| jury_id | UUID | Référence profiles (FK) |
| candidate_id | UUID | Référence candidates (FK) |
| score_technique | NUMERIC | Note technique (0-20) |
| score_originalite | NUMERIC | Note originalité (0-20) |
| score_presence | NUMERIC | Note présence (0-20) |
| is_approved_preselection | BOOLEAN | Validation PRÉSELECTION |
| phase | TEXT | Phase de notation |
| created_at | TIMESTAMP | Date de notation |

**Relations** :
- profiles (jury) (N:1)
- candidates (N:1)

**Contraintes** :
- score_technique BETWEEN 0 AND 20
- score_originalite BETWEEN 0 AND 20
- score_presence BETWEEN 0 AND 20
- phase IN ('preselection', 'audition', 'semifinal', 'final')
- UNIQUE(jury_id, candidate_id, phase)

#### 5. system_control
**Description** : Contrôle global du système

| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER | Identifiant (PK, toujours 1) |
| current_phase | TEXT | Phase actuelle |
| current_phase_new | TEXT | Nouvelle phase (migration) |
| live_voting_candidate_id | UUID | Candidat en vote live |
| is_voting_open | BOOLEAN | Vote public ouvert |
| forced_tie_breaker_candidate_id | UUID | Candidat prioritaire |
| is_maintenance_mode | BOOLEAN | Mode maintenance |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de mise à jour |

**Contraintes** :
- current_phase IN ('preselection_open', 'preselection_closed', 'audition', 'semifinal', 'final', 'archived')
- id = 1 (single row table)

#### 6. partners
**Description** : Partenaires de l'émission

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique (PK) |
| name | TEXT | Nom du partenaire |
| logo_url | TEXT | URL du logo |
| category | TEXT | 'institutionnel' ou 'innovation' |
| website_url | TEXT | Site web (optionnel) |
| created_at | TIMESTAMP | Date de création |

**Contraintes** :
- category IN ('institutionnel', 'innovation')

### Vues

#### candidate_jury_averages
**Description** : Vue agrégée des moyennes jury

```sql
SELECT 
    candidate_id,
    phase,
    COUNT(jury_id) as jury_count,
    ROUND(AVG(score_technique), 2) as avg_technique,
    ROUND(AVG(score_originalite), 2) as avg_originalite,
    ROUND(AVG(score_presence), 2) as avg_presence,
    ROUND(AVG((score_technique + score_originalite + score_presence) / 3.0), 2) as total_jury_average
FROM jury_ratings
GROUP BY candidate_id, phase
```

### Index

**Candidates** :
- idx_candidates_status
- idx_candidates_stage_name
- idx_candidates_profile_id

**Votes** :
- idx_votes_candidate_id
- idx_votes_payment_status
- idx_votes_phase

**Jury ratings** :
- idx_jury_ratings_candidate_id
- idx_jury_ratings_jury_id
- idx_jury_ratings_phase

---

## Dépannage FAQ Technique

### Gestion des sessions

#### Problème : "Session expirée" ou "Non connecté"
**Symptômes** :
- Redirection vers la page de connexion
- Impossible d'accéder aux dashboards

**Causes possibles** :
- Cookie expiré ou supprimé
- Token Supabase invalide
- Problème de synchronisation

**Solutions** :
1. **Déconnexion et reconnexion** :
   - Cliquer sur "Déconnexion"
   - Se reconnecter avec identifiants
   
2. **Vider le cache** :
   - Supprimer les cookies du navigateur
   - Vider le localStorage
   - Recharger la page

3. **Vérifier la configuration** :
   - Vérifier NEXT_PUBLIC_SUPABASE_URL
   - Vérifier NEXT_PUBLIC_SUPABASE_ANON_KEY

**Prévention** :
- Implémenter un refresh automatique des tokens
- Utiliser des cookies avec expiration appropriée
- Surveiller les logs d'authentification

#### Problème : "Rôle non reconnu"
**Symptômes** :
- Redirection incorrecte après connexion
- Accès refusé aux dashboards

**Causes possibles** :
- Rôle non synchronisé dans auth.users.app_metadata
- Trigger handle_profile_role_update non exécuté
- Incohérence entre profiles et auth.users

**Solutions** :
1. **Vérifier le profil** :
   ```sql
   SELECT * FROM profiles WHERE id = 'user_id';
   ```

2. **Vérifier app_metadata** :
   ```sql
   SELECT raw_app_meta_data FROM auth.users WHERE id = 'user_id';
   ```

3. **Synchroniser manuellement** :
   ```sql
   UPDATE auth.users
   SET raw_app_meta_data = jsonb_set(raw_app_meta_data, '{role}', '"jury"')
   WHERE id = 'user_id';
   ```

**Prévention** :
- Vérifier que le trigger est actif
- Tester la création de nouveaux utilisateurs
- Surveiller les logs du trigger

### Erreurs de casse sur les phases

#### Problème : "Phase invalide" ou "Phase non reconnue"
**Symptômes** :
- Erreur lors du changement de phase
- Interface ne se met pas à jour

**Causes possibles** :
- Incohérence entre TypeScript et SQL
- current_phase vs current_phase_new
- Conversion majuscule/minuscule

**Solutions** :
1. **Vérifier la phase actuelle** :
   ```sql
   SELECT * FROM system_control WHERE id = 1;
   ```

2. **Utiliser les helpers** :
   ```typescript
   toSqlPhase('PRESELECTION') // 'preselection'
   fromSqlPhase('preselection') // 'PRESELECTION'
   ```

3. **Mettre à jour manuellement** :
   ```sql
   UPDATE system_control
   SET current_phase_new = 'preselection'
   WHERE id = 1;
   ```

**Prévention** :
- Toujours utiliser les helpers de conversion
- Documenter les valeurs valides
- Tester les changements de phase

### Connexion WebSocket / Real-time

#### Problème : "Mises à jour non synchronisées"
**Symptômes** :
- Changements non visibles en temps réel
- Nécessité de recharger la page

**Causes possibles** :
- Realtime non activé sur la table
- Subscription incorrecte
- Problème réseau

**Solutions** :
1. **Activer Realtime** :
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE system_control;
   ```

2. **Vérifier la subscription** :
   ```typescript
   const channel = supabase
     .channel('system_control_changes')
     .on('postgres_changes', { event: 'UPDATE', table: 'system_control' }, callback)
     .subscribe()
   ```

3. **Fallback sur localStorage** :
   - Utiliser CustomEvent comme fallback
   - Implémenter un polling de secours

**Prévention** :
- Activer Realtime sur les tables critiques
- Tester les subscriptions
- Implémenter des fallbacks

### Upload de fichiers

#### Problème : "Échec de l'upload vidéo"
**Symptômes** :
- Erreur lors de la soumission du formulaire
- Vidéo non uploadée

**Causes possibles** :
- Fichier trop volumineux (> 50 Mo)
- Format non supporté
- Permissions Storage insuffisantes
- Quota dépassé

**Solutions** :
1. **Vérifier le fichier** :
   - Taille < 50 Mo
   - Format MP4 ou MOV
   
2. **Vérifier les permissions Storage** :
   ```sql
   SELECT * FROM storage.policies WHERE bucket_id = 'candidate-videos';
   ```

3. **Vérifier le quota** :
   - Consulter le dashboard Supabase
   - Nettoyer les anciens fichiers si nécessaire

**Prévention** :
- Valider le fichier côté client
- Afficher des messages d'erreur clairs
- Surveiller l'utilisation du storage

### RLS (Row Level Security)

#### Problème : "Accès refusé" ou "Permission denied"
**Symptômes** :
- Impossible de lire/écrire des données
- Erreur 403 ou 401

**Causes possibles** :
- Policy RLS trop restrictive
- Rôle incorrect dans profiles
- Policy mal configurée

**Solutions** :
1. **Vérifier les policies** :
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'candidates';
   ```

2. **Vérifier le rôle** :
   ```sql
   SELECT role FROM profiles WHERE id = auth.uid();
   ```

3. **Désactiver RLS temporairement** (dev uniquement) :
   ```sql
   ALTER TABLE candidates DISABLE ROW LEVEL SECURITY;
   ```

4. **Utiliser les RPC functions** :
   - update_candidate_status
   - confirm_candidate_by_admin

**Prévention** :
- Tester les policies en dev
- Documenter les permissions
- Utiliser des RPC pour les ops admin

### Webhook FedaPay

#### Problème : "Vote non enregistré"
**Symptômes** :
- Paiement réussi mais vote non comptabilisé
- Transaction en statut 'pending'

**Causes possibles** :
- Webhook non reçu
- Signature invalide
- Erreur dans le traitement

**Solutions** :
1. **Vérifier les logs** :
   - Logs du serveur API
   - Logs Supabase Functions
   
2. **Vérifier la transaction** :
   ```sql
   SELECT * FROM votes WHERE transaction_ref = 'TXN-XXX';
   ```

3. **Traiter manuellement** :
   - Mettre à jour payment_status
   - Appeler increment_candidate_votes

**Prévention** :
- Implémenter un retry mechanism
- Logger toutes les transactions
- Surveiller les webhooks

### Performance

#### Problème : "Lenteur du dashboard"
**Symptômes** :
- Chargement lent des données
- Interface non responsive

**Causes possibles** :
- Requêtes non optimisées
- Manque d'index
- Trop de données chargées

**Solutions** :
1. **Ajouter des index** :
   ```sql
   CREATE INDEX idx_candidates_status ON candidates(status);
   ```

2. **Optimiser les requêtes** :
   - Utiliser SELECT avec colonnes spécifiques
   - Implémenter la pagination
   - Cacher les résultats

3. **Utiliser les RPC functions** :
   - get_candidate_vote_counts pour l'agrégation

**Prévention** :
- Surveiller les performances
- Utiliser EXPLAIN ANALYZE
- Implémenter le caching

### Mobile Money

#### Problème : "Échec du paiement"
**Symptômes** :
- Transaction FedaPay échoue
- USSD Push non reçu

**Causes possibles** :
- Solde insuffisant
- Numéro invalide
- Problème opérateur

**Solutions** :
1. **Vérifier le numéro** :
   - 8 chiffres
   - Format béninois
   
2. **Vérifier la configuration FedaPay** :
   - API key valide
   - Secret key correcte
   
3. **Tester avec un petit montant** :
   - 1 vote (500 FCFA)

**Prévention** :
- Valider le numéro côté client
- Afficher des messages clairs
- Proposer un retry

### Développement

#### Problème : "Mode mock non fonctionnel"
**Symptômes** :
- Données non sauvegardées
- localStorage vide

**Causes possibles** :
- Supabase configuré mais inaccessible
- initLocalStorage non appelé
- Browser bloque localStorage

**Solutions** :
1. **Vérifier la configuration** :
   ```typescript
   console.log('Supabase configured:', !!supabase)
   ```

2. **Forcer le mode mock** :
   - Commenter la configuration Supabase
   - Utiliser uniquement localStorage

3. **Vérifier localStorage** :
   ```javascript
   console.log(localStorage.getItem('ttb_candidates'))
   ```

**Prévention** :
- Documenter le mode mock
- Tester sans Supabase
- Fournir des données de test

### Logs et Monitoring

#### Où trouver les logs ?

**Frontend** :
- Console du navigateur (F12)
- Network tab pour les requêtes

**Backend** :
- Supabase Dashboard → Logs
- Vercel Logs (si déployé)
- Server console en dev

**Base de données** :
- Supabase Dashboard → Database → Logs
- Query performance insights

#### Logs utiles

**Authentification** :
```
[Auth] Sign-in successful
[Auth] Session cleared
```

**Database** :
```
[DB] Candidates query success
[DB] Error fetching candidates
```

**Server Actions** :
```
[Server Action] updateCandidateStatus - Attempting to update candidate
[Server Action] updateCandidateStatus - Success
```

### Contact Support

**En cas de problème non résolu** :

1. **Collecter les informations** :
   - Screenshots des erreurs
   - Logs console
   - Étapes pour reproduire
   - Environnement (dev/prod)

2. **Contacter l'équipe technique** :
   - Email : support@toptalentbenin.com
   - WhatsApp : +229 XX XX XX XX
   - Slack : #tech-support

3. **Urgences** :
   - Mode maintenance activé
   - Communication aux utilisateurs
   - Escalation aux responsables

---

## Checklist de lancement

### Avant le lancement

- [ ] Créer les comptes admin
- [ ] Créer les comptes jury
- [ ] Configurer FedaPay
- [ ] Tester le flux de candidature
- [ ] Tester le flux de vote
- [ ] Tester le flux de notation
- [ ] Vérifier les RLS policies
- [ ] Activer Realtime
- [ ] Configurer le mode maintenance
- [ ] Préparer les communications

### Pendant la phase PRÉSELECTION

- [ ] Surveiller les candidatures
- [ ] Modérer les contenus
- [ ] Communiquer avec les candidats
- [ ] Préparer le jury
- [ ] Planifier la transition

### Pendant les votes

- [ ] Surveiller les transactions
- [ ] Vérifier les webhooks
- [ ] Communiquer les statistiques
- [ ] Gérer les incidents
- [ ] Préparer la phase suivante

### Après la compétition

- [ ] Archiver les données
- [ ] Générer les rapports
- [ ] Remercier les participants
- [ ] Analyser les métriques
- [ ] Préparer la prochaine édition

---

## Glossaire

- **RLS** : Row Level Security - Sécurité au niveau des lignes dans PostgreSQL
- **RPC** : Remote Procedure Call - Fonctions PostgreSQL appelables depuis le client
- **BaaS** : Backend as a Service - Supabase comme service backend
- **USSD** : Unstructured Supplementary Service Data - Protocole pour Mobile Money
- **Webhook** : Callback HTTP pour les notifications asynchrones
- **Realtime** : Synchronisation en temps réel via WebSockets
- **Middleware** : Fonction exécutée avant les routes Next.js
- **Server Action** : Fonction serveur exécutable depuis le client
