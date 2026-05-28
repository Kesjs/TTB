import { supabase } from '../lib/supabase/client';

async function testConnection() {
  console.log('Test de connexion Supabase...');
  
  if (!supabase) {
    console.error('❌ Supabase non configuré');
    return;
  }

  try {
    // Test simple : récupérer les profiles (table existe ?)
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      console.error('❌ Erreur de connexion:', error.message);
      return;
    }

    console.log('✅ Connexion réussie !');
    console.log('📊 Tables accessibles:', data ? 'profiles OK' : 'profiles vide (normal)');
    
    // Test candidates
    const candidates = await supabase.from('candidates').select('*').limit(1);
    console.log('📊 Candidates:', candidates.error ? 'Erreur' : 'OK');
    
  } catch (err) {
    console.error('❌ Erreur inattendue:', err);
  }
}

testConnection();
