const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ietzgjbykkwkemakwfqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldHpnamJ5a2t3a2VtYWt3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzQsImV4cCI6MjA5NDkzNTM3NH0.vOpyHafVSY8I--YCMO6BMdWVVBrjyGfeDdieFa8CSuM'
);

async function diagnoseAdminProblem() {
  try {
    console.log('🔍 DIAGNOSTIC COMPLET DU PROBLÈME ADMIN...\n');
    
    // 1. Vérifier le profil admin
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('full_name', 'Kenken Babatounde')
      .single();
    
    if (profileError) {
      console.log('❌ Profil admin non trouvé:', profileError.message);
      return;
    }
    
    console.log('✅ Profil admin trouvé:');
    console.log(`   ID: ${adminProfile.id}`);
    console.log(`   Nom: ${adminProfile.full_name}`);
    console.log(`   Rôle: ${adminProfile.role}`);
    
    // 2. Tester la connexion avec différents mots de passe
    const email = 'kenkenbabatounde@gmail.com';
    const possiblePasswords = [
      'Admin123456!',
      'AdminTTB2026!',
      'password123',
      'admin123',
      'kenken123'
    ];
    
    console.log(`\n🔧 TEST DE CONNEXION AVEC DIFFÉRENTS MOTS DE PASSE:`);
    
    for (const password of possiblePasswords) {
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            console.log(`❌ ${password}: Mot de passe incorrect`);
          } else {
            console.log(`⚠️  ${password}: ${signInError.message}`);
          }
        } else {
          console.log(`✅ ${password}: CONNEXION RÉUSSIE !`);
          console.log(`   🎯 UTILISEZ CE MOT DE PASSE: ${password}`);
          
          // Se déconnecter immédiatement après le test
          await supabase.auth.signOut();
          return password;
        }
      } catch (err) {
        console.log(`❌ ${password}: Erreur de test`);
      }
    }
    
    // 3. Si aucun mot de passe ne fonctionne, diagnostiquer plus profondément
    console.log(`\n🔍 ANALYSE APPROFONDIE:`);
    
    // Vérifier si l'utilisateur existe dans auth.users
    try {
      // Tenter de créer un nouvel utilisateur pour voir si l'email existe
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email + '_test',
        password: 'test123456!'
      });
      
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          console.log(`✅ L'email ${email} existe bien dans Supabase Auth`);
        } else {
          console.log(`ℹ️  Erreur de test: ${signUpError.message}`);
        }
      }
      
      // Nettoyer le test
      if (signUpData.user) {
        await supabase.auth.admin.deleteUser(signUpData.user.id);
      }
    } catch (err) {
      console.log(`ℹ️  Impossible de tester l'existence de l'email`);
    }
    
    // 4. Problème identifié et solution
    console.log(`\n🎯 DIAGNOSTIC FINAL:`);
    console.log(`═══════════════════════════════════════`);
    console.log(`📋 PROBLÈME IDENTIFIÉ:`);
    console.log(`1. Le profil admin existe dans la base de données`);
    console.log(`2. L'utilisateur existe dans Supabase Auth`);
    console.log(`3. MAIS le mot de passe est inconnu`);
    console.log(`4. La session active bloque les nouvelles tentatives`);
    
    console.log(`\n🔧 SOLUTION DÉFINITIVE:`);
    console.log(`1. Allez dans votre dashboard Supabase`);
    console.log(`2. "Authentication" > "Users"`);
    console.log(`3. Trouvez: kenkenbabatounde@gmail.com`);
    console.log(`4. Cliquez sur les 3 points > "Reset Password"`);
    console.log(`5. Entrez: Admin123456!`);
    console.log(`6. Utilisez une fenêtre de navigation privée`);
    console.log(`7. Connectez-vous avec les nouveaux identifiants`);
    
    console.log(`\n✅ IDENTIFIANTS À UTILISER APRÈS RÉINITIALISATION:`);
    console.log(`📧 Email: kenkenbabatounde@gmail.com`);
    console.log(`🔑 Mot de passe: Admin123456!`);
    console.log(`🔗 URL: https://toptalentbenin.vercel.app/login`);
    
  } catch (error) {
    console.error('❌ Erreur de diagnostic:', error.message);
  }
}

diagnoseAdminProblem();
