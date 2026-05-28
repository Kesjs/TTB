const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ietzgjbykkwkemakwfqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldHpnamJ5a2t3a2VtYWt3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzQsImV4cCI6MjA5NDkzNTM3NH0.vOpyHafVSY8I--YCMO6BMdWVVBrjyGfeDdieFa8CSuM'
);

async function verifyAdminInSupabase() {
  try {
    console.log('🔍 Vérification du compte admin dans Supabase...\n');
    
    // 1. Vérifier dans la table auth.users (via signIn)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@toptalentbenin.com',
      password: 'AdminTTB2026!'
    });
    
    if (signInError) {
      console.error('❌ Erreur connexion:', signInError.message);
      return;
    }
    
    console.log('✅ UTILISATEUR AUTH TROUVÉ');
    console.log(`   ID: ${signInData.user.id}`);
    console.log(`   Email: ${signInData.user.email}`);
    console.log(`   Confirmé: ${signInData.user.email_confirmed_at ? 'Oui' : 'Non'}`);
    console.log(`   Créé le: ${new Date(signInData.user.created_at).toLocaleString('fr-FR')}`);
    
    // 2. Vérifier dans la table profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Erreur profil:', profileError.message);
      return;
    }
    
    console.log('\n✅ PROFIL TROUVÉ');
    console.log(`   ID Profil: ${profileData.id}`);
    console.log(`   Nom: ${profileData.full_name}`);
    console.log(`   Rôle: ${profileData.role}`);
    console.log(`   Téléphone: ${profileData.phone}`);
    console.log(`   Créé le: ${new Date(profileData.created_at).toLocaleString('fr-FR')}`);
    
    // 3. Résumé
    console.log('\n📋 RÉCAPITULATIF SUPABASE');
    console.log('═══════════════════════════════════════');
    console.log('🗄️  Base de données: Supabase');
    console.log('📊 Table auth.users: ✅ Utilisateur créé');
    console.log('👥 Table profiles: ✅ Profil associé');
    console.log('🔐 Authentification: ✅ Fonctionnelle');
    console.log('🎯 Rôle: admin');
    console.log('🌐 Accessible via: https://toptalentbenin.vercel.app/login');
    
    console.log('\n🔗 STRUCTURE COMPLÈTE:');
    console.log('├── auth.users (Supabase Auth)');
    console.log('│   ├── ID: ' + signInData.user.id);
    console.log('│   ├── Email: admin@toptalentbenin.com');
    console.log('│   └── Mot de passe: chiffré');
    console.log('└── public.profiles (Base de données)');
    console.log('    ├── ID: ' + profileData.id + ' (même ID)');
    console.log('    ├── Rôle: admin');
    console.log('    └── Infos profil');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

verifyAdminInSupabase();
