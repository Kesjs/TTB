const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic parser for .env.local since we can't use dotenv easily
function loadEnv() {
  try {
    const envPaths = [
      path.resolve(process.cwd(), '.env.local'),
      path.resolve(process.cwd(), '.env')
    ];
    
    envPaths.forEach(envPath => {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) {
            const trimmedKey = key.trim();
            if (!process.env[trimmedKey]) {
              process.env[trimmedKey] = value.trim().replace(/^["']|["']$/g, '');
            }
          }
        });
      }
    });
  } catch (err) {
    console.error('Error loading env files:', err.message);
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixBoboweCandidate() {
  console.log('--- Réparation du candidat Bobo wé ---');
  
  try {
    // 1. Lister tous les profils candidats pour voir ce qui existe
    const { data: allCandidates, error: listError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'candidate');
    
    if (listError) {
      console.error('❌ Erreur liste candidats:', listError.message);
      return;
    }
    
    console.log('📋 Liste des profils candidats trouvés:');
    allCandidates.forEach(p => {
      console.log(`   - ${p.full_name} (ID: ${p.id})`);
    });
    
    // 2. Chercher Bobo wé avec une recherche plus flexible
    let profile = null;
    
    // Essai 1: Recherche exacte
    const { data: exactProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('full_name', 'Bobo wé')
      .eq('role', 'candidate')
      .maybeSingle();
    
    if (exactProfile) {
      profile = exactProfile;
    } else {
      // Essai 2: Recherche partielle
      const { data: partialProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'candidate')
        .ilike('full_name', '%Bobo%');
      
      if (partialProfiles && partialProfiles.length > 0) {
        profile = partialProfiles[0];
        console.log('🔍 Profil trouvé avec recherche partielle:', profile.full_name);
      }
    }
    
    if (!profile) {
      console.error('❌ Profil Bobo wé non trouvé. Vérifiez l\'orthographe exacte dans la base de données.');
      return;
    }
    
    console.log('✅ Profil trouvé:', profile.full_name, 'ID:', profile.id);
    
    // 2. Vérifier si une candidature existe déjà
    const { data: existingCandidate, error: existingError } = await supabase
      .from('candidates')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();
    
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('❌ Erreur vérification candidature existante:', existingError.message);
      return;
    }
    
    if (existingCandidate) {
      console.log('⚠️  Une candidature existe déjà pour Bobo wé');
      console.log('   - Statut:', existingCandidate.status);
      console.log('   - Nom de scène:', existingCandidate.stage_name);
      console.log('   - Créée le:', existingCandidate.created_at);
      return;
    }
    
    // 3. Créer la candidature manquante
    console.log('🔧 Création de la candidature manquante...');
    
    const candidateData = {
      profile_id: profile.id,
      stage_name: 'Bobo wé',
      discipline: 'Musique', // Valeur par défaut
      region: 'Littoral', // Valeur par défaut
      video_url: 'https://placeholder-video-url', // URL temporaire
      candidature_type: 'solo',
      member_count: 1,
      bio: 'Artiste musical talentueux représentant le département du Littoral.',
      status: 'pending_review'
    };
    
    const { data: newCandidate, error: insertError } = await supabase
      .from('candidates')
      .insert(candidateData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erreur création candidature:', insertError.message);
      console.error('   Détails:', insertError);
      return;
    }
    
    console.log('✅ Candidature créée avec succès!');
    console.log('   - ID:', newCandidate.id);
    console.log('   - Nom de scène:', newCandidate.stage_name);
    console.log('   - Statut:', newCandidate.status);
    console.log('   - Discipline:', newCandidate.discipline);
    console.log('   - Région:', newCandidate.region);
    
    console.log('\n🎉 Bobo wé peut maintenant se connecter et accéder à son dashboard!');
    
  } catch (err) {
    console.error('❌ Erreur inattendue:', err.message);
  }
}

fixBoboweCandidate();
