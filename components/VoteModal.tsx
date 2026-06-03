'use client';

import React, { useState, useCallback } from 'react';
import { X, Loader2, CheckCircle2, Smartphone, AlertCircle } from 'lucide-react';
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
  const [phone, setPhone] = useState<string>(''); // Format brut pour la logique
  const [displayPhone, setDisplayPhone] = useState<string>(''); // Format visuel pour l'input
  const [network, setNetwork] = useState<'MTN' | 'MOOV' | 'CELTIIS'>('MTN');
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<Step>('input');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const PRICE_PER_VOTE = 200;
  const totalAmount = voteCount * PRICE_PER_VOTE;

  // Gestion du formatage visuel XX XX XX XX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\s/g, '').replace(/\D/g, '').slice(0, 8);
    setPhone(rawValue);
    
    // Application du masque visuel
    let formatted = rawValue;
    if (rawValue.length > 2) formatted = rawValue.slice(0, 2) + ' ' + rawValue.slice(2);
    if (rawValue.length > 4) formatted = formatted.slice(0, 5) + ' ' + rawValue.slice(4);
    if (rawValue.length > 6) formatted = formatted.slice(0, 8) + ' ' + rawValue.slice(6);
    setDisplayPhone(formatted);
  };

  const validatePhoneNumber = (number: string): boolean => {
    if (number.length !== 8) return false;
    const validPrefixes = ['01', '97', '96', '95', '94', '67', '66', '65', '64', '57', '56', '55', '54', '40', '41', '42', '43', '44', '69', '61'];
    return validPrefixes.includes(number.substring(0, 2));
  };

  const pollTransactionStatus = useCallback(async (transactionRef: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async (): Promise<void> => {
      attempts++;
      try {
        const response = await fetch(`/api/vote/status?transaction_ref=${transactionRef}`);
        const data = await response.json();

        if (data.status === 'success') {
          setStep('success');
          setLoading(false);
        } else if (data.status === 'failed') {
          throw new Error('Le paiement a été refusé.');
        } else if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          throw new Error('Délai d\'attente dépassé.');
        }
      } catch (err: any) {
        setStep('error');
        setErrorMessage(err.message || 'Erreur lors de la vérification.');
        setLoading(false);
      }
    };
    poll();
  }, []);

  const handlePay = async () => {
    if (!validatePhoneNumber(phone)) {
      setErrorMessage('Numéro invalide. Vérifiez le format (8 chiffres).');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidate.id,
          phone_payer: phone,
          network,
          vote_count: voteCount,
          phase: 'preselection',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('waiting');
        pollTransactionStatus(data.transaction_ref);
      } else {
        setErrorMessage(data.message || 'Erreur lors de l\'initialisation.');
        setLoading(false);
      }
    } catch (error) {
      setErrorMessage('Erreur de connexion.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Soutenir {candidate.stage_name}</h3>
          <button onClick={onClose} disabled={loading} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            
            {/* ÉTAPE : INPUT */}
            {step === 'input' && (
              <motion.div key="input" exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700">Réseau mobile</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['MTN', 'MOOV', 'CELTIIS'].map((n) => (
                      <button key={n} onClick={() => setNetwork(n as any)} 
                        className={`p-3 border-2 rounded-xl text-xs font-semibold transition-all ${network === n ? 'border-gray-900 bg-gray-50' : 'border-gray-200'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700">Numéro de téléphone</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={displayPhone}
                      onChange={handlePhoneChange}
                      placeholder="01 23 45 67"
                      className="w-full h-14 px-4 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-gray-900 outline-none font-mono text-lg"
                    />
                    <Smartphone className="absolute right-4 top-4 text-gray-400" size={20} />
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 flex items-center gap-2 bg-red-50 text-red-700 text-sm rounded-xl">
                    <AlertCircle size={16} /> {errorMessage}
                  </div>
                )}

                <button
                  onClick={handlePay}
                  disabled={loading || phone.length !== 8}
                  className={`w-full h-14 rounded-xl font-semibold text-white transition-all ${loading || phone.length !== 8 ? 'bg-gray-300' : 'bg-gray-900 hover:bg-black'}`}
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : `Payer ${totalAmount.toLocaleString()} FCFA`}
                </button>
              </motion.div>
            )}

            {/* ÉTAPE : WAITING */}
            {step === 'waiting' && (
              <motion.div key="waiting" className="text-center py-10 space-y-4">
                <Loader2 size={48} className="animate-spin mx-auto text-gray-900" />
                <p className="font-medium">Validation du paiement en cours...</p>
                <p className="text-sm text-gray-500">Veuillez valider la demande sur votre téléphone.</p>
              </motion.div>
            )}

            {/* ÉTAPE : SUCCESS */}
            {step === 'success' && (
              <motion.div key="success" className="text-center py-10 space-y-4">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold">Vote enregistré !</h3>
                <button onClick={onClose} className="mt-4 w-full h-12 bg-gray-900 text-white rounded-xl">Fermer</button>
              </motion.div>
            )}

            {/* ÉTAPE : ERROR */}
            {step === 'error' && (
              <motion.div key="error" className="text-center py-10 space-y-4">
                <AlertCircle size={48} className="mx-auto text-red-500" />
                <h3 className="text-lg font-bold text-red-600">Erreur de transaction</h3>
                <p className="text-sm text-gray-600">{errorMessage}</p>
                <button onClick={() => setStep('input')} className="w-full h-12 border-2 border-gray-200 rounded-xl">Réessayer</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}