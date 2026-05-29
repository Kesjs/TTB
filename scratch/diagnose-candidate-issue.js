const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ietzgjbykkwkemakwfqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldHpnamJ5a2t3a2VtYWt3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzQsImV4cCI6MjA5NDkzNTM3NH0.vOpyHafVSY8I--YCMO6BMdWVVBrjyGfeDdieFa8CSuM'
);

async function diagnoseCandidateIssue() {
  console.log('🔍 Diagnostic du problème de connexion candidat...\n');

  const email = 'dems@gmail.com';
  const password = 'Kennedy16?';

  try {
    // Step 1: Sign in
    console.log('1️⃣ Connexion...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('❌ Erreur de connexion:', signInError.message);
      return;
    }

    console.log('✅ Connexion réussie');
    console.log('   User ID:', signInData.user.id);
    console.log('   Email:', signInData.user.email);
    console.log();

    // Step 2: Get user profile
    console.log('2️⃣ Récupération du profil...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Erreur profil:', profileError.message);
    } else {
      console.log('✅ Profil trouvé');
      console.log('   Role:', profile.role);
      console.log('   Full Name:', profile.full_name);
      console.log('   Phone:', profile.phone);
    }
    console.log();

    // Step 3: Get candidates with profileId
    console.log('3️⃣ Recherche du candidat avec profileId...');
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('*')
      .eq('profile_id', signInData.user.id);

    if (candidatesError) {
      console.error('❌ Erreur candidats:', candidatesError.message);
      console.error('   Details:', candidatesError);
    } else {
      console.log('✅ Candidats trouvés:', candidates.length);
      if (candidates.length > 0) {
        console.log('   Candidat ID:', candidates[0].id);
        console.log('   Stage Name:', candidates[0].stage_name);
        console.log('   Status:', candidates[0].status);
        console.log('   Profile ID (from candidate):', candidates[0].profile_id);
        console.log('   Profile ID (from user):', signInData.user.id);
        console.log('   Match:', candidates[0].profile_id === signInData.user.id ? '✅' : '❌');
      }
    }
    console.log();

    // Step 4: Check all candidates to see if any have this user ID
    console.log('4️⃣ Vérification de tous les candidats...');
    const { data: allCandidates, error: allCandidatesError } = await supabase
      .from('candidates')
      .select('id, stage_name, profile_id, status');

    if (allCandidatesError) {
      console.error('❌ Erreur tous les candidats:', allCandidatesError.message);
    } else {
      console.log('✅ Total candidats:', allCandidates.length);
      const matchingCandidates = allCandidates.filter(c => c.profile_id === signInData.user.id);
      console.log('   Candidats avec ce profile_id:', matchingCandidates.length);
      
      if (matchingCandidates.length === 0) {
        console.log('   ⚠️  Aucun candidat trouvé avec ce profile_id');
        console.log('   🔍 Vérification des profile_ids existants...');
        const profileIds = [...new Set(allCandidates.map(c => c.profile_id))];
        console.log('   Profile IDs uniques:', profileIds.length);
        console.log('   User ID actuel:', signInData.user.id);
        console.log('   User ID présent dans les candidats:', profileIds.includes(signInData.user.id) ? '✅' : '❌');
      }
    }
    console.log();

    // Step 5: Check RLS policies
    console.log('5️⃣ Vérification des politiques RLS...');
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    console.log('   Session actuelle:', currentUser ? '✅' : '❌');
    console.log('   User ID session:', currentUser?.id);
    console.log('   User ID connexion:', signInData.user.id);
    console.log('   Match:', currentUser?.id === signInData.user.id ? '✅' : '❌');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  } finally {
    await supabase.auth.signOut();
    console.log('\n🔒 Déconnexion');
  }
}

diagnoseCandidateIssue();
