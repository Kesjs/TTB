# Documentation Complète - Top Talent Benin

**Version** : 1.0  
**Date** : 29 mai 2026  
**Projet** : Top Talent Benin 2026

---

## Table des matières

- [Partie 1 : Documentation Fonctionnelle](#partie-1--documentation-fonctionnelle)
  - [Vue d'ensemble du système](#vue-densemble-du-système)
  - [Parcours utilisateurs](#parcours-utilisateurs)
  - [Règles de gestion métier](#règles-de-gestion-métier)
  - [Phases de la compétition](#phases-de-la-compétition)
  - [Workflow des candidatures](#workflow-des-candidatures)

- [Partie 2 : Documentation Technique](#partie-2--documentation-technique)
  - [Architecture technique](#architecture-technique)
  - [Workflow de données](#workflow-de-données)
  - [Interactions avec Supabase](#interactions-avec-supabase)
  - [Gestion des sessions et cookies](#gestion-des-sessions-et-cookies)
  - [Fonctions RPC et Triggers](#fonctions-rpc-et-triggers)
  - [Structure du projet](#structure-du-projet)

- [Partie 3 : Guide de Pilotage de l'Émission](#partie-3--guide-de-pilotage-de-lémission)
  - [Guide de l'Admin](#guide-de-ladmin)
  - [Guide du Jury](#guide-du-jury)
  - [Schéma de Données](#schéma-de-données)
  - [Dépannage FAQ Technique](#dépannage-faq-technique)

---

# Partie 1 : Documentation Fonctionnelle

## Vue d'ensemble du système

Top Talent Benin est une plateforme de compétition artistique en ligne qui permet :
- Aux candidats de déposer leurs performances vidéo
- Au jury d'évaluer les talents selon des critères techniques
- Au public de voter pour leurs favoris via Mobile Money
- À l'administration de piloter l'ensemble du processus

### Acteurs principaux
- **Candidat** : Artiste qui soumet sa candidature
- **Jury** : Expert qui évalue les performances
- **Admin** : Administrateur qui gère la plateforme
- **Public** : Visiteurs qui votent pour les candidats

---

## Parcours utilisateurs

### 1. Parcours Candidat

#### Inscription
1. **Accès** : Via la page `/candidature` (uniquement en phase PRÉSELECTION)
2. **Formulaire en 3 étapes** :
   - **Étape 1** : Identité artistique
     - Nom de scène (vérification unicité en temps réel)
     - Discipline artistique (8 catégories)
     - Bio (max 250 caractères)
   - **Étape 2** : Coordonnées
     - Département (12 départements du Bénin)
     - Email (vérification unicité)
     - Téléphone (8 chiffres)
     - Mot de passe (critères de sécurité)
   - **Étape 3** : Médias
     - Vidéo de performance (max 50 Mo, MP4/MOV)
     - Image de couverture (max 5 Mo, avec recadrage)
3. **Auto-save** : Brouillon sauvegardé automatiquement dans localStorage
4. **Soumission** : Création compte Supabase Auth + upload vidéos + création profil

#### Connexion
- Via `/candidature?view=login`
- Redirection automatique vers `/dashboard/candidate`
- Gestion des erreurs de connexion traduites en français

#### Dashboard Candidat
- Affichage du statut de candidature
- Visualisation des votes reçus
- Accès aux informations personnelles

### 2. Parcours Jury

#### Connexion
- Via `/dashboard/jury` (protégé par middleware)
- Redirection selon le rôle depuis auth

#### Dashboard Jury
- **4 onglets** :
  - **Sélection** : Phase PRÉSELECTION - validation des candidats
  - **Évaluation** : Notation sur 3 critères (Technique, Originalité, Présence)
  - **Historique** : Consultation des notes passées
  - **Statistiques** : Vue d'ensemble des évaluations

#### Processus de notation
1. **Filtrage par phase** : Seuls les candidats de la phase actuelle sont visibles
2. **Critères d'évaluation** (sur 20 points chacun) :
   - Technique : Compétence technique
   - Originalité : Créativité et innovation
   - Présence : Charisme et mise en scène
3. **Validation** : Confirmation obligatoire avant enregistrement
4. **Modification** : Possibilité de modifier les notes jusqu'à validation

### 3. Parcours Admin

#### Connexion
- Via `/dashboard/admin` (protégé par middleware)
- Accès complet à toutes les fonctionnalités

#### Dashboard Admin
- **5 onglets principaux** :
  1. **Jury** : Gestion des membres du jury (CRUD)
  2. **Modération** : Validation des candidatures
  3. **Phases** : Pilotage des phases de compétition
  4. **Settings** : Configuration globale
  5. **Preview** : Aperçu du site public

#### Fonctionnalités clés
- **Gestion Jury** : Création, modification, suppression des jurés
- **Modération** : Approuver/Rejeter les candidatures
- **Pilotage de phase** : Changer la phase actuelle
- **Mode maintenance** : Activer/désactiver le site
- **Gestion des votes** : Surveillance des transactions

---

## Règles de gestion métier

### Règles de candidature

#### Unicité
- **Nom de scène** : Unique parmi tous les candidats
- **Email** : Unique dans le système (auth.users)
- **Vérification en temps réel** : Feedback immédiat lors de la saisie

#### Validation des médias
- **Vidéo** :
  - Format : MP4, MOV
  - Taille max : 50 Mo
  - Durée suggérée : 1 minute
- **Image de couverture** :
  - Format : JPG, PNG
  - Taille max : 5 Mo
  - Recadrage obligatoire via cropper

#### Mot de passe
- Minimum 8 caractères
- Au moins 1 majuscule
- Au moins 1 chiffre
- Au moins 1 caractère spécial

#### Types de candidature
- **Solo** : 1 membre
- **Groupe** : 2+ membres (avec nombre de membres spécifié)

### Règles de vote

#### Tarification
- **1 vote** : 500 FCFA
- **3 votes** : 1 000 FCFA (pack économique)
- **10 votes** : 3 000 FCFA (pack premium)

#### Opérateurs Mobile Money
- MTN MoMo
- Moov Money

#### Contraintes
- Numéro de téléphone : 8 chiffres (format béninois)
- Phase de vote : Uniquement quand `is_voting_open = true`
- Transaction unique par référence

#### Workflow de paiement
1. Initialisation via API FedaPay
2. USSD Push vers le téléphone
3. Validation PIN par l'utilisateur
4. Webhook de confirmation
5. Enregistrement du vote

### Règles de notation du jury

#### Critères
- **Technique** (0-20) : Compétence technique
- **Originalité** (0-20) : Créativité et innovation
- **Présence** (0-20) : Charisme et mise en scène

#### Calcul de la moyenne
```
Moyenne = (Technique + Originalité + Présence) / 3
```

#### Contraintes
- Un juré ne peut noter qu'une fois par candidat par phase
- Notes modifiables jusqu'à confirmation
- Phase de notation liée à la phase système actuelle

### Règles de calcul du score hybride

#### Formule
```
Score Final = 0.5 × (Moyenne Jury) + 0.5 × (Votes Public Normalisés)
```

#### Normalisation des votes publics
```
Votes Normalisés = (Votes Candidat / Max Votes) × 20
```

#### Tie-breaker
- En cas d'égalité, l'admin peut forcer un candidat gagnant via `forced_tie_breaker_candidate_id`

---

## Phases de la compétition

### 1. PRÉSELECTION
- **Durée** : Période d'inscription des candidats
- **Accès candidature** : Ouvert
- **Rôle jury** : Sélection des Top 40
- **Rôle public** : Pas de vote
- **Actions admin** :
  - Modération des candidatures
  - Validation des candidats
  - Sélection des Top 40 (is_top_40)

### 2. VOTES_TOP_40 (Audition)
- **Durée** : Vote public pour les Top 40
- **Accès candidature** : Fermé
- **Rôle jury** : Notation des Top 40
- **Rôle public** : Vote ouvert (Mobile Money)
- **Actions admin** :
  - Surveillance des votes
  - Sélection des Top 20 (is_semifinalist)

### 3. SEMIFINAL
- **Durée** : Demi-finale avec Top 20
- **Accès candidature** : Fermé
- **Rôle jury** : Notation des Top 20
- **Rôle public** : Vote ouvert
- **Actions admin** :
  - Sélection des Finalistes (is_finalist)

### 4. FINAL
- **Durée** : Grande finale
- **Accès candidature** : Fermé
- **Rôle jury** : Notation finale
- **Rôle public** : Vote final
- **Actions admin** :
  - Détermination du gagnant
  - Archivage de la compétition

### 5. ARCHIVED
- **Durée** : Après la compétition
- **Accès** : Lecture seule
- **Actions** : Conservation des données

---

## Workflow des candidatures

### Cycle de vie d'une candidature

```
Inscription → pending_review → approved → is_top_40 → is_semifinalist → is_finalist → winner → archived
              ↓ rejected
```

### Statuts des candidats

| Statut | Description | Qui peut modifier |
|--------|-------------|-------------------|
| `pending_review` | En attente de validation | Admin |
| `approved` | Validé et visible | Admin |
| `rejected` | Rejeté | Admin |
| `is_top_40` | Sélectionné Top 40 | Admin/Jury |
| `is_semifinalist` | Sélectionné Top 20 | Admin |
| `is_finalist` | Finaliste | Admin |
| `winner` | Gagnant | Admin |

### Disciplines artistiques

8 catégories acceptées :
1. **Musique** : Chant, Rap, Afrobeat, Gospel, Traditionnel
2. **Danse** : Danses urbaines, Traditionnelles, Afro, Breakdance
3. **Humour** : Stand-up, Blagues, Imitation, Éwé, Théâtre
4. **Art Oratoire** : Slam, Poésie, Éloquence, Parole, Conte
5. **Digital** : TikTok, Vidéastes, Créateurs de contenu, Beatmaking
6. **Cirque** : Magie, Jonglage, Cracheurs de feu, Gymnastique
7. **Sport** : Foot freestyle, Roller, Sports acrobatiques, Skate
8. **Arts Visuels** : Dessin, Peinture, Mode, Stylisme, Maquillage

### Départements du Bénin

12 départements couverts :
1. Alibori (Kandi)
2. Atacora (Natitingou)
3. Atlantique (Calavi)
4. Borgou (Parakou)
5. Collines (Dassa)
6. Donga (Djougou)
7. Kouffo (Aplahoué)
8. Littoral (Cotonou)
9. Mono (Lokossa)
10. Ouémé (Porto-Novo)
11. Plateau (Pobè)
12. Zou (Abomey)

---

# Partie 2 : Documentation Technique

## Architecture technique

### Stack technologique

#### Frontend
- **Framework** : Next.js 15 (App Router)
- **Language** : TypeScript
- **Styling** : TailwindCSS
- **UI Components** : Custom components + Lucide icons
- **Animations** : Framer Motion
- **Forms** : React Hook Form + react-dom
- **Image Cropping** : react-easy-crop

#### Backend
- **BaaS** : Supabase (PostgreSQL + Auth + Storage)
- **API Routes** : Next.js API routes
- **Server Actions** : Next.js Server Actions
- **Webhooks** : FedaPay payment webhooks

#### Infrastructure
- **Hosting** : Vercel (recommandé)
- **Database** : Supabase PostgreSQL
- **Storage** : Supabase Storage (candidate-videos bucket)
- **CDN** : Supabase CDN pour les médias

### Architecture du projet

```
top-talent-benin/
├── app/
│   ├── actions/          # Server Actions
│   ├── admin/            # Pages admin
│   ├── api/              # API Routes
│   ├── dashboard/        # Dashboards (candidate, jury, admin)
│   └── candidature/      # Page d'inscription
├── components/
│   ├── home/             # Composants page d'accueil
│   └── ui/               # Composants UI réutilisables
├── lib/
│   ├── constants/        # Constantes métier
│   ├── scoring/          # Algorithmes de scoring
│   └── supabase/         # Client Supabase + types + db
├── public/               # Assets statiques
├── supabase/             # Scripts SQL
└── docs/                 # Documentation
```

---

## Workflow de données

### Cycle de vie d'une candidature

```
Candidat → Frontend → Supabase Auth → Supabase Storage → Supabase DB → Dashboard
```

**Étapes détaillées** :
1. Candidat soumet le formulaire
2. Création utilisateur Supabase Auth
3. Upload vidéo vers Supabase Storage
4. Upload image couverture
5. Insertion dans table profiles
6. Insertion dans table candidates
7. Redirection vers dashboard

### Workflow de vote

```
Public → Frontend → API Vote → FedaPay → Webhook → Supabase DB → Confirmation
```

**Étapes détaillées** :
1. Public clique sur "Voter"
2. Formulaire vote (téléphone, quantité)
3. Initiation transaction FedaPay
4. USSD Push vers téléphone
5. Validation PIN par utilisateur
6. Webhook confirmation
7. Insertion vote + incrémentation compteur

### Workflow de notation jury

```
Jury → Frontend → Supabase DB → RPC Function → Confirmation
```

**Étapes détaillées** :
1. Jury accède dashboard
2. Sélectionne candidat
3. Saisit notes (T, O, P)
4. UPSERT dans jury_ratings
5. Calcul automatique moyenne

### Workflow de changement de phase

```
Admin → Frontend → Supabase DB → Realtime → Tous les utilisateurs
```

**Étapes détaillées** :
1. Admin change phase
2. UPDATE system_control
3. Dispatch événement Realtime
4. Sync temps réel tous clients
5. Re-render avec nouvelle phase

---

## Interactions avec Supabase

### Client Supabase

#### Configuration
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

#### Server Client
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get, set, remove } }
  )
}
```

### Database Layer (lib/supabase/db.ts)

#### Pattern de fallback
```typescript
export const db = {
  getCandidates: async (options?) => {
    if (supabase) {
      const { data, error } = await supabase.from('candidates').select('*')
      if (!error && data) return data
    }
    // Fallback to localStorage for development
    initLocalStorage()
    return JSON.parse(localStorage.getItem('ttb_candidates') || '[]')
  }
}
```

#### Fonctions principales

| Fonction | Description | RLS Policy |
|----------|-------------|------------|
| `getSystemControl()` | Récupère la phase actuelle | Lecture publique |
| `updateSystemControl()` | Met à jour la phase | Admin uniquement |
| `getCandidates()` | Liste des candidats | Filtrée par status |
| `createCandidate()` | Crée un candidat | Propriétaire uniquement |
| `updateCandidateStatus()` | Change le statut | RPC bypass RLS |
| `confirmCandidateByAdmin()` | Confirme candidat | RPC bypass RLS |
| `saveJuryRating()` | Enregistre note jury | Jury uniquement |
| `getJuryAverages()` | Calcule moyennes jury | Lecture publique |
| `addVote()` | Ajoute un vote | Service role uniquement |

### Storage

#### Bucket configuration
```sql
CREATE STORAGE BUCKET candidate-videos
WITH (PUBLIC = true);
```

#### Policies
- **Lecture publique** : Tous les utilisateurs
- **Upload** : Authentifié + propriétaire du dossier
- **Delete** : Authentifié + propriétaire du dossier

---

## Gestion des sessions et cookies

### Authentification Supabase

#### Sign Up (Candidat)
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { role: 'candidate' }
  }
})
```

#### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
})
```

#### Sign Out
```typescript
await supabase.auth.signOut()
// Clear localStorage
localStorage.removeItem('user_id')
localStorage.removeItem('user_role')
// Clear cookies
document.cookie = 'sb-access-token=; path=/; expires=...'
```

### Middleware d'authentification

```typescript
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* ... */)
  const { data: { session } } = await supabase.auth.getSession()
  
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/candidature?view=login', request.url))
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    if (profile?.role === 'candidate' && !request.nextUrl.pathname.includes('/candidate')) {
      return NextResponse.redirect(new URL('/dashboard/candidate', request.url))
    }
  }
  
  return NextResponse.next()
}
```

---

## Fonctions RPC et Triggers

### RPC Functions (PostgreSQL)

#### 1. update_candidate_status
```sql
CREATE OR REPLACE FUNCTION public.update_candidate_status(
  candidate_uuid UUID,
  new_status TEXT
)
RETURNS JSON AS $$
DECLARE
  user_id UUID;
  user_role TEXT;
BEGIN
  user_id := auth.uid();
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  
  IF user_role != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'User is not admin');
  END IF;
  
  UPDATE public.candidates
  SET status = new_status
  WHERE id = candidate_uuid;
  
  RETURN json_build_object('success', true, 'candidate_id', candidate_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage** : Bypass RLS pour les mises à jour admin

#### 2. confirm_candidate_by_admin
```sql
CREATE OR REPLACE FUNCTION public.confirm_candidate_by_admin(
  candidate_uuid UUID,
  is_confirmed BOOLEAN
)
RETURNS JSON AS $$
-- Similar structure to update_candidate_status
-- Updates is_confirmed_by_admin field
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3. increment_candidate_votes
```sql
CREATE OR REPLACE FUNCTION public.increment_candidate_votes(
  candidate_uuid UUID,
  vote_increment INT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.candidates
  SET votes_count = votes_count + vote_increment
  WHERE id = candidate_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage** : Appelé par le webhook de paiement

#### 4. get_candidate_vote_counts
```sql
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
```

**Usage** : Agrégation optimisée pour le dashboard

### Triggers

#### handle_profile_role_update
```sql
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

CREATE TRIGGER on_profile_role_change
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_role_update();
```

**Usage** : Synchronise le rôle dans auth.users.app_metadata

---

## Structure du projet

### Types TypeScript

#### lib/supabase/types.ts
```typescript
export interface Profile {
  id: string;
  email?: string;
  full_name: string;
  phone: string;
  role: 'visitor' | 'candidate' | 'jury' | 'admin';
  avatar_url?: string;
  created_at: string;
}

export interface Candidate {
  id: string;
  profile_id: string;
  stage_name: string;
  discipline: Discipline;
  region: Region;
  video_url: string;
  cover_image_url?: string;
  status: 'pending_review' | 'approved' | 'rejected';
  is_confirmed_by_admin?: boolean;
  is_top_40?: boolean;
  is_semifinalist?: boolean;
  is_finalist?: boolean;
  created_at: string;
}

export interface Vote {
  id: string;
  candidate_id: string;
  vote_count: number;
  amount_fcfa: number;
  phone_payer: string;
  network: 'MTN' | 'MOOV';
  transaction_ref: string;
  payment_status: 'pending' | 'success' | 'failed';
  phase: 'preselection' | 'audition' | 'semifinal' | 'final';
  created_at: string;
}

export interface JuryRating {
  id: string;
  jury_id: string;
  candidate_id: string;
  score_technique: number;
  score_originalite: number;
  score_presence: number;
  is_approved_preselection: boolean;
  phase: 'preselection' | 'audition' | 'semifinal' | 'final';
  created_at: string;
}

export interface SystemControl {
  id: number;
  current_phase: 'PRESELECTION' | 'VOTES_TOP_40' | 'SEMIFINAL' | 'FINAL' | 'ARCHIVED';
  live_voting_candidate_id: string | null;
  is_voting_open: boolean;
  forced_tie_breaker_candidate_id: string | null;
  is_maintenance_mode?: boolean;
  created_at: string;
  updated_at: string;
}
```

### Algorithmes de scoring

#### lib/scoring/hybrid-score.ts
```typescript
export function calculateHybridScore(
  candidateId: string,
  votes: Vote[],
  juryAverages: Record<string, JuryAverage>,
  candidates: Candidate[]
) {
  const maxVotes = Math.max(1, ...candidates.map(c => getCandidateVotes(votes, c.id)))
  const avgJury = juryAverages[candidateId]?.total_jury_average ?? 10
  const normalizedPublic = (getCandidateVotes(votes, candidateId) / maxVotes) * 20
  const finalScore = 0.5 * avgJury + 0.5 * normalizedPublic
  return Math.round(finalScore * 100) / 100
}
```

---

# Partie 3 : Guide de Pilotage de l'Émission

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

#### 5. Onglet PREVIEW
**Objectif** : Aperçu du site public

**Fonctionnalités** :
- Iframe intégrant le site public
- Bouton de rafraîchissement
- Visualisation en temps réel des changements

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

#### 3. Onglet HISTORIQUE
**Objectif** : Consulter les notes passées

#### 4. Onglet STATISTIQUES
**Objectif** : Vue d'ensemble des évaluations

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
| status | TEXT | 'pending_review', 'approved', 'rejected' |
| votes_count | INTEGER | Total des votes (agrégé) |
| is_top_40 | BOOLEAN | Sélectionné Top 40 |
| is_semifinalist | BOOLEAN | Sélectionné Top 20 |
| is_finalist | BOOLEAN | Finaliste |
| created_at | TIMESTAMP | Date de création |

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
| phase | TEXT | Phase du vote |
| created_at | TIMESTAMP | Date du vote |

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
| phase | TEXT | Phase de notation |
| created_at | TIMESTAMP | Date de notation |

#### 5. system_control
**Description** : Contrôle global du système

| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER | Identifiant (PK, toujours 1) |
| current_phase | TEXT | Phase actuelle |
| is_voting_open | BOOLEAN | Vote public ouvert |
| forced_tie_breaker_candidate_id | UUID | Candidat prioritaire |
| is_maintenance_mode | BOOLEAN | Mode maintenance |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de mise à jour |

---

## Dépannage FAQ Technique

### Gestion des sessions

#### Problème : "Session expirée" ou "Non connecté"
**Solutions** :
1. Déconnexion et reconnexion
2. Vider le cache et localStorage
3. Vérifier la configuration Supabase

#### Problème : "Rôle non reconnu"
**Solutions** :
1. Vérifier le profil dans la table profiles
2. Vérifier app_metadata dans auth.users
3. Synchroniser manuellement si nécessaire

### Erreurs de casse sur les phases

#### Problème : "Phase invalide" ou "Phase non reconnue"
**Solutions** :
1. Vérifier la phase actuelle dans system_control
2. Utiliser les helpers toSqlPhase/fromSqlPhase
3. Mettre à jour manuellement si nécessaire

### Connexion WebSocket / Real-time

#### Problème : "Mises à jour non synchronisées"
**Solutions** :
1. Activer Realtime sur la table
2. Vérifier la subscription
3. Utiliser le fallback localStorage

### Upload de fichiers

#### Problème : "Échec de l'upload vidéo"
**Solutions** :
1. Vérifier la taille (< 50 Mo)
2. Vérifier le format (MP4/MOV)
3. Vérifier les permissions Storage

### RLS (Row Level Security)

#### Problème : "Accès refusé" ou "Permission denied"
**Solutions** :
1. Vérifier les policies RLS
2. Vérifier le rôle dans profiles
3. Utiliser les RPC functions pour les ops admin

### Webhook FedaPay

#### Problème : "Vote non enregistré"
**Solutions** :
1. Vérifier les logs serveur
2. Vérifier la transaction dans la DB
3. Traiter manuellement si nécessaire

### Performance

#### Problème : "Lenteur du dashboard"
**Solutions** :
1. Ajouter des index sur les tables
2. Optimiser les requêtes
3. Utiliser les RPC functions d'agrégation

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

---

**Fin de la documentation**

*Document généré automatiquement le 29 mai 2026*
