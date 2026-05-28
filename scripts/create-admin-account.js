const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ietzgjbykkwkemakwfqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldHpnamJ5a2t3a2VtYWt3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzQsImV4cCI6MjA5NDkzNTM3NH0.vOpyHafVSY8I--YCMO6BMdWVVBrjyGfeDdieFa8CSuM'
);

async function createAdminAccount() {
  try {
    console.log('🔧 Création d\'un compte admin fonctionnel...\n');
    
    // Email et mot de passe pour le nouveau compte admin
    const adminEmail = 'admin@toptalentbenin.com';
    const adminPassword = 'AdminTTB2026!';
    
    // 1. Créer l'utilisateur auth avec admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        full_name: 'Administrateur Top Talent'
      }
    });
    
    if (authError) {
      console.error('❌ Erreur création auth:', authError.message);
      
      // Si l'utilisateur existe déjà, essayer de le récupérer
      if (authError.message.includes('already registered')) {
        console.log('📧 L\'email admin existe déjà, tentative de récupération...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword
        });
        
        if (signInError) {
          console.log('❌ Mot de passe incorrect pour l\'email existant');
          console.log('💡 Utilisez "Identifiants oubliés ?" sur la page de connexion');
          return;
        }
        
        console.log('✅ Compte admin existant validé');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Mot de passe: ${adminPassword}`);
        console.log(`🔗 URL: https://toptalentbenin.vercel.app/login`);
        return;
      }
      return;
    }
    
    console.log('✅ Utilisateur auth créé:', authData.user.id);
    
    // 2. Mettre à jour ou créer le profil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        full_name: 'Administrateur Top Talent',
        phone: '+22990000000',
        role: 'admin'
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Erreur création profil:', profileError.message);
      return;
    }
    
    console.log('✅ Profil admin créé/mis à jour:', profileData.id);
    
    // 3. Afficher les identifiants
    console.log(`\n🎉 COMPTE ADMIN CRÉÉ AVEC SUCCÈS`);
    console.log(`═══════════════════════════════════════`);
    console.log(`📧 EMAIL:     ${adminEmail}`);
    console.log(`🔑 MOT DE PASSE: ${adminPassword}`);
    console.log(`🔗 URL CONNEXION: https://toptalentbenin.vercel.app/login`);
    console.log(`═══════════════════════════════════════`);
    console.log(`\n📋 INSTRUCTIONS:`);
    console.log(`1. Allez sur https://toptalentbenin.vercel.app/login`);
    console.log(`2. Entrez l'email: ${adminEmail}`);
    console.log(`3. Entrez le mot de passe: ${adminPassword}`);
    console.log(`4. Vous serez redirigé vers /dashboard/admin`);
    console.log(`\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion !`);
    
  } catch (error) {
    console.error('❌ Erreur création admin:', error.message);
  }
}

// Exécuter la création
createAdminAccount();
