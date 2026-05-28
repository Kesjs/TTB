const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ietzgjbykkwkemakwfqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldHpnamJ5a2t3a2VtYWt3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzQsImV4cCI6MjA5NDkzNTM3NH0.vOpyHafVSY8I--YCMO6BMdWVVBrjyGfeDdieFa8CSuM'
);

async function checkJuryDisplay() {
  try {
    console.log('🔍 Vérification du processus d\'affichage des candidats au jury...\n');
    
    // 1. Vérifier les candidats approuvés (ceux que le jury doit voir)
    const { data: approvedCandidates, error: approvedError } = await supabase
      .from('candidates')
      .select('*')
      .eq('status', 'approved');
    
    if (approvedError) throw approvedError;
    
    console.log('=== CANDIDATS APPROUVÉS (VISIBLES PAR LE JURY) ===');
    console.log(`Nombre: ${approvedCandidates.length}`);
    
    approvedCandidates.forEach((candidate, index) => {
      console.log(`\n${index + 1}. ${candidate.stage_name}`);
      console.log(`   ID: ${candidate.id}`);
      console.log(`   Discipline: ${candidate.discipline}`);
      console.log(`   Région: ${candidate.region}`);
      console.log(`   Statut: ${candidate.status}`);
      console.log(`   Confirmé par admin: ${candidate.is_confirmed_by_admin || 'Non'}`);
      console.log(`   Top 40: ${candidate.is_top_40 || 'Non'}`);
      console.log(`   Votes: ${candidate.votes_count || 0}`);
    });
    
    // 2. Vérifier les évaluations du jury existantes
    const { data: juryRatings, error: ratingsError } = await supabase
      .from('jury_ratings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (ratingsError) throw ratingsError;
    
    console.log(`\n=== ÉVALUATIONS DU JURY EXISTANTES ===`);
    console.log(`Nombre total d\'évaluations: ${juryRatings.length}`);
    
    // Grouper par phase
    const ratingsByPhase = {};
    juryRatings.forEach(rating => {
      if (!ratingsByPhase[rating.phase]) {
        ratingsByPhase[rating.phase] = [];
      }
      ratingsByPhase[rating.phase].push(rating);
    });
    
    Object.keys(ratingsByPhase).forEach(phase => {
      console.log(`\n📊 Phase ${phase}: ${ratingsByPhase[phase].length} évaluations`);
      ratingsByPhase[phase].forEach((rating, index) => {
        console.log(`   ${index + 1}. Jury ID: ${rating.jury_id?.substring(0, 8)}... | Candidat ID: ${rating.candidate_id?.substring(0, 8)}...`);
        console.log(`      Technique: ${rating.score_technique || 'N/A'} | Originalité: ${rating.score_originalite || 'N/A'} | Présence: ${rating.score_presence || 'N/A'}`);
      });
    });
    
    // 3. Vérifier le contrôle du système (phase actuelle)
    const { data: systemControl, error: systemError } = await supabase
      .from('system_control')
      .select('*')
      .single();
    
    if (systemError) throw systemError;
    
    console.log(`\n=== PHASE ACTUELLE DU SYSTÈME ===`);
    console.log(`Phase: ${systemControl.current_phase || systemControl.current_phase_new || 'Non définie'}`);
    console.log(`Vote ouvert: ${systemControl.is_voting_open || false}`);
    console.log(`Candidat en direct: ${systemControl.live_voting_candidate_id || 'Aucun'}`);
    
    // 4. Simulation du processus
    console.log(`\n=== PROCESSUS D\'AFFICHAGE AU JURY ===`);
    console.log(`1. Le jury se connecte via /login`);
    console.log(`2. Redirection vers /dashboard/jury`);
    console.log(`3. Chargement de TOUS les candidats (db.getCandidates({}) sans filtre)`);
    console.log(`4. Sélection automatique du premier candidat avec status = 'approved'`);
    console.log(`5. Le jury peut évaluer tous les candidats approuvés`);
    
    console.log(`\n=== PROCESSUS D\'AFFICHAGE PUBLIC ===`);
    console.log(`1. Page d\'accueil (/) charge db.getCandidates({ status: 'approved' })`);
    console.log(`2. Seuls les candidats approuvés sont visibles publiquement`);
    console.log(`3. Affichage dans CandidateGrid si phase != PRESELECTION ou si des qualifiés existent`);
    
    // 5. État actuel
    console.log(`\n=== ÉTAT ACTUEL ===`);
    if (approvedCandidates.length === 0) {
      console.log(`⚠️  Aucun candidat approuvé - Le jury ne verra personne !`);
      console.log(`💡 Solution: L\'admin doit approuver les candidats en premier`);
    } else {
      console.log(`✅ ${approvedCandidates.length} candidat(s) disponible(s) pour le jury`);
      console.log(`✅ Le jury peut commencer les évaluations`);
      console.log(`✅ Les candidats sont visibles publiquement`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkJuryDisplay();
