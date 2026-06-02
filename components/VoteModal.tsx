'use client';

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Candidate } from '@/lib/supabase';

interface VoteModalProps {
  candidate: Candidate;
  onClose: () => void;
  currentPhase: string;
  onSuccess?: () => void;
}

export default function VoteModal({ candidate, onClose, currentPhase, onSuccess }: VoteModalProps) {
  const [voteCount, setVoteCount] = useState<number>(1);
  const [phone, setPhone] = useState<string>('');
  const [network, setNetwork] = useState<'MTN' | 'MOOV' | 'CELTIIS'>('MTN');
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  
  const totalAmount = voteCount * 500;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="relative h-20 overflow-hidden bg-slate-100">
          <img src={candidate.cover_image_url} className="w-full h-full object-cover opacity-20" alt="" />
          <div className="absolute bottom-3 left-6">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Soutenir {candidate.stage_name}</h3>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'input' && (
              <motion.form key="input" exit={{ opacity: 0 }} className="space-y-6">
                
                {/* Réseaux avec vraies images */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'MTN', src: '/mtn.png' },
                    { id: 'MOOV', src: '/moov.png' },
                    { id: 'CELTIIS', src: '/celtiis.png' }
                  ].map((n) => (
                    <button key={n.id} type="button" onClick={() => setNetwork(n.id as any)} 
                      className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${network === n.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                      <img src={n.src} alt={n.id} className="w-6 h-6 object-contain" />
                      <span className="text-[9px] font-bold text-slate-700 uppercase">{n.id}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <input type="number" value={voteCount} onChange={(e) => setVoteCount(Math.max(1, parseInt(e.target.value) || 1))} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 text-center text-lg font-bold outline-none focus:border-indigo-500" />
                  
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-slate-400 font-bold">+229</span>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.slice(0, 8))} placeholder="XX XX XX XX" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pl-16 text-slate-900 font-mono outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <button onClick={(e) => { e.preventDefault(); setLoading(true); setTimeout(() => setStep('otp'), 1000); }} 
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" /> : <>Payer {totalAmount.toLocaleString()} FCFA</>}
                </button>
              </motion.form>
            )}

            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0 }} className="text-center py-8 space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
                <h4 className="text-slate-900 font-bold">Validation en cours...</h4>
                <p className="text-sm text-slate-500">Validez le push USSD sur votre téléphone.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}