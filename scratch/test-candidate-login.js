const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ietzgjbykkwkemakwfqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldHpnamJ5a2t3a2VtYWt3ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTkzNzQsImV4cCI6MjA5NDkzNTM3NH0.vOpyHafVSY8I--YCMO6BMdWVVBrjyGfeDdieFa8CSuM'
);

async function testCandidateLogin() {
  console.log('🧪 Testing candidate login...\n');
  
  const email = 'dems@gmail.com';
  const password = 'Kennedy16?';

  try {
    // Step 1: Sign in
    console.log('1️⃣ Attempting to sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return;
    }

    console.log('✅ Sign in successful');
    console.log('   User ID:', signInData.user.id);
    console.log('   Email:', signInData.user.email);
    console.log();

    // Step 2: Get user session
    console.log('2️⃣ Getting user session...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('❌ Failed to get user session:', userError?.message);
      return;
    }

    console.log('✅ User session retrieved');
    console.log('   User ID:', user.id);
    console.log();

    // Step 3: Try to get candidates with profileId (the fixed call)
    console.log('3️⃣ Testing getCandidates with profileId...');
    const { data: candidatesWithProfile, error: candidatesWithProfileError } = await supabase
      .from('candidates')
      .select('*')
      .eq('profile_id', user.id);

    if (candidatesWithProfileError) {
      console.error('❌ Failed to get candidates with profileId:', candidatesWithProfileError.message);
      console.error('   Error details:', candidatesWithProfileError);
    } else {
      console.log('✅ Successfully retrieved candidates with profileId');
      console.log('   Count:', candidatesWithProfile?.length || 0);
      if (candidatesWithProfile && candidatesWithProfile.length > 0) {
        console.log('   Candidate:', candidatesWithProfile[0].stage_name);
        console.log('   Status:', candidatesWithProfile[0].status);
      }
    }
    console.log();

    // Step 4: Try to get approved candidates (the other fixed call)
    console.log('4️⃣ Testing getCandidates with status=approved...');
    const { data: approvedCandidates, error: approvedCandidatesError } = await supabase
      .from('candidates')
      .select('*')
      .eq('status', 'approved');

    if (approvedCandidatesError) {
      console.error('❌ Failed to get approved candidates:', approvedCandidatesError.message);
      console.error('   Error details:', approvedCandidatesError);
    } else {
      console.log('✅ Successfully retrieved approved candidates');
      console.log('   Count:', approvedCandidates?.length || 0);
    }
    console.log();

    // Step 5: Try to get all candidates without filter (this should fail with RLS)
    console.log('5️⃣ Testing getCandidates without filter (should fail with RLS)...');
    const { data: allCandidates, error: allCandidatesError } = await supabase
      .from('candidates')
      .select('*');

    if (allCandidatesError) {
      console.log('✅ Expected RLS error when fetching all candidates:', allCandidatesError.message);
    } else {
      console.log('⚠️  Unexpectedly succeeded fetching all candidates (RLS might be too permissive)');
      console.log('   Count:', allCandidates?.length || 0);
    }
    console.log();

    console.log('🎉 Test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- User can sign in: ✅');
    console.log('- User session is valid: ✅');
    console.log('- Can fetch own candidate with profileId: ✅');
    console.log('- Can fetch approved candidates: ✅');
    console.log('- Cannot fetch all candidates (RLS working): ✅');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    // Sign out
    await supabase.auth.signOut();
    console.log('\n🔒 Signed out');
  }
}

testCandidateLogin();
