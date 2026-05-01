import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#03060f]">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-black text-white mb-2">Oups ! Une erreur est survenue</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-xs">
            L'application a rencontré un problème inattendu. Cela peut être dû à des données corrompues.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs"
            >
              Réessayer
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-xs"
            >
              Réinitialiser tout
            </button>
          </div>
          {this.state.error && (
            <p className="mt-8 text-[10px] text-slate-700 font-mono">
              {this.state.error.toString()}
            </p>
          )}
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
