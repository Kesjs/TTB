'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import Cropper from 'react-easy-crop';
import { Upload, Film, CheckCircle2, Clock, Share2, ArrowRight, User, MapPin, Award, Lock, Loader2, Users, Eye, EyeOff, Plus, Minus, Mic, Music, Clapperboard, MessageSquare, Video, Sparkles, Trophy, Palette, ChevronDown, X } from 'lucide-react';
import { auth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { db } from '@/lib/supabase';
import { signIn } from '@/app/actions/auth';
import CustomSelect from '@/components/ui/CustomSelect';

export default function CandidaturePage() {
  const router = useRouter();
  const [viewState, setViewState] = useState<'form' | 'login' | 'dashboard'>(() => (
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'login' ? 'login' : 'form'
  ));
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [candidatureType, setCandidatureType] = useState<'solo' | 'group'>('solo');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password criteria validation state
  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    hasUpperCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const [signInState, signInFormAction] = useFormState(signIn, null);
  const [currentPhase, setCurrentPhase] = useState<string>('PRESELECTION');
  const [formData, setFormData] = useState({
    stageName: '',
    discipline: '',
    region: '',
    bio: '',
    email: '',
    password: '',
    confirmPassword: '',
    memberCount: 1,
    specialite: '',
  });

  // Validation states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Update password criteria and confirm password validation in real-time
  useEffect(() => {
    setPasswordCriteria({
      minLength: formData.password.length >= 8,
      hasUpperCase: /[A-Z]/.test(formData.password),
      hasNumber: /[0-9]/.test(formData.password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
    });

    // Re-validate confirm password if it's already been touched
    if (touchedFields.confirmPassword) {
      const confirmError = formData.confirmPassword !== formData.password ? 'Les mots de passe ne correspondent pas' : '';
      setFieldErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  }, [formData.password, formData.confirmPassword, touchedFields.confirmPassword]);

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

  // Clear sensitive data when switching views
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: ''
    }));
    setFieldErrors({});
    setTouchedFields({});
    setError('');
  }, [viewState]);

  // Fetch current phase on mount and redirect if not PRESELECTION
  useEffect(() => {
    const fetchPhase = async () => {
      try {
        const systemControl = await db.getSystemControl();
        if (systemControl) {
          setCurrentPhase(systemControl.current_phase);
          if (systemControl.current_phase !== 'PRESELECTION' && viewState !== 'login') {
            window.location.href = '/';
          }
        }
      } catch (err) {
        console.error('Error fetching phase:', err);
      }
    };
    void fetchPhase();
  }, [viewState]);

  const validateField = (fieldName: string, value: string) => {
    let error = '';
    switch (fieldName) {
      case 'stageName':
        if (value.length < 2) error = 'Minimum 2 caractères requis';
        break;
      case 'discipline':
        if (!value) error = 'Veuillez sélectionner une discipline';
        break;
      case 'region':
        if (!value) error = 'Veuillez sélectionner un département';
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) error = 'Format email invalide';
        break;
      case 'password':
        if (value.length > 0 && value.length < 8) return 'Minimum 8 caractères requis';
        if (value.length >= 8) {
          if (!/[A-Z]/.test(value)) return 'Au moins une majuscule requise';
          if (!/[0-9]/.test(value)) return 'Au moins un chiffre requis';
          if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Au moins un caractère spécial requis';
        }
        break;
      case 'confirmPassword':
        if (value && value !== formData.password) return 'Les mots de passe ne correspondent pas';
        break;
      case 'specialite':
        if (!value) error = 'Veuillez préciser votre spécialité';
        break;
      case 'coverImage':
        if (!coverImagePreview) error = 'Veuillez sélectionner une image de couverture';
        break;
    }
    return error;
  };

  // Categories data
  const categories = [
    { id: 'Musique', title: 'CHANT & MUSIQUE', subtitle: 'Rap, Han, Afrobeat, Gospel, Traditionnel...', icon: Mic, placeholder: 'Ex: Je chante du Rap/Afrobeat, je joue du piano, je fais du beatmaking...' },
    { id: 'Danse', title: 'DANSE & CHORÉGRAPHIE', subtitle: 'Danses urbaines, Traditionnelles, Afro, Breakdance...', icon: Music, placeholder: 'Ex: Je danse le Zinli, je fais du Afro, du Breakdance, des danses traditionnelles...' },
    { id: 'Humour', title: 'HUMOUR & COMÉDIE', subtitle: 'Stand-up, Blagues, Imitation, Éwé, Théâtre...', icon: Clapperboard, placeholder: 'Ex: Je fais du stand-up, des imitations, des sketchs comiques...' },
    { id: 'Art_Oratoire', title: 'SLAM & CONTE', subtitle: 'Slam, Poésie, Éloquence, Parole, Conte...', icon: MessageSquare, placeholder: 'Ex: Je fais du slam, de la poésie, du conte, de léloquence...' },
    { id: 'Digital', title: 'VIDÉO & DIGITAL', subtitle: 'TikTok, Vidéastes, Humour en vidéo, Créateurs de contenu, Beatmaking, Cinéma...', icon: Video, placeholder: 'Ex: Je crée du contenu sur TikTok, je fais des vidéos, du montage, du beatmaking...' },
    { id: 'Cirque', title: 'ACROBATIE & CIRQUE', subtitle: 'Magie, Jonglage, Cracheurs de feu, Gymnastique...', icon: Sparkles, placeholder: 'Ex: Je fais de la magie, du jonglage, des acrobaties, de la gymnastique...' },
    { id: 'Sport', title: 'FOOT FREESTYLE & ROLLER', subtitle: 'Sports acrobatiques, Skate, Street-workout...', icon: Trophy, placeholder: 'Ex: Je fais du foot freestyle, du skate, du street-workout, des sports acrobatiques...' },
    { id: 'Arts_Visuels', title: 'DESSIN, PEINTURE & MODE', subtitle: 'Stylisme, Maquillage artistique, Tableaux, Coiffure...', icon: Palette, placeholder: 'Ex: Je fais du stylisme, du maquillage artistique, des tableaux, de la coiffure...' },
  ];

  // Departments data
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

  const handleFieldBlur = (fieldName: string, value: string) => {
    setTouchedFields({ ...touchedFields, [fieldName]: true });
    const error = validateField(fieldName, value);
    setFieldErrors({ ...fieldErrors, [fieldName]: error });
  };

  const handleSubmitCandidature = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate all fields
    const errors: Record<string, string> = {};
    errors.stageName = validateField('stageName', formData.stageName);
    errors.discipline = validateField('discipline', formData.discipline);
    errors.specialite = validateField('specialite', formData.specialite);
    errors.region = validateField('region', formData.region);
    errors.email = validateField('email', formData.email);
    errors.password = validateField('password', formData.password);
    errors.confirmPassword = validateField('confirmPassword', formData.confirmPassword);
    if (!videoPreview) errors.video = 'Veuillez télécharger votre vidéo';

    setFieldErrors(errors);
    setTouchedFields({
      stageName: true,
      discipline: true,
      specialite: true,
      region: true,
      email: true,
      password: true,
      confirmPassword: true,
      video: true,
      coverImage: true,
    });

    // Validate cover image
    if (!coverImagePreview) {
      errors.coverImage = 'Veuillez sélectionner une image de couverture';
    }

    const hasErrors = Object.values(errors).some(error => error);
    if (hasErrors) {
      setError('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }

    if (candidatureType === 'group' && formData.memberCount < 2) {
      setError('Pour un groupe, le nombre de membres doit être d\'au moins 2 personnes.');
      return;
    }

    setIsUploading(true);
    setError('');

    // Simulate upload progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) clearInterval(progressInterval);
    }, 200);

    try {
      const result = await auth.signUpCandidate({
        email: formData.email,
        password: formData.password,
        stageName: formData.stageName,
        discipline: formData.discipline as any,
        region: formData.region as any,
        videoFile: videoPreview!,
        coverImageFile: coverImagePreview!,
        fullName: formData.stageName,
        candidatureType,
        memberCount: formData.memberCount,
      });

      localStorage.setItem('user_id', result.user.id);
      localStorage.setItem('user_role', 'candidate');
      const cookieOptions = 'path=/; max-age=604800; SameSite=Lax; Secure';
      document.cookie = `user_id=${result.user.id}; ${cookieOptions}`;
      document.cookie = `user_role=candidate; ${cookieOptions}`;

      clearInterval(progressInterval);
      router.push('/dashboard/candidate');
    } catch (err: any) {
      console.error('Erreur inscription:', err);
      clearInterval(progressInterval);
      setError(err.message || 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };


  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Size check: Max 50MB
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        setFieldErrors({ ...fieldErrors, video: 'Le fichier dépasse la limite autorisée de 50 Mo.' });
        if (videoInputRef.current) {
          videoInputRef.current.value = '';
        }
        setVideoPreview(null);
        return;
      }

      // Type check: Must be video
      if (!file.type.startsWith('video/')) {
        setFieldErrors({ ...fieldErrors, video: 'Le fichier doit être une vidéo (MP4, MOV, etc.)' });
        if (videoInputRef.current) {
          videoInputRef.current.value = '';
        }
        setVideoPreview(null);
        return;
      }

      // Clear any existing video error
      setFieldErrors(prev => ({ ...prev, video: '' }));
      setTouchedFields(prev => ({ ...prev, video: true }));
      setVideoPreview(file);
    }
  };

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Size check: Max 5MB
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setFieldErrors({ ...fieldErrors, coverImage: 'L\'image dépasse la limite autorisée de 5 Mo.' });
        if (coverImageInputRef.current) {
          coverImageInputRef.current.value = '';
        }
        setCoverImagePreview(null);
        return;
      }

      // Type check: Must be image
      if (!file.type.startsWith('image/')) {
        setFieldErrors({ ...fieldErrors, coverImage: 'Le fichier doit être une image (JPG, PNG, etc.)' });
        if (coverImageInputRef.current) {
          coverImageInputRef.current.value = '';
        }
        setCoverImagePreview(null);
        return;
      }

      setFieldErrors({ ...fieldErrors, coverImage: '' });
      // Open cropper instead of directly setting preview
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedArea: any, croppedAreaPixels: any) => {
    const image = new Image();
    image.src = imageToCrop;
    await new Promise((resolve) => {
      image.onload = resolve;
    });

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
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setImageToCrop('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (coverImageInputRef.current) {
      coverImageInputRef.current.value = '';
    }
  };

  const handleConfirmCrop = () => {
    setShowCropper(false);
    setImageToCrop('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="min-h-screen bg-white text-[#050505] pt-24 sm:pt-32 pb-12 sm:pb-16 selection:bg-[#e5c47f] selection:text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Back to home button */}
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-heading uppercase tracking-[0.15em] text-slate-500 hover:text-[#050505] transition-colors mb-6">
          ← Retour à l'accueil
        </Link>
        {viewState === 'dashboard' ? (
          <div className="max-w-4xl mx-auto bg-white border border-zinc-100 rounded-xl p-6 sm:p-8 lg:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.02)] space-y-6 sm:space-y-10 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-zinc-100 pb-4 sm:pb-6">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 w-fit">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-heading font-black uppercase tracking-tight text-[#050505]">Espace de suivi activé — {formData.stageName}</h2>
                <p className="text-zinc-500 text-xs font-body">Votre dossier technique et votre flux vidéo ont été sécurisés.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-zinc-50 border border-zinc-100 p-4 sm:p-5 rounded-lg space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Statut Capsule</span>
                <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider pt-1">
                  <Clock className="w-3.5 h-3.5 animate-pulse" /> En cours de revue
                </div>
              </div>
              <div className="bg-zinc-50 border border-zinc-100 p-4 sm:p-5 rounded-lg space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Votes Certifiés</span>
                <p className="text-xl sm:text-2xl font-black font-mono text-[#050505]">0</p>
              </div>
              <div className="bg-zinc-50 border border-zinc-100 p-4 sm:p-5 rounded-lg space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Compteur National</span>
                <p className="text-xs font-bold uppercase text-zinc-400 pt-1.5">Verrouillé</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <h3 className="text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-bold">Récapitulatif de votre fiche</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-body">
                <div className="flex items-center gap-3 text-zinc-600"><User className="w-4 h-4 text-zinc-400" /> <span>{candidatureType === 'solo' ? 'Artiste' : 'Groupe'} : <strong className="text-black uppercase">{formData.stageName}</strong></span></div>
                <div className="flex items-center gap-3 text-zinc-600"><Award className="w-4 h-4 text-zinc-400" /> <span>Catégorie : <strong className="text-black uppercase">{formData.discipline}</strong></span></div>
                <div className="flex items-center gap-3 text-zinc-600"><MapPin className="w-4 h-4 text-zinc-400" /> <span>Département : <strong className="text-black uppercase">{formData.region}</strong></span></div>
                {candidatureType === 'group' && (
                  <div className="flex items-center gap-3 text-zinc-600"><Users className="w-4 h-4 text-zinc-400" /> <span>Membres : <strong className="text-black">{formData.memberCount}</strong></span></div>
                )}
                <div className="flex items-center gap-3 text-zinc-600"><Share2 className="w-4 h-4 text-zinc-400" /> <span>Lien de vote : <span className="text-zinc-400 italic">Disponible après validation</span></span></div>
              </div>
            </div>

            <div className="p-4 bg-[#e5c47f]/5 rounded border border-[#e5c47f]/10 text-center">
             
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-16 items-start">
            {/* Left Sidebar - Hero */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-6 relative">
              {/* Decorative background pattern */}
              <div className="absolute -top-10 -left-10 w-64 h-64 bg-[#e5c47f]/5 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#050505]/5 rounded-full blur-3xl -z-10"></div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e5c47f]/10 border border-[#e5c47f]/30 rounded-full mb-4">
                <div className="w-2 h-2 bg-[#e5c47f] rounded-full animate-pulse"></div>
                <span className="text-[10px] font-heading font-bold uppercase tracking-[0.2em] text-[#e5c47f]">Candidatures Ouvertes</span>
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight leading-[1.1] text-[#050505] mb-6">
                Deviens la <span className="text-[#e5c47f]">Prochaine Icône</span> du Bénin.
              </h1>
              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed font-body mb-8 max-w-md">
                Ta talentueuse performance peut te propulser au sommet. Dépose ta vidéo, fais-toi valider par nos experts, et laisse le public béninois voter pour toi.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-700 font-body">
                  <div className="w-8 h-8 bg-[#050505] rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <span><strong>Vidéo 1 minute max</strong> — brute et authentique</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-700 font-body">
                  <div className="w-8 h-8 bg-[#050505] rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <span><strong>Représente ton département</strong> — fierté locale</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-700 font-body">
                  <div className="w-8 h-8 bg-[#050505] rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <span><strong>Validation par experts</strong> — qualité garantie</span>
                </div>
              </div>
            </div>

            {/* Main Form */}
            <div className="lg:col-span-8 bg-white border border-zinc-100 p-6 sm:p-8 lg:p-10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.01)]">
              <div className="flex border-b border-zinc-100 pb-4 mb-6 gap-3 sm:gap-6 overflow-x-auto">
                {currentPhase === 'PRESELECTION' && (
                  <button
                    type="button"
                    onClick={() => setViewState('form')}
                    className={`font-heading text-[10px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] pb-2 border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                      viewState === 'form' ? 'border-black text-black font-bold' : 'border-transparent text-zinc-400 hover:text-black'
                    }`}
                  >
                    <span className="hidden sm:inline">Déposer une candidature</span>
                    <span className="sm:hidden">Candidature</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewState('login')}
                  className={`font-heading text-[10px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] pb-2 border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                    viewState === 'login' ? 'border-black text-black font-bold' : 'border-transparent text-zinc-400 hover:text-black'
                  }`}
                >
                  <span className="hidden sm:inline">Se connecter</span>
                  <span className="sm:hidden">Connexion</span>
                </button>
              </div>

              {viewState === 'form' && (
                <form onSubmit={handleSubmitCandidature} className="space-y-4 sm:space-y-6 animate-fadeIn">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Progress Indicator */}
                  <div className="flex items-center justify-center gap-8 mb-4">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex flex-col items-center">
                        <div className={`flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold transition-all ${
                          currentStep >= step
                            ? 'bg-zinc-800 text-white'
                            : 'bg-zinc-100 text-zinc-400'
                        }`}>
                          {currentStep > step ? '✓' : step}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Step Labels */}
                  <div className="flex items-center justify-center gap-8 mb-6 text-[8px] uppercase tracking-wider font-bold">
                    <span className={currentStep >= 1 ? 'text-zinc-800' : 'text-zinc-400'}>Identité</span>
                    <span className={currentStep >= 2 ? 'text-zinc-800' : 'text-zinc-400'}>Contact</span>
                    <span className={currentStep >= 3 ? 'text-zinc-800' : 'text-zinc-400'}>Média</span>
                  </div>

                  {/* Step 1: Identity */}
                  <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 sm:space-y-6"
                      >
                        <div className="mb-6">
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-3">Type de candidature</label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => { setCandidatureType('solo'); setFormData({ ...formData, memberCount: 1 }); }}
                              className={`flex-1 py-3 px-4 border transition-all text-xs uppercase tracking-[0.15em] font-bold ${
                                candidatureType === 'solo'
                                  ? 'border-[#050505] bg-[#050505] text-white'
                                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-[#050505]'
                              }`}
                            >
                              Solo
                            </button>
                            <button
                              type="button"
                              onClick={() => { setCandidatureType('group'); setFormData({ ...formData, memberCount: 2 }); }}
                              className={`flex-1 py-3 px-4 border transition-all text-xs uppercase tracking-[0.15em] font-bold ${
                                candidatureType === 'group'
                                  ? 'border-[#050505] bg-[#050505] text-white'
                                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-[#050505]'
                              }`}
                            >
                              Groupe
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">
                            {candidatureType === 'solo' ? 'Nom de scène' : 'Nom du groupe'}
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.stageName}
                            onChange={(event) => setFormData({ ...formData, stageName: event.target.value })}
                            onBlur={() => handleFieldBlur('stageName', formData.stageName)}
                            placeholder={candidatureType === 'solo' ? "EX: SIKA VOICE" : "EX: LES ÉLÉVATEURS"}
                            className={`w-full bg-zinc-50 border p-3 sm:p-4 text-sm font-heading tracking-wide focus:outline-none transition-colors ${
                              touchedFields.stageName && fieldErrors.stageName
                                ? 'border-red-500'
                                : 'border-zinc-200 focus:border-black'
                            }`}
                            disabled={isUploading}
                          />
                          {touchedFields.stageName && fieldErrors.stageName && (
                            <p className="font-mono text-[9px] uppercase text-red-500 mt-1">{fieldErrors.stageName}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-3">CHOISIS TA CATÉGORIE</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {categories.map((category) => {
                              const Icon = category.icon;
                              const isSelected = formData.discipline === category.id;
                              return (
                                <button
                                  key={category.id}
                                  type="button"
                                  onClick={() => !isUploading && setFormData({ ...formData, discipline: category.id })}
                                  disabled={isUploading}
                                  className={`p-4 border transition-all text-left ${
                                    isSelected
                                      ? 'bg-zinc-800 border-zinc-800 text-white'
                                      : 'bg-white border-zinc-200 text-[#050505] hover:border-zinc-400'
                                  } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-zinc-500'}`} />
                                    <div className="flex-1">
                                      <h3 className="text-xs font-bold uppercase tracking-wider mb-1">{category.title}</h3>
                                      <p className={`text-[10px] leading-relaxed ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                        {category.subtitle}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {touchedFields.discipline && fieldErrors.discipline && (
                            <p className="font-mono text-[9px] uppercase text-red-500 mt-2">{fieldErrors.discipline}</p>
                          )}
                        </div>

                        <AnimatePresence>
                          {formData.discipline && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                              <div>
                                <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">
                                  PRÉCISE EN QUELQUES MOTS CE QUE TU FAIS EXACTEMENT
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={formData.specialite}
                                  onChange={(event) => setFormData({ ...formData, specialite: event.target.value })}
                                  onBlur={() => handleFieldBlur('specialite', formData.specialite)}
                                  placeholder={categories.find(c => c.id === formData.discipline)?.placeholder || "Ex: Je fais des sketchs sur TikTok, je danse le Zinli, je fais du beatbox, je crée des vêtements..."}
                                  className={`w-full bg-zinc-50 border p-3 sm:p-4 text-sm font-body tracking-wide focus:outline-none transition-colors ${
                                    touchedFields.specialite && fieldErrors.specialite
                                      ? 'border-red-500'
                                      : 'border-zinc-200 focus:border-black'
                                  }`}
                                  disabled={isUploading}
                                />
                                {touchedFields.specialite && fieldErrors.specialite && (
                                  <p className="font-mono text-[9px] uppercase text-red-500 mt-1">{fieldErrors.specialite}</p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {candidatureType === 'group' && (
                          <div>
                            <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Nombre de membres</label>
                            <div className="w-full bg-zinc-50 border border-zinc-200 p-3 sm:p-4">
                              <div className="flex justify-between items-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (formData.memberCount > 2) {
                                      setFormData({ ...formData, memberCount: formData.memberCount - 1 });
                                    }
                                  }}
                                  disabled={formData.memberCount <= 2 || isUploading}
                                  className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-none transition-all active:scale-95 ${
                                    formData.memberCount <= 2 || isUploading
                                      ? 'opacity-30 pointer-events-none cursor-not-allowed border-zinc-900 bg-zinc-950 text-zinc-600'
                                      : 'bg-zinc-900 border border-zinc-800 text-zinc-100 hover:bg-zinc-850'
                                  }`}
                                >
                                  <Minus className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                                <span className="text-base sm:text-lg font-mono font-bold text-black min-w-[40px] text-center">
                                  {formData.memberCount}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (formData.memberCount < 12) {
                                      setFormData({ ...formData, memberCount: formData.memberCount + 1 });
                                    }
                                  }}
                                  disabled={formData.memberCount >= 12 || isUploading}
                                  className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-none transition-all active:scale-95 ${
                                    formData.memberCount >= 12 || isUploading
                                      ? 'opacity-30 pointer-events-none cursor-not-allowed border-zinc-900 bg-zinc-950 text-zinc-600'
                                      : 'bg-zinc-900 border border-zinc-800 text-zinc-100 hover:bg-zinc-850'
                                  }`}
                                >
                                  <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-1">Entre 2 et 12 membres</p>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          disabled={!formData.stageName || !formData.discipline || !formData.specialite}
                          className="w-full py-3 sm:py-4 bg-[#050505] text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#e5c47f] hover:text-black transition-all flex items-center justify-center gap-2 sm:gap-3 rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          SUIVANT <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step 2: Contact */}
                  <AnimatePresence mode="wait">
                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 sm:space-y-6"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Département d&apos;origine</label>
                            <CustomSelect
                              value={formData.region}
                              onChange={(value) => {
                                setFormData({ ...formData, region: value });
                                handleFieldBlur('region', value);
                              }}
                              options={departments}
                              placeholder="SÉLECTIONNER"
                              disabled={isUploading}
                            />
                            {touchedFields.region && fieldErrors.region && (
                              <p className="font-mono text-[9px] uppercase text-red-500 mt-1">{fieldErrors.region}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Adresse E-mail</label>
                            <input 
                              type="email" 
                              required 
                              value={formData.email} 
                              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                              onBlur={() => handleFieldBlur('email', formData.email)}
                              placeholder="ARTISTE@GMAIL.COM" 
                              className={`w-full bg-zinc-50 border p-3 sm:p-4 text-sm font-heading tracking-wide focus:outline-none transition-colors ${
                                touchedFields.email && fieldErrors.email
                                  ? 'border-red-500'
                                  : 'border-zinc-200 focus:border-black'
                              }`}
                              disabled={isUploading}
                            />
                            {touchedFields.email && fieldErrors.email && (
                              <p className="font-mono text-[9px] uppercase text-red-500 mt-1">{fieldErrors.email}</p>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-zinc-100 pt-4 sm:pt-5">
                          <label className="block text-sm uppercase tracking-widest text-zinc-400 font-bold mb-2">Créez votre mot de passe d&apos;accès</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={formData.password}
                              onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                              onBlur={() => handleFieldBlur('password', formData.password)}
                              placeholder="••••••••"
                              className={`w-full bg-zinc-50 border p-3 sm:p-4 pr-10 text-sm font-sans focus:outline-none transition-all duration-300 ${
                                touchedFields.password && fieldErrors.password
                                  ? 'border-red-500 bg-red-50/30'
                                  : formData.password.length >= 8 && !fieldErrors.password
                                  ? 'border-emerald-500 bg-emerald-50/30'
                                  : 'border-zinc-200 focus:border-black'
                              }`}
                              disabled={isUploading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                              disabled={isUploading}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          
                          {/* Modern Dynamic Password Criteria Grid */}
                          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 bg-zinc-50/50 p-3 rounded-lg border border-zinc-100">
                            <div className="flex items-center gap-2 transition-all duration-300">
                              {passwordCriteria.minLength ? (
                                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 scale-110">
                                  <CheckCircle2 className="w-3 h-3" />
                                </div>
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300" />
                              )}
                              <span className={`text-[10px] font-medium tracking-tight ${passwordCriteria.minLength ? 'text-emerald-700' : 'text-zinc-400'}`}>8+ caractères</span>
                            </div>
                            
                            <div className="flex items-center gap-2 transition-all duration-300">
                              {passwordCriteria.hasUpperCase ? (
                                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 scale-110">
                                  <CheckCircle2 className="w-3" />
                                </div>
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300" />
                              )}
                              <span className={`text-[10px] font-medium tracking-tight ${passwordCriteria.hasUpperCase ? 'text-emerald-700' : 'text-zinc-400'}`}>1 Majuscule</span>
                            </div>

                            <div className="flex items-center gap-2 transition-all duration-300">
                              {passwordCriteria.hasNumber ? (
                                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 scale-110">
                                  <CheckCircle2 className="w-3 h-3" />
                                </div>
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300" />
                              )}
                              <span className={`text-[10px] font-medium tracking-tight ${passwordCriteria.hasNumber ? 'text-emerald-700' : 'text-zinc-400'}`}>1 Chiffre</span>
                            </div>

                            <div className="flex items-center gap-2 transition-all duration-300">
                              {passwordCriteria.hasSpecialChar ? (
                                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 scale-110">
                                  <CheckCircle2 className="w-3 h-3" />
                                </div>
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300" />
                              )}
                              <span className={`text-[10px] font-medium tracking-tight ${passwordCriteria.hasSpecialChar ? 'text-emerald-700' : 'text-zinc-400'}`}>1 Spécial (!@#)</span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-zinc-100 pt-4 sm:pt-5">
                          <label className="block text-sm uppercase tracking-widest text-zinc-400 font-bold mb-2">Répétez le mot de passe</label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              required
                              value={formData.confirmPassword}
                              onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })}
                              onBlur={() => handleFieldBlur('confirmPassword', formData.confirmPassword)}
                              placeholder="••••••••"
                              className={`w-full bg-zinc-50 border p-3 sm:p-4 pr-10 text-sm font-sans focus:outline-none transition-all duration-300 ${
                                touchedFields.confirmPassword && formData.confirmPassword !== formData.password
                                  ? 'border-red-500 bg-red-50/30'
                                  : formData.confirmPassword && formData.confirmPassword === formData.password && !fieldErrors.password
                                  ? 'border-emerald-500 bg-emerald-50/30'
                                  : 'border-zinc-200 focus:border-black'
                              }`}
                              disabled={isUploading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                              disabled={isUploading}
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {touchedFields.confirmPassword && formData.confirmPassword !== formData.password && (
                            <p className="font-mono text-[9px] uppercase text-red-500 mt-2 ml-1 animate-in fade-in slide-in-from-top-1">
                              Les mots de passe ne correspondent pas
                            </p>
                          )}
                          {formData.confirmPassword && formData.confirmPassword === formData.password && !fieldErrors.password && (
                            <p className="font-mono text-[9px] uppercase text-emerald-600 mt-2 ml-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                              <CheckCircle2 className="w-3 h-3" /> Correspondance parfaite
                            </p>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            disabled={isUploading}
                            className="flex-1 py-3 sm:py-4 border border-zinc-200 text-zinc-600 text-xs uppercase tracking-[0.2em] font-bold hover:border-[#050505] hover:text-[#050505] transition-all rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            PRÉCÉDENT
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(3)}
                            disabled={!formData.region || !formData.email || !formData.password || !formData.confirmPassword || !!fieldErrors.password || !!fieldErrors.confirmPassword}
                            className="flex-1 py-3 sm:py-4 bg-[#050505] text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#e5c47f] hover:text-black transition-all flex items-center justify-center gap-2 rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            SUIVANT <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step 3: Media & Security */}
                  <AnimatePresence mode="wait">
                    {currentStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 sm:space-y-6"
                      >
                        <div>
                          <label className="block text-sm uppercase tracking-widest text-zinc-400 font-bold mb-2">Capsule Vidéo (1 Min Max)</label>
                          <div
                            onClick={() => !isUploading && videoInputRef.current?.click()}
                            className={`border-2 border-dashed transition-colors p-6 sm:p-8 text-center cursor-pointer flex flex-col items-center justify-center space-y-2 group ${
                              fieldErrors.video ? 'border-red-500 bg-red-50' : 'border-zinc-200 hover:border-black bg-zinc-50'
                            } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
                          >
                            <input type="file" ref={videoInputRef} onChange={handleVideoChange} accept="video/*" className="hidden" disabled={isUploading} />
                            {videoPreview ? (
                              <div className="w-full space-y-3">
                                <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold uppercase tracking-wider">
                                  <Film className="w-4 h-4" /> {videoPreview.name}
                                </div>
                                <video
                                  src={URL.createObjectURL(videoPreview)}
                                  controls
                                  className="w-full max-h-48 object-cover rounded-lg"
                                />
                              </div>
                            ) : (
                              <>
                                <Upload className="w-5 h-5 text-zinc-400 group-hover:text-black transition-colors" />
                                <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Sélectionner le fichier</span>
                                <span className="text-xs text-zinc-400 font-body">MP4 ou MOV (Max 50 Mo)</span>
                              </>
                            )}
                          </div>
                          {fieldErrors.video && (
                            <p className="font-mono text-[9px] uppercase text-red-500 mt-1">{fieldErrors.video}</p>
                          )}
                          {isUploading && (
                            <div className="w-full bg-zinc-200 h-[2px] mt-2 rounded-none overflow-hidden">
                              <div 
                                className="bg-black h-full transition-all duration-300" 
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          )}
                        </div>

                        <div className="border-t border-zinc-100 pt-4 sm:pt-5">
                          <label className="block text-sm uppercase tracking-widest text-zinc-400 font-bold mb-2">Image de couverture (Photo de profil)</label>
                          <div
                            onClick={() => !isUploading && coverImageInputRef.current?.click()}
                            className={`border-2 border-dashed transition-colors p-6 sm:p-8 text-center cursor-pointer flex flex-col items-center justify-center space-y-2 group ${
                              fieldErrors.coverImage ? 'border-red-500 bg-red-50' : 'border-zinc-200 hover:border-black bg-zinc-50'
                            } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
                          >
                            <input type="file" ref={coverImageInputRef} onChange={handleCoverImageChange} accept="image/*" className="hidden" disabled={isUploading} />
                            {coverImagePreview ? (
                              <div className="w-full space-y-3">
                                <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold uppercase tracking-wider">
                                  <CheckCircle2 className="w-4 h-4" /> {coverImagePreview.name}
                                </div>
                                <img
                                  src={URL.createObjectURL(coverImagePreview)}
                                  alt="Preview"
                                  className="w-full max-h-48 object-cover rounded-lg"
                                />
                              </div>
                            ) : (
                              <>
                                <Upload className="w-5 h-5 text-zinc-400 group-hover:text-black transition-colors" />
                                <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Sélectionner l'image</span>
                                <span className="text-xs text-zinc-400 font-body">JPG ou PNG (Max 5 Mo)</span>
                              </>
                            )}
                          </div>
                          {fieldErrors.coverImage && (
                            <p className="font-mono text-[9px] uppercase text-red-500 mt-1">{fieldErrors.coverImage}</p>
                          )}
                        </div>

                        <div className="border-t border-zinc-100 pt-4 sm:pt-5">
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Courte biographie artistique (Optionnel)</label>
                          <textarea
                            value={formData.bio}
                            onChange={(event) => setFormData({ ...formData, bio: event.target.value.slice(0, 150) })}
                            placeholder="Décrivez votre parcours artistique en quelques mots..."
                            maxLength={150}
                            rows={3}
                            className="w-full bg-zinc-50 border border-zinc-200 p-3 sm:p-4 text-sm font-body tracking-wide focus:outline-none focus:border-black resize-none rounded-none"
                            disabled={isUploading}
                          />
                          <p className="text-[9px] text-zinc-400 mt-1 text-right">{formData.bio.length}/150 caractères</p>
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            disabled={isUploading}
                            className="flex-1 py-3 sm:py-4 border border-zinc-200 text-zinc-600 text-xs uppercase tracking-[0.2em] font-bold hover:border-[#050505] hover:text-[#050505] transition-all rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            PRÉCÉDENT
                          </button>
                          <button
                            type="submit"
                            disabled={isUploading}
                            className="flex-1 py-3 sm:py-4 bg-[#050509] text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#e5c47f] hover:text-black transition-colors flex items-center justify-center gap-2 sm:gap-3 rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> TRANSMISSION... {uploadProgress}%
                              </>
                            ) : (
                              <>VALIDER <ArrowRight className="w-3.5 h-3.5" /></>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              )}

              {viewState === 'login' && (
                <form action={signInFormAction} className="space-y-4 sm:space-y-5 animate-fadeIn py-4">
                  {signInState?.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {signInState.error}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Adresse E-mail</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="VOTRE@EMAIL.COM"
                      className="w-full bg-zinc-50 border border-zinc-200 p-3 sm:p-4 text-sm font-sans focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm uppercase tracking-widest text-zinc-400 font-bold">Mot de passe</label>
                      <button 
                        type="button"
                        onClick={() => window.open('mailto:kenkenbabatounde@gmail.com?subject=Identifiants oubliés - Top Talent Bénin', '_blank')}
                        className="text-[10px] text-[#e5c47f] hover:underline uppercase tracking-wider font-bold"
                      >
                        Identifiants oubliés ?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-zinc-50 border border-zinc-200 p-3 sm:p-4 pr-10 text-sm font-sans focus:outline-none focus:border-black"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 sm:py-4 bg-[#050505] text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#e5c47f] hover:text-black transition-all flex items-center justify-center gap-2 rounded shadow-sm"
                  >
                    <Lock className="w-3 h-3" /> ACCÉDER À MON ESPACE
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Image Cropper Modal */}
        {showCropper && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider">Recadrer l'image</h3>
                <button
                  onClick={handleCancelCrop}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 bg-zinc-900 relative min-h-[400px]">
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
                    className="w-full"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelCrop}
                    className="flex-1 py-3 border border-zinc-200 text-zinc-600 text-xs uppercase tracking-[0.2em] font-bold hover:border-[#050505] hover:text-[#050505] transition-all rounded-none"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmCrop}
                    className="flex-1 py-3 bg-[#050505] text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#e5c47f] transition-all rounded-none"
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
