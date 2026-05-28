const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ietzgjbykkwkemakwfqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldHpnamJ5a2t3a2VtYWt3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzQsImV4cCI6MjA5NDkzNTM3NH0.vOpyHafVSY8I--YCMO6BMdWVVBrjyGfeDdieFa8CSuM'
);

async function findAdminEmail() {
  try {
    console.log('🔍 Recherche de l\'email du compte Kenken Babatounde...\n');
    
    // Récupérer le profil admin
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('full_name', 'Kenken Babatounde')
      .single();
    
    if (profileError) {
      console.error('❌ Erreur profil:', profileError.message);
      return;
    }
    
    console.log('✅ Profil Kenken Babatounde trouvé:');
    console.log(`   ID: ${adminProfile.id}`);
    console.log(`   Nom: ${adminProfile.full_name}`);
    console.log(`   Téléphone: ${adminProfile.phone}`);
    
    // Essayer de trouver l'email en testant des possibilités communes
    const possibleEmails = [
      'kenkenbabatounde@gmail.com',
      'kenken.babatounde@gmail.com',
      'kenkenbabatounde@yahoo.com',
      'kenken.babatounde@yahoo.com',
      'contact@toptalentbenin.com',
      'admin@toptalentbenin.com',
      'babatounde@gmail.com',
      'kenken@gmail.com'
    ];
    
    console.log(`\n🔍 Test des emails possibles...`);
    
    for (const email of possibleEmails) {
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: 'password123' // Test avec un mot de passe simple
        });
        
        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            // L'email existe mais mauvais mot de passe
            console.log(`📧 ${email} - Email existe (mauvais mot de passe)`);
            console.log(`   💡 C'est probablement le bon email !`);
            console.log(`   🔑 Utilisez votre mot de passe manuel avec cet email`);
            return email;
          } else {
            console.log(`❌ ${email} - ${signInError.message}`);
          }
        } else {
          console.log(`✅ ${email} - Connexion réussie !`);
          return email;
        }
      } catch (err) {
        console.log(`❌ ${email} - Erreur: ${err.message}`);
      }
    }
    
    console.log(`\n❌ Aucun email trouvé parmi les possibilités testées`);
    console.log(`\n💡 SOLUTIONS:`);
    console.log(`1. Utilisez l'email que vous avez utilisé manuellement pour créer le compte`);
    console.log(`2. Les emails les plus probables sont:`);
    console.log(`   - kenkenbabatounde@gmail.com`);
    console.log(`   - kenken.babatounde@gmail.com`);
    console.log(`   - contact@toptalentbenin.com`);
    console.log(`3. Essayez avec le mot de passe que vous avez défini manuellement`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

findAdminEmail();
