'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    if (typeof window !== 'undefined') {
      console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Une erreur est survenue
            </h1>
            <p className="text-zinc-400 mb-6">
              Nous sommes désolés, mais quelque chose s'est mal passé. Veuillez rafraîchir la page ou réessayer plus tard.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#e5c47f] text-black font-semibold rounded-lg hover:bg-[#d4b36e] transition-colors"
            >
              Rafraîchir la page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-zinc-500 cursor-pointer text-sm">
                  Détails de l'erreur (dev only)
                </summary>
                <pre className="mt-2 p-4 bg-zinc-900 rounded text-xs text-red-400 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
