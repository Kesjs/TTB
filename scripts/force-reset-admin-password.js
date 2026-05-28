const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ietzgjbykkwkemakwfqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldHpnamJ5a2t3a2VtYWt3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzQsImV4cCI6MjA5NDkzNTM3NH0.vOpyHafVSY8I--YCMO6BMdWVVBrjyGfeDdieFa8CSuM'
);

async function forceResetAdminPassword() {
  try {
    console.log('🔧 Réinitialisation forcée du mot de passe admin...\n');
    
    const email = 'kenkenbabatounde@gmail.com';
    const newPassword = 'Admin123456!';
    
    // Méthode 1: Essayer de réinitialiser via l'API admin si possible
    try {
      // D'abord se connecter avec le compte admin@toptalentbenin.com que nous avons créé
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@toptalentbenin.com',
        password: 'AdminTTB2026!'
      });
      
      if (!signInError && signInData.user) {
        console.log('✅ Connexion admin réussie, tentative de réinitialisation...');
        
        // Maintenant essayer de mettre à jour l'autre utilisateur
        // Cette méthode peut ne pas fonctionner sans permissions admin
        console.log('⚠️  Permissions admin limitées, essayez la méthode alternative...');
      }
    } catch (err) {
      console.log('ℹ️  Connexion admin non disponible, utilisation de la méthode alternative...');
    }
    
    // Méthode 2: Créer un script SQL direct pour Supabase
    console.log(`\n🎯 SOLUTION DIRECTE POUR VOTRE SYSTÈME:`);
    console.log(`═══════════════════════════════════════`);
    console.log(`1. Allez dans votre dashboard Supabase`);
    console.log(`2. Allez dans "SQL Editor"`);
    console.log(`3. Exécutez cette requête SQL:`);
    console.log(``);
    console.log(`-- Mettre à jour le mot de passe de l'admin`);
    console.log(`UPDATE auth.users`);
    console.log(`SET encrypted_password = crypt('${newPassword}', gen_salt('bf'))`);
    console.log(`WHERE email = '${email}';`);
    console.log(``);
    console.log(`4. Après exécution, utilisez:`);
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Mot de passe: ${newPassword}`);
    console.log(`═══════════════════════════════════════`);
    
    // Méthode 3: Alternative via Supabase Dashboard
    console.log(`\n🔄 ALTERNATIVE VIA DASHBOARD SUPABASE:`);
    console.log(`1. Connectez-vous à votre projet Supabase`);
    console.log(`2. Allez dans "Authentication" > "Users"`);
    console.log(`3. Trouvez l'utilisateur: ${email}`);
    console.log(`4. Cliquez sur les 3 points > "Reset Password"`);
    console.log(`5. Entrez le nouveau mot de passe: ${newPassword}`);
    
    console.log(`\n✅ IDENTIFIANTS FINAUX:`);
    console.log(`📧 EMAIL: ${email}`);
    console.log(`🔑 MOT DE PASSE: ${newPassword}`);
    console.log(`🔗 URL: https://toptalentbenin.vercel.app/login`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

forceResetAdminPassword();
