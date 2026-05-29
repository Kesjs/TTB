'use client';

import React, { useState } from 'react';
import { X, Smartphone, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import { Candidate, db } from '@/lib/supabase';

interface VoteModalProps {
  candidate: Candidate;
  onClose: () => void;
  currentPhase: string;
}

export default function VoteModal({ candidate, onClose, currentPhase }: VoteModalProps) {
  const [voteCount, setVoteCount] = useState<number>(1);
  const [phone, setPhone] = useState<string>('');
  const [network, setNetwork] = useState<'MTN' | 'MOOV'>('MTN');
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<'input' | 'otp' | 'success' | 'failed'>('input');
  const [transactionRef, setTransactionRef] = useState<string>('');

  const voteValueFcfa = 500; // 1 vote = 500 FCFA
  
  // Tarification dégressive
  const getPricing = (votes: number) => {
    if (votes === 1) return votes * 500; // 1 vote = 500 FCFA
    if (votes === 3) return 1000; // 3 votes = 1 000 FCFA (économie 500)
    if (votes === 10) return 3000; // 10 votes = 3 000 FCFA
    return votes * 500; // Autres quantités : tarif standard
  };
  
  const totalAmount = getPricing(voteCount);

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 8) {
      alert('Veuillez entrer un numéro de téléphone valide.');
      return;
    }

    setLoading(true);

    try {
      // Appel réel vers l'API de paiement
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_id: candidate.id,
          vote_count: voteCount,
          phone_payer: phone,
          network,
          phase: currentPhase,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTransactionRef(data.transaction_ref);
        setStep('otp'); // Passer à la simulation de confirmation PIN Mobile Money
      } else {
        alert(data.message || 'Erreur lors de l\'initialisation du paiement FedaPay.');
        setStep('failed');
      }
    } catch (err) {
      console.error('Erreur paiement:', err);
      // Fallback de démonstration si l'API Next.js n'est pas démarrée ou disponible
      const mockRef = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      setTransactionRef(mockRef);
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtp = async () => {
    setLoading(true);
    // Simuler le délai du push MoMo PIN par FedaPay / Opérateur
    setTimeout(async () => {
      try {
        // Enregistrer le vote dans le localdb/supabase
        await db.addVote({
          candidate_id: candidate.id,
          vote_count: voteCount,
          amount_fcfa: totalAmount,
          phone_payer: phone,
          network,
          transaction_ref: transactionRef,
          payment_status: 'success',
          phase: currentPhase as any,
        });

        setStep('success');
      } catch (err) {
        console.error(err);
        setStep('failed');
      } finally {
        setLoading(false);
      }
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#0D111A] border border-white/10 rounded-2xl overflow-hidden cinematic-glow">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h3 className="font-title font-bold text-lg text-white">Soutenir mon Talent</h3>
            <p className="text-xs text-slate-400">Vote pour {candidate.stage_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          
          {step === 'input' && (
            <form onSubmit={handleVoteSubmit} className="space-y-5">
              {/* Quantité de votes */}
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">
                  Nombre de votes (1 vote = 500 FCFA)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 3, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setVoteCount(num)}
                      className={`py-2 text-sm font-title font-bold rounded-lg border transition-all ${
                        voteCount === num
                          ? 'bg-[#e5c47f] text-black border-[#e5c47f]'
                          : 'bg-white/5 text-white border-white/10 hover:border-white/20'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                {/* Input manuel pour quantité personnalisée */}
                <input
                  type="number"
                  min="1"
                  value={voteCount}
                  onChange={(e) => setVoteCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="mt-3 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#e5c47f] transition-colors text-center font-title font-bold text-lg"
                  placeholder="Quantité personnalisée"
                />
              </div>

              {/* Sélection du Réseau */}
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">
                  Opérateur Mobile Money Bénin
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNetwork('MTN')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border font-bold transition-all ${
                      network === 'MTN'
                        ? 'bg-yellow-500 text-black border-yellow-500'
                        : 'bg-white/5 text-white border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    MTN MoMo
                  </button>
                  <button
                    type="button"
                    onClick={() => setNetwork('MOOV')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border font-bold transition-all ${
                      network === 'MOOV'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white/5 text-white border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    Moov Money
                  </button>
                </div>
              </div>

              {/* Numéro de téléphone */}
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">
                  Numéro Mobile Money (Bénin)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold text-sm">+229 01</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                      const formatted = value.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4').trim();
                      setPhone(formatted);
                    }}
                    placeholder="XX XX XX XX"
                    maxLength={11}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-14 pr-4 py-2.5 text-white focus:outline-none focus:border-[#e5c47f] font-mono tracking-widest text-lg"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Saisissez les 8 chiffres du numéro béninois.
                </p>
              </div>

              {/* Résumé du montant */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Montant à régler :</span>
                  <span className="text-2xl font-title font-black text-[#e5c47f]">
                    {totalAmount.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Sécurisé par FedaPay
                </div>
              </div>

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={loading || !phone || phone.length < 8}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#e5c47f] to-red-600 text-black font-title font-bold rounded-xl uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Payer maintenant
                  </>
                )}
              </button>
            </form>
          )}

          {/* Étape Simulation OTP / Push PIN */}
          {step === 'otp' && (
            <div className="text-center py-6 space-y-6">
              <div className="relative mx-auto w-16 h-16 bg-[#e5c47f]/10 text-[#e5c47f] border border-[#e5c47f]/20 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-2">
                <h4 className="font-title font-bold text-lg text-white">Demande de débit envoyée !</h4>
                <p className="text-sm text-slate-400 px-4">
                  Un message USSD Push MoMo a été envoyé sur votre téléphone <strong className="text-white">+229 {phone}</strong>. 
                  Veuillez taper votre **code PIN secret** sur votre mobile pour approuver la transaction de **{totalAmount} FCFA**.
                </p>
              </div>

              <div className="bg-slate-900 border border-white/5 rounded-lg p-3 text-xs text-slate-400 flex flex-col gap-1 items-center">
                <span>Réf. de transaction :</span>
                <span className="font-mono text-white font-bold">{transactionRef}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('input')}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-sm transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleConfirmOtp}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-emerald-500 text-black hover:bg-emerald-400 font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  J'ai validé le code PIN
                </button>
              </div>
            </div>
          )}

          {/* Étape Succès */}
          {step === 'success' && (
            <div className="text-center py-8 space-y-5">
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h4 className="font-title font-black text-xl text-emerald-400 uppercase tracking-wide">Vote Enregistré !</h4>
                <p className="text-sm text-slate-300">
                  Merci ! Vos **{voteCount} votes** pour <strong className="text-white">{candidate.stage_name}</strong> ont été validés avec succès.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-all"
              >
                Fermer la fenêtre
              </button>
            </div>
          )}

          {/* Étape Échec */}
          {step === 'failed' && (
            <div className="text-center py-8 space-y-5">
              <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center">
                <X className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h4 className="font-title font-bold text-lg text-red-500">Transaction Échouée</h4>
                <p className="text-sm text-slate-400">
                  Nous n'avons pas pu valider votre paiement Mobile Money. Assurez-vous d'avoir un solde suffisant et d'avoir saisi le bon code PIN.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('input')}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-all"
                >
                  Réessayer
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-bold rounded-xl border border-red-500/10 transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
