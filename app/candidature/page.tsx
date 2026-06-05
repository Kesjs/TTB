'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import Cropper from 'react-easy-crop';
import { Upload, Film, CheckCircle2, Clock, Share2, ArrowRight, User, MapPin, Award, Lock, Users, Eye, EyeOff, Plus, Minus, Mic, Music, Clapperboard, MessageSquare, Video, Sparkles, Trophy, Palette, ChevronDown, X } from 'lucide-react';
import { auth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { db } from '@/lib/supabase';
import { signIn } from '@/app/actions/auth';
import CustomSelect from '@/components/ui/CustomSelect';
import { ButtonLoader } from '@/components/ui/ButtonLoader';
import { ProgressBar } from '@/components/ui/ProgressBar';

// Memoized Video Preview Component to prevent flickering during upload
const VideoPreview = ({ videoFile, onRemove }: { videoFile: File; onRemove: () => void }) => {
  const videoUrl = useMemo(() => URL.createObjectURL(videoFile), [videoFile]);
  
  return (
    <div className="w-full space-y-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-center gap-2 text-emerald-600 font-heading text-[10px] font-bold uppercase tracking-wider">
        <Film className="w-4 h-4" /> Capsule Sélectionnée avec succès
      </div>
      <p className="text-xs text-zinc-500 font-mono line-clamp-1 max-w-md mx-auto">
        {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} Mo)
      </p>
      <div className="max-w-xs mx-auto overflow-hidden border border-zinc-100 shadow-sm">
        <video 
          src={videoUrl} 
          controls 
          className="w-full h-36 object-cover bg-black"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-[9px] font-heading font-bold text-red-500 uppercase tracking-widest hover:underline"
      >
        Changer la vidéo
      </button>
    </div>
  );
};

