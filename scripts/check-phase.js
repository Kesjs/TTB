const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPhase() {
  try {
    const { data, error } = await supabase
      .from('system_control')
      .select('*')
      .single();

    if (error) throw error;

    console.log('=== PHASE ACTUELLE ===');
    console.log('Phase:', data.current_phase);
    console.log('Votes ouverts:', data.is_voting_open);
    console.log('Live candidate ID:', data.live_voting_candidate_id);
    
    return data;
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

checkPhase();
