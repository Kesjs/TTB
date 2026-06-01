/**
 * TESTS DE SÉCURITÉ RLS - TOP TALENT BENIN
 * 
 * Ce script teste les politiques RLS (Row Level Security) pour s'assurer que:
 * - Le jury ne peut pas accéder au dashboard admin
 * - L'admin ne peut pas noter comme le jury
 * - Les visiteurs anonymes ne voient que les approved
 * - Le jury ne peut pas modifier après jury_selection_submitted = true
 * 
 * Prérequis:
 * - Avoir un compte admin actif
 * - Avoir un compte jury actif
 * 
 * Usage: node scripts/test-rls-security.js
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
  console.log(`\n🔒 ${testName}`);
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
// 1. JURY CONNECTÉ NE PEUT PAS ACCÉDER AU DASHBOARD ADMIN
// ==========================================

async function testJuryCannotAccessAdminDashboard() {
  logSection('1. JURY CONNECTÉ NE PEUT PAS ACCÉDER AU DASHBOARD ADMIN');

  // Authentifier jury
  logTest('Authentification jury');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.JURY_EMAIL,
    password: TEST_CONFIG.JURY_PASSWORD,
  });

  if (authError) {
    logError(`Échec de l'authentification jury: ${authError.message}`);
    recordTest(false);
    return;
  }
  logSuccess('Jury authentifié avec succès');

  // Tenter d'accéder à system_control (réservé aux admins)
  logTest('Jury tente d\'accéder à system_control');
  try {
    const { data: systemControl, error } = await supabase
      .from('system_control')
      .select('*')
      .single();

    if (error) {
      logSuccess('Accès refusé (RLS fonctionne)');
      recordTest(true);
    } else {
      logError('Accès autorisé (FAILLE DE SÉCURITÉ)');
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Tenter de modifier system_control
  logTest('Jury tente de modifier system_control');
  try {
    const { error } = await supabase
      .from('system_control')
      .update({ current_phase: 'FINAL' })
      .eq('id', 1);

    if (error) {
      logSuccess('Modification refusée (RLS fonctionne)');
      recordTest(true);
    } else {
      logError('Modification autorisée (FAILLE DE SÉCURITÉ)');
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Tenter d'accéder aux profils admins
  logTest('Jury tente d\'accéder aux profils admins');
  try {
    const { data: adminProfiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin');

    if (error) {
      logSuccess('Accès refusé (RLS fonctionne)');
      recordTest(true);
    } else {
      logError('Accès autorisé (FAILLE DE SÉCURITÉ)');
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Déconnexion jury
  await supabase.auth.signOut();
}

// ==========================================
// 2. ADMIN NE PEUT PAS NOTER COMME LE JURY
// ==========================================

async function testAdminCannotRateLikeJury() {
  logSection('2. ADMIN NE PEUT PAS NOTER COMME LE JURY');

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

  // Récupérer un candidat
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id')
    .limit(1)
    .single();

  if (!candidate) {
    logWarning('Aucun candidat trouvé pour le test');
    recordTest(false);
    await supabase.auth.signOut();
    return;
  }

  // Tenter d'ajouter une note jury
  logTest('Admin tente d\'ajouter une note jury');
  try {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .single();

    if (!userProfile) {
      logError('Profil admin non trouvé');
      recordTest(false);
      await supabase.auth.signOut();
      return;
    }

    const { error } = await supabase
      .from('jury_ratings')
      .insert({
        candidate_id: candidate.id,
        jury_id: userProfile.id,
        performance: 8,
        originality: 7,
        stage_presence: 9,
        technique: 8,
        overall_score: 8,
      });

    if (error) {
      logSuccess('Insertion refusée (RLS fonctionne)');
      recordTest(true);
    } else {
      logError('Insertion autorisée (FAILLE DE SÉCURITÉ)');
      recordTest(false);
      
      // Nettoyer
      await supabase
        .from('jury_ratings')
        .delete()
        .eq('candidate_id', candidate.id)
        .eq('jury_id', userProfile.id);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Tenter de modifier une note jury existante
  logTest('Admin tente de modifier une note jury existante');
  try {
    const { data: existingRating } = await supabase
      .from('jury_ratings')
      .select('id')
      .limit(1)
      .single();

    if (existingRating) {
      const { error } = await supabase
        .from('jury_ratings')
        .update({ performance: 10 })
        .eq('id', existingRating.id);

      if (error) {
        logSuccess('Modification refusée (RLS fonctionne)');
        recordTest(true);
      } else {
        logError('Modification autorisée (FAILLE DE SÉCURITÉ)');
        recordTest(false);
      }
    } else {
      logWarning('Aucune note existante pour le test');
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
// 3. VISITEUR ANONYME NE VOIT QUE LES APPROVED
// ==========================================

async function testAnonymousVisitorSeesOnlyApproved() {
  logSection('3. VISITEUR ANONYME NE VOIT QUE LES APPROVED');

  // S'assurer qu'on n'est pas connecté
  await supabase.auth.signOut();

  logTest('Visiteur anonyme (non authentifié)');

  // Test 1: Ne peut voir que les approved
  logTest('Visiteur anonyme ne voit que les approved');
  try {
    const { data: candidates } = await supabase
      .from('candidates')
      .select('*');

    const hasOnlyApproved = candidates?.every(c => c.status === 'approved');

    if (hasOnlyApproved) {
      logSuccess('RLS fonctionne: uniquement les approved visibles');
      recordTest(true);
    } else {
      const otherStatuses = candidates?.filter(c => c.status !== 'approved').map(c => c.status);
      logError(`FAILLE: Visiteur voit aussi: ${otherStatuses.join(', ')}`);
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 2: Ne peut pas voir les pending_review
  logTest('Visiteur anonyme ne peut pas voir les pending_review');
  try {
    const { data: pendingCandidates } = await supabase
      .from('candidates')
      .select('id')
      .eq('status', 'pending_review');

    if (!pendingCandidates || pendingCandidates.length === 0) {
      logSuccess('RLS fonctionne: pending_review non visibles');
      recordTest(true);
    } else {
      logError(`FAILLE: ${pendingCandidates.length} pending_review visibles`);
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 3: Ne peut pas voir les pre_approved
  logTest('Visiteur anonyme ne peut pas voir les pre_approved');
  try {
    const { data: preApproved } = await supabase
      .from('candidates')
      .select('id')
      .eq('status', 'pre_approved');

    if (!preApproved || preApproved.length === 0) {
      logSuccess('RLS fonctionne: pre_approved non visibles');
      recordTest(true);
    } else {
      logError(`FAILLE: ${preApproved.length} pre_approved visibles`);
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 4: Ne peut pas voir les jury_selected
  logTest('Visiteur anonyme ne peut pas voir les jury_selected');
  try {
    const { data: jurySelected } = await supabase
      .from('candidates')
      .select('id')
      .eq('status', 'jury_selected');

    if (!jurySelected || jurySelected.length === 0) {
      logSuccess('RLS fonctionne: jury_selected non visibles');
      recordTest(true);
    } else {
      logError(`FAILLE: ${jurySelected.length} jury_selected visibles`);
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 5: Ne peut pas voir les rejected
  logTest('Visiteur anonyme ne peut pas voir les rejected');
  try {
    const { data: rejected } = await supabase
      .from('candidates')
      .select('id')
      .eq('status', 'rejected');

    if (!rejected || rejected.length === 0) {
      logSuccess('RLS fonctionne: rejected non visibles');
      recordTest(true);
    } else {
      logError(`FAILLE: ${rejected.length} rejected visibles`);
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 6: Ne peut pas créer de candidature sans profil
  logTest('Visiteur anonyme ne peut pas créer de candidature');
  try {
    const { error } = await supabase
      .from('candidates')
      .insert({
        profile_id: '00000000-0000-0000-0000-000000000000',
        stage_name: 'Test',
        real_name: 'Test',
        discipline: 'Musique',
        region: 'Littoral',
        phone: '+22912345678',
        status: 'pending_review',
        video_url: 'https://youtube.com/test',
      });

    if (error) {
      logSuccess('Insertion refusée (RLS fonctionne)');
      recordTest(true);
    } else {
      logError('Insertion autorisée (FAILLE DE SÉCURITÉ)');
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 7: Ne peut pas modifier les candidats
  logTest('Visiteur anonyme ne peut pas modifier les candidats');
  try {
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id')
      .limit(1)
      .single();

    if (candidate) {
      const { error } = await supabase
        .from('candidates')
        .update({ stage_name: 'Modified' })
        .eq('id', candidate.id);

      if (error) {
        logSuccess('Modification refusée (RLS fonctionne)');
        recordTest(true);
      } else {
        logError('Modification autorisée (FAILLE DE SÉCURITÉ)');
        recordTest(false);
        
        // Restaurer
        await supabase
          .from('candidates')
          .update({ stage_name: 'Test' })
          .eq('id', candidate.id);
      }
    } else {
      logWarning('Aucun candidat pour le test');
      recordTest(true);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 8: Ne peut pas accéder à system_control
  logTest('Visiteur anonyme ne peut pas accéder à system_control');
  try {
    const { data: systemControl, error } = await supabase
      .from('system_control')
      .select('*')
      .single();

    if (error) {
      logSuccess('Accès refusé (RLS fonctionne)');
      recordTest(true);
    } else {
      logError('Accès autorisé (FAILLE DE SÉCURITÉ)');
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 9: Ne peut pas accéder aux profils
  logTest('Visiteur anonyme ne peut pas accéder aux profils');
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      logSuccess('Accès refusé (RLS fonctionne)');
      recordTest(true);
    } else {
      logError('Accès autorisé (FAILLE DE SÉCURITÉ)');
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 10: Ne peut pas accéder aux notifications
  logTest('Visiteur anonyme ne peut pas accéder aux notifications');
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*');

    if (error) {
      logSuccess('Accès refusé (RLS fonctionne)');
      recordTest(true);
    } else {
      logError('Accès autorisé (FAILLE DE SÉCURITÉ)');
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }
}

// ==========================================
// 4. JURY NE PEUT PAS MODIFIER APRÈS JURY_SELECTION_SUBMITTED = TRUE
// ==========================================

async function testJuryCannotModifyAfterSubmission() {
  logSection('4. JURY NE PEUT PAS MODIFIER APRÈS JURY_SELECTION_SUBMITTED = TRUE');

  // Authentifier admin pour activer le verrou
  logTest('Activation du verrou jury_selection_submitted');
  const { data: adminAuth, error: adminAuthError } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.ADMIN_EMAIL,
    password: TEST_CONFIG.ADMIN_PASSWORD,
  });

  if (adminAuthError) {
    logError(`Échec de l'authentification admin: ${adminAuthError.message}`);
    recordTest(false);
    return;
  }

  const { error: lockError } = await supabase
    .from('system_control')
    .update({ jury_selection_submitted: true })
    .eq('id', 1);

  if (lockError) {
    logError(`Erreur activation verrou: ${lockError.message}`);
    recordTest(false);
    await supabase.auth.signOut();
    return;
  }
  logSuccess('Verrou activé');

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
    // Restaurer le verrou
    await supabase.auth.signInWithPassword({
      email: TEST_CONFIG.ADMIN_EMAIL,
      password: TEST_CONFIG.ADMIN_PASSWORD,
    });
    await supabase
      .from('system_control')
      .update({ jury_selection_submitted: false })
      .eq('id', 1);
    await supabase.auth.signOut();
    return;
  }
  logSuccess('Jury authentifié avec succès');

  // Test 1: Ne peut pas sélectionner un candidat
  logTest('Jury ne peut pas sélectionner un candidat après soumission');
  try {
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id')
      .eq('status', 'pre_approved')
      .limit(1)
      .single();

    if (candidate) {
      const { error } = await supabase
        .from('candidates')
        .update({ status: 'jury_selected' })
        .eq('id', candidate.id);

      if (error) {
        logSuccess('Sélection refusée (RLS fonctionne)');
        recordTest(true);
      } else {
        logError('Sélection autorisée (FAILLE DE SÉCURITÉ)');
        recordTest(false);
        
        // Restaurer
        await supabase
          .from('candidates')
          .update({ status: 'pre_approved' })
          .eq('id', candidate.id);
      }
    } else {
      logWarning('Aucun candidat pre_approved pour le test');
      recordTest(true);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 2: Ne peut pas désélectionner un candidat
  logTest('Jury ne peut pas désélectionner un candidat après soumission');
  try {
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id')
      .eq('status', 'jury_selected')
      .limit(1)
      .single();

    if (candidate) {
      const { error } = await supabase
        .from('candidates')
        .update({ status: 'pre_approved' })
        .eq('id', candidate.id);

      if (error) {
        logSuccess('Désélection refusée (RLS fonctionne)');
        recordTest(true);
      } else {
        logError('Désélection autorisée (FAILLE DE SÉCURITÉ)');
        recordTest(false);
        
        // Restaurer
        await supabase
          .from('candidates')
          .update({ status: 'jury_selected' })
          .eq('id', candidate.id);
      }
    } else {
      logWarning('Aucun candidat jury_selected pour le test');
      recordTest(true);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 3: Ne peut pas ajouter de notes
  logTest('Jury ne peut pas ajouter de notes après soumission');
  try {
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id')
      .limit(1)
      .single();

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'jury')
      .single();

    if (candidate && userProfile) {
      const { error } = await supabase
        .from('jury_ratings')
        .insert({
          candidate_id: candidate.id,
          jury_id: userProfile.id,
          performance: 8,
          originality: 7,
          stage_presence: 9,
          technique: 8,
          overall_score: 8,
        });

      if (error) {
        logSuccess('Insertion refusée (RLS fonctionne)');
        recordTest(true);
      } else {
        logError('Insertion autorisée (FAILLE DE SÉCURITÉ)');
        recordTest(false);
        
        // Nettoyer
        await supabase
          .from('jury_ratings')
          .delete()
          .eq('candidate_id', candidate.id)
          .eq('jury_id', userProfile.id);
      }
    } else {
      logWarning('Candidat ou profil jury non trouvé');
      recordTest(true);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 4: Ne peut pas modifier les notes existantes
  logTest('Jury ne peut pas modifier les notes existantes après soumission');
  try {
    const { data: existingRating } = await supabase
      .from('jury_ratings')
      .select('id')
      .limit(1)
      .single();

    if (existingRating) {
      const { error } = await supabase
        .from('jury_ratings')
        .update({ performance: 10 })
        .eq('id', existingRating.id);

      if (error) {
        logSuccess('Modification refusée (RLS fonctionne)');
        recordTest(true);
      } else {
        logError('Modification autorisée (FAILLE DE SÉCURITÉ)');
        recordTest(false);
      }
    } else {
      logWarning('Aucune note existante pour le test');
      recordTest(true);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Déconnexion jury
  await supabase.auth.signOut();

  // Restaurer le verrou
  logTest('Restauration du verrou');
  const { data: restoreAuth, error: restoreAuthError } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.ADMIN_EMAIL,
    password: TEST_CONFIG.ADMIN_PASSWORD,
  });

  if (restoreAuthError) {
    logError(`Erreur restauration: ${restoreAuthError.message}`);
  } else {
    await supabase
      .from('system_control')
      .update({ jury_selection_submitted: false })
      .eq('id', 1);
    logSuccess('Verrou restauré');
    await supabase.auth.signOut();
  }
}

// ==========================================
// 5. CANDIDAT NE VOIT QUE SA PROPRE CANDIDATURE
// ==========================================

async function testCandidateSeesOnlyOwnApplication() {
  logSection('5. CANDIDAT NE VOIT QUE SA PROPRE CANDIDATURE');

  // Créer un candidat de test
  logTest('Création d\'un candidat de test');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'test_candidate_rls@example.com',
    password: 'test123',
  });

  if (authError && !authError.message.includes('already registered')) {
    logError(`Erreur création candidat: ${authError.message}`);
    recordTest(false);
    return;
  }

  const profileId = authData.user?.id;
  
  // Créer le profil
  await supabase.from('profiles').upsert({
    id: profileId,
    email: 'test_candidate_rls@example.com',
    full_name: 'Test Candidate RLS',
    role: 'candidate',
  });

  // Créer une candidature
  const { data: candidate, error: createError } = await supabase
    .from('candidates')
    .insert({
      profile_id: profileId,
      stage_name: 'Test Artist RLS',
      real_name: 'Test Real Name',
      discipline: 'Musique',
      region: 'Littoral',
      phone: '+22912345678',
      status: 'pending_review',
      video_url: 'https://youtube.com/test',
    })
    .select()
    .single();

  if (createError) {
    logError(`Erreur création candidature: ${createError.message}`);
    recordTest(false);
    await supabase.auth.signOut();
    return;
  }
  logSuccess('Candidat créé avec succès');

  // Test 1: Peut voir sa propre candidature
  logTest('Candidat peut voir sa propre candidature');
  try {
    const { data: ownCandidate } = await supabase
      .from('candidates')
      .select('*')
      .eq('profile_id', profileId);

    if (ownCandidate && ownCandidate.length > 0) {
      logSuccess('Candidat peut voir sa propre candidature');
      recordTest(true);
    } else {
      logError('Candidat ne peut pas voir sa propre candidature');
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 2: Ne peut pas voir les autres candidatures
  logTest('Candidat ne peut pas voir les autres candidatures');
  try {
    const { data: allCandidates } = await supabase
      .from('candidates')
      .select('*');

    const hasOnlyOwn = allCandidates?.every(c => c.profile_id === profileId);

    if (hasOnlyOwn) {
      logSuccess('Candidat ne voit que sa propre candidature');
      recordTest(true);
    } else {
      const otherCount = allCandidates?.filter(c => c.profile_id !== profileId).length;
      logError(`FAILLE: Candidat voit ${otherCount} autres candidatures`);
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 3: Peut modifier sa propre candidature
  logTest('Candidat peut modifier sa propre candidature');
  try {
    const { error } = await supabase
      .from('candidates')
      .update({ stage_name: 'Modified Test' })
      .eq('profile_id', profileId);

    if (error) {
      logError('Candidat ne peut pas modifier sa propre candidature');
      recordTest(false);
    } else {
      logSuccess('Candidat peut modifier sa propre candidature');
      recordTest(true);
      
      // Restaurer
      await supabase
        .from('candidates')
        .update({ stage_name: 'Test Artist RLS' })
        .eq('profile_id', profileId);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 4: Ne peut pas modifier les autres candidatures
  logTest('Candidat ne peut pas modifier les autres candidatures');
  try {
    const { data: otherCandidate } = await supabase
      .from('candidates')
      .select('id')
      .neq('profile_id', profileId)
      .limit(1)
      .single();

    if (otherCandidate) {
      const { error } = await supabase
        .from('candidates')
        .update({ stage_name: 'Hacked' })
        .eq('id', otherCandidate.id);

      if (error) {
        logSuccess('Modification refusée (RLS fonctionne)');
        recordTest(true);
      } else {
        logError('Modification autorisée (FAILLE DE SÉCURITÉ)');
        recordTest(false);
        
        // Restaurer
        await supabase
          .from('candidates')
          .update({ stage_name: 'Test' })
          .eq('id', otherCandidate.id);
      }
    } else {
      logWarning('Aucun autre candidat pour le test');
      recordTest(true);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Nettoyer
  logTest('Nettoyage du candidat de test');
  await supabase.from('candidates').delete().eq('profile_id', profileId);
  await supabase.from('profiles').delete().eq('id', profileId);
  await supabase.auth.admin.deleteUser(profileId);
  await supabase.auth.signOut();
  logSuccess('Nettoyage terminé');
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
  logSection('DÉBUT DES TESTS DE SÉCURITÉ RLS');
  logInfo(`Admin: ${TEST_CONFIG.ADMIN_EMAIL}`);
  logInfo(`Jury: ${TEST_CONFIG.JURY_EMAIL}`);

  try {
    await testJuryCannotAccessAdminDashboard();
    await testAdminCannotRateLikeJury();
    await testAnonymousVisitorSeesOnlyApproved();
    await testJuryCannotModifyAfterSubmission();
    await testCandidateSeesOnlyOwnApplication();
    printReport();
  } catch (error) {
    logError(`Erreur fatale: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter les tests
runAllTests();
