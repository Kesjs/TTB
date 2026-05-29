'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center border border-red-900/30">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Oups, ça a planté !
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Une erreur inattendue s'est produite. Nos équipes ont été notifiées et nous travaillons à résoudre le problème.
          </p>
          {error.message && (
            <p className="text-xs text-zinc-500 font-mono bg-zinc-900/50 p-3 rounded border border-zinc-800">
              {error.message}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#e5c47f] text-black font-bold text-xs uppercase tracking-widest rounded hover:bg-[#d4b36f] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold text-xs uppercase tracking-widest rounded border border-zinc-800 hover:bg-zinc-800 transition-colors"
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-zinc-900">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
            Top Talent Bénin 2026 • Erreur serveur
          </p>
        </div>
      </div>
    </div>
  );
}