export default function CandidaturePage() {
  const router = useRouter();
  const [viewState, setViewState] = useState<'form' | 'login' | 'dashboard'>('form');
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [candidatureType, setCandidatureType] = useState<'solo' | 'group'>('solo');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- PRODUCTION STATES ---
  const [isSubmittingSuccess, setIsSubmittingSuccess] = useState(false);
  const [stageNameStatus, setStageNameStatus] = useState<'available' | 'taken' | 'checking' | null>(null);
  const [emailStatus, setEmailStatus] = useState<'available' | 'taken' | 'checking' | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [profile, setProfile] = useState<{ role: string } | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Password criteria validation state
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUpperCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const [currentPhase, setCurrentPhase] = useState<string>('PRESELECTION');

  // Form states matching table definitions
  const [formData, setFormData] = useState({
    stageName: '',
    discipline: '',
    region: '',
    bio: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    memberCount: 1,
  });

  // Validation states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Handle initial hydration and URL parameter check
  useEffect(() => {
    setIsHydrated(true);
    
    // Check if URL has view=login parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'login') {
      setViewState('login');
    }
  }, []);

  // Update password criteria and confirm password validation in real-time
  useEffect(() => {
    setPasswordCriteria({
      minLength: formData.password.length >= 8,
      hasUpperCase: /[A-Z]/.test(formData.password),
      hasNumber: /[0-9]/.test(formData.password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
    });

    if (touchedFields.confirmPassword) {
      const confirmError = formData.confirmPassword !== formData.password 
        ? 'Les mots de passe ne correspondent pas' 
        : '';
      setFieldErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  }, [formData.password, formData.confirmPassword, touchedFields.confirmPassword]);

  // References and previews for media elements
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [videoPreview, setVideoPreview] = useState<File | null>(null);
  
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<File | null>(null);

  // Image cropping state
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedImage, setCroppedImage] = useState<File | null>(null);

  // Clear sensitive data when switching views to avoid leakages
  useEffect(() => {
    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    setFieldErrors({});
    setTouchedFields({});
    setError('');
  }, [viewState]);

  // Fetch current phase and maintenance mode on mount
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const systemControl = await db.getSystemControl();
        if (systemControl) {
          setCurrentPhase(systemControl.current_phase);
          
          // Access fields safely with type assertion or fallback
          const isMaintenance = (systemControl as any).is_maintenance_mode;
          const isNotPreselection = systemControl.current_phase !== 'PRESELECTION';

          // Force redirect away if maintenance or phase changed, UNLESS it's the login view
          if ((isMaintenance || isNotPreselection) && viewState !== 'login') {
            window.location.href = '/';
          }
        }
      } catch (err) {
        console.error('Error fetching system status:', err);
      }
    };
    void fetchSystemStatus();
  }, [viewState]);

  // --- AUTO-SAVE LOGIC ---
  // Restore form draft on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !draftLoaded) {
      const savedDraft = localStorage.getItem('ttb_candidature_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // Restore everything except passwords
          setFormData(prev => ({
            ...prev,
            ...parsed,
            password: '',
            confirmPassword: ''
          }));
          if (parsed.candidatureType) setCandidatureType(parsed.candidatureType);
          if (parsed.currentStep) setCurrentStep(parsed.currentStep);
          console.log('📝 Brouillon de candidature restauré avec succès');
        } catch (e) {
          console.error('Failed to parse saved draft', e);
        }
      }
      setDraftLoaded(true);
    }
  }, [draftLoaded]);

  // Save form draft on change
  useEffect(() => {
    if (draftLoaded && !isSubmittingSuccess) {
      const draftData = {
        stageName: formData.stageName,
        discipline: formData.discipline,
        region: formData.region,
        bio: formData.bio,
        memberCount: formData.memberCount,
        email: formData.email,
        phone: formData.phone,
        candidatureType,
        currentStep
      };
      localStorage.setItem('ttb_candidature_draft', JSON.stringify(draftData));
    }
  }, [formData, candidatureType, currentStep, draftLoaded, isSubmittingSuccess]);

  // --- UNIQUENESS CHECKS ---
  const checkStageNameUniqueness = async (name: string) => {
    if (!name || name.length < 2 || !supabase) return;
    setStageNameStatus('checking');
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('id')
        .eq('stage_name', name.trim())
        .maybeSingle();

      if (data) {
        setStageNameStatus('taken');
        // Trigger smart suggestions generator
        void generateSuggestions(name, formData.discipline);
      } else {
        setStageNameStatus('available');
        setSuggestions([]);
      }
    } catch (err) {
      setStageNameStatus(null);
    }
  };

  const generateSuggestions = async (name: string, category: string) => {
    if (!supabase) return;
    setIsGeneratingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-stage-names', {
        body: { name, category }
      });
      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([`${name} Officiel`, `${name} 229`, `The ${name}`]);
      }
    } catch (err) {
      setSuggestions([`${name} Officiel`, `${name} 229`, `The ${name}`]);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const checkEmailUniqueness = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !supabase) return;
    setEmailStatus('checking');
    try {
      const { data } = await supabase
        .from('candidates')
        .select('id')
        .eq('email', email.trim())
        .maybeSingle();

      if (data) {
        setEmailStatus('taken');
        setFieldErrors(prev => ({ ...prev, email: "Ce compte existe déjà, connectez-vous plutôt" }));
      } else {
        setEmailStatus('available');
        setFieldErrors(prev => ({ ...prev, email: "" }));
      }
    } catch (err) {
      setEmailStatus(null);
    }
  };

  const validateField = (fieldName: string, value: string) => {
    let error = '';
    switch (fieldName) {
      case 'stageName':
        if (!value.trim()) error = 'Le nom de scène/groupe est requis';
        else if (value.length < 2) error = 'Minimum 2 caractères requis';
        break;
      case 'discipline':
        if (!value) error = 'Veuillez sélectionner votre univers artistique';
        break;
      case 'region':
        if (!value) error = 'Veuillez sélectionner votre département';
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) error = 'L\'adresse e-mail est requise';
        else if (!emailRegex.test(value)) error = 'Format e-mail invalide';
        break;
      case 'phone':
        const phoneDigits = value.replace(/\D/g, '');
        if (!value) error = 'Le numéro de téléphone est requis';
        else if (phoneDigits.length !== 8) error = 'Le numéro doit contenir 8 chiffres';
        break;
      case 'password':
        if (!value) error = 'Le mot de passe est requis';
        else if (value.length < 8) error = 'Minimum 8 caractères requis';
        else if (!/[A-Z]/.test(value)) error = 'Au moins une majuscule requise';
        else if (!/[0-9]/.test(value)) error = 'Au moins un chiffre requis';
        else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) error = 'Au moins un caractère spécial requis';
        break;
      case 'confirmPassword':
        if (!value) error = 'Veuillez confirmer votre mot de passe';
        else if (value !== formData.password) error = 'Les mots de passe ne correspondent pas';
        break;
      case 'bio':
        if (!value.trim()) error = 'Veuillez préciser votre activité de manière synthétique';
        else if (value.length > 250) error = 'La description ne doit pas dépasser 250 caractères';
        break;
    }
    return error;
  };

  const handleFieldBlur = (fieldName: string, value: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    const fieldError = validateField(fieldName, value);
    setFieldErrors(prev => ({ ...prev, [fieldName]: fieldError }));
  };

  // --- GESTION AMÉLIORÉE DU LOGIN CANDIDAT SANS CRASH NI ACCÈS RESTREINT ---
  const handleCandidateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError('');

    try {
      const loginFormData = new FormData();
      loginFormData.append('email', formData.email);
      loginFormData.append('password', formData.password);

      // Appel synchrone direct de l'action serveur signIn
      // Note: Le serveur gère déjà la redirection, pas besoin de router.push côté client
      const result = await signIn(null, loginFormData);

      if (result && result.error) {
        setError(result.error);
        setIsLoggingIn(false);
      }
      // Si pas d'erreur, le serveur redirige automatiquement vers /dashboard/candidate
    } catch (err) {
      console.error(err);
      setError('Une erreur est survenue lors de la connexion. Veuillez réessayer.');
      setIsLoggingIn(false);
    }
  };

  // Static items array inside component context
  const categories = [
    {
      id: 'Musique',
      title: 'CHANT & MUSIQUE',
      subtitle: 'Rap, Han, Afrobeat, Gospel, Traditionnel...',
      icon: Mic,
      placeholder: 'Ex: Je chante du Rap/Afrobeat, je joue du piano, je fais du beatmaking...'
    },
    {
      id: 'Danse',
      title: 'DANSE & CHORÉGRAPHIE',
      subtitle: 'Danses urbaines, Traditionnelles, Afro, Breakdance...',
      icon: Music,
      placeholder: 'Ex: Je danse le Zinli, je fais du Afro, du Breakdance, des danses traditionnelles...'
    },
    {
      id: 'Humour',
      title: 'HUMOUR & COMÉDIE',
      subtitle: 'Stand-up, Blagues, Imitation, Éwé, Théâtre...',
      icon: Clapperboard,
      placeholder: 'Ex: Je fais du stand-up, des imitations, des sketchs comiques...'
    },
    {
      id: 'Art_Oratoire',
      title: 'SLAM & CONTE',
      subtitle: 'Slam, Poésie, Éloquence, Parole, Conte...',
      icon: MessageSquare,
      placeholder: 'Ex: Je fais du slam, de la poésie, du conte, de l\'éloquence...'
    },
    {
      id: 'Digital',
      title: 'VIDÉO & DIGITAL',
      subtitle: 'TikTok, Vidéastes, Humour en vidéo, Créateurs de contenu, Beatmaking, Cinéma...',
      icon: Video,
      placeholder: 'Ex: Je crée du contenu sur TikTok, je fais des vidéos, du montage, du beatmaking...'
    },
    {
      id: 'Cirque',
      title: 'ACROBATIE & CIRQUE',
      subtitle: 'Magie, Jonglage, Cracheurs de feu, Gymnastique...',
      icon: Sparkles,
      placeholder: 'Ex: Je fais de la magie, du jonglage, des acrobaties, de la gymnastique...'
    },
    {
      id: 'Sport',
      title: 'FOOT FREESTYLE & ROLLER',
      subtitle: 'Sports acrobatiques, Skate, Street-workout...',
      icon: Trophy,
      placeholder: 'Ex: Je fais du foot freestyle, du skate, du street-workout, des sports acrobatiques...'
    },
    {
      id: 'Arts_Visuels',
      title: 'DESSIN, PEINTURE & MODE',
      subtitle: 'Stylisme, Maquillage artistique, Tableaux, Coiffure...',
      icon: Palette,
      placeholder: 'Ex: Je fais du stylisme, du maquillage artistique, des tableaux, de la coiffure...'
    },
  ];

  const departments = [
    { value: 'Alibori', label: 'ALIBORI (KANDI)' },
    { value: 'Atacora', label: 'ATACORA (NATITINGOU)' },
    { value: 'Atlantique', label: 'ATLANTIQUE (CALAVI)' },
    { value: 'Borgou', label: 'BORGOU (PARAKOU)' },
    { value: 'Collines', label: 'COLLINES (DASSA)' },
    { value: 'Donga', label: 'DONGA (DJOUGOU)' },
    { value: 'Kouffo', label: 'KOUFFO (APLAHOUÉ)' },
    { value: 'Littoral', label: 'LITTORAL (COTONOU)' },
    { value: 'Mono', label: 'MONO (LOKOSSA)' },
    { value: 'Ouémé', label: 'OUÉMÉ (PORTO-NOVO)' },
    { value: 'Plateau', label: 'PLATEAU (POBÈ)' },
    { value: 'Zou', label: 'ZOU (ABOMEY)' },
  ];

  const handleNextStep = () => {
    // Validate current step fields before passing
    const errors: Record<string, string> = {};
    if (currentStep === 1) {
      errors.stageName = validateField('stageName', formData.stageName);
      errors.discipline = validateField('discipline', formData.discipline);
      errors.bio = validateField('bio', formData.bio);
      
      setFieldErrors(prev => ({ ...prev, ...errors }));
      setTouchedFields(prev => ({ ...prev, stageName: true, discipline: true, bio: true }));
      
      const hasErrors = errors.stageName || errors.discipline || errors.bio;
      if (hasErrors || stageNameStatus === 'taken') return;
    } else if (currentStep === 2) {
      errors.region = validateField('region', formData.region);
      errors.email = validateField('email', formData.email);
      errors.phone = validateField('phone', formData.phone);
      errors.password = validateField('password', formData.password);
      errors.confirmPassword = validateField('confirmPassword', formData.confirmPassword);

      setFieldErrors(prev => ({ ...prev, ...errors }));
      setTouchedFields(prev => ({ ...prev, region: true, email: true, phone: true, password: true, confirmPassword: true }));

      const hasErrors = errors.region || errors.email || errors.phone || errors.password || errors.confirmPassword;
      if (hasErrors || emailStatus === 'taken') return;
    }

    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (50MB maximum for performance)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        setFieldErrors(prev => ({ ...prev, video: 'Le fichier dépasse la limite autorisée de 50 Mo.' }));
        return;
      }
      if (!file.type.startsWith('video/')) {
        setFieldErrors(prev => ({ ...prev, video: 'Le fichier sélectionné doit être une vidéo valide (MP4, MOV).' }));
        return;
      }
      setFieldErrors(prev => ({ ...prev, video: '' }));
      setVideoPreview(file);
    }
  };

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setFieldErrors(prev => ({ ...prev, coverImage: 'L\'image dépasse la limite autorisée de 5 Mo.' }));
        return;
      }
      if (!file.type.startsWith('image/')) {
        setFieldErrors(prev => ({ ...prev, coverImage: 'Le fichier sélectionné doit être une image valide (JPG, PNG).' }));
        return;
      }

      setFieldErrors(prev => ({ ...prev, coverImage: '' }));
      
      // Initialize Cropper workflow
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedArea: any, croppedAreaPixels: any) => {
    // Generate cropped image file using canvas context APIs
    try {
      const image = new Image();
      image.src = imageToCrop;
      await new Promise((resolve) => { image.onload = resolve; });

      const canvas = document.createElement('canvas');
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], 'cover-image.jpg', { type: 'image/jpeg' });
            setCroppedImage(croppedFile);
            setCoverImagePreview(croppedFile);
          }
        }, 'image/jpeg', 0.9);
      }
    } catch (e) {
      console.error('Cropping pipeline error:', e);
    }
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setImageToCrop('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    // Reset inputs if canceled
    if (coverImageInputRef.current) coverImageInputRef.current.value = '';
  };

  const handleConfirmCrop = () => {
    setShowCropper(false);
    setImageToCrop('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleSubmitCandidature = async (event: React.FormEvent) => {
    event.preventDefault();

    // Final checks before transaction block
    const errors: Record<string, string> = {};
    if (!videoPreview) errors.video = 'Veuillez télécharger votre vidéo de performance';
    if (!coverImagePreview) errors.coverImage = 'Veuillez sélectionner une photo de couverture';

    if (errors.video || errors.coverImage) {
      setFieldErrors(prev => ({ ...prev, ...errors }));
      setError('Des éléments obligatoires sont manquants dans votre dossier média.');
      return;
    }

    if (candidatureType === 'group' && formData.memberCount < 2) {
      setError('Pour un groupe, le nombre de membres doit être d\'au moins 2 personnes.');
      return;
    }

    setIsUploading(true);
    setError('');

    // Fake upload progression indicators for optimal client visual cues
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 8;
      if (progress >= 100) {
        setUploadProgress(98); // Lock till server finishes storage writes
      } else {
        setUploadProgress(progress);
      }
    }, 250);

    try {
      const result = await auth.signUpCandidate({
        email: formData.email,
        password: formData.password,
        stageName: formData.stageName,
        discipline: formData.discipline as any,
        region: formData.region as any,
        videoFile: videoPreview!,
        coverImageFile: coverImagePreview!,
        fullName: formData.stageName, // Map stageName to profile fullName constraint
        phone: `+229 01 ${formData.phone}`, // Format complet avec indicatif
        candidatureType,
        memberCount: formData.memberCount,
        bio: formData.bio,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Expunge draft storage safely on success transaction
      localStorage.removeItem('ttb_candidature_draft');
      setIsSubmittingSuccess(true);
      
      // Auto-login immediately after successful registration
      if (supabase) {
        await supabase.auth.signInWithPassword({ 
          email: formData.email, 
          password: formData.password 
        });
      }
      
      // Redirect directly to dashboard
      setTimeout(() => {
        router.refresh();
        router.push('/dashboard/candidate');
      }, 1500);

    } catch (err: any) {
      console.error('Candidate registration transaction error:', err);
      clearInterval(progressInterval);
      setError(err.message || 'Une erreur système s\'est produite lors de l\'enregistrement de votre candidature. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e5c47f]"></div>
      </div>
    );
  }

  if (isSubmittingSuccess) {
    return (
      <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center">
        <div className="max-w-md w-full px-6 text-center animate-in zoom-in-95 duration-700">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white uppercase tracking-tight mb-3">
            Dossier enregistré !
          </h2>
          <p className="text-zinc-500 text-sm font-body leading-relaxed mb-8">
            Félicitations, votre candidature pour Top Talent Bénin 2026 a été envoyée avec succès. Préparation de votre espace candidat sécurisé...
          </p>
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-[#e5c47f] rounded-full animate-ping" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#050505] pt-24 sm:pt-32 pb-12 sm:pb-16 selection:bg-[#e5c47f] selection:text-black">
      {/* Global Progress Bar - SaaS Style */}
      {isUploading && (
        <div className="fixed bottom-0 left-0 w-full z-50 px-4 py-2 bg-white border-t border-zinc-200">
          <ProgressBar progress={uploadProgress} showPercentage size="sm" />
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Navigation Breadcrumbs back home */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-heading uppercase tracking-[0.15em] text-slate-500 hover:text-[#050505] transition-colors mb-6 sm:mb-8"
        >
          ← Retour à l&apos;accueil
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-16 items-start">
          
          {/* Left Column - Informational Branding Canvas */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6 lg:sticky lg:top-28">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e5c47f]/10 border border-[#e5c47f]/30 rounded-full mb-2">
              <div className="w-2 h-2 bg-[#e5c47f] rounded-full animate-pulse"></div>
              <span className="text-[10px] font-heading font-bold uppercase tracking-[0.2em] text-[#e5c47f]">
                Candidatures Ouvertes
              </span>
            </div>
            
            <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight leading-[1.1] text-[#050505]">
              Deviens la <span className="text-[#e5c47f]">Prochaine Icône</span> du Bénin.
            </h1>
            
            <p className="text-zinc-600 text-sm sm:text-base leading-relaxed font-body max-w-md">
              Ta performance artistique peut te propulser au sommet nationale. Dépose ta capsule vidéo, fais-toi valider par nos jurés experts, et mobilise le public pour récolter un maximum de votes !
            </p>

            <div className="pt-4 space-y-3 border-t border-zinc-100 max-w-sm">
              <div className="flex items-start gap-3.5 text-xs sm:text-sm text-zinc-700 font-body">
                <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-zinc-600" />
                </div>
                <div>
                  <p className="font-bold text-black uppercase tracking-wide text-[10px] font-heading mt-0.5">Vidéo 1 minute max</p>
                  <p className="text-zinc-500 text-xs">Montre ton talent à l&apos;état brut, sans filtres ni montages complexes.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 text-xs sm:text-sm text-zinc-700 font-body">
                <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-zinc-600" />
                </div>
                <div>
                  <p className="font-bold text-black uppercase tracking-wide text-[10px] font-heading mt-0.5">Fierté Départementale</p>
                  <p className="text-zinc-500 text-xs">Représente fièrement ta localité et deviens l&apos;ambassadeur de ton terroir.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 text-xs sm:text-sm text-zinc-700 font-body">
                <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-4 h-4 text-zinc-600" />
                </div>
                <div>
                  <p className="font-bold text-black uppercase tracking-wide text-[10px] font-heading mt-0.5">Évaluation du Jury</p>
                  <p className="text-zinc-500 text-xs">Une note technique sera attribuée par un comité académique d&apos;experts.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - State Driven Dynamic Form Shell */}
          <div className="lg:col-span-8 bg-white border border-zinc-100 p-5 sm:p-8 lg:p-10 rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.01)]">
            
            {/* Form Mode View Switch Tabs */}
            <div className="flex border-b border-zinc-100 pb-4 mb-6 sm:mb-8 gap-4 sm:gap-8 overflow-x-auto scrollbar-none">
              {currentPhase === 'PRESELECTION' && (
                <button
                  type="button"
                  onClick={() => setViewState('form')}
                  className={`font-heading text-[10px] uppercase tracking-[0.2em] pb-2 border-b-2 transition-all whitespace-nowrap ${
                    viewState === 'form' 
                      ? 'border-black text-black font-black' 
                      : 'border-transparent text-zinc-400 hover:text-black font-medium'
                  }`}
                >
                  Déposer une candidature
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setViewState('login')}
                className={`font-heading text-[10px] uppercase tracking-[0.2em] pb-2 border-b-2 transition-all whitespace-nowrap ${
                  viewState === 'login' 
                    ? 'border-black text-black font-black' 
                    : 'border-transparent text-zinc-400 hover:text-black font-medium'
                }`}
              >
                Espace Candidat (Connexion)
              </button>
            </div>

            {/* --- VIEW MODE: DISPATCH REGISTER FLOW --- */}
            {viewState === 'form' && (
              <form onSubmit={handleSubmitCandidature} className="space-y-6 sm:space-y-8 animate-fadeIn">
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-4 rounded-none font-body">
                    {error}
                  </div>
                )}

                {/* Progress Step Nodes Bar */}
                <div className="flex items-center justify-between max-w-xs mx-auto mb-8 sm:mb-12 relative">
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-zinc-100 -translate-y-1/2 z-0" />
                  
                  {[1, 2, 3].map((stepNumber) => (
                    <div 
                      key={stepNumber}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold z-10 transition-all ${
                        currentStep === stepNumber
                          ? 'bg-black text-white ring-4 ring-zinc-100'
                          : currentStep > stepNumber
                            ? 'bg-zinc-900 text-[#e5c47f]'
                            : 'bg-zinc-50 border border-zinc-100 text-zinc-400'
                      }`}
                    >
                      {currentStep > stepNumber ? '✓' : stepNumber}
                    </div>
                  ))}
                </div>

                {/* STEP 1 SECTION: IDENTITY CORNER */}
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Grid of Disciplines / Categories */}
                      <div className="space-y-3">
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold">
                          1. Sélectionne ton domaine artistique *
                        </label>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                          {categories.map((cat, index) => {
                            const IconComponent = cat.icon;
                            const isSelected = formData.discipline === cat.id;
                            
                            return (
                              <motion.button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, discipline: cat.id }));
                                  setFieldErrors(prev => ({ ...prev, discipline: '' }));
                                }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                whileHover={{ 
                                  scale: 1.02, 
                                  y: -2,
                                  transition: { duration: 0.2 }
                                }}
                                whileTap={{ 
                                  scale: 0.98,
                                  transition: { duration: 0.1 }
                                }}
                                className={`p-3 sm:p-4 border text-left transition-all relative flex flex-col justify-between min-h-[100px] sm:min-h-[110px] rounded-lg ${
                                  isSelected
                                    ? 'border-[#e5c47f] bg-zinc-950 text-white shadow-lg ring-2 ring-[#e5c47f]/20'
                                    : 'border-zinc-200 bg-white text-black hover:border-[#e5c47f] hover:shadow-md'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isSelected ? 'text-[#e5c47f]' : 'text-zinc-400'}`} />
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="w-2 h-2 bg-[#e5c47f] rounded-full"
                                    />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-[9px] sm:text-[10px] font-heading font-black uppercase tracking-wider mb-1 leading-tight">
                                    {cat.title}
                                  </h3>
                                  <p className={`text-[8px] sm:text-[9px] font-body line-clamp-2 leading-tight ${
                                    isSelected ? 'text-zinc-400' : 'text-zinc-500'
                                  }`}>
                                    {cat.subtitle}
                                  </p>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                        {touchedFields.discipline && fieldErrors.discipline && (
                          <p className="text-xs text-red-500 font-body">{fieldErrors.discipline}</p>
                        )}
                      </div>

                      {/* Candidature Type Selector */}
                      <div className="space-y-3 pt-2">
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold">
                          2. Type de présentation *
                        </label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setCandidatureType('solo');
                              setFormData(prev => ({ ...prev, memberCount: 1 }));
                            }}
                            className={`flex-1 py-3 text-center text-[10px] font-heading font-bold uppercase tracking-widest border rounded-none transition-all ${
                              candidatureType === 'solo'
                                ? 'bg-black border-black text-white'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'
                            }`}
                          >
                            Artiste Solo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCandidatureType('group');
                              setFormData(prev => ({ ...prev, memberCount: 2 }));
                            }}
                            className={`flex-1 py-3 text-center text-[10px] font-heading font-bold uppercase tracking-widest border rounded-none transition-all ${
                              candidatureType === 'group'
                                ? 'bg-black border-black text-white'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'
                            }`}
                          >
                            Collectif / Groupe
                          </button>
                        </div>
                      </div>

                      {/* Stage Name and Bio Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                        <div className="space-y-2">
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold">
                            {candidatureType === 'solo' ? 'Nom de scène *' : 'Nom du groupe / collectif *'}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={formData.stageName}
                              onChange={(e) => setFormData(prev => ({ ...prev, stageName: e.target.value }))}
                              onBlur={(e) => {
                                handleFieldBlur('stageName', e.target.value);
                                void checkStageNameUniqueness(e.target.value);
                              }}
                              placeholder="Ex: SIKA VOICE, D-CREW"
                              className={`w-full bg-zinc-50 border p-3 text-sm font-heading tracking-wide rounded-none focus:outline-none transition-all ${
                                touchedFields.stageName && fieldErrors.stageName
                                  ? 'border-red-400 focus:border-red-500'
                                  : stageNameStatus === 'taken'
                                    ? 'border-amber-400 focus:border-amber-500'
                                    : stageNameStatus === 'available'
                                      ? 'border-emerald-400 focus:border-emerald-500'
                                      : 'border-zinc-200 focus:border-black'
                              }`}
                            />
                            {stageNameStatus === 'checking' && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <ButtonLoader size="sm" />
                              </div>
                            )}
                          </div>
                          
                          {stageNameStatus === 'available' && (
                            <p className="text-[10px] text-emerald-600 font-body font-bold animate-fadeIn">
                              ✓ Ce nom de scène est disponible !
                            </p>
                          )}
                          
                          {stageNameStatus === 'taken' && (
                            <div className="space-y-2 animate-fadeIn">
                              <p className="text-[10px] text-amber-600 font-body font-bold">
                                ✕ Ce nom est déjà pris par un autre candidat. Suggestions :
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {suggestions.map((suggestedName, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, stageName: suggestedName }));
                                      setStageNameStatus('available');
                                      setFieldErrors(prev => ({ ...prev, stageName: '' }));
                                    }}
                                    className="px-2 py-1 bg-zinc-50 border border-zinc-200 hover:border-black text-[9px] font-mono rounded-none transition-all"
                                  >
                                    {suggestedName}
                                  </button>
                                ))}
                                {isGeneratingSuggestions && (
                                  <span className="text-[9px] text-zinc-400 italic flex items-center gap-1">
                                    <ButtonLoader size="sm" /> Génération...
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {touchedFields.stageName && fieldErrors.stageName && (
                            <p className="text-xs text-red-500 font-body">{fieldErrors.stageName}</p>
                          )}
                        </div>

                        {/* Interactive Member Count for Group types */}
                        {candidatureType === 'group' && (
                          <div className="space-y-2 animate-fadeIn">
                            <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold">
                              Nombre de membres du groupe (2 à 12) *
                            </label>
                            <div className="flex items-center gap-4 bg-zinc-50 border border-zinc-200 p-1.5 w-fit rounded-none">
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, memberCount: Math.max(2, prev.memberCount - 1) }))}
                                className="p-2 bg-white border border-zinc-100 text-zinc-600 hover:bg-zinc-100 transition-all rounded-none"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono font-bold text-sm w-8 text-center">
                                {formData.memberCount}
                              </span>
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, memberCount: Math.min(12, prev.memberCount + 1) }))}
                                className="p-2 bg-white border border-zinc-100 text-zinc-600 hover:bg-zinc-100 transition-all rounded-none"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bio Field depending on Category select state */}
                      {formData.discipline && (
                        <div className="space-y-2 pt-2 animate-fadeIn">
                          <div className="flex justify-between items-center">
                            <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold">
                              Précise ton univers artistique (250 car. max) *
                            </label>
                            <span className="text-[10px] font-mono text-zinc-400">
                              {formData.bio.length}/250
                            </span>
                          </div>
                          <textarea
                            required
                            maxLength={250}
                            value={formData.bio}
                            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                            onBlur={(e) => handleFieldBlur('bio', e.target.value)}
                            placeholder={categories.find(c => c.id === formData.discipline)?.placeholder || "Décris en quelques mots ta performance..."}
                            rows={3}
                            className={`w-full bg-zinc-50 border p-3 text-sm font-body rounded-none focus:outline-none transition-all resize-none ${
                              touchedFields.bio && fieldErrors.bio
                                ? 'border-red-400 focus:border-red-500'
                                : 'border-zinc-200 focus:border-black'
                            }`}
                          />
                          {touchedFields.bio && fieldErrors.bio && (
                            <p className="text-xs text-red-500 font-body">{fieldErrors.bio}</p>
                          )}
                        </div>
                      )}

                      {/* Step Action Submit */}
                      <div className="pt-4 border-t border-zinc-100 flex justify-end">
                        <button
                          type="button"
                          onClick={handleNextStep}
                          disabled={!formData.stageName || !formData.discipline || !formData.bio || stageNameStatus === 'taken'}
                          className="px-8 py-3.5 bg-black text-white text-xs font-heading font-bold uppercase tracking-widest hover:bg-[#e5c47f] hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 rounded-none"
                        >
                          Étape Suivante <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* STEP 2 SECTION: LOCATION & SECURE ACCOUNT AUTH */}
                <AnimatePresence mode="wait">
                  {currentStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Region and Email inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold">
                            Département représenté *
                          </label>
                          <CustomSelect
                            value={formData.region}
                            onChange={(value) => {
                              setFormData(prev => ({ ...prev, region: value }));
                              setFieldErrors(prev => ({ ...prev, region: '' }));
                            }}
                            options={departments}
                            placeholder="SÉLECTIONNER TON DÉPARTEMENT"
                          />
                          {touchedFields.region && fieldErrors.region && (
                            <p className="text-xs text-red-500 font-body">{fieldErrors.region}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold">
                            Adresse E-mail du candidat *
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                              onBlur={(e) => {
                                handleFieldBlur('email', e.target.value);
                                void checkEmailUniqueness(e.target.value);
                              }}
                              placeholder="artiste@exemple.com"
                              className={`w-full bg-zinc-50 border p-3 text-sm font-heading tracking-wide rounded-none focus:outline-none transition-all ${
                                (touchedFields.email && fieldErrors.email) || emailStatus === 'taken'
                                  ? 'border-red-400 focus:border-red-500'
                                  : 'border-zinc-200 focus:border-black'
                              }`}
                            />
                            {emailStatus === 'checking' && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <ButtonLoader size="sm" />
                              </div>
                            )}
                          </div>
                          {touchedFields.email && fieldErrors.email && (
                            <p className="text-xs text-red-500 font-body">{fieldErrors.email}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold">
                            Numéro de téléphone *
                          </label>
                          <div className="flex">
                            <span className="bg-zinc-100 border border-zinc-200 border-r-0 px-3 py-3 text-sm text-zinc-600 flex items-center font-mono">
                              +229 01
                            </span>
                            <input
                              type="tel"
                              required
                              value={formData.phone}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                                const formatted = value.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4').trim();
                                setFormData(prev => ({ ...prev, phone: formatted }));
                              }}
                              onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                              placeholder="XX XX XX XX"
                              maxLength={11}
                              className={`flex-1 bg-zinc-50 border p-3 text-sm font-heading tracking-wide rounded-none focus:outline-none transition-all ${
                                touchedFields.phone && fieldErrors.phone
                                  ? 'border-red-400 focus:border-red-500'
                                  : 'border-zinc-200 focus:border-black'
                              }`}
                            />
                          </div>
                          {touchedFields.phone && fieldErrors.phone && (
                            <p className="text-xs text-red-500 font-body">{fieldErrors.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* Password setup box */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                        <div className="space-y-2">
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold">
                            Créer un mot de passe sécurisé *
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={formData.password}
                              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                              onBlur={(e) => handleFieldBlur('password', e.target.value)}
                              placeholder="••••••••••••"
                              className={`w-full bg-zinc-50 border p-3 text-sm font-heading tracking-wide rounded-none focus:outline-none transition-all pr-10 ${
                                touchedFields.password && fieldErrors.password
                                  ? 'border-red-400 focus:border-red-500'
                                  : 'border-zinc-200 focus:border-black'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          
                          {/* Live Password Criteria Grid Checklist */}
                          <div className="mt-3 grid grid-cols-2 gap-2 bg-zinc-50 border border-zinc-100 p-3 text-[10px] font-mono">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${passwordCriteria.minLength ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                              <span className={passwordCriteria.minLength ? 'text-emerald-700 font-bold' : 'text-zinc-500'}>Au moins 8 caractères</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${passwordCriteria.hasUpperCase ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                              <span className={passwordCriteria.hasUpperCase ? 'text-emerald-700 font-bold' : 'text-zinc-500'}>1 Majuscule (A-Z)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${passwordCriteria.hasNumber ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                              <span className={passwordCriteria.hasNumber ? 'text-emerald-700 font-bold' : 'text-zinc-500'}>1 Chiffre (0-9)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${passwordCriteria.hasSpecialChar ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                              <span className={passwordCriteria.hasSpecialChar ? 'text-emerald-700 font-bold' : 'text-zinc-500'}>1 Caractère spécial (!@#...)</span>
                            </div>
                          </div>
                          
                          {touchedFields.password && fieldErrors.password && (
                            <p className="text-xs text-red-500 font-body">{fieldErrors.password}</p>
                          )}
                        </div>

                        {/* Confirmation Password input */}
                        <div className="space-y-2">
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold">
                            Confirmer le mot de passe *
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              required
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              onBlur={(e) => handleFieldBlur('confirmPassword', e.target.value)}
                              placeholder="••••••••••••"
                              className={`w-full bg-zinc-50 border p-3 text-sm font-heading tracking-wide rounded-none focus:outline-none transition-all pr-10 ${
                                touchedFields.confirmPassword && fieldErrors.confirmPassword
                                  ? 'border-red-400 focus:border-red-500'
                                  : 'border-zinc-200 focus:border-black'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {touchedFields.confirmPassword && fieldErrors.confirmPassword && (
                            <p className="text-xs text-red-500 font-body">{fieldErrors.confirmPassword}</p>
                          )}
                        </div>
                      </div>

                      {/* Flow navigations */}
                      <div className="pt-4 border-t border-zinc-100 flex justify-between gap-3">
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className="px-6 py-3.5 border border-zinc-200 text-zinc-600 text-xs font-heading font-bold uppercase tracking-widest hover:border-black hover:text-black transition-all rounded-none"
                        >
                          Retour
                        </button>
                        
                        <button
                          type="button"
                          onClick={handleNextStep}
                          disabled={
                            !formData.region || 
                            !formData.email || 
                            emailStatus === 'taken' ||
                            !passwordCriteria.minLength || 
                            !passwordCriteria.hasUpperCase || 
                            !passwordCriteria.hasNumber || 
                            !passwordCriteria.hasSpecialChar ||
                            formData.password !== formData.confirmPassword
                          }
                          className="px-8 py-3.5 bg-black text-white text-xs font-heading font-bold uppercase tracking-widest hover:bg-[#e5c47f] hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 rounded-none"
                        >
                          Continuer <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* STEP 3 SECTION: MULTIMEDIA DOSSIER UPLOAD PIPELINES */}
                <AnimatePresence mode="wait">
                  {currentStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Box for video asset upload */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold">
                            Capsule Vidéo de démonstration (1 Min Max) *
                          </label>
                          <span className="text-[10px] font-mono text-zinc-400">Format MP4, MOV - Max 50 Mo</span>
                        </div>
                        
                        <div 
                          onClick={() => !isUploading && videoInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-none p-6 text-center cursor-pointer transition-colors ${
                            videoPreview 
                              ? 'border-emerald-300 bg-emerald-50/10' 
                              : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-400'
                          }`}
                        >
                          <input 
                            type="file" 
                            ref={videoInputRef}
                            onChange={handleVideoChange}
                            accept="video/mp4,video/quicktime,video/x-matroska"
                            className="hidden" 
                          />
                          
                          {videoPreview ? (
                            <VideoPreview 
                              videoFile={videoPreview} 
                              onRemove={() => {
                                setVideoPreview(null);
                                if (videoInputRef.current) videoInputRef.current.value = '';
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center py-4">
                              <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                              <span className="text-xs font-heading font-bold uppercase tracking-wider text-black mb-1">
                                Choisir ou Glisser le fichier vidéo
                              </span>
                              <span className="text-[11px] font-body text-zinc-500">
                                Enregistre une performance claire et face caméra de 60 secondes maximum.
                              </span>
                            </div>
                          )}
                        </div>
                        {fieldErrors.video && (
                          <p className="text-xs text-red-500 font-body mt-1">{fieldErrors.video}</p>
                        )}
                      </div>

                      {/* Box for image asset profile photo cover */}
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-baseline">
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold">
                            Photo officielle de couverture / Profil *
                          </label>
                          <span className="text-[10px] font-mono text-zinc-400">Format JPG, PNG - Max 5 Mo</span>
                        </div>
                        
                        <div 
                          onClick={() => !isUploading && coverImageInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-none p-6 text-center cursor-pointer transition-colors ${
                            coverImagePreview 
                              ? 'border-emerald-300 bg-emerald-50/10' 
                              : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-400'
                          }`}
                        >
                          <input 
                            type="file" 
                            ref={coverImageInputRef}
                            onChange={handleCoverImageChange}
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden" 
                          />
                          
                          {coverImagePreview ? (
                            <div className="w-full space-y-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-2 text-emerald-600 font-heading text-[10px] font-bold uppercase tracking-wider">
                                <CheckCircle2 className="w-4 h-4" /> Photo Recadrée Prête
                              </div>
                              <div className="w-24 h-24 mx-auto overflow-hidden rounded-full border-2 border-white shadow-md bg-zinc-100">
                                <img 
                                  src={URL.createObjectURL(coverImagePreview)} 
                                  alt="Aperçu de la photo de profil du candidat" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setCoverImagePreview(null);
                                  if (coverImageInputRef.current) coverImageInputRef.current.value = '';
                                }}
                                className="text-[9px] font-heading font-bold text-red-500 uppercase tracking-widest hover:underline"
                              >
                                Remplacer la photo
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center py-4">
                              <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                              <span className="text-xs font-heading font-bold uppercase tracking-wider text-black mb-1">
                                Sélectionner ton portrait de profil
                              </span>
                              <span className="text-[11px] font-body text-zinc-500">
                                Une photo nette, de haute qualité, servant de vignette pour le vote du public.
                              </span>
                            </div>
                          )}
                        </div>
                        {fieldErrors.coverImage && (
                          <p className="text-xs text-red-500 font-body mt-1">{fieldErrors.coverImage}</p>
                        )}
                      </div>

                      {/* Global transactional layout trigger */}
                      <div className="pt-6 border-t border-zinc-100 flex justify-between gap-3">
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          disabled={isUploading}
                          className="px-6 py-3.5 border border-zinc-200 text-zinc-600 text-xs font-heading font-bold uppercase tracking-widest hover:border-black hover:text-black transition-all rounded-none disabled:opacity-30"
                        >
                          Retour
                        </button>
                        
                        <button
                          type="submit"
                          disabled={isUploading || !videoPreview || !coverImagePreview}
                          className="flex-1 py-3.5 bg-zinc-950 text-white text-xs font-heading font-black uppercase tracking-widest hover:bg-[#e5c47f] hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 rounded-none shadow-md"
                        >
                          {isUploading ? (
                            <>Transmission en cours...</>
                          ) : (
                            <>
                              VALIDER ET SOUMETTRE MON DOSSIER
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            )}

            {/* --- VIEW MODE: SECURE CANDIDATE LOGIN (SANS USEFORMSTATE CRASH) --- */}
            {viewState === 'login' && (
              <form onSubmit={handleCandidateLogin} className="space-y-5 animate-fadeIn py-4">
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-none font-body">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold">
                    Adresse E-mail du candidat
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="artiste@exemple.com"
                    className="w-full bg-zinc-50 border border-zinc-200 p-3.5 text-sm font-heading tracking-wide focus:outline-none focus:border-black rounded-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold">
                      Mot de passe
                    </label>
                    <button 
                      type="button" 
                      onClick={() => window.open('mailto:kenkenbabatounde@gmail.com?subject=Identifiants oubliés - Top Talent Bénin', '_blank')}
                      className="text-[10px] text-[#e5c47f] hover:underline uppercase tracking-widest font-heading font-bold transition-all"
                    >
                      Identifiants oubliés ?
                    </button>
                  </div>
                  
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••••••"
                      className="w-full bg-zinc-50 border border-zinc-200 p-3.5 pr-10 text-sm font-heading tracking-wide focus:outline-none focus:border-black rounded-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-4 bg-black text-white text-xs font-heading font-black uppercase tracking-widest hover:bg-[#e5c47f] hover:text-black transition-all flex items-center justify-center gap-2 rounded-none shadow-sm disabled:opacity-40"
                  >
                    {isLoggingIn ? (
                      <>
                        <ButtonLoader size="sm" />
                        VÉRIFICATION DE L&apos;ACCÈS...
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" /> ACCÉDER À MON ESPACE CANDIDAT
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Microbranding bottom card sign */}
            <div className="mt-8 pt-4 border-t border-zinc-50 text-center">
              <p className="text-[10px] uppercase font-heading font-medium tracking-widest text-zinc-400">
                Portail officiel d&apos;inscription • Top Talent Bénin 2026
              </p>
            </div>
          </div>
        </div>

        {/* --- GLOBAL EASY CROP OVERLAY MODAL --- */}
        {showCropper && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col rounded-none shadow-2xl">
              
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-xs font-heading font-black uppercase tracking-wider text-black">
                  Recadrer l&apos;image de couverture (Ratio 16:9)
                </h3>
                <button 
                  type="button"
                  onClick={handleCancelCrop}
                  className="p-1.5 hover:bg-zinc-100 rounded-none text-zinc-400 hover:text-black transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 bg-zinc-950 relative min-h-[350px] sm:min-h-[400px]">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={handleCropComplete}
                  cropShape="rect"
                  showGrid={true}
                />
              </div>
              
              <div className="p-4 border-t border-zinc-200 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Zoom</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-black"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancelCrop}
                    className="flex-1 py-3 border border-zinc-200 text-zinc-600 text-xs font-heading uppercase tracking-[0.2em] font-bold hover:border-[#050505] hover:text-[#050505] transition-all rounded-none"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCrop}
                    className="flex-1 py-3 bg-[#050505] text-white text-xs font-heading uppercase tracking-[0.2em] font-bold hover:bg-[#e5c47f] hover:text-black transition-all rounded-none"
                  >
                    Confirmer
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}