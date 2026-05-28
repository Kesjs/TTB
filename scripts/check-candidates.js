const { createClient } = require('@supabase/supabase-js');

// Récupérer les variables d'environnement depuis .env.local
const fs = require('fs');
const path = require('path');

function loadEnvVars() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        process.env[key] = value.replace(/^["']|["']$/g, ''); // Enlever les guillemets
      }
    });
  } catch (error) {
    console.error('Erreur lors du chargement des variables d\'environnement:', error.message);
  }
}

loadEnvVars();

const supabase = createClient(
  'https://ietzgjbykkwkemakwfqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldHpnamJ5a2t3a2VtYWt3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzQsImV4cCI6MjA5NDkzNTM3NH0.vOpyHafVSY8I--YCMO6BMdWVVBrjyGfeDdieFa8CSuM'
);

async function checkCandidates() {
  try {
    console.log('🔍 Vérification des candidats existants...\n');
    
    // Vérifier les candidats
    const { data: candidates, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log('=== CANDIDATS EXISTANTS ===');
    console.log(`Nombre total: ${candidates.length}`);
    
    candidates.forEach((candidate, index) => {
      console.log(`\n${index + 1}. ${candidate.stage_name}`);
      console.log(`   ID: ${candidate.id}`);
      console.log(`   Discipline: ${candidate.discipline}`);
      console.log(`   Statut: ${candidate.status}`);
      console.log(`   Région: ${candidate.region}`);
      console.log(`   Votes: ${candidate.votes_count}`);
      console.log(`   Créé le: ${new Date(candidate.created_at).toLocaleDateString('fr-FR')}`);
    });
    
    // Vérifier les profils associés
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, role, full_name, phone')
      .eq('role', 'candidate');
    
    console.log(`\n=== PROFILS CANDIDATS ===`);
    console.log(`Nombre de profils candidats: ${profiles.length}`);
    
    profiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. ${profile.full_name}`);
      console.log(`   ID Profil: ${profile.id}`);
      console.log(`   Téléphone: ${profile.phone}`);
    });
    
    // Vérifier la corrélation
    console.log(`\n=== VÉRIFICATION DES CORRÉLATIONS ===`);
    const candidateIds = candidates.map(c => c.profile_id);
    const profileIds = profiles.map(p => p.id);
    
    const unmatchedCandidates = candidateIds.filter(id => !profileIds.includes(id));
    const unmatchedProfiles = profileIds.filter(id => !candidateIds.includes(id));
    
    if (unmatchedCandidates.length > 0) {
      console.log(`⚠️  Candidats sans profil: ${unmatchedCandidates.length}`);
    }
    
    if (unmatchedProfiles.length > 0) {
      console.log(`⚠️  Profils sans candidature: ${unmatchedProfiles.length}`);
    }
    
    if (unmatchedCandidates.length === 0 && unmatchedProfiles.length === 0) {
      console.log(`✅ Tous les candidats ont un profil valide`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkCandidates();
