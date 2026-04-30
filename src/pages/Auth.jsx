import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { isValidEmail, isStrongPassword } from '../utils/security';

const Auth = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    // Validation des entrées (Sécurité client-side)
    if (!isValidEmail(email)) {
      setError("Le format de l'email est invalide.");
      setLoading(false);
      return;
    }
    
    if (!isLogin && !isStrongPassword(password)) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
        setMessage('Compte créé avec succès ! Il est en attente de validation par un administrateur.');
        setIsLogin(true); // Switch to login view
      }
    } catch (err) {
      if (err.message.includes('Invalid login credentials')) {
        setError('Identifiants incorrects.');
      } else if (err.message.includes('User already registered')) {
        setError('Cet email est déjà utilisé.');
      } else {
        setError(err.message || 'Une erreur est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            {isLogin ? <LogIn className="text-white" size={32} /> : <UserPlus className="text-white" size={32} />}
          </div>
        </div>

        <h1 className="text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h1>
        <p className="text-center text-slate-400 mb-8">
          {isLogin ? 'Accédez à votre espace Iron Track' : 'Créez votre compte personnel'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
            <UserPlus className="text-emerald-400 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-emerald-200">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="votre@email.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300 ml-1">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/40 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Se connecter' : "S'inscrire")}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setMessage('');
            }}
            className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
