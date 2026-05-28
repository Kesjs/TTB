const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ietzgjbykkwkemakwfqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldHpnamJ5a2t3a2VtYWt3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzQsImV4cCI6MjA5NDkzNTM3NH0.vOpyHafVSY8I--YCMO6BMdWVVBrjyGfeDdieFa8CSuM'
);

async function resetAdminPassword() {
  try {
    console.log('🔧 Réinitialisation du mot de passe admin...\n');
    
    const email = 'kenkenbabatounde@gmail.com';
    const newPassword = 'AdminTTB2026!';
    
    // 1. D'abord, essayer de trouver l'utilisateur
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('❌ Impossible de lister les utilisateurs (permissions requises)');
      console.log('💡 Solution alternative via API publique...');
      
      // Alternative: utiliser la récupération de mot de passe
      console.log(`\n📧 ENVOI D'EMAIL DE RÉINITIALISATION`);
      console.log(`═══════════════════════════════════════`);
      console.log(`1. Allez sur: https://toptalentbenin.vercel.app/login`);
      console.log(`2. Cliquez sur: "Identifiants oubliés ?"`);
      console.log(`3. Entrez l'email: ${email}`);
      console.log(`4. Vous recevrez un email pour réinitialiser`);
      console.log(`5. Choisissez un nouveau mot de passe`);
      console.log(`═══════════════════════════════════════`);
      
      return;
    }
    
    // 2. Chercher l'utilisateur admin
    const adminUser = userList.users.find(user => user.email === email);
    
    if (!adminUser) {
      console.log(`❌ Utilisateur ${email} non trouvé`);
      return;
    }
    
    console.log(`✅ Utilisateur trouvé: ${adminUser.email}`);
    console.log(`   ID: ${adminUser.id}`);
    
    // 3. Réinitialiser le mot de passe avec admin API
    const { data: resetData, error: resetError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      { password: newPassword }
    );
    
    if (resetError) {
      console.log(`❌ Erreur réinitialisation: ${resetError.message}`);
      console.log(`\n💡 SOLUTION MANUELLE:`);
      console.log(`1. Utilisez "Identifiants oubliés ?" sur la page de connexion`);
      console.log(`2. Entrez: ${email}`);
      console.log(`3. Suivez les instructions par email`);
      return;
    }
    
    console.log(`✅ MOT DE PASSE RÉINITIALISÉ AVEC SUCCÈS!`);
    console.log(`═══════════════════════════════════════`);
    console.log(`📧 EMAIL: ${email}`);
    console.log(`🔑 NOUVEAU MOT DE PASSE: ${newPassword}`);
    console.log(`🔗 URL: https://toptalentbenin.vercel.app/login`);
    console.log(`═══════════════════════════════════════`);
    console.log(`\n🎯 CONNECTEZ-VOUS MAINTENANT avec ces identifiants!`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log(`\n💡 SOLUTION ALTERNATIVE:`);
    console.log(`Utilisez "Identifiants oubliés ?" avec l'email kenkenbabatounde@gmail.com`);
  }
}

resetAdminPassword();
