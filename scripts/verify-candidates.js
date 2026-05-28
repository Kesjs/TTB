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

async function verifyData() {
  console.log('--- Vérification des Données en Base ---');
  
  // 1. System Control
  const { data: sc } = await supabase.from('system_control').select('*').single();
  console.log(`\nPhase Actuelle : ${sc?.current_phase_new || sc?.current_phase || 'Inconnue'}`);
  console.log(`Mode Maintenance : ${sc?.is_maintenance_mode ? 'OUI' : 'NON'}`);

  // 2. Candidates
  const { data: candidates, error: candError, count: candCount } = await supabase
    .from('candidates')
    .select('*', { count: 'exact' });

  if (candError) {
    console.error('\nErreur Candidates:', candError.message);
  } else {
    console.log(`\nNombre de candidats (visibles publiquement) : ${candCount || 0}`);
    if (candidates && candidates.length > 0) {
      candidates.forEach((c) => {
        console.log(`- ${c.stage_name} [${c.status}] T40:${c.is_top_40?'Y':'N'} SF:${c.is_semifinalist?'Y':'N'} F:${c.is_finalist?'Y':'N'}`);
      });
    }
  }

  // 3. Profiles (Jury/Admin)
  const { data: profiles, count: profCount } = await supabase.from('profiles').select('*', { count: 'exact' });
  console.log(`\nNombre de profils : ${profCount || 0}`);
  if (profiles) {
    profiles.forEach(p => console.log(`- ${p.full_name} (${p.role})`));
  }
}

verifyData();
