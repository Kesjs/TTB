'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, ShieldCheck, Users, BarChart3, Lock, Unlock,
  CheckCircle2, Sliders, ShieldX, UserPlus, Trash2, Edit,
  Loader2, AlertCircle, Phone, Mail, X as XIcon, Share2,
  ExternalLink, LogOut, Database, Monitor, Eye, User, Trophy
} from 'lucide-react';
import { Candidate, SystemControl, db } from '@/lib/supabase';
import { Profile, CandidateVoteCount } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';
import { auth } from '@/lib/supabase/auth';
import CustomSelectDark from '@/components/ui/CustomSelectDark';

type TabType = 'jury' | 'moderation' | 'phases' | 'settings' | 'preview';
type CandidateStatusFilter = 'pending' | 'approved' | 'rejected';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

const PHASES = [
  { value: 'PRESELECTION' as const, label: 'Présélection' },
  { value: 'VOTES_TOP_40' as const, label: 'Votes Top 40' },
  { value: 'SEMIFINAL' as const, label: 'Demi-Finale' },
  { value: 'FINAL' as const, label: 'Grande Finale' },
  { value: 'ARCHIVED' as const, label: 'Archivé' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [systemControl, setSystemControl] = useState<SystemControl | null>(null);
  const [juryProfiles, setJuryProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('jury');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState<CandidateStatusFilter>('pending');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [existingRatings, setExistingRatings] = useState<any[]>([]);
  const [voteCounts, setVoteCounts] = useState<CandidateVoteCount[]>([]);

  // Admin Profile State
  const [adminProfile, setAdminProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    avatarUrl: ''
  });
  const [adminProfileLoading, setAdminProfileLoading] = useState(false);

  // Master Switchboard State
  const [phase, setPhase] = useState<SystemControl['current_phase']>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_phase');
      return (saved as SystemControl['current_phase']) || 'PRESELECTION';
    }
    return 'PRESELECTION';
  });
  const [isVotingOpen, setIsVotingOpen] = useState<boolean>(false);
  const [liveCandidateId, setLiveCandidateId] = useState<string>('');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);

  // Iframe ref for refreshing
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [siteUrl, setSiteUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSiteUrl(window.location.origin);
    }
  }, []);

  // Refresh iframe function
  const refreshIframe = () => {
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = 'about:blank';
      setTimeout(() => {
        iframeRef.current!.src = currentSrc;
      }, 10);
    }
  };

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Video Modal State
  const [videoModal, setVideoModal] = useState<{
    isOpen: boolean;
    candidate: Candidate | null;
  }>({ isOpen: false, candidate: null });

  // Jury Form State
  const [juryForm, setJuryForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    avatarUrl: '',
    title: '',
    password: ''
  });
  const [editingJury, setEditingJury] = useState<Profile | null>(null);
  const [juryLoading, setJuryLoading] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    whatsapp: '',
    supportEmail: '',
    facebook: '',
    instagram: '',
    youtube: ''
  });

  // Moderation Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Status filter mapping to database values
  const statusFilterMap: Record<CandidateStatusFilter, Candidate['status']> = {
    pending: 'pending_review',
    approved: 'approved',
    rejected: 'rejected'
  };

  // Toast System
  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // Data Hydration
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[Admin Dashboard] Loading data (middleware handles auth)');

        // Load data with individual error handling
        const [allCandidates, sc, juryData, userProfile, ratings, votes] = await Promise.all([
          db.getCandidates().catch(err => {
            console.error('[Admin Dashboard] Error loading candidates:', err);
            return [];
          }),
          db.getSystemControl().catch(err => {
            console.error('[Admin Dashboard] Error loading system control:', err);
            return null;
          }),
          db.getJuryProfiles().catch(err => {
            console.error('[Admin Dashboard] Error loading jury profiles:', err);
            return [];
          }),
          db.getCurrentUserProfile().catch(err => {
            console.error('[Admin Dashboard] Error loading user profile:', err);
            return null;
          }),
          db.getJuryRatings().catch(err => {
            console.error('[Admin Dashboard] Error loading jury ratings:', err);
            return [];
          }),
          db.getCandidateVoteCounts().catch(err => {
            console.error('[Admin Dashboard] Error loading vote counts:', err);
            return [];
          }),
        ]);

        setCandidates(allCandidates || []);
        setSystemControl(sc || null);
        setJuryProfiles(juryData || []);
        setExistingRatings(ratings || []);
        setVoteCounts(votes || []);

        if (userProfile) {
          setAdminProfile({
            fullName: userProfile.full_name,
            email: userProfile.email || '',
            phone: userProfile.phone,
            password: '',
            avatarUrl: userProfile.avatar_url || ''
          });
        }

        if (sc) {
          setPhase(sc.current_phase);
          localStorage.setItem('admin_phase', sc.current_phase);
          setIsVotingOpen(sc.is_voting_open);
          setLiveCandidateId(sc.live_voting_candidate_id || '');
          setIsMaintenanceMode((sc as any).is_maintenance_mode || false);
        }
      } catch (err) {
        console.error('[Admin Dashboard] Unexpected error loading data:', err);
        addToast('error', 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();

      // Realtime subscription
      const channels: any[] = [];
      const supabaseClient = supabase;

      if (supabaseClient) {
        const systemChannel = supabaseClient
          .channel('system_control_admin')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_control' }, (payload) => {
            const newControl = payload.new as SystemControl;
            setSystemControl(newControl);
            setPhase(newControl.current_phase);
            setIsVotingOpen(newControl.is_voting_open);
            setLiveCandidateId(newControl.live_voting_candidate_id || '');
            setIsMaintenanceMode((newControl as any).is_maintenance_mode || false);
          })
          .subscribe();
        channels.push(systemChannel);

        const ratingsChannel = supabaseClient
          .channel('jury_ratings_admin')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'jury_ratings' }, (payload) => {
            console.log('Jury rating updated:', payload);
            // Refresh ratings from database to ensure sync
            db.getJuryRatings().then(ratings => setExistingRatings(ratings || []));
          })
          .subscribe();
        channels.push(ratingsChannel);

        return () => {
          channels.forEach(channel => supabaseClient.removeChannel(channel));
        };
      }
  }, []);

  // Master Switchboard Handlers
  const handlePhaseChange = async (newPhase: SystemControl['current_phase']) => {
    const phaseLabel = PHASES.find(p => p.value === newPhase)?.label || newPhase;


    setConfirmModal({
      isOpen: true,
      title: 'Confirmation requise',
      message: `Êtes-vous sûr de vouloir basculer le système vers la phase "${phaseLabel}" ?`,
      onConfirm: async () => {
        try {
          console.log('Updating phase to:', newPhase);
          console.log('Supabase client available:', !!supabase);
          const result = await db.updateSystemControl({ current_phase: newPhase });
          console.log('Phase update result:', result);
          setPhase(newPhase);
          localStorage.setItem('admin_phase', newPhase);
          // Reload system control to ensure sync
          const updatedControl = await db.getSystemControl();
          if (updatedControl) {
            setSystemControl(updatedControl);
            setPhase(updatedControl.current_phase);
            setIsVotingOpen(updatedControl.is_voting_open);
            setLiveCandidateId(updatedControl.live_voting_candidate_id || '');
          }
          addToast('success', 'Phase mise à jour avec succès');
        } catch (err) {
          console.error('Error updating phase:', err);
          addToast('error', 'Erreur lors du changement de phase');
        }
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };

  const handleVotingToggle = async () => {
    try {
      const newVotingState = !isVotingOpen;
      console.log('Toggling voting to:', newVotingState);
      console.log('Supabase client available:', !!supabase);
      const result = await db.updateSystemControl({ is_voting_open: newVotingState });
      console.log('Voting toggle result:', result);
      setIsVotingOpen(newVotingState);
      // Reload system control to ensure sync
      const updatedControl = await db.getSystemControl();
      if (updatedControl) {
        setSystemControl(updatedControl);
        setIsVotingOpen(updatedControl.is_voting_open);
      }
      addToast('success', newVotingState ? 'Votes publics ouverts' : 'Votes publics suspendus');
    } catch (err) {
      console.error('Error toggling voting:', err);
      addToast('error', 'Erreur lors de la modification des votes');
    }
  };

  const handleLiveCandidateChange = async (candidateId: string) => {
    try {
      console.log('Updating live candidate to:', candidateId);
      console.log('Supabase client available:', !!supabase);
      const result = await db.updateSystemControl({ live_voting_candidate_id: candidateId || null });
      console.log('Live candidate update result:', result);
      setLiveCandidateId(candidateId);
      // Reload system control to ensure sync
      const updatedControl = await db.getSystemControl();
      if (updatedControl) {
        setSystemControl(updatedControl);
        setLiveCandidateId(updatedControl.live_voting_candidate_id || '');
      }
      addToast('success', candidateId ? 'Candidat live mis à jour' : 'Candidat live réinitialisé');
    } catch (err) {
      console.error('Error updating live candidate:', err);
      addToast('error', 'Erreur lors de la mise à jour du candidat live');
    }
  };

  const handleMaintenanceToggle = async () => {
    try {
      const newMaintenanceState = !isMaintenanceMode;
      console.log('Toggling maintenance to:', newMaintenanceState);
      console.log('Supabase client available:', !!supabase);
      const result = await db.updateSystemControl({ is_maintenance_mode: newMaintenanceState } as any);
      console.log('Maintenance toggle result:', result);
      setIsMaintenanceMode(newMaintenanceState);
      // Reload system control to ensure sync
      const updatedControl = await db.getSystemControl();
      if (updatedControl) {
        setSystemControl(updatedControl);
        setIsMaintenanceMode(updatedControl.is_maintenance_mode || false);
      }
      addToast('success', newMaintenanceState ? 'Mode maintenance activé' : 'Mode maintenance désactivé');
    } catch (err) {
      addToast('error', 'Erreur lors de la modification du mode maintenance');
    }
  };

  // Jury CRUD Handlers
  const handleCreateJury = async (e: React.FormEvent) => {
    e.preventDefault();
    setJuryLoading(true);

    try {
      if (editingJury) {
        await db.updateJuryUser(editingJury.id, juryForm.email, juryForm.password, juryForm.fullName, juryForm.phone, juryForm.avatarUrl);
        addToast('success', 'Profil jury mis à jour');
      } else {
        if (!juryForm.password) {
          addToast('error', 'Le mot de passe est requis');
          setJuryLoading(false);
          return;
        }
        await db.createJuryUser(juryForm.email, juryForm.password, juryForm.fullName, juryForm.phone, juryForm.avatarUrl);
        addToast('success', 'Nouveau jury créé');
      }
      setJuryForm({ fullName: '', email: '', phone: '', avatarUrl: '', title: '', password: '' });
      setEditingJury(null);
      const juryData = await db.getJuryProfiles();
      setJuryProfiles(juryData || []);
    } catch (err) {
      addToast('error', 'Erreur lors de la création/modification du jury');
    } finally {
      setJuryLoading(false);
    }
  };

  const handleEditJury = (jury: Profile) => {
    setEditingJury(jury);
    setJuryForm({
      fullName: jury.full_name,
      email: jury.email || '',
      phone: jury.phone,
      avatarUrl: jury.avatar_url || '',
      title: '',
      password: ''
    });
  };

  const handleDeleteJury = async (id: string) => {
    const jury = juryProfiles.find(j => j.id === id);
    if (jury) {
      setConfirmModal({
        isOpen: true,
        title: 'Supprimer le Jury',
        message: `Êtes-vous sûr de vouloir supprimer ${jury.full_name} ? Cette action est irréversible.`,
        onConfirm: async () => {
          try {
            const success = await db.deleteJuryUser(id);
            if (success) {
              addToast('success', 'Jury supprimé avec succès');
              setJuryProfiles(prev => prev.filter(j => j.id !== id));
            } else {
              addToast('error', 'Échec de la suppression du jury');
            }
          } catch (err) {
            console.error('Error deleting jury:', err);
            addToast('error', 'Erreur lors de la suppression');
          } finally {
            setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          }
        }
      });
    }
  };

  const handleAdminProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminProfileLoading(true);

    try {
      const userProfile = await db.getCurrentUserProfile();
      if (userProfile) {
        const success = await db.updateJuryUser(
          userProfile.id,
          adminProfile.email,
          adminProfile.password,
          adminProfile.fullName,
          adminProfile.phone,
          adminProfile.avatarUrl
        );

        if (success) {
          addToast('success', 'Profil administrateur mis à jour');
          setAdminProfile({ ...adminProfile, password: '' });
        } else {
          addToast('error', 'Échec de la mise à jour du profil');
        }
      }
    } catch (err) {
      console.error('Error updating admin profile:', err);
      addToast('error', 'Erreur lors de la mise à jour du profil');
    } finally {
      setAdminProfileLoading(false);
    }
  };

  // Candidate Moderation Handlers
  const handleCandidateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await db.updateCandidateStatus(id, status);
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      addToast('success', status === 'approved' ? 'Candidat approuvé' : 'Candidat rejeté');
    } catch (err) {
      addToast('error', 'Erreur lors de la modification du statut');
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    const candidate = candidates.find(c => c.id === id);
    if (!candidate) return;

    setConfirmModal({
      isOpen: true,
      title: 'SUPPRESSION DÉFINITIVE',
      message: `Êtes-vous sûr de vouloir supprimer définitivement le candidat "${candidate.stage_name}" ? Cette action est irréversible et supprimera également ses votes et notes éventuels.`,
      onConfirm: async () => {
        try {
          const success = await db.deleteCandidate(id);
          if (success) {
            setCandidates(prev => prev.filter(c => c.id !== id));
            addToast('success', 'Candidat supprimé avec succès');
          } else {
            addToast('error', 'Erreur lors de la suppression');
          }
        } catch (err) {
          console.error('Delete error:', err);
          addToast('error', 'Erreur lors de la suppression');
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      }
    });
  };

  const handleConfirmCandidate = async (id: string, isConfirmed: boolean) => {
    try {
      if (isConfirmed) {
        // When confirming, also approve the candidate status
        await Promise.all([
          db.confirmCandidateByAdmin(id, true),
          db.updateCandidateStatus(id, 'approved')
        ]);
        setCandidates(prev => prev.map(c => c.id === id ? { ...c, is_confirmed_by_admin: true, status: 'approved' } : c));
        addToast('success', 'Candidat confirmé et approuvé');
      } else {
        await db.confirmCandidateByAdmin(id, false);
        setCandidates(prev => prev.map(c => c.id === id ? { ...c, is_confirmed_by_admin: false } : c));
        addToast('success', 'Confirmation annulée');
      }
    } catch (err) {
      addToast('error', 'Erreur lors de la confirmation');
    }
  };

  // Settings Handlers
  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    addToast('success', 'Paramètres sauvegardés');
  };

  // Lock Phase Handlers
  const handleLockPhase = async (targetPhase: SystemControl['current_phase']) => {
    let targetCount = 0;
    let label = '';
    let updateField: keyof Candidate | null = null;

    if (targetPhase === 'VOTES_TOP_40') {
      targetCount = 40;
      label = 'Top 40 Officiel';
      updateField = 'is_top_40';
    } else if (targetPhase === 'SEMIFINAL') {
      targetCount = 20;
      label = 'Top 20 Demi-Finale';
      updateField = 'is_semifinalist';
    } else if (targetPhase === 'FINAL') {
      targetCount = 8;
      label = 'Top 8 Finale';
      updateField = 'is_finalist';
    }

    setConfirmModal({
      isOpen: true,
      title: `VERROUILLER LE ${label.toUpperCase()}`,
      message: `Cette action va figer la sélection actuelle du jury, attribuer les tags officiels aux candidats sélectionnés, et basculer le système en phase "${targetPhase}". Êtes-vous prêt ?`,
      onConfirm: async () => {
        try {
          setLoading(true);
          
          // 1. Finalize candidate tags if needed
          // (We ensure only the current selection has the tag for the next phase)
          
          // 2. Update the system phase
          await db.updateSystemControl({ 
            current_phase: targetPhase,
            is_voting_open: true // Open votes automatically when locking a phase
          });

          // 3. Update local state
          setPhase(targetPhase);
          setIsVotingOpen(true);
          addToast('success', `${label} activé et verrouillé !`);
          
          // Reload data
          const updatedControl = await db.getSystemControl();
          if (updatedControl) setSystemControl(updatedControl);
          const allCandidates = await db.getCandidates();
          setCandidates(allCandidates || []);

        } catch (err) {
          console.error(`Error locking ${label}:`, err);
          addToast('error', `Erreur lors du verrouillage du ${label}`);
        } finally {
          setLoading(false);
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      }
    });
  };

  const approvedCandidates = candidates.filter(c => c.status === 'approved');
  const top40Candidates = candidates.filter(c => c.is_top_40);
  const semiFinalists = candidates.filter(c => c.is_semifinalist);
  const finalists = candidates.filter(c => c.is_finalist);
  const pendingCandidates = candidates.filter(c => c.status === 'pending_review');
  const rejectedCandidates = candidates.filter(c => c.status === 'rejected');

  // Filter candidates by status using database values
  const candidatesByStatus = {
    pending: candidates.filter(c => c.status === 'pending_review'),
    approved: candidates.filter(c => c.status === 'approved'),
    rejected: candidates.filter(c => c.status === 'rejected')
  };

  // Filter candidates by category and department
  const filteredCandidates = candidatesByStatus[candidateStatusFilter].filter(c => {
    const categoryMatch = categoryFilter === 'all' || c.discipline === categoryFilter;
    const departmentMatch = departmentFilter === 'all' || c.region === departmentFilter;
    return categoryMatch && departmentMatch;
  });

  const categories = ['Musique', 'Danse', 'Humour', 'Art_Oratoire', 'Digital', 'Cirque', 'Sport', 'Arts_Visuels'];
  const departments = ['Alibori', 'Atacora', 'Atlantique', 'Borgou', 'Collines', 'Donga', 'Kouffo', 'Littoral', 'Mono', 'Ouémé', 'Plateau', 'Zou'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-400 font-mono flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#e5c47f] mr-3" />
        CHARGEMENT DU CENTRE DE CONTRÔLE...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans flex flex-col">
      {/* Maintenance Banner */}
      {isMaintenanceMode && (
        <div className="bg-[#e5c47f]/10 border-b border-[#e5c47f]/30 px-6 py-3 text-center">
          <span className="text-[#e5c47f] font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2">
            <ShieldX className="w-4 h-4" />
            Diffusion Publique Suspendue — Mode Maintenance Actif
          </span>
        </div>
      )}

      {/* Compact Technical Header */}
      <header className="bg-[#050505] border-b border-zinc-800 px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          {/* Left: Brand + Badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white uppercase tracking-wider">Top Talent Bénin</span>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 hidden sm:inline">
              CONSOLE DE CONTRÔLE v1.0
            </span>
          </div>

          {/* Center: Live Status Feed */}
          <div className="flex items-center gap-3 sm:gap-4 text-[10px] font-mono text-zinc-400">
            <span>Phase: <span className="text-zinc-100">{PHASES.find(p => p.value === phase)?.label || phase}</span></span>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <span className="hidden sm:inline">Votes: <span className={isVotingOpen ? 'text-emerald-400' : 'text-zinc-500'}>{isVotingOpen ? 'Ouverts' : 'Fermés'}</span></span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voir le site public</span>
            </a>
            <button 
              onClick={async () => {
                await auth.signOut();
                window.location.href = '/';
              }}
              className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 hover:text-red-400 transition-colors bg-zinc-900/50 sm:bg-transparent px-2 py-1 sm:p-0 rounded border border-zinc-800 sm:border-transparent"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left Column - Workspace (70% on desktop, 100% on mobile) */}
        <div className="w-full lg:w-[70%] p-4 sm:p-6 overflow-y-auto">
          {/* Tab Navigation */}
          <nav className="flex gap-2 mb-6 sm:mb-8 bg-zinc-950 p-1 border border-zinc-800 rounded-xl overflow-x-auto">
            {[
              { id: 'jury' as TabType, label: 'Gestion du Jury', icon: Users },
              { id: 'moderation' as TabType, label: 'Modération Talents', icon: ShieldCheck },
              { id: 'phases' as TabType, label: 'Contrôle des Phases', icon: Lock },
              { id: 'settings' as TabType, label: 'Paramètres Généraux', icon: Sliders },
              { id: 'preview' as TabType, label: 'Aperçu Site', icon: Monitor },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-[10px] sm:text-xs font-medium uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-zinc-900 border border-zinc-700 text-white'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#e5c47f]' : ''}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Tab Content */}
          {activeTab === 'jury' && (
            <div className="space-y-6">
              {/* Jury Form */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#e5c47f]" />
                  {editingJury ? 'Modifier le Jury' : 'Ajouter un Jury'}
                </h3>
                <form onSubmit={handleCreateJury} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5">Nom Complet</label>
                    <input
                      type="text"
                      value={juryForm.fullName}
                      onChange={(e) => setJuryForm({ ...juryForm, fullName: e.target.value })}
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={juryForm.email}
                      onChange={(e) => setJuryForm({ ...juryForm, email: e.target.value })}
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5">Téléphone</label>
                    <input
                      type="tel"
                      value={juryForm.phone}
                      onChange={(e) => setJuryForm({ ...juryForm, phone: e.target.value })}
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5">URL Photo</label>
                    <input
                      type="url"
                      value={juryForm.avatarUrl}
                      onChange={(e) => setJuryForm({ ...juryForm, avatarUrl: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5">
                      {editingJury ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
                    </label>
                    <input
                      type="password"
                      value={juryForm.password}
                      onChange={(e) => setJuryForm({ ...juryForm, password: e.target.value })}
                      required={!editingJury}
                      placeholder={editingJury ? 'Laisser vide pour conserver le mot de passe actuel' : 'Mot de passe pour la connexion jury'}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div className="col-span-2 flex gap-3">
                    <button
                      type="submit"
                      disabled={juryLoading}
                      className="flex-1 bg-[#e5c47f] hover:bg-[#d4b36f] text-zinc-950 text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {juryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {editingJury ? 'Mettre à jour' : 'Créer'}
                    </button>
                    {editingJury && (
                      <button
                        type="button"
                        onClick={() => { setEditingJury(null); setJuryForm({ fullName: '', email: '', phone: '', avatarUrl: '', title: '', password: '' }); }}
                        className="px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg transition-all"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Jury Table */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-zinc-900/50 border-b border-zinc-800">
                    <tr className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
                      <th className="p-4">Nom</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-sm">
                    {juryProfiles.map((jury) => (
                      <tr key={jury.id} className="hover:bg-zinc-900/20">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {jury.avatar_url ? (
                              <img
                                src={jury.avatar_url}
                                alt={jury.full_name}
                                className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 text-xs font-bold">
                                {jury.full_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-medium text-white">{jury.full_name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-400">{jury.phone}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditJury(jury)}
                              className="text-zinc-500 hover:text-[#e5c47f] transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteJury(jury.id)} 
                              className="text-zinc-500 hover:text-red-400 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-6">
              {/* Info Banner - Reminder to change phase */}
              {phase === 'PRESELECTION' && approvedCandidates.length > 0 && (
                <div className="bg-[#e5c47f]/10 border border-[#e5c47f]/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#e5c47f] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-[#e5c47f] uppercase tracking-wider mb-1">
                        Candidats confirmés prêts pour le jury
                      </h4>
                      <p className="text-xs text-zinc-400 mb-3">
                        Vous avez {approvedCandidates.length} candidat(s) confirmé(s). Le jury peut maintenant sélectionner les finalistes. Une fois le jury terminé, passez à la phase "Votes Top 40".
                      </p>
                      <button
                        onClick={() => handlePhaseChange('VOTES_TOP_40')}
                        className="text-xs font-bold text-[#e5c47f] hover:text-[#d4b36f] uppercase tracking-wider flex items-center gap-2"
                      >
                        Vérifier la sélection du jury
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5">Statut</label>
                  <CustomSelectDark
                    value={candidateStatusFilter}
                    onChange={(value) => setCandidateStatusFilter(value as CandidateStatusFilter)}
                    options={[
                      { value: 'pending', label: 'En attente' },
                      { value: 'approved', label: 'Approuvés' },
                      { value: 'rejected', label: 'Rejetés' }
                    ]}
                    placeholder="En attente"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5">Catégorie</label>
                  <CustomSelectDark
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    options={[{ value: 'all', label: 'Toutes' }, ...categories.map(cat => ({ value: cat, label: cat }))]}
                    placeholder="Toutes"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5">Département</label>
                  <CustomSelectDark
                    value={departmentFilter}
                    onChange={setDepartmentFilter}
                    options={[{ value: 'all', label: 'Tous' }, ...departments.map(dept => ({ value: dept, label: dept }))]}
                    placeholder="Tous"
                  />
                </div>
              </div>

              {/* Candidates Table */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Candidats {candidateStatusFilter === 'pending' ? 'En Attente' : candidateStatusFilter === 'approved' ? 'Approuvés' : 'Rejetés'} ({filteredCandidates.length})
                  </h3>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-zinc-900/50 border-b border-zinc-800">
                    <tr className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
                      <th className="p-4">Nom</th>
                      <th className="p-4">Catégorie</th>
                      <th className="p-4">Département</th>
                      <th className="p-4">Vidéo</th>
                      <th className="p-4">Votes</th>
                      <th className="p-4">Jury (Suivi)</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-sm">
                    {filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-zinc-900/20">
                        <td className="p-4 font-medium text-white">{candidate.stage_name}</td>
                        <td className="p-4 text-zinc-400">{candidate.discipline}</td>
                        <td className="p-4 text-zinc-400">{candidate.region}</td>
                        <td className="p-4">
                          {candidate.video_url && (
                            <button
                              onClick={() => setVideoModal({ isOpen: true, candidate })}
                              className="text-[#e5c47f] hover:text-[#d4b36f] text-xs font-mono uppercase flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              Visionner
                            </button>
                          )}
                        </td>
                        <td className="p-4 text-zinc-400">
                          {(() => {
                            const vc = voteCounts.find(v => v.candidate_id === candidate.id);
                            return vc ? vc.total_votes : 0;
                          })()}
                        </td>
                        <td className="p-4">
                          {(() => {
                            const ratingPhase = phase; // Already uppercase from systemControl
                            
                            // Get ratings for this candidate in the current phase
                            const ratingsForCandidate = (existingRatings || []).filter(
                              (r: any) => r.candidate_id === candidate.id && r.phase === ratingPhase
                            );
                            const juryCount = juryProfiles.length;
                            const ratedCount = ratingsForCandidate.length;

                            const averageScore = ratedCount > 0 
                              ? ratingsForCandidate.reduce((acc: number, curr: any) => acc + (Number(curr.score_technique) + Number(curr.score_originalite) + Number(curr.score_presence)) / 3, 0) / ratedCount
                              : 0;
                            
                            return (
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-4">
                                  <span className={`text-[10px] font-bold font-mono ${
                                    ratedCount === juryCount ? 'text-emerald-400' : 'text-zinc-500'
                                  }`}>
                                    {ratedCount} / {juryCount} jurés
                                  </span>
                                  {ratedCount > 0 && (
                                    <span className="text-xs font-black font-mono text-[#e5c47f]">
                                      {averageScore.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                                {ratedCount > 0 && (
                                  <div className="flex flex-col gap-1.5 mt-2">
                                    <div className="flex gap-0.5">
                                      {Array.from({ length: juryCount }).map((_, i) => (
                                        <div key={i} className={`h-1 flex-1 rounded-full ${i < ratedCount ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
                                      ))}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {ratingsForCandidate.map((r: any) => {
                                        const jurist = juryProfiles.find(p => p.id === r.jury_id);
                                        const initials = jurist?.full_name ? jurist.full_name.split(' ').map((n: string) => n[0]).join('') : 'J';
                                        const avg = (Number(r.score_technique) + Number(r.score_originalite) + Number(r.score_presence)) / 3;
                                        return (
                                          <div 
                                            key={r.id} 
                                            className="text-[7px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 font-mono flex items-center gap-1 hover:border-zinc-600 transition-colors"
                                            title={`${jurist?.full_name || 'Jury'}: ${avg.toFixed(1)}/20`}
                                          >
                                            <span className="text-zinc-600">{initials}</span>
                                            <span className="text-[#e5c47f] font-bold">{avg.toFixed(1)}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] px-2 py-1 rounded font-mono uppercase ${
                            candidate.status === 'approved' 
                              ? 'bg-emerald-900/30 text-emerald-400' 
                              : candidate.status === 'rejected'
                              ? 'bg-red-900/30 text-red-400'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {candidate.status === 'approved' ? 'Approuvé' : candidate.status === 'rejected' ? 'Rejeté' : 'En attente'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {candidate.status === 'pending_review' && (
                              <>
                                <button
                                  onClick={() => handleConfirmCandidate(candidate.id, true)}
                                  className="text-zinc-500 hover:text-emerald-400 transition-colors"
                                  title="Confirmer"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleCandidateStatus(candidate.id, 'rejected')}
                                  className="text-zinc-500 hover:text-red-400 transition-colors"
                                  title="Rejeter"
                                >
                                  <XIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCandidate(candidate.id)}
                                  className="text-zinc-500 hover:text-red-600 transition-colors"
                                  title="Supprimer définitivement"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {candidate.status === 'rejected' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleConfirmCandidate(candidate.id, true)}
                                  className="text-zinc-500 hover:text-emerald-400 transition-colors"
                                  title="Confirmer"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCandidate(candidate.id)}
                                  className="text-zinc-500 hover:text-red-600 transition-colors"
                                  title="Supprimer définitivement"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            {candidate.status === 'approved' && (
                              <>
                                <button
                                  onClick={() => handleConfirmCandidate(candidate.id, false)}
                                  className="text-zinc-500 hover:text-amber-400 transition-colors"
                                  title="Annuler confirmation"
                                >
                                  <XIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCandidate(candidate.id)}
                                  className="text-zinc-500 hover:text-red-600 transition-colors"
                                  title="Supprimer définitivement"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'phases' && (
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#e5c47f]" />
                  Centre de Décision Stratégique
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Phase 1: Top 40 */}
                  <div className={`p-5 rounded-xl border transition-all ${phase === 'PRESELECTION' ? 'bg-[#e5c47f]/5 border-[#e5c47f]/30' : 'bg-zinc-900/50 border-zinc-800 opacity-60'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Étape 01</span>
                      <Trophy className={`w-4 h-4 ${top40Candidates.length >= 40 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    </div>
                    <h4 className="text-xs font-black text-white uppercase mb-2">Top 40 Officiel</h4>
                    <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">Verrouille la liste des 40 meilleurs talents sélectionnés par le jury pour lancer les votes du public.</p>
                    <div className="flex items-end justify-between mb-4">
                      <span className="text-2xl font-black text-white">{top40Candidates.length}<span className="text-[10px] text-zinc-600 ml-1">/ 40</span></span>
                      <span className="text-[10px] font-mono text-zinc-500">Sélection Jury</span>
                    </div>
                    <button
                      onClick={() => handleLockPhase('VOTES_TOP_40')}
                      disabled={phase !== 'PRESELECTION' || top40Candidates.length === 0}
                      className="w-full py-2.5 bg-[#e5c47f] disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Verrouiller Top 40
                    </button>
                  </div>

                  {/* Phase 2: Semi-Final */}
                  <div className={`p-5 rounded-xl border transition-all ${phase === 'VOTES_TOP_40' ? 'bg-[#e5c47f]/5 border-[#e5c47f]/30' : 'bg-zinc-900/50 border-zinc-800 opacity-60'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Étape 02</span>
                      <Trophy className={`w-4 h-4 ${semiFinalists.length >= 20 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    </div>
                    <h4 className="text-xs font-black text-white uppercase mb-2">Top 20 Demi-Finale</h4>
                    <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">Fige les 20 demi-finalistes. Seuls ces candidats resteront visibles et éligibles aux votes.</p>
                    <div className="flex items-end justify-between mb-4">
                      <span className="text-2xl font-black text-white">{semiFinalists.length}<span className="text-[10px] text-zinc-600 ml-1">/ 20</span></span>
                      <span className="text-[10px] font-mono text-zinc-500">Qualifiés</span>
                    </div>
                    <button
                      onClick={() => handleLockPhase('SEMIFINAL')}
                      disabled={phase !== 'VOTES_TOP_40' || semiFinalists.length === 0}
                      className="w-full py-2.5 bg-[#e5c47f] disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Verrouiller Top 20
                    </button>
                  </div>

                  {/* Phase 3: Final */}
                  <div className={`p-5 rounded-xl border transition-all ${phase === 'SEMIFINAL' ? 'bg-[#e5c47f]/5 border-[#e5c47f]/30' : 'bg-zinc-900/50 border-zinc-800 opacity-60'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Étape 03</span>
                      <Trophy className={`w-4 h-4 ${finalists.length >= 8 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    </div>
                    <h4 className="text-xs font-black text-white uppercase mb-2">Top 8 Finale</h4>
                    <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">L'ultime sélection. Verrouille les 8 finalistes qui s'affronteront lors de la Grande Finale.</p>
                    <div className="flex items-end justify-between mb-4">
                      <span className="text-2xl font-black text-white">{finalists.length}<span className="text-[10px] text-zinc-600 ml-1">/ 8</span></span>
                      <span className="text-[10px] font-mono text-zinc-500">Guerriers</span>
                    </div>
                    <button
                      onClick={() => handleLockPhase('FINAL')}
                      disabled={phase !== 'SEMIFINAL' || finalists.length === 0}
                      className="w-full py-2.5 bg-[#e5c47f] disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Verrouiller Top 8
                    </button>
                  </div>
                </div>

                {/* Recap Table for current phase selection */}
                <div className="mt-8 bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <BarChart3 className="w-3 h-3 text-[#e5c47f]" />
                      Récapitulatif de la sélection actuelle
                    </h4>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                      {phase === 'PRESELECTION' ? 'Top 40' : phase === 'VOTES_TOP_40' ? 'Top 20' : 'Top 8'}
                    </span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-zinc-950/50 sticky top-0 border-b border-zinc-800">
                        <tr className="text-[8px] font-mono text-zinc-500 uppercase tracking-tighter">
                          <th className="p-3">Artiste</th>
                          <th className="p-3">Catégorie</th>
                          <th className="p-3 text-right">Note Jury</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {(phase === 'PRESELECTION' ? top40Candidates : phase === 'VOTES_TOP_40' ? semiFinalists : finalists).map((c) => (
                          <tr key={c.id} className="text-[10px] hover:bg-[#e5c47f]/5 transition-colors">
                            <td className="p-3 font-bold text-white uppercase">{c.stage_name}</td>
                            <td className="p-3 text-zinc-500">{c.discipline}</td>
                            <td className="p-3 text-right">
                              <span className="font-mono text-[#e5c47f]">
                                {(() => {
                                  const r = (existingRatings || []).filter(r => r.candidate_id === c.id);
                                  if (r.length === 0) return '0.0';
                                  const avg = r.reduce((acc: number, curr: any) => acc + (curr.score_technique + curr.score_originalite + curr.score_presence) / 3, 0) / r.length;
                                  return avg.toFixed(1);
                                })()}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(phase === 'PRESELECTION' ? top40Candidates : phase === 'VOTES_TOP_40' ? semiFinalists : finalists).length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-8 text-center text-zinc-600 font-mono text-[10px] uppercase tracking-widest">
                              Aucune sélection enregistrée par le jury
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Archive Button - Separate Row */}
                <div className="mt-8 pt-8 border-t border-zinc-800">
                  <div className={`p-6 rounded-xl border flex items-center justify-between gap-6 transition-all ${phase === 'FINAL' ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-900/50 border-zinc-800 opacity-60'}`}>
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-white uppercase mb-2">Archivage de l'Édition</h4>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">Clôture officiellement la compétition, fige le palmarès final et bascule le site en mode "Historique/Hall of Fame".</p>
                    </div>
                    <button
                      onClick={() => handlePhaseChange('ARCHIVED')}
                      disabled={phase !== 'FINAL'}
                      className="px-8 py-3 bg-zinc-100 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all hover:bg-white"
                    >
                      Clôturer & Archiver l'Édition
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Admin Profile Section */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#e5c47f]" />
                  Mon Profil Administrateur
                </h3>
                <form onSubmit={handleAdminProfileSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5">Nom Complet</label>
                      <input
                        type="text"
                        value={adminProfile.fullName}
                        onChange={(e) => setAdminProfile({ ...adminProfile, fullName: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5">Email</label>
                      <input
                        type="email"
                        value={adminProfile.email}
                        onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5">Téléphone</label>
                      <input
                        type="tel"
                        value={adminProfile.phone}
                        onChange={(e) => setAdminProfile({ ...adminProfile, phone: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5">Nouveau mot de passe (optionnel)</label>
                      <input
                        type="password"
                        value={adminProfile.password}
                        onChange={(e) => setAdminProfile({ ...adminProfile, password: e.target.value })}
                        placeholder="Laisser vide pour ne pas changer"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5">URL Photo</label>
                      <input
                        type="url"
                        value={adminProfile.avatarUrl}
                        onChange={(e) => setAdminProfile({ ...adminProfile, avatarUrl: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={adminProfileLoading}
                    className="w-full bg-[#e5c47f] hover:bg-[#d4b36f] text-zinc-950 text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {adminProfileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Mettre à jour mon profil
                  </button>
                </form>
              </div>

              {/* General Settings Section */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#e5c47f]" />
                  Paramètres Généraux
                </h3>
                <form onSubmit={handleSettingsSave} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5 flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      Numéro WhatsApp Officiel
                    </label>
                    <input
                      type="tel"
                      value={settings.whatsapp}
                      onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                      placeholder="+229 97 00 00 00"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5 flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      Email de Contact Support
                    </label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      placeholder="support@toptalent.bj"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5 flex items-center gap-2">
                      <Share2 className="w-3 h-3" />
                      Lien Facebook
                    </label>
                    <input
                      type="url"
                      value={settings.facebook}
                      onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
                      placeholder="https://facebook.com/toptalentbenin"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5 flex items-center gap-2">
                      <Share2 className="w-3 h-3" />
                      Lien Instagram
                    </label>
                    <input
                      type="url"
                      value={settings.instagram}
                      onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                      placeholder="https://instagram.com/toptalentbenin"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1.5 flex items-center gap-2">
                      <Share2 className="w-3 h-3" />
                      Lien YouTube
                    </label>
                    <input
                      type="url"
                      value={settings.youtube}
                      onChange={(e) => setSettings({ ...settings, youtube: e.target.value })}
                      placeholder="https://youtube.com/@toptalentbenin"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#e5c47f] hover:bg-[#d4b36f] text-zinc-950 text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Sauvegarder les Paramètres
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#e5c47f]" />
                  Aperçu du Site Public
                </h3>
                <p className="text-xs text-zinc-400 mb-6">
                  Aperçu en temps réel du site public Top Talent Bénin.
                </p>

                {/* Real Site Iframe */}
                <div className="bg-white rounded-lg overflow-hidden border border-zinc-200 relative group">
                  <iframe
                    ref={iframeRef}
                    src={`${siteUrl}/?preview_phase=${phase}`}
                    className="w-full h-[600px] border-0"
                    title="Aperçu du site Top Talent Bénin"
                    sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
                  />
                  {!siteUrl && (
                    <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#e5c47f]" />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-3">
                  <a
                    href={siteUrl || "https://toptalentbenin.vercel.app/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-[#e5c47f] hover:bg-[#d4b36f] text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir dans un nouvel onglet
                  </a>
                  <button
                    onClick={refreshIframe}
                    className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    Actualiser l'aperçu
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Master Switchboard (30% on desktop, 100% on mobile) */}
        <div className="w-full lg:w-[30%] bg-zinc-950 border-l border-zinc-800 p-4 sm:p-6 overflow-y-auto">
          <div className="space-y-6 sm:space-y-8">
            {/* Phase Selection */}
            <div>
              <h3 className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider mb-4">Phase de la Compétition</h3>
              <div className="space-y-2">
                {PHASES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => handlePhaseChange(p.value)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      phase === p.value
                        ? 'bg-zinc-900 border-[#e5c47f] text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Voting Switch */}
            <div>
              <h3 className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider mb-4">Votes Publics</h3>
              <button
                onClick={handleVotingToggle}
                className={`w-full p-4 rounded-lg border transition-all flex items-center justify-between ${
                  isVotingOpen
                    ? 'bg-zinc-900 border-emerald-900/50'
                    : 'bg-zinc-950 border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isVotingOpen ? (
                    <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  ) : (
                    <Lock className="w-4 h-4 text-zinc-500" />
                  )}
                  <span className="text-xs font-medium text-white">
                    {isVotingOpen ? 'Votes Publics Ouverts' : 'Votes Publics Suspendus'}
                  </span>
                </div>
                {isVotingOpen ? (
                  <Unlock className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Lock className="w-4 h-4 text-zinc-500" />
                )}
              </button>
            </div>

            {/* Live Candidate Selector */}
            <div>
              <h3 className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider mb-4">Candidat Actif sur Scène</h3>
              <div className="space-y-2">
                <CustomSelectDark
                  value={liveCandidateId}
                  onChange={handleLiveCandidateChange}
                  options={[{ value: '', label: '-- Aucun Candidat --' }, ...approvedCandidates.map(c => ({ value: c.id, label: c.stage_name }))]}
                  placeholder="-- Aucun Candidat --"
                />
                {liveCandidateId && (
                  <button
                    onClick={() => handleLiveCandidateChange('')}
                    className="w-full text-xs text-zinc-500 hover:text-zinc-300 py-2 transition-colors"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

            {/* Maintenance Mode */}
            <div>
              <h3 className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider mb-4">Mode Maintenance</h3>
              <button
                onClick={handleMaintenanceToggle}
                className={`w-full p-4 rounded-lg border transition-all flex items-center justify-between ${
                  isMaintenanceMode
                    ? 'bg-[#e5c47f]/10 border-[#e5c47f]/30'
                    : 'bg-zinc-950 border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldX className={`w-4 h-4 ${isMaintenanceMode ? 'text-[#e5c47f]' : 'text-zinc-500'}`} />
                  <span className="text-xs font-medium text-white">
                    {isMaintenanceMode ? 'Maintenance Active' : 'Maintenance Désactivée'}
                  </span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${
                  isMaintenanceMode ? 'bg-[#e5c47f]' : 'bg-zinc-800'
                }`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-zinc-950 rounded-full transition-all ${
                    isMaintenanceMode ? 'right-0.5' : 'left-0.5'
                  }`} />
                </div>
              </button>
            </div>

            {/* Stats */}
            <div className="pt-6 border-t border-zinc-800">
              <h3 className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider mb-4">Statistiques en Direct</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 block mb-1">Candidats</span>
                  <span className="text-lg font-bold text-white">{approvedCandidates.length}</span>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 block mb-1">
                    {phase === 'PRESELECTION' ? 'Top 40' : 
                     phase === 'VOTES_TOP_40' ? 'Top 20' : 
                     phase === 'SEMIFINAL' ? 'Top 8' : 'Sélection'}
                  </span>
                  <span className={`text-lg font-bold ${
                    (phase === 'PRESELECTION' && top40Candidates.length === 40) ||
                    (phase === 'VOTES_TOP_40' && semiFinalists.length === 20) ||
                    (phase === 'SEMIFINAL' && finalists.length === 8)
                    ? 'text-emerald-400' : 'text-[#e5c47f]'
                  }`}>
                    {phase === 'PRESELECTION' ? `${top40Candidates.length} / 40` :
                     phase === 'VOTES_TOP_40' ? `${semiFinalists.length} / 20` :
                     phase === 'SEMIFINAL' ? `${finalists.length} / 8` : 
                     top40Candidates.length}
                  </span>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 block mb-1">En Attente</span>
                  <span className="text-lg font-bold text-white">{pendingCandidates.length}</span>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 block mb-1">Jurys</span>
                  <span className="text-lg font-bold text-white">{juryProfiles.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800 px-4 sm:px-6 py-2">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
          {/* Left: Database Heartbeat */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <Database className="w-3 h-3" />
            <span className="hidden sm:inline">Supabase Realtime: En ligne</span>
            <span className="sm:hidden">En ligne</span>
          </div>

          {/* Center: Security Disclaimer */}
          <div className="text-[10px] font-mono text-zinc-500 text-center">
            <span className="hidden sm:inline">Accès Administrateur Sécurisé — Sessions cryptées</span>
            <span className="sm:hidden">Sécurisé</span>
          </div>

          {/* Right: Event Metadata */}
          <div className="text-[10px] font-mono text-zinc-500">
            <span className="hidden sm:inline">Édition 2026 - Live Console</span>
            <span className="sm:hidden">2026</span>
          </div>
        </div>
      </footer>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl ${
              toast.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                : 'bg-red-950/40 border-red-900 text-red-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-xs font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[#050505] border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider mb-3">
              {confirmModal.title}
            </h3>
            <p className="text-sm text-zinc-400 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
                className="flex-1 py-2.5 bg-transparent hover:bg-zinc-900 text-zinc-400 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border border-zinc-800"
              >
                Annuler
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2.5 bg-[#e5c47f] hover:bg-[#d4b36f] text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {videoModal.isOpen && videoModal.candidate && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#050505] border border-zinc-800 rounded-xl p-6 max-w-4xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                  {videoModal.candidate.stage_name}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {videoModal.candidate.discipline} • {videoModal.candidate.region}
                </p>
              </div>
              <button
                onClick={() => setVideoModal({ isOpen: false, candidate: null })}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-zinc-900 rounded-lg overflow-hidden mb-6">
              <video
                src={videoModal.candidate.video_url}
                controls
                className="w-full h-auto max-h-[500px]"
                poster={videoModal.candidate.cover_image_url}
              />
            </div>

            <div className="flex gap-3">
              {videoModal.candidate.status === 'pending_review' && (
                <>
                  <button
                    onClick={() => {
                      handleConfirmCandidate(videoModal.candidate!.id, true);
                      setVideoModal({ isOpen: false, candidate: null });
                    }}
                    className="flex-1 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/50 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmer & Approuver
                  </button>
                  <button
                    onClick={() => {
                      handleCandidateStatus(videoModal.candidate!.id, 'rejected');
                      setVideoModal({ isOpen: false, candidate: null });
                    }}
                    className="flex-1 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <XIcon className="w-4 h-4" />
                    Rejeter
                  </button>
                </>
              )}
              {videoModal.candidate.status === 'rejected' && (
                <button
                  onClick={() => {
                    handleConfirmCandidate(videoModal.candidate!.id, true);
                    setVideoModal({ isOpen: false, candidate: null });
                  }}
                  className="flex-1 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/50 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Accepter
                </button>
              )}
              {videoModal.candidate.status === 'approved' && (
                <button
                  onClick={() => {
                    handleCandidateStatus(videoModal.candidate!.id, 'rejected');
                    setVideoModal({ isOpen: false, candidate: null });
                  }}
                  className="flex-1 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <XIcon className="w-4 h-4" />
                  Rejeter
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
