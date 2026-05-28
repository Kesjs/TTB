import { supabase } from '@/lib/supabase/client';
import type { Candidate, Profile } from '@/lib/supabase/types';

export interface SignUpCandidateInput {
  email: string;
  password: string;
  stageName: string;
  discipline: Candidate['discipline'];
  region: Candidate['region'];
  videoFile: File;
  coverImageFile?: File;
  fullName?: string;
  phone?: string;
  candidatureType?: 'solo' | 'group';
  memberCount?: number;
  bio?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export const auth = {
  isConfigured: () => Boolean(supabase),

  getSession: async () => {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  signIn: async ({ email, password }: SignInInput) => {
    if (!supabase) throw new Error('Le système n\'est pas configuré correctement.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Translate all Supabase error messages to French
      const errorMsg = error.message.toLowerCase();
      
      // Invalid credentials errors
      if (errorMsg.includes('invalid') && (errorMsg.includes('credential') || errorMsg.includes('login') || errorMsg.includes('password'))) {
        throw new Error('Adresse email ou mot de passe incorrect. Veuillez réessayer.');
      }
      
      // Email confirmation errors
      if (errorMsg.includes('email') && errorMsg.includes('confirm')) {
        throw new Error('Veuillez confirmer votre adresse email avant de vous connecter.');
      }
      
      // User not found errors
      if (errorMsg.includes('not found') || errorMsg.includes('user not found')) {
        throw new Error('Compte introuvable. Veuillez vérifier votre adresse email.');
      }
      
      // Default fallback - translate any remaining English error
      throw new Error('Erreur de connexion. Veuillez vérifier vos identifiants.');
    }
    return data;
  },

  signOut: async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    
    // Always clear local data even if supabase call fails
    if (typeof window !== 'undefined') {
      // Clear localStorage
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      
      // Clear cookies with all possible variations to ensure removal
      const cookiesToClear = ['user_id', 'user_role', 'sb-access-token', 'sb-refresh-token'];
      cookiesToClear.forEach(name => {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
        document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax; Secure`;
        // Also try without Secure just in case it was set that way in dev
        document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
      });
      
      console.log('[Auth] Session cleared successfully');
    }
  },

  signUpCandidate: async ({ email, password, stageName, discipline, region, videoFile, coverImageFile, fullName, phone, candidatureType = 'solo', memberCount = 1, bio }: SignUpCandidateInput) => {
    if (!supabase) throw new Error('Le système n\'est pas configuré correctement.');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'candidate',
        },
      },
    });

    if (authError) {
      throw new Error('Cette adresse email est déjà utilisée ou le mot de passe est trop court.');
    }

    if (!authData.user) {
      throw new Error('La création du compte a échoué. Veuillez réessayer.');
    }

    // Auto sign-in to create session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw new Error('La connexion automatique a échoué. Veuillez vous connecter manuellement.');
    }

    // Upload video to Supabase Storage
    const fileExt = videoFile.name.split('.').pop();
    const fileName = `${authData.user.id}/${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('candidate-videos')
      .upload(fileName, videoFile);

    if (uploadError) {
      throw new Error('Le téléchargement de la vidéo a échoué. Vérifiez que le fichier est au format MP4 ou MOV et fait moins de 50 Mo.');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('candidate-videos')
      .getPublicUrl(fileName);

    // Upload cover image to Supabase Storage
    let coverImageUrl: string | undefined;
    if (coverImageFile) {
      const coverExt = coverImageFile.name.split('.').pop();
      const coverFileName = `${authData.user.id}/cover_${Date.now()}.${coverExt}`;
      const { data: coverUploadData, error: coverUploadError } = await supabase.storage
        .from('candidate-videos')
        .upload(coverFileName, coverImageFile);

      if (coverUploadError) {
        throw new Error('Le téléchargement de l\'image de couverture a échoué. Veuillez réessayer.');
      }

      const { data: { publicUrl: coverPublicUrl } } = supabase.storage
        .from('candidate-videos')
        .getPublicUrl(coverFileName);

      coverImageUrl = coverPublicUrl;
    }

    const profile: Omit<Profile, 'created_at'> = {
      id: authData.user.id,
      full_name: fullName || stageName,
      phone: phone || '',
      role: 'candidate',
    };

    const { error: profileError } = await supabase.from('profiles').upsert(profile);
    if (profileError) {
      throw new Error('La création du profil a échoué. Veuillez réessayer.');
    }

    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .insert({
        profile_id: authData.user.id,
        stage_name: stageName,
        discipline,
        region,
        video_url: publicUrl,
        cover_image_url: coverImageUrl,
        candidature_type: candidatureType,
        member_count: memberCount,
        bio: bio,
        status: 'pending_review',
      })
      .select()
      .single();

    if (candidateError) {
      throw new Error('L\'enregistrement de la candidature a échoué. Veuillez réessayer.');
    }

    return {
      user: authData.user,
      session: authData.session,
      candidate: candidate as Candidate,
    };
  },
};
