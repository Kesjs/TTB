const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ietzgjbykkwkemakwfqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldHpnamJ5a2t3a2VtYWt3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzQsImV4cCI6MjA5NDkzNTM3NH0.vOpyHafVSY8I--YCMO6BMdWVVBrjyGfeDdieFa8CSuM'
);

async function checkAdminAccounts() {
  try {
    console.log('🔍 Vérification des comptes admin existants...\n');
    
    // 1. Vérifier les profils admin
    const { data: adminProfiles, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin');
    
    if (adminError) throw adminError;
    
    console.log('=== PROFILS ADMIN TROUVÉS ===');
    console.log(`Nombre: ${adminProfiles.length}`);
    
    if (adminProfiles.length === 0) {
      console.log('❌ Aucun profil admin trouvé - Création nécessaire...');
      await createAdminAccount();
      return;
    }
    
    adminProfiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. ${profile.full_name}`);
      console.log(`   ID: ${profile.id}`);
      console.log(`   Email: (non stocké dans profiles)`);
      console.log(`   Téléphone: ${profile.phone || 'Non défini'}`);
      console.log(`   Rôle: ${profile.role}`);
      console.log(`   Créé le: ${new Date(profile.created_at).toLocaleDateString('fr-FR')}`);
    });
    
    // 2. Vérifier les utilisateurs auth correspondants
    console.log(`\n=== VÉRIFICATION UTILISATEURS AUTH ===`);
    
    for (const profile of adminProfiles) {
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);
        
        if (authError) {
          console.log(`❌ Profil ${profile.id}: Pas d'utilisateur auth correspondant`);
        } else if (authUser.user) {
          console.log(`✅ Profil ${profile.id}: Utilisateur auth trouvé`);
          console.log(`   Email: ${authUser.user.email}`);
          console.log(`   Confirmé: ${authUser.user.email_confirmed_at ? 'Oui' : 'Non'}`);
          console.log(`   Dernière connexion: ${authUser.user.last_sign_in_at ? new Date(authUser.user.last_sign_in_at).toLocaleString('fr-FR') : 'Jamais'}`);
        }
      } catch (err) {
        console.log(`⚠️  Impossible de vérifier l'utilisateur auth pour ${profile.id}`);
      }
    }
    
    // 3. Instructions de connexion
    console.log(`\n=== INSTRUCTIONS DE CONNEXION ===`);
    console.log(`🔗 URL de connexion: https://toptalentbenin.vercel.app/login`);
    console.log(`📧 Email: Utiliser l'email de l'utilisateur auth trouvé ci-dessus`);
    console.log(`🔑 Mot de passe: Doit être connu ou réinitialisé`);
    
    if (adminProfiles.length > 0) {
      console.log(`\n💡 Si vous ne connaissez pas le mot de passe:`);
      console.log(`   1. Utiliser "Identifiants oubliés ?" sur la page de connexion`);
      console.log(`   2. Ou créer un nouveau compte admin avec le script`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function createAdminAccount() {
  try {
    console.log('\n🔧 Création d\'un compte admin par défaut...');
    
    // Créer un utilisateur admin avec Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@toptalentbenin.com',
      password: 'Admin123456!',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        full_name: 'Administrateur Top Talent'
      }
    });
    
    if (authError) {
      console.error('❌ Erreur création auth:', authError.message);
      return;
    }
    
    console.log('✅ Utilisateur auth créé:', authData.user.id);
    
    // Créer le profil correspondant
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: 'Administrateur Top Talent',
        phone: '+22900000000',
        role: 'admin'
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Erreur création profil:', profileError.message);
      return;
    }
    
    console.log('✅ Profil admin créé:', profileData.id);
    
    console.log(`\n=== NOUVEAU COMPTE ADMIN CRÉÉ ===`);
    console.log(`📧 Email: admin@toptalentbenin.com`);
    console.log(`🔑 Mot de passe: Admin123456!`);
    console.log(`🔗 URL: https://toptalentbenin.vercel.app/login`);
    console.log(`\n⚠️  Notez bien ces identifiants et changez le mot de passe après la première connexion !`);
    
  } catch (error) {
    console.error('❌ Erreur création admin:', error.message);
  }
}

checkAdminAccounts();
