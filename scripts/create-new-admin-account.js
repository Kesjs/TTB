const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ietzgjbykkwkemakwfqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldHpnamJ5a2t3a2VtYWt3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzQsImV4cCI6MjA5NDkzNTM3NH0.vOpyHafVSY8I--YCMO6BMdWVVBrjyGfeDdieFa8CSuM'
);

async function createNewAdminAccount() {
  try {
    console.log('🔧 CRÉATION D\'UN NOUVEAU COMPTE ADMIN DÉFINITIF...\n');
    
    // Nouveau compte admin avec un email différent
    const newAdminEmail = 'ttb.admin.2026@gmail.com';
    const newAdminPassword = 'AdminTTB2026!';
    
    // 1. Créer le nouvel utilisateur
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: newAdminEmail,
      password: newAdminPassword,
      options: {
        data: {
          role: 'admin',
          full_name: 'Admin Top Talent 2026'
        }
      }
    });
    
    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('❌ Erreur création:', signUpError.message);
      return;
    }
    
    console.log('✅ Utilisateur admin créé ou existe déjà');
    
    // 2. Si le compte existe, tester la connexion
    if (signUpError && signUpError.message.includes('already registered')) {
      console.log('📧 Compte existe déjà, test de connexion...');
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: newAdminEmail,
        password: newAdminPassword
      });
      
      if (signInError) {
        console.log('❌ Mot de passe incorrect pour le compte existant');
        console.log('💡 Utilisez "Identifiants oubliés ?" avec cet email');
        return;
      }
      
      console.log('✅ Compte existant validé');
      
      // Créer le profil si nécessaire
      if (signInData.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single();
        
        if (!profileData) {
          await supabase
            .from('profiles')
            .insert({
              id: signInData.user.id,
              full_name: 'Admin Top Talent 2026',
              phone: '+22997000000',
              role: 'admin'
            });
          console.log('✅ Profil admin créé');
        }
      }
    } else if (signUpData.user) {
      // Créer le profil pour le nouveau compte
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          full_name: 'Admin Top Talent 2026',
          phone: '+22997000000',
          role: 'admin'
        })
        .select()
        .single();
      
      if (profileError) {
        console.error('❌ Erreur profil:', profileError.message);
      } else {
        console.log('✅ Profil admin créé:', profileData.id);
      }
    }
    
    // 3. Afficher les nouveaux identifiants
    console.log(`\n🎉 NOUVEAU COMPTE ADMIN CRÉÉ`);
    console.log(`═══════════════════════════════════════`);
    console.log(`📧 EMAIL: ${newAdminEmail}`);
    console.log(`🔑 MOT DE PASSE: ${newAdminPassword}`);
    console.log(`🔗 URL: https://toptalentbenin.vercel.app/login`);
    console.log(`═══════════════════════════════════════`);
    
    console.log(`\n📋 INSTRUCTIONS:`);
    console.log(`1. Utilisez une fenêtre de navigation privée`);
    console.log(`2. Allez sur: https://toptalentbenin.vercel.app/login`);
    console.log(`3. Entrez: ${newAdminEmail}`);
    console.log(`4. Entrez: ${newAdminPassword}`);
    console.log(`5. Connectez-vous`);
    
    // 4. Alternative si ça ne fonctionne pas
    console.log(`\n🔄 SOLUTION ALTERNATIVE SI BLOCAGE:`);
    console.log(`1. Allez directement sur: https://toptalentbenin.vercel.app/dashboard/admin`);
    console.log(`2. Si redirection vers login, utilisez les identifiants ci-dessus`);
    console.log(`3. Si toujours bloqué, vérifiez la console pour les erreurs`);
    
    console.log(`\n⚠️  SI TOUJOURS BLOQUÉ:`);
    console.log(`Le problème pourrait venir de:`);
    console.log(`- La page /login elle-même (erreur JavaScript)`);
    console.log(`- Le middleware qui bloque l'accès`);
    console.log(`- Un problème avec l'action signInStaff`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createNewAdminAccount();
