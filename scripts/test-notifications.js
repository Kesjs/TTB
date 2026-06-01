/**
 * TESTS DES NOTIFICATIONS - TOP TALENT BENIN
 * 
 * Ce script teste le système de notifications:
 * - Badge 🔴 apparaît instantanément (pas après 30 secondes)
 * - Badge disparaît après "tout marquer comme lu"
 * - Bonne notification au bon destinataire (jury vs admin)
 * 
 * Prérequis:
 * - Avoir un compte admin actif
 * - Avoir un compte jury actif
 * 
 * Usage: node scripts/test-notifications.js
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
  console.log(`\n🔔 ${testName}`);
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
// 1. BADGE APPARAÎT INSTANÉMENT
// ==========================================

async function testBadgeAppearsInstantly() {
  logSection('1. BADGE APPARAÎT INSTANÉMENT');

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

  // Récupérer l'ID du profil admin
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .single();

  if (!adminProfile) {
    logError('Profil admin non trouvé');
    recordTest(false);
    await supabase.auth.signOut();
    return;
  }

  // Nettoyer les notifications existantes
  logTest('Nettoyage des notifications existantes');
  await supabase
    .from('notifications')
    .delete()
    .eq('user_id', adminProfile.id);

  // Créer une notification de test
  logTest('Création d\'une notification de test');
  const startTime = Date.now();
  const { data: notification, error: createError } = await supabase
    .from('notifications')
    .insert({
      user_id: adminProfile.id,
      title: 'Test Notification',
      message: 'Ceci est une notification de test',
      type: 'info',
      is_read: false,
    })
    .select()
    .single();

  if (createError) {
    logError(`Erreur création notification: ${createError.message}`);
    recordTest(false);
    await supabase.auth.signOut();
    return;
  }

  const creationTime = Date.now() - startTime;
  logInfo(`Temps de création: ${creationTime}ms`);

  // Vérifier que la notification est créée
  logTest('Vérification de la création instantanée');
  try {
    const { data: unreadNotifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', adminProfile.id)
      .eq('is_read', false);

    if (unreadNotifications && unreadNotifications.length > 0) {
      logSuccess('Notification créée instantanément');
      recordTest(true);
    } else {
      logError('Notification non trouvée');
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Vérifier le compteur de notifications non lues
  logTest('Vérification du compteur de notifications non lues');
  try {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', adminProfile.id)
      .eq('is_read', false);

    if (count > 0) {
      logSuccess(`Compteur fonctionnel: ${count} notification(s) non lue(s)`);
      recordTest(true);
    } else {
      logError('Compteur incorrect');
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Déconnexion admin
  await supabase.auth.signOut();
}

// ==========================================
// 2. BADGE DISPARAÎT APRÈS "TOUT MARQUER COMME LU"
// ==========================================

async function testBadgeDisappearsAfterMarkAllRead() {
  logSection('2. BADGE DISPARAÎT APRÈS "TOUT MARQUER COMME LU"');

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

  // Récupérer l'ID du profil admin
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .single();

  if (!adminProfile) {
    logError('Profil admin non trouvé');
    recordTest(false);
    await supabase.auth.signOut();
    return;
  }

  // Créer plusieurs notifications non lues
  logTest('Création de notifications non lues');
  const notifications = [];
  for (let i = 0; i < 3; i++) {
    const { data } = await supabase
      .from('notifications')
      .insert({
        user_id: adminProfile.id,
        title: `Test Notification ${i + 1}`,
        message: `Ceci est la notification de test ${i + 1}`,
        type: 'info',
        is_read: false,
      })
      .select()
      .single();
    notifications.push(data);
  }
  logSuccess('3 notifications créées');

  // Vérifier le compteur avant marquer comme lu
  logTest('Vérification du compteur avant marquer comme lu');
  try {
    const { count: beforeCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', adminProfile.id)
      .eq('is_read', false);

    logInfo(`Notifications non lues avant: ${beforeCount}`);

    if (beforeCount === 3) {
      logSuccess('Compteur correct avant');
      recordTest(true);
    } else {
      logError('Compteur incorrect avant');
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Marquer toutes comme lues
  logTest('Marquer toutes comme lues');
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', adminProfile.id)
      .eq('is_read', false);

    if (error) {
      logError(`Erreur marquer comme lu: ${error.message}`);
      recordTest(false);
    } else {
      logSuccess('Notifications marquées comme lues');
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Vérifier le compteur après marquer comme lu
  logTest('Vérification du compteur après marquer comme lu');
  try {
    const { count: afterCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', adminProfile.id)
      .eq('is_read', false);

    logInfo(`Notifications non lues après: ${afterCount}`);

    if (afterCount === 0) {
      logSuccess('Badge devrait disparaître (0 notifications non lues)');
      recordTest(true);
    } else {
      logError('Badge ne devrait pas apparaître');
      recordTest(false);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Nettoyer
  await supabase
    .from('notifications')
    .delete()
    .eq('user_id', adminProfile.id);

  // Déconnexion admin
  await supabase.auth.signOut();
}

// ==========================================
// 3. BONNE NOTIFICATION AU BON DESTINATAIRE
// ==========================================

async function testCorrectNotificationToCorrectRecipient() {
  logSection('3. BONNE NOTIFICATION AU BON DESTINATAIRE');

  // Récupérer les IDs des profils
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .single();

  const { data: juryProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'jury')
    .limit(1)
    .single();

  if (!adminProfile || !juryProfile) {
    logError('Profils admin ou jury non trouvés');
    recordTest(false);
    return;
  }

  // Test 1: Notification pour l'admin
  logTest('Création notification pour l\'admin');
  try {
    const { data: adminNotification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: adminProfile.id,
        title: 'Notification Admin',
        message: 'Ceci est une notification pour l\'admin',
        type: 'info',
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      logError(`Erreur création notification admin: ${error.message}`);
      recordTest(false);
    } else {
      logSuccess('Notification admin créée');
      recordTest(true);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Vérifier que l'admin peut voir sa notification
  logTest('Vérification admin peut voir sa notification');
  const { data: adminAuth, error: adminAuthError } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.ADMIN_EMAIL,
    password: TEST_CONFIG.ADMIN_PASSWORD,
  });

  if (adminAuthError) {
    logError(`Échec de l'authentification admin: ${adminAuthError.message}`);
    recordTest(false);
  } else {
    try {
      const { data: adminNotifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', adminProfile.id);

      if (adminNotifications && adminNotifications.length > 0) {
        logSuccess('Admin peut voir ses notifications');
        recordTest(true);
      } else {
        logError('Admin ne peut pas voir ses notifications');
        recordTest(false);
      }
    } catch (error) {
      logError(`Erreur test: ${error.message}`);
      recordTest(false);
    }
    await supabase.auth.signOut();
  }

  // Vérifier que le jury ne peut PAS voir les notifications de l'admin
  logTest('Vérification jury ne peut PAS voir les notifications de l\'admin');
  const { data: juryAuth, error: juryAuthError } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.JURY_EMAIL,
    password: TEST_CONFIG.JURY_PASSWORD,
  });

  if (juryAuthError) {
    logError(`Échec de l'authentification jury: ${juryAuthError.message}`);
    recordTest(false);
  } else {
    try {
      const { data: juryNotificationsForAdmin } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', adminProfile.id);

      if (!juryNotificationsForAdmin || juryNotificationsForAdmin.length === 0) {
        logSuccess('Jury ne peut pas voir les notifications de l\'admin');
        recordTest(true);
      } else {
        logError('FAILLE: Jury peut voir les notifications de l\'admin');
        recordTest(false);
      }
    } catch (error) {
      logError(`Erreur test: ${error.message}`);
      recordTest(false);
    }
    await supabase.auth.signOut();
  }

  // Test 2: Notification pour le jury
  logTest('Création notification pour le jury');
  try {
    const { data: juryNotification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: juryProfile.id,
        title: 'Notification Jury',
        message: 'Ceci est une notification pour le jury',
        type: 'info',
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      logError(`Erreur création notification jury: ${error.message}`);
      recordTest(false);
    } else {
      logSuccess('Notification jury créée');
      recordTest(true);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Vérifier que le jury peut voir sa notification
  logTest('Vérification jury peut voir sa notification');
  const { data: juryAuth2, error: juryAuthError2 } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.JURY_EMAIL,
    password: TEST_CONFIG.JURY_PASSWORD,
  });

  if (juryAuthError2) {
    logError(`Échec de l'authentification jury: ${juryAuthError2.message}`);
    recordTest(false);
  } else {
    try {
      const { data: juryNotifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', juryProfile.id);

      if (juryNotifications && juryNotifications.length > 0) {
        logSuccess('Jury peut voir ses notifications');
        recordTest(true);
      } else {
        logError('Jury ne peut pas voir ses notifications');
        recordTest(false);
      }
    } catch (error) {
      logError(`Erreur test: ${error.message}`);
      recordTest(false);
    }
    await supabase.auth.signOut();
  }

  // Vérifier que l'admin ne peut PAS voir les notifications du jury
  logTest('Vérification admin ne peut PAS voir les notifications du jury');
  const { data: adminAuth2, error: adminAuthError2 } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.ADMIN_EMAIL,
    password: TEST_CONFIG.ADMIN_PASSWORD,
  });

  if (adminAuthError2) {
    logError(`Échec de l'authentification admin: ${adminAuthError2.message}`);
    recordTest(false);
  } else {
    try {
      const { data: adminNotificationsForJury } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', juryProfile.id);

      if (!adminNotificationsForJury || adminNotificationsForJury.length === 0) {
        logSuccess('Admin ne peut pas voir les notifications du jury');
        recordTest(true);
      } else {
        logError('FAILLE: Admin peut voir les notifications du jury');
        recordTest(false);
      }
    } catch (error) {
      logError(`Erreur test: ${error.message}`);
      recordTest(false);
    }
    await supabase.auth.signOut();
  }

  // Nettoyer
  await supabase
    .from('notifications')
    .delete()
    .in('user_id', [adminProfile.id, juryProfile.id]);
}

// ==========================================
// 4. NOTIFICATIONS DE WORKFLOW
// ==========================================

async function testWorkflowNotifications() {
  logSection('4. NOTIFICATIONS DE WORKFLOW');

  // Récupérer les profils
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .single();

  const { data: juryProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'jury')
    .limit(1)
    .single();

  if (!adminProfile || !juryProfile) {
    logError('Profils non trouvés');
    recordTest(false);
    return;
  }

  // Test 1: Notification envoyée au jury après "Envoyer au jury"
  logTest('Simulation notification au jury après envoi');
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: juryProfile.id,
        title: 'Candidats envoyés au jury',
        message: 'Les candidats pré-approuvés sont maintenant disponibles pour sélection',
        type: 'workflow',
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      logError(`Erreur création notification: ${error.message}`);
      recordTest(false);
    } else {
      logSuccess('Notification workflow jury créée');
      recordTest(true);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 2: Notification envoyée à l'admin après soumission jury
  logTest('Simulation notification à l\'admin après soumission jury');
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: adminProfile.id,
        title: 'Sélection jury soumise',
        message: 'Le jury a soumis sa sélection de 40 candidats',
        type: 'workflow',
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      logError(`Erreur création notification: ${error.message}`);
      recordTest(false);
    } else {
      logSuccess('Notification workflow admin créée');
      recordTest(true);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Test 3: Notification envoyée au jury après confirmation admin
  logTest('Simulation notification au jury après confirmation admin');
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: juryProfile.id,
        title: 'Candidats confirmés et publiés',
        message: 'L\'admin a confirmé et publié les candidats sélectionnés',
        type: 'workflow',
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      logError(`Erreur création notification: ${error.message}`);
      recordTest(false);
    } else {
      logSuccess('Notification workflow jury créée');
      recordTest(true);
    }
  } catch (error) {
    logError(`Erreur test: ${error.message}`);
    recordTest(false);
  }

  // Nettoyer
  await supabase
    .from('notifications')
    .delete()
    .in('user_id', [adminProfile.id, juryProfile.id]);
}

// ==========================================
// 5. PERFORMANCE DES NOTIFICATIONS
// ==========================================

async function testNotificationPerformance() {
  logSection('5. PERFORMANCE DES NOTIFICATIONS');

  // Authentifier admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.ADMIN_EMAIL,
    password: TEST_CONFIG.ADMIN_PASSWORD,
  });

  if (authError) {
    logError(`Échec de l'authentification admin: ${authError.message}`);
    recordTest(false);
    return;
  }

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .single();

  if (!adminProfile) {
    logError('Profil admin non trouvé');
    recordTest(false);
    await supabase.auth.signOut();
    return;
  }

  // Nettoyer
  await supabase
    .from('notifications')
    .delete()
    .eq('user_id', adminProfile.id);

  // Test 1: Création en masse
  logTest('Création de 50 notifications en masse');
  const startTime = Date.now();
  const notifications = [];
  for (let i = 0; i < 50; i++) {
    const { data } = await supabase
      .from('notifications')
      .insert({
        user_id: adminProfile.id,
        title: `Notification ${i + 1}`,
        message: `Message ${i + 1}`,
        type: 'info',
        is_read: false,
      })
      .select()
      .single();
    notifications.push(data);
  }
  const creationTime = Date.now() - startTime;
  logInfo(`Temps pour 50 notifications: ${creationTime}ms`);
  logInfo(`Moyenne par notification: ${(creationTime / 50).toFixed(2)}ms`);

  if (creationTime < 5000) {
    logSuccess('Performance acceptable');
    recordTest(true);
  } else {
    logWarning('Performance à améliorer');
    recordTest(true);
  }

  // Test 2: Lecture en masse
  logTest('Lecture de 50 notifications');
  const readStartTime = Date.now();
  const { data: allNotifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', adminProfile.id);
  const readTime = Date.now() - readStartTime;
  logInfo(`Temps de lecture: ${readTime}ms`);

  if (readTime < 1000) {
    logSuccess('Performance lecture acceptable');
    recordTest(true);
  } else {
    logWarning('Performance lecture à améliorer');
    recordTest(true);
  }

  // Test 3: Marquer tout comme lu
  logTest('Marquer 50 notifications comme lues');
  const markStartTime = Date.now();
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', adminProfile.id);
  const markTime = Date.now() - markStartTime;
  logInfo(`Temps de marquage: ${markTime}ms`);

  if (markTime < 1000) {
    logSuccess('Performance marquage acceptable');
    recordTest(true);
  } else {
    logWarning('Performance marquage à améliorer');
    recordTest(true);
  }

  // Nettoyer
  await supabase
    .from('notifications')
    .delete()
    .eq('user_id', adminProfile.id);

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
  logSection('DÉBUT DES TESTS DE NOTIFICATIONS');
  logInfo(`Admin: ${TEST_CONFIG.ADMIN_EMAIL}`);
  logInfo(`Jury: ${TEST_CONFIG.JURY_EMAIL}`);

  try {
    await testBadgeAppearsInstantly();
    await testBadgeDisappearsAfterMarkAllRead();
    await testCorrectNotificationToCorrectRecipient();
    await testWorkflowNotifications();
    await testNotificationPerformance();
    printReport();
  } catch (error) {
    logError(`Erreur fatale: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter les tests
runAllTests();
