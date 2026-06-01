/**
 * MASTER TEST RUNNER - TOP TALENT BENIN
 * 
 * Ce script exécute tous les tests de validation du workflow:
 * - Workflow complet
 * - Sécurité RLS
 * - Notifications
 * - Cas limites
 * 
 * Usage: node scripts/run-all-tests.js
 */

const { execSync } = require('child_process');
const path = require('path');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(colors.bold + title, 'cyan');
  console.log('='.repeat(70));
}

const scripts = [
  { name: 'Workflow Complet', file: 'test-complete-workflow.js' },
  { name: 'Sécurité RLS', file: 'test-rls-security.js' },
  { name: 'Notifications', file: 'test-notifications.js' },
  { name: 'Cas Limites', file: 'test-edge-cases.js' },
];

async function runTest(script) {
  logSection(`Exécution: ${script.name}`);
  
  try {
    const startTime = Date.now();
    execSync(`node ${path.join(__dirname, script.file)}`, { stdio: 'inherit' });
    const duration = Date.now() - startTime;
    log(`✅ ${script.name} terminé en ${duration}ms`, 'green');
    return { name: script.name, success: true, duration };
  } catch (error) {
    log(`❌ ${script.name} échoué`, 'red');
    return { name: script.name, success: false, duration: 0 };
  }
}

async function main() {
  logSection('MASTER TEST RUNNER - TOP TALENT BENIN');
  log('Ce script exécute tous les tests de validation', 'blue');
  log('Assurez-vous d\'avoir configuré les variables d\'environnement:', 'yellow');
  log('- TEST_ADMIN_EMAIL', 'yellow');
  log('- TEST_ADMIN_PASSWORD', 'yellow');
  log('- TEST_JURY_EMAIL', 'yellow');
  log('- TEST_JURY_PASSWORD', 'yellow');
  console.log('');

  const results = [];
  const totalStartTime = Date.now();

  for (const script of scripts) {
    const result = await runTest(script);
    results.push(result);
  }

  const totalDuration = Date.now() - totalStartTime;

  // Rapport final
  logSection('RAPPORT FINAL');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  log(`Total suites: ${results.length}`, 'blue');
  log(`Réussies: ${successful}`, 'green');
  log(`Échouées: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Durée totale: ${totalDuration}ms`, 'blue');
  console.log('='.repeat(70));

  if (failed > 0) {
    log('\nSuites échouées:', 'red');
    results.filter(r => !r.success).forEach(r => {
      log(`  - ${r.name}`, 'red');
    });
    process.exit(1);
  } else {
    log('\n✅ Tous les tests ont réussi!', 'green');
  }
}

main();
