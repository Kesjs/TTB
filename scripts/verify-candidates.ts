import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyCandidates() {
  console.log('--- Vérification des Candidats en Base ---');
  
  const { data, error, count } = await supabase
    .from('candidates')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Erreur lors de la récupération des candidats:', error.message);
    return;
  }

  console.log(`Nombre total de candidats : ${count}`);
  
  if (data && data.length > 0) {
    console.log('\nListe des candidats :');
    data.forEach((c: any) => {
      console.log(`- [${c.id}] ${c.stage_name} (${c.status}) - T40: ${c.is_top_40 ? 'Oui' : 'Non'}, SF: ${c.is_semifinalist ? 'Oui' : 'Non'}, F: ${c.is_finalist ? 'Oui' : 'Non'}`);
    });
  } else {
    console.log('Aucun candidat trouvé dans la table candidates.');
  }
}

verifyCandidates();
