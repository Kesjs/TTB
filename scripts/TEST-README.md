# Tests du Workflow - Top Talent Benin

Ce dossier contient les scripts de test automatisés pour valider le workflow complet de sélection des candidats.

## 📋 Scripts de Test

### 1. `test-complete-workflow.js`
Teste l'intégralité du workflow de sélection:
- **Phase Admin (pré-tri)**: Soumission, pré-approbation, rejet, restauration, envoi au jury
- **Phase Jury**: Sélection/désélection, compteur [X/40], soumission, verrouillage
- **Phase Admin (confirmation)**: Confirmation et publication des candidats
- **Site Public**: Visibilité des candidats approuvés uniquement

### 2. `test-rls-security.js`
Teste les politiques de sécurité RLS (Row Level Security):
- Jury ne peut pas accéder au dashboard admin
- Admin ne peut pas noter comme le jury
- Visiteurs anonymes ne voient que les candidats approuvés
- Jury ne peut pas modifier après soumission
- Candidats ne voient que leur propre candidature

### 3. `test-notifications.js`
Teste le système de notifications:
- Badge apparaît instantanément
- Badge disparaît après "tout marquer comme lu"
- Bonne notification au bon destinataire (jury vs admin)
- Performance des notifications

### 4. `test-edge-cases.js`
Teste les cas limites et scénarios d'erreur:
- Jury essaie de sélectionner un 41ème candidat
- Admin clique "Confirmer" sans jury_selected
- 2 admins travaillent en même temps (concurrence)
- Jury soumet avec moins de 40 candidats
- Candidat avec données invalides
- Changement de phase intempestif
- Suppression d'un candidat avec votes

### 5. `run-all-tests.js`
Script maître qui exécute tous les tests en séquence.

## 🚀 Installation et Configuration

### Prérequis
- Node.js installé
- Compte admin actif dans la base de données
- Compte jury actif dans la base de données

### Configuration des variables d'environnement

Créez ou modifiez votre fichier `.env` avec les variables suivantes:

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_supabase

# Comptes de test (optionnel, valeurs par défaut disponibles)
TEST_ADMIN_EMAIL=admin@toptalentbenin.com
TEST_ADMIN_PASSWORD=admin123
TEST_JURY_EMAIL=jury@toptalentbenin.com
TEST_JURY_PASSWORD=jury123
```

### Installation des dépendances

```bash
npm install @supabase/supabase-js dotenv
```

## 📊 Exécution des Tests

### Exécuter tous les tests
```bash
node scripts/run-all-tests.js
```

### Exécuter un test spécifique
```bash
# Workflow complet
node scripts/test-complete-workflow.js

# Sécurité RLS
node scripts/test-rls-security.js

# Notifications
node scripts/test-notifications.js

# Cas limites
node scripts/test-edge-cases.js
```

## 📈 Résultats des Tests

Chaque script affiche:
- Un rapport détaillé de chaque test
- Le nombre de tests réussis/échoués
- Le taux de réussite
- Des messages d'erreur explicites en cas d'échec

## 🔒 Tests de Sécurité

Les tests de sécurité RLS sont particulièrement importants:
- Ils vérifient que les politiques de sécurité sont correctement appliquées
- Ils détectent les failles potentielles d'accès aux données
- Ils s'assurent que chaque rôle ne peut accéder qu'à ses propres données

## ⚠️ Notes Importantes

1. **Données de test**: Les scripts créent et modifient des données de test. Assurez-vous de tester sur un environnement de développement ou de staging.

2. **Nettoyage**: Les scripts tentent de nettoyer les données de test créées, mais il est recommandé de vérifier manuellement après l'exécution.

3. **Authentification**: Les scripts nécessitent des comptes valides. Assurez-vous que les comptes de test existent dans votre base de données.

4. **Permissions**: Les scripts testent les permissions RLS. Si les tests échouent, vérifiez vos politiques RLS dans Supabase.

## 🐛 Dépannage

### Erreur: "Échec de l'authentification"
- Vérifiez que les comptes de test existent
- Vérifiez que les mots de passe sont corrects
- Vérifiez que les comptes ont les bons rôles (admin/jury)

### Erreur: "Accès refusé" dans les tests RLS
- C'est normal et attendu pour les tests de sécurité
- Si un test attend un accès autorisé mais échoue, vérifiez vos politiques RLS

### Erreur: "Aucun candidat trouvé"
- Assurez-vous d'avoir des candidats de test dans la base
- Les scripts créent des candidats de test automatiquement quand possible

## 📝 Checklist de Validation

Avant de mettre en production, assurez-vous que:
- ✅ Tous les tests de workflow passent
- ✅ Tous les tests de sécurité RLS passent
- ✅ Tous les tests de notifications passent
- ✅ Tous les tests de cas limites passent
- ✅ Le taux de réussite est de 100%

## 🔄 Maintenance

Mettez à jour les tests lorsque:
- De nouvelles fonctionnalités sont ajoutées
- Le workflow est modifié
- De nouveaux rôles sont créés
- Les politiques RLS sont modifiées

## 📞 Support

En cas de problème avec les tests:
1. Vérifiez les logs dans la console
2. Vérifiez les logs Supabase
3. Consultez la documentation technique
4. Contactez l'équipe de développement
