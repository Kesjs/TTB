const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ietzgjbykkwkemakwfqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldHpnamJ5a2t3a2VtYWt3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzQsImV4cCI6MjA5NDkzNTM3NH0.vOpyHafVSY8I--YCMO6BMdWVVBrjyGfeDdieFa8CSuM'
);

async function fixAdminConflict() {
  try {
    console.log('🔧 Analyse du conflit de session admin...\n');
    
    // 1. Vérifier tous les profils admin
    const { data: adminProfiles, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin');
    
    if (adminError) throw adminError;
    
    console.log('=== PROFILS ADMIN TROUVÉS ===');
    adminProfiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. ${profile.full_name}`);
      console.log(`   ID: ${profile.id}`);
      console.log(`   Email: (non stocké dans profiles)`);
      console.log(`   Téléphone: ${profile.phone}`);
    });
    
    // 2. Pour chaque profil admin, essayer de trouver l'email correspondant
    console.log(`\n=== RECHERCHE DES EMAILS ADMIN ===`);
    
    for (const profile of adminProfiles) {
      // Le profil "Kenken Babatounde" est probablement l'ancien
      if (profile.full_name.includes('Kenken') || profile.full_name.includes('Babatounde')) {
        console.log(`\n🔍 Profil ancien trouvé: ${profile.full_name}`);
        console.log(`   ID: ${profile.id}`);
        
        // Essayer de récupérer l'email depuis les métadonnées utilisateur
        try {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);
          
          if (!userError && userData.user) {
            console.log(`   ✅ Email trouvé: ${userData.user.email}`);
            console.log(`   📅 Créé le: ${new Date(userData.user.created_at).toLocaleString('fr-FR')}`);
            console.log(`   🔐 Dernière connexion: ${userData.user.last_sign_in_at ? new Date(userData.user.last_sign_in_at).toLocaleString('fr-FR') : 'Jamais'}`);
            
            // C'est probablement le bon compte à utiliser
            console.log(`\n💡 SOLUTION UTILISER CE COMPTE:`);
            console.log(`   📧 Email: ${userData.user.email}`);
            console.log(`   🔑 Mot de passe: (inconnu - utiliser "Identifiants oubliés ?")`);
            console.log(`   🔗 URL: https://toptalentbenin.vercel.app/login`);
            
            // Nettoyer l'autre compte admin que nous avons créé
            console.log(`\n🧹 NETTOYAGE: Suppression du compte admin@toptalentbenin.com créé précédemment...`);
            
            try {
              // Supprimer le profil du nouveau compte
              const { error: deleteProfileError } = await supabase
                .from('profiles')
                .delete()
                .eq('full_name', 'Administrateur Top Talent');
              
              if (deleteProfileError) {
                console.log(`⚠️  Erreur suppression profil: ${deleteProfileError.message}`);
              } else {
                console.log(`✅ Profil admin@toptalentbenin.com supprimé`);
              }
              
              // Tenter de supprimer l'utilisateur auth (nécessite les permissions admin)
              try {
                const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
                  'd73a5de8-d6fb-4066-834c-ad2248563379'
                );
                
                if (deleteAuthError) {
                  console.log(`⚠️  Erreur suppression auth: ${deleteAuthError.message}`);
                  console.log(`   (normal si pas de permissions admin)`);
                } else {
                  console.log(`✅ Utilisateur auth admin@toptalentbenin.com supprimé`);
                }
              } catch (err) {
                console.log(`⚠️  Impossible de supprimer l'utilisateur auth (permissions requises)`);
              }
              
            } catch (cleanupError) {
              console.log(`⚠️  Erreur lors du nettoyage: ${cleanupError.message}`);
            }
            
          } else {
            console.log(`   ❌ Impossible de récupérer l'email: ${userError?.message}`);
          }
        } catch (err) {
          console.log(`   ❌ Erreur vérification utilisateur: ${err.message}`);
        }
      }
    }
    
    // 3. Instructions finales
    console.log(`\n📋 INSTRUCTIONS FINALES`);
    console.log(`═══════════════════════════════════════`);
    console.log(`1. Utilisez le compte "Kenken Babatounde" qui a déjà une session active`);
    console.log(`2. Si vous ne connaissez pas le mot de passe, cliquez sur "Identifiants oubliés ?"`);
    console.log(`3. Entrez l'email de Kenken Babatounde (probablement kenkenbabatounde@gmail.com)`);
    console.log(`4. Suivez les instructions pour réinitialiser le mot de passe`);
    console.log(`5. Reconnectez-vous avec le nouveau mot de passe`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixAdminConflict();
