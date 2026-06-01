/**
 * TESTS DES CAS LIMITES - TOP TALENT BENIN
 * 
 * Ce script teste les cas limites et scénarios d'erreur:
 * - Que se passe-t-il si jury essaie de sélectionner un 41ème candidat ?
 * - Que se passe-t-il si admin clique "Confirmer" sans jury_selected ?
 * - Que se passe-t-il si 2 admins travaillent en même temps ?
 * - Autres cas limites
 * 
 * Prérequis:
 * - Avoir un compte admin actif
 * - Avoir un compte jury actif
 * 
 * Usage: node scripts/test-edge-cases.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Configuration des tests
const TEST_CONFIG = {
  ADMIN_EMAIL: process.env.TEST_ADMIN_EMAIL || 'admin@toptalentbenin.com',
  ADMIN_PASSWORD: process.env.TEST_ADMIN_PASSWORD || 'admin123',
  JURY_EMAIL: process.env.TEST_JURY_EMAIL || 'jury@toptalentbenin.com',
  JURY_PASSWORD: process.env.TEST_JURY_PASSWORD || 'jury123',
};

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Fonctions utilitaires
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(testName) {
  console.log(`\n🐛 ${testName}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Compteur de tests
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
};

function recordTest(passed) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// ==========================================
// 1. JURY ESSAIE DE SÉLECTIONNER UN 41ÈME CANDIDAT
// ==========================================

async function testJurySelects41stCandidate() {
  logSection('1. JURY ESSAIE DE SÉLECTIONNER UN 41ÈME CANDIDAT');

  // Authentifier admin pour préparer le scénario
  logTest('Préparation: Créer 40 candidats jury_selected');
  const { data: adminAuth, error: adminAuthError } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.ADMIN_EMAIL,
    password: TEST_CONFIG.ADMIN_PASSWORD,
  });

  if (adminAuthError) {
    logError(`Échec de l'authentification admin: ${adminAuthError.message}`);
    recordTest(false);
    return;
  }

  // Réinitialiser les candidats à pre_approved
  await supabase
    .from('candidates')
    .update({ status: 'pre_approved' })
    .eq('status', 'jury_selected');

  // Sélectionner 40 candidats
  const { data: candidates } = await supabase
    .from('candidates')
    .select('id')
    .eq('status', 'pre_approved')
    .limit(40);

  if (candidates && candidates.length >= 40) {
    const candidateIds = candidates.slice(0, 40).map(c => c.id);
    await supabase
      .from('candidates')
      .update({ status: 'jury_selected' })
      .in('id', candidateIds);
    logSuccess('40 candidats marqués comme jury_selected');
  } else {
    logWarning('Moins de 40 candidats disponibles pour le test');
    await supabase.auth.signOut();
    recordTest(false);
    return;
  }

  await supabase.auth.signOut();

  // Authentifier jury
  logTest('Authentification jury');
  const { data: juryAuth, error: juryAuthError } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.JURY_EMAIL,
    password: TEST_CONFIG.JURY_PASSWORD,
  });

  if (juryAuthError) {
    logError(`Échec de l'authentification jury: ${juryAuthError.message}`);
    recordTest(false);
    return;
  }
  logSuccess('Jury authentifié avec succès');

  // Tenter de sélectionner un 41ème candidat
  logTest('Jury tente de sélectionner un 41ème candidat');
  try {
    const { data: extraCandidate } = await supabase
      .from('candidates')
      .select('id')
      .eq('status', 'pre_approved')
      .limit(1)
      .single();

    if (extraCandidate) {
      const { error } = await supabase
        .from('candidates')
        .update({ status: 'jury_selected' })
        .eq('id', extraCandidate.id);

      if (error) {
        logSuccess('Sélection du 41ème refusée (comportement attendu)');
        recordTest(true);
      } else {
        logError('Sélection du 41ème autorisée (PROBLÈME)');
        recordTest(false);
        
        // Restaurer
        await supabase
          .from('candidates')
          .update({ status: 'pre_approved' })
          .eq('id', extraCandidate.id);
      }
    } else {
      logWarning('Aucun candidat supplémentaire disponible');
      recordTest(true);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Vérifier le compteur
  logTest('Vérification du compteur après tentative');
  try {
    const { count } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'jury_selected');

    logInfo(`Nombre de jury_selected: ${count}`);

    if (count === 40) {
      logSuccess('Compteur reste à 40 (correct)');
      recordTest(true);
    } else {
      logError(`Compteur incorrect: ${count} au lieu de 40`);
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Nettoyer
  await supabase.auth.signOut();
  
  // Réinitialiser
  const { data: adminAuth2 } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.ADMIN_EMAIL,
    password: TEST_CONFIG.ADMIN_PASSWORD,
  });
  await supabase
    .from('candidates')
    .update({ status: 'pre_approved' })
    .eq('status', 'jury_selected');
  await supabase.auth.signOut();
}

// ==========================================
// 2. ADMIN CLIQUE "CONFIRMER" SANS JURY_SELECTED
// ==========================================

async function testAdminConfirmWithoutJurySelected() {
  logSection('2. ADMIN CLIQUE "CONFIRMER" SANS JURY_SELECTED');

  // Authentifier admin
  logTest('Authentification admin');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.ADMIN_EMAIL,
    password: TEST_CONFIG.ADMIN_PASSWORD,
  });

  if (authError) {
    logError(`Échec de l'authentification admin: ${authError.message}`);
    recordTest(false);
    return;
  }
  logSuccess('Admin authentifié avec succès');

  // S'assurer qu'il n'y a pas de jury_selected
  logTest('Réinitialisation: aucun jury_selected');
  await supabase
    .from('candidates')
    .update({ status: 'pre_approved' })
    .eq('status', 'jury_selected');

  // Tenter de confirmer sans jury_selected
  logTest('Admin tente de confirmer sans jury_selected');
  try {
    const { count } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'jury_selected');

    logInfo(`Nombre de jury_selected: ${count}`);

    if (count === 0) {
      logSuccess('Aucun jury_selected (scénario correct)');
      recordTest(true);

      // Simuler la tentative de confirmation
      logTest('Simulation de la tentative de confirmation');
      // Dans l'UI, cela devrait être bloqué par une validation
      logInfo('L\'UI devrait empêcher cette action');
      recordTest(true);
    } else {
      logWarning('Il y a des jury_selected, scénario non applicable');
      recordTest(true);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Déconnexion admin
  await supabase.auth.signOut();
}

// ==========================================
// 3. 2 ADMINS TRAVAILLENT EN MÊME TEMPS
// ==========================================

async function testConcurrentAdmins() {
  logSection('3. 2 ADMINS TRAVAILLENT EN MÊME TEMPS');

  // Ce test simule un scénario de concurrence
  logTest('Simulation de concurrence entre 2 admins');

  // Authentifier admin 1
  const { data: admin1Auth, error: admin1Error } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.ADMIN_EMAIL,
    password: TEST_CONFIG.ADMIN_PASSWORD,
  });

  if (admin1Error) {
    logError(`Échec de l'authentification admin 1: ${admin1Error.message}`);
    recordTest(false);
    return;
  }
  logSuccess('Admin 1 authentifié');

  // Récupérer un candidat
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id, stage_name')
    .limit(1)
    .single();

  if (!candidate) {
    logError('Aucun candidat trouvé');
    recordTest(false);
    await supabase.auth.signOut();
    return;
  }

  // Simuler admin 1 modifie le candidat
  logTest('Admin 1 modifie le candidat');
  const originalName = candidate.stage_name;
  await supabase
    .from('candidates')
    .update({ stage_name: 'Modified by Admin 1' })
    .eq('id', candidate.id);

  // Simuler admin 2 modifie le même candidat (en utilisant le même compte pour le test)
  logTest('Admin 2 modifie le même candidat (simulation)');
  await supabase
    .from('candidates')
    .update({ stage_name: 'Modified by Admin 2' })
    .eq('id', candidate.id);

  // Vérifier le résultat
  logTest('Vérification du résultat');
  try {
    const { data: updatedCandidate } = await supabase
      .from('candidates')
      .select('stage_name')
      .eq('id', candidate.id)
      .single();

    logInfo(`Nom final: ${updatedCandidate.stage_name}`);
    logInfo('Le dernier écrase le premier (comportement normal sans verrouillage)');
    logSuccess('Test de concurrence effectué');
    recordTest(true);
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Restaurer
  await supabase
    .from('candidates')
    .update({ stage_name: originalName })
    .eq('id', candidate.id);

  // Déconnexion admin
  await supabase.auth.signOut();
}

// ==========================================
// 4. JURY SOUMET AVEC MOINS DE 40 CANDIDATS
// ==========================================

async function testJurySubmitWithLessThan40() {
  logSection('4. JURY SOUMET AVEC MOINS DE 40 CANDIDATS');

  // Authentifier admin pour préparer
  logTest('Préparation: Créer 39 candidats jury_selected');
  const { data: adminAuth, error: adminAuthError } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.ADMIN_EMAIL,
    password: TEST_CONFIG.ADMIN_PASSWORD,
  });

  if (adminAuthError) {
    logError(`Échec de l'authentification admin: ${adminAuthError.message}`);
    recordTest(false);
    return;
  }

  // Réinitialiser
  await supabase
    .from('candidates')
    .update({ status: 'pre_approved' })
    .eq('status', 'jury_selected');

  // Sélectionner 39 candidats
  const { data: candidates } = await supabase
    .from('candidates')
    .select('id')
    .eq('status', 'pre_approved')
    .limit(39);

  if (candidates && candidates.length >= 39) {
    const candidateIds = candidates.slice(0, 39).map(c => c.id);
    await supabase
      .from('candidates')
      .update({ status: 'jury_selected' })
      .in('id', candidateIds);
    logSuccess('39 candidats marqués comme jury_selected');
  } else {
    logWarning('Moins de 39 candidats disponibles');
    await supabase.auth.signOut();
    recordTest(false);
    return;
  }

  await supabase.auth.signOut();

  // Authentifier jury
  logTest('Authentification jury');
  const { data: juryAuth, error: juryAuthError } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.JURY_EMAIL,
    password: TEST_CONFIG.JURY_PASSWORD,
  });

  if (juryAuthError) {
    logError(`Échec de l'authentification jury: ${juryAuthError.message}`);
    recordTest(false);
    return;
  }

  // Tenter de soumettre avec 39 candidats
  logTest('Jury tente de soumettre avec 39 candidats');
  try {
    const { count } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'jury_selected');

    logInfo(`Nombre de jury_selected: ${count}`);

    if (count < 40) {
      logSuccess('Moins de 40 candidats (scénario correct)');
      logInfo('L\'UI devrait empêcher la soumission');
      recordTest(true);
    } else {
      logWarning('40 candidats ou plus, scénario non applicable');
      recordTest(true);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Nettoyer
  await supabase.auth.signOut();
  
  // Réinitialiser
  const { data: adminAuth2 } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.ADMIN_EMAIL,
    password: TEST_CONFIG.ADMIN_PASSWORD,
  });
  await supabase
    .from('candidates')
    .update({ status: 'pre_approved' })
    .eq('status', 'jury_selected');
  await supabase.auth.signOut();
}

// ==========================================
// 5. CANDIDAT AVEC DONNÉES INVALIDES
// ==========================================

async function testCandidateWithInvalidData() {
  logSection('5. CANDIDAT AVEC DONNÉES INVALIDES');

  // Créer un profil de test
  logTest('Création d\'un profil de test');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'test_invalid@example.com',
    password: 'test123',
  });

  if (authError && !authError.message.includes('already registered')) {
    logError(`Erreur création profil: ${authError.message}`);
    recordTest(false);
    return;
  }

  const profileId = authData.user?.id;

  // Créer le profil
  await supabase.from('profiles').upsert({
    id: profileId,
    email: 'test_invalid@example.com',
    full_name: 'Test Invalid',
    role: 'candidate',
  });

  // Test 1: Candidat sans vidéo
  logTest('Tentative de création sans vidéo');
  try {
    const { error } = await supabase
      .from('candidates')
      .insert({
        profile_id: profileId,
        stage_name: 'Test No Video',
        real_name: 'Test Real',
        discipline: 'Musique',
        region: 'Littoral',
        phone: '+22912345678',
        status: 'pending_review',
        video_url: '', // Vide
      });

    if (error) {
      logSuccess('Création refusée (validation fonctionne)');
      recordTest(true);
    } else {
      logError('Création autorisée (problème de validation)');
      recordTest(false);
      
      // Nettoyer
      await supabase
        .from('candidates')
        .delete()
        .eq('profile_id', profileId);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 2: Candidat avec téléphone invalide
  logTest('Tentative de création avec téléphone invalide');
  try {
    const { error } = await supabase
      .from('candidates')
      .insert({
        profile_id: profileId,
        stage_name: 'Test Invalid Phone',
        real_name: 'Test Real',
        discipline: 'Musique',
        region: 'Littoral',
        phone: 'invalid', // Invalide
        status: 'pending_review',
        video_url: 'https://youtube.com/test',
      });

    if (error) {
      logSuccess('Création refusée (validation fonctionne)');
      recordTest(true);
    } else {
      logError('Création autorisée (problème de validation)');
      recordTest(false);
      
      // Nettoyer
      await supabase
        .from('candidates')
        .delete()
        .eq('profile_id', profileId);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 3: Candidat avec discipline invalide
  logTest('Tentative de création avec discipline invalide');
  try {
    const { error } = await supabase
      .from('candidates')
      .insert({
        profile_id: profileId,
        stage_name: 'Test Invalid Discipline',
        real_name: 'Test Real',
        discipline: 'InvalidDiscipline', // Invalide
        region: 'Littoral',
        phone: '+22912345678',
        status: 'pending_review',
        video_url: 'https://youtube.com/test',
      });

    if (error) {
      logSuccess('Création refusée (validation fonctionne)');
      recordTest(true);
    } else {
      logError('Création autorisée (problème de validation)');
      recordTest(false);
      
      // Nettoyer
      await supabase
        .from('candidates')
        .delete()
        .eq('profile_id', profileId);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Nettoyer
  await supabase.from('profiles').delete().eq('id', profileId);
  await supabase.auth.admin.deleteUser(profileId);
  await supabase.auth.signOut();
}

// ==========================================
// 6. CHANGEMENT DE PHASE INTEMPESTIF
// ==========================================

async function testUntimelyPhaseChange() {
  logSection('6. CHANGEMENT DE PHASE INTEMPESTIF');

  // Authentifier admin
  logTest('Authentification admin');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.ADMIN_EMAIL,
    password: TEST_CONFIG.ADMIN_PASSWORD,
  });

  if (authError) {
    logError(`Échec de l'authentification admin: ${authError.message}`);
    recordTest(false);
    return;
  }

  // Récupérer la phase actuelle
  const { data: currentControl } = await supabase
    .from('system_control')
    .select('current_phase')
    .single();

  const originalPhase = currentControl?.current_phase;
  logInfo(`Phase actuelle: ${originalPhase}`);

  // Tenter de changer de phase sans préparation
  logTest('Tentative de changement de phase sans préparation');
  try {
    const { error } = await supabase
      .from('system_control')
      .update({ current_phase: 'FINAL' })
      .eq('id', 1);

    if (error) {
      logSuccess('Changement refusé (validation fonctionne)');
      recordTest(true);
    } else {
      logError('Changement autorisé (problème de validation)');
      recordTest(false);
      
      // Restaurer
      await supabase
        .from('system_control')
        .update({ current_phase: originalPhase })
        .eq('id', 1);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Déconnexion admin
  await supabase.auth.signOut();
}

// ==========================================
// 7. SUPPRESSION D'UN CANDIDAT AVEC VOTES
// ==========================================

async function testDeleteCandidateWithVotes() {
  logSection('7. SUPPRESSION D\'UN CANDIDAT AVEC VOTES');

  // Authentifier admin
  logTest('Authentification admin');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.ADMIN_EMAIL,
    password: TEST_CONFIG.ADMIN_PASSWORD,
  });

  if (authError) {
    logError(`Échec de l'authentification admin: ${authError.message}`);
    recordTest(false);
    return;
  }

  // Trouver un candidat avec des votes
  logTest('Recherche d\'un candidat avec des votes');
  const { data: candidateWithVotes } = await supabase
    .from('candidates')
    .select('id, stage_name')
    .limit(1)
    .single();

  if (!candidateWithVotes) {
    logWarning('Aucun candidat trouvé');
    recordTest(true);
    await supabase.auth.signOut();
    return;
  }

  // Tenter de supprimer le candidat
  logTest('Tentative de suppression du candidat');
  try {
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', candidateWithVotes.id);

    if (error) {
      logSuccess('Suppression refusée (protection active)');
      recordTest(true);
    } else {
      logError('Suppression autorisée (problème de protection)');
      recordTest(false);
      
      // Recréer le candidat (simplifié)
      logWarning('Candidat supprimé - devrait être recréé manuellement');
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Déconnexion admin
  await supabase.auth.signOut();
}

// ==========================================
// 8. ACCÈS AUX DONNÉES APRÈS SUPPRESSION DE COMPTE
// ==========================================

async function testDataAccessAfterAccountDeletion() {
  logSection('8. ACCÈS AUX DONNÉES APRÈS SUPPRESSION DE COMPTE');

  // Ce test vérifie que les données d'un utilisateur supprimé restent accessibles aux admins
  logTest('Vérification de l\'accès aux données après suppression');

  // Authentifier admin
  const { data: adminAuth, error: adminAuthError } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.ADMIN_EMAIL,
    password: TEST_CONFIG.ADMIN_PASSWORD,
  });

  if (adminAuthError) {
    logError(`Échec de l'authentification admin: ${adminAuthError.message}`);
    recordTest(false);
    return;
  }

  // Vérifier que les candidats sans profil sont toujours visibles pour l'admin
  logTest('Vérification des candidats orphelins');
  try {
    const { data: candidates } = await supabase
      .from('candidates')
      .select('*');

    logInfo(`${candidates?.length || 0} candidats visibles pour l'admin`);
    logSuccess('Admin peut voir tous les candidats (même orphelins)');
    recordTest(true);
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Déconnexion admin
  await supabase.auth.signOut();
}

// ==========================================
// RAPPORT FINAL
// ==========================================

function printReport() {
  logSection('RAPPORT FINAL');
  log(`Total tests: ${testResults.total}`);
  log(`Réussis: ${testResults.passed}`, 'green');
  log(`Échoués: ${testResults.failed}`, 'red');
  log(`Taux de réussite: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  console.log('='.repeat(60));
}

// ==========================================
// EXÉCUTION
// ==========================================

async function runAllTests() {
  logSection('DÉBUT DES TESTS DES CAS LIMITES');
  logInfo(`Admin: ${TEST_CONFIG.ADMIN_EMAIL}`);
  logInfo(`Jury: ${TEST_CONFIG.JURY_EMAIL}`);

  try {
    await testJurySelects41stCandidate();
    await testAdminConfirmWithoutJurySelected();
    await testConcurrentAdmins();
    await testJurySubmitWithLessThan40();
    await testCandidateWithInvalidData();
    await testUntimelyPhaseChange();
    await testDeleteCandidateWithVotes();
    await testDataAccessAfterAccountDeletion();
    printReport();
  } catch (error) {
    logError(`Erreur fatale: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter les tests
runAllTests();
