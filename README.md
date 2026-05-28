# Top Talent du Bénin

Plateforme officielle de détection de talents du Bénin. Candidature, vote et suivi des artistes en direct.

## Stack Technique

- **Framework** : Next.js 16.2.6 (App Router)
- **UI** : React 19.2.4, TailwindCSS
- **Backend** : Supabase (Auth + Database)
- **Langage** : TypeScript

## Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Exécutez le schéma SQL dans `supabase/schema.sql` via l'éditeur SQL Supabase
3. Configurez les variables d'environnement avec vos credentials Supabase

## Déploiement

Le projet est optimisé pour Vercel. Connectez votre repository GitHub et déployez en un clic.

## Structure du projet

- `app/` : Pages Next.js (App Router)
- `components/` : Composants React réutilisables
- `lib/supabase/` : Client Supabase et helpers de base de données
- `supabase/schema.sql` : Schéma de base de données
