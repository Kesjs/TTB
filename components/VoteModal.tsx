'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, CheckCircle2, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Candidate } from '@/lib/supabase';

interface VoteModalProps {
  candidate: Candidate;
  onClose: () => void;
  currentPhase: string;
}

type Step = 'input' | 'waiting' | 'success' | 'error';

export default function VoteModal({ candidate, onClose }: VoteModalProps) {
  const [voteCount, setVoteCount] = useState<number>(1);
  const [phone, setPhone] = useState<string>('');
  const [network, setNetwork] = useState<'MTN' | 'MOOV' | 'CELTIIS'>('MTN');
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<Step>('input');
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Prix fixe par vote : 200 FCFA (selon votre API existante)
  const PRICE_PER_VOTE = 200;
  const totalAmount = voteCount * PRICE_PER_VOTE;

  // Polling pour vérifier le statut de la transaction via Supabase
  const pollTransactionStatus = useCallback(async (transactionRef: string) => {
    const maxAttempts = 60; // 60 secondes max
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        attempts++;
        
        // Vérifier le statut du vote dans Supabase via l'API
        const response = await fetch(`/api/vote/status?transaction_ref=${transactionRef}`);
        const data = await response.json();

        if (data.status === 'success') {
          setStep('success');
          setLoading(false);
        } else if (data.status === 'failed') {
          setStep('error');
          setErrorMessage(data.message || 'Le paiement a échoué');
          setLoading(false);
        } else if (attempts < maxAttempts) {
          // Continuer le polling
          setTimeout(poll, 1000);
        } else {
          // Timeout
          setStep('error');
          setErrorMessage('Délai d\'attente dépassé. Veuillez vérifier votre mobile et réessayer.');
          setLoading(false);
        }
      } catch (error) {
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          setStep('error');
          setErrorMessage('Erreur de connexion. Veuillez réessayer.');
          setLoading(false);
        }
      }
    };

    poll();
  }, []);

  const handlePay = async () => {
    // Validation du numéro de téléphone
    if (phone.length !== 8) {
      setErrorMessage('Veuillez entrer un numéro valide (8 chiffres)');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Appel API existante pour initier le paiement FedaPay
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidate.id,
          phone_payer: phone,
          network,
          vote_count: voteCount,
          phase: 'preselection', // À adapter selon votre logique métier
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTransactionRef(data.transaction_ref);
        setStep('waiting');
        // Démarrer le polling pour vérifier le statut via webhook
        pollTransactionStatus(data.transaction_ref);
      } else {
        setErrorMessage(data.message || 'Erreur lors de l\'initialisation du paiement');
        setLoading(false);
      }
    } catch (error) {
      setErrorMessage('Erreur de connexion au serveur de paiement');
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Empêcher la fermeture si une transaction est en cours
    if (loading || step === 'waiting') {
      return;
    }
    onClose();
  };

  // Animation variants pour les transitions
  const variants = {
    input: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    },
    waiting: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    },
    success: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const }
    },
    error: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Soutenir {candidate.stage_name}
          </h3>
          <button 
            onClick={handleClose}
            disabled={loading || step === 'waiting'}
            className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
              (loading || step === 'waiting') ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {/* Étape 1: Input */}
            {step === 'input' && (
              <motion.div
                key="input"
                variants={variants}
                initial="input"
                animate="input"
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Sélection du réseau mobile */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Réseau mobile
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'MTN' as const, img: '/celtiis.png', name: 'MTN' },
                      { id: 'MOOV' as const, img: '/celtiis.png', name: 'MOOV' },
                      { id: 'CELTIIS' as const, img: '/celtiis.png', name: 'CELTIIS' }
                    ].map((n) => (
                      <button
                        key={n.id}
                        onClick={() => setNetwork(n.id)}
                        className={`p-3 border-2 rounded-xl flex flex-col items-center transition-all ${
                          network === n.id 
                            ? 'border-gray-900 bg-gray-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img 
                          src={n.img} 
                          alt={n.name} 
                          className="h-6 w-auto object-contain mb-2"
                          style={{ maxWidth: '24px' }}
                        />
                        <span className="text-xs font-semibold text-gray-700">{n.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nombre de votes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Nombre de votes
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setVoteCount(Math.max(1, voteCount - 1))}
                      className="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors active:scale-95"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={voteCount}
                      onChange={(e) => setVoteCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 h-12 text-center text-xl font-bold text-gray-900 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-gray-900 focus:outline-none transition-colors"
                      min="1"
                    />
                    <button
                      onClick={() => setVoteCount(voteCount + 1)}
                      className="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Numéro de téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="01 23 45 67"
                      className="w-full h-14 px-4 text-lg text-gray-900 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-gray-900 focus:outline-none transition-colors placeholder-gray-400"
                      maxLength={8}
                    />
                    <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  </div>
                </div>

                {/* Message d'erreur */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                  >
                    {errorMessage}
                  </motion.div>
                )}

                {/* Bouton de paiement */}
                <button
                  onClick={handlePay}
                  disabled={loading || phone.length !== 8}
                  className={`w-full h-14 rounded-xl font-semibold text-white transition-all active:scale-98 ${
                    loading || phone.length !== 8
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gray-900 hover:bg-gray-800 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={20} />
                      <span>Traitement...</span>
                    </div>
                  ) : (
                    `Payer ${totalAmount.toLocaleString()} FCFA`
                  )}
                </button>

                {/* Informations de sécurité */}
                <p className="text-xs text-gray-500 text-center">
                  Paiement sécurisé via {network}. 200 FCFA par vote.
                </p>
              </motion.div>
            )}

            {/* Étape 2: Attente de confirmation */}
            {step === 'waiting' && (
              <motion.div
                key="waiting"
                variants={variants}
                initial={{ opacity: 0, x: 20 }}
                animate="waiting"
                exit={{ opacity: 0, x: -20 }}
                className="text-center py-8"
              >
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-gray-900" size={40} />
                  </div>
                </div>
                
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  Confirmation en cours
                </h4>
                
                <p className="text-gray-600 mb-4">
                  Veuillez confirmer le paiement sur votre mobile.
                </p>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">Montant à payer</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalAmount.toLocaleString()} FCFA
                  </p>
                </div>

                <p className="text-xs text-gray-500">
                  Ne fermez pas cette fenêtre pendant le traitement.
                </p>
              </motion.div>
            )}

            {/* Étape 3: Succès */}
            {step === 'success' && (
              <motion.div
                key="success"
                variants={variants}
                initial={{ opacity: 0, scale: 0.9 }}
                animate="success"
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-8"
              >
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="text-green-600" size={40} />
                  </div>
                </div>
                
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  Paiement réussi !
                </h4>
                
                <p className="text-gray-600 mb-4">
                  Merci pour votre soutien à {candidate.stage_name}.
                </p>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-1">Votes ajoutés</p>
                  <p className="text-2xl font-bold text-gray-900">
                    +{voteCount}
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="w-full h-12 rounded-xl font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                >
                  Fermer
                </button>
              </motion.div>
            )}

            {/* Étape 4: Erreur */}
            {step === 'error' && (
              <motion.div
                key="error"
                variants={variants}
                initial={{ opacity: 0, x: 20 }}
                animate="error"
                exit={{ opacity: 0, x: -20 }}
                className="text-center py-8"
              >
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                    <X className="text-red-600" size={40} />
                  </div>
                </div>
                
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  Échec du paiement
                </h4>
                
                <p className="text-gray-600 mb-6">
                  {errorMessage}
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setStep('input');
                      setErrorMessage('');
                    }}
                    className="w-full h-12 rounded-xl font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                  >
                    Réessayer
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="w-full h-12 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}