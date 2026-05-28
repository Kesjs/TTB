const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ietzgjbykkwkemakwfqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldHpnamJ5a2t3a2VtYWt3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzQsImV4cCI6MjA5NDkzNTM3NH0.vOpyHafVSY8I--YCMO6BMdWVVBrjyGfeDdieFa8CSuM'
);

async function createAdminWithPublicAPI() {
  try {
    console.log('🔧 Création compte admin via API publique...\n');
    
    const adminEmail = 'admin@toptalentbenin.com';
    const adminPassword = 'AdminTTB2026!';
    
    // 1. Créer le compte avec signUp (API publique)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          role: 'admin',
          full_name: 'Administrateur Top Talent'
        }
      }
    });
    
    if (signUpError) {
      console.error('❌ Erreur signUp:', signUpError.message);
      
      // Si le compte existe déjà, essayer de se connecter
      if (signUpError.message.includes('already registered')) {
        console.log('📧 Email déjà enregistré, test de connexion...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword
        });
        
        if (signInError) {
          console.log('❌ Mot de passe incorrect');
          console.log('💡 Solution: Utiliser la page de connexion avec "Identifiants oubliés ?"');
          return;
        }
        
        console.log('✅ Compte admin existant validé!');
        
        // Vérifier si le profil existe
        if (signInData.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signInData.user.id)
            .single();
          
          if (!profileData) {
            // Créer le profil manquant
            await supabase
              .from('profiles')
              .insert({
                id: signInData.user.id,
                full_name: 'Administrateur Top Talent',
                phone: '+22990000000',
                role: 'admin'
              });
            console.log('✅ Profil admin créé');
          }
        }
      }
      return;
    }
    
    console.log('✅ Compte créé avec succès!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Mot de passe:', adminPassword);
    
    // 2. Confirmer l'email automatiquement si nécessaire
    if (signUpData.user && !signUpData.user.email_confirmed_at) {
      console.log('⏳ En attente de confirmation email...');
    }
    
    // 3. Créer le profil
    if (signUpData.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          full_name: 'Administrateur Top Talent',
          phone: '+22990000000',
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
    
    console.log(`\n🎉 COMPTE ADMIN PRÊT`);
    console.log(`═══════════════════════════════════════`);
    console.log(`📧 EMAIL:     ${adminEmail}`);
    console.log(`🔑 MOT DE PASSE: ${adminPassword}`);
    console.log(`🔗 URL:        https://toptalentbenin.vercel.app/login`);
    console.log(`═══════════════════════════════════════`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

createAdminWithPublicAPI();
