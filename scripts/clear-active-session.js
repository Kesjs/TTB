const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ietzgjbykkwkemakwfqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldHpnamJ5a2t3a2VtYWt3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzQsImV4cCI6MjA5NDkzNTM3NH0.vOpyHafVSY8I--YCMO6BMdWVVBrjyGfeDdieFa8CSuM'
);

async function clearActiveSession() {
  try {
    console.log('🧹 Nettoyage de la session active admin...\n');
    
    // 1. D'abord, essayer de se déconnecter de la session active
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (!signOutError) {
        console.log('✅ Session active déconnectée avec succès');
      } else {
        console.log('ℹ️  Pas de session active à déconnecter');
      }
    } catch (err) {
      console.log('ℹ️  Erreur lors de la déconnexion:', err.message);
    }
    
    // 2. Nettoyer les cookies et localStorage côté client (instructions)
    console.log(`\n🔧 NETTOYAGE MANUEL REQUIS:`);
    console.log(`═══════════════════════════════════════`);
    console.log(`1. Dans votre navigateur, appuyez sur F12`);
    console.log(`2. Allez dans "Application" > "Storage"`);
    console.log(`3. Supprimez TOUS les cookies du domaine`);
    console.log(`4. Supprimez TOUT le localStorage`);
    console.log(`5. Supprimez TOUT le sessionStorage`);
    console.log(`6. Fermez et rouvrez votre navigateur`);
    console.log(`═══════════════════════════════════════`);
    
    // 3. Alternative: créer une nouvelle session propre
    console.log(`\n🔄 SOLUTION ALTERNATIVE:`);
    console.log(`1. Utilisez une fenêtre de navigation privée/incognito`);
    console.log(`2. Allez sur: https://toptalentbenin.vercel.app/login`);
    console.log(`3. Entrez: kenkenbabatounde@gmail.com`);
    console.log(`4. Entrez: Admin123456!`);
    console.log(`5. Connectez-vous`);
    
    // 4. Instructions pour réinitialiser via Supabase
    console.log(`\n🎯 RÉINITIALISATION VIA SUPABASE DASHBOARD:`);
    console.log(`1. Allez dans votre dashboard Supabase`);
    console.log(`2. Allez dans "Authentication" > "Users"`);
    console.log(`3. Trouvez: kenkenbabatounde@gmail.com`);
    console.log(`4. Cliquez sur les 3 points > "Sign Out User"`);
    console.log(`5. Puis "Reset Password" > "Admin123456!"`);
    
    console.log(`\n✅ APRÈS NETTOYAGE:`);
    console.log(`📧 Email: kenkenbabatounde@gmail.com`);
    console.log(`🔑 Mot de passe: Admin123456!`);
    console.log(`🔗 URL: https://toptalentbenin.vercel.app/login`);
    
    // 5. Script SQL pour forcer la déconnexion
    console.log(`\n🔧 SCRIPT SQL FORCÉ:`);
    console.log(`-- Forcer la déconnexion de tous les utilisateurs`);
    console.log(`UPDATE auth.users SET last_sign_in_at = NULL WHERE email = 'kenkenbabatounde@gmail.com';`);
    console.log(`-- Réinitialiser le mot de passe`);
    console.log(`UPDATE auth.users SET encrypted_password = crypt('Admin123456!', gen_salt('bf')) WHERE email = 'kenkenbabatounde@gmail.com';`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

clearActiveSession();
