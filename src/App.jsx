import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar, BottomNav } from "./components/layout/Nav";
import ErrorBoundary from "./components/ErrorBoundary";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { useApp } from "./context/AppContext";

import Dashboard from "./pages/Dashboard";
import Workout from "./pages/Workout";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Planning from "./pages/Planning";
import ExerciseLibrary from "./pages/ExerciseLibrary";
import Community from "./pages/Community";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import PRTracker from "./pages/PRTracker";

const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4">
    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pulse">
      <RefreshCw size={28} className="text-white animate-spin" />
    </div>
    <div className="text-center">
      <h2 className="text-xl font-black text-white">IRON TRACKER</h2>
      <p className="text-sm text-slate-500 mt-1">Synchronisation en cours...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, profile, isLoading } = useAuth();
  
  if (isLoading) return <LoadingScreen />;
  
  if (!user) return <Navigate to="/auth" />;
  
  if (profile?.status?.toLowerCase() !== 'active' && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 max-w-md shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Diagnostic en cours</h2>
          
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-6 text-left space-y-2 text-sm text-slate-300">
            <p><strong className="text-cyan-400">ID de connexion :</strong><br/> <span className="text-xs font-mono">{user?.id}</span></p>
            <p><strong className="text-cyan-400">Profil trouvé :</strong> {profile ? "Oui" : "Non (Bloqué ou Introuvable)"}</p>
          </div>
          
          {profile === null ? (
            <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30 mb-6">
              <p className="text-red-400 font-bold mb-1">Erreur de lecture du profil</p>
              <p className="text-red-300 text-sm">Votre profil n'a pas pu être lu dans la base de données. Cela est généralement dû aux règles de sécurité (RLS) dans Supabase.</p>
            </div>
          ) : (
            <>
              <p className="text-slate-400 mb-2">Votre compte est en cours de validation par un administrateur.</p>
              <p className="text-xs text-slate-500 mb-6 uppercase tracking-wider">Statut actuel : {profile.status}</p>
            </>
          )}

          <button 
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition-colors"
          >
            <RefreshCw size={18} />
            Rafraîchir
          </button>
        </div>
      </div>
    );
  }
  
  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return children;
};

const AppLayout = ({ children }) => (
  <div className="min-h-screen">
    <Navbar />
    <main>{children}</main>
    <BottomNav />
  </div>
);

import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GenderOnboardingModal from "./components/layout/GenderOnboardingModal";

const AnimatedPage = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 1.02, y: -10 }}
    transition={{ duration: 0.25, ease: "easeInOut" }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

const AppInner = () => {
  const { isDataLoading, gender, changeGender } = useApp();
  const { user, profile } = useAuth();
  const location = useLocation();
  
  if (isDataLoading) return <LoadingScreen />;
  
  const showOnboarding = user && profile && profile.status?.toLowerCase() === 'active' && !gender;
  
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/auth" element={<AnimatedPage><Auth /></AnimatedPage>} />
          <Route path="/" element={<ProtectedRoute><AppLayout><AnimatedPage><Dashboard /></AnimatedPage></AppLayout></ProtectedRoute>} />
          <Route path="/workout" element={<ProtectedRoute><AppLayout><AnimatedPage><Workout /></AnimatedPage></AppLayout></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AppLayout><AnimatedPage><Analytics /></AnimatedPage></AppLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AppLayout><AnimatedPage><Profile /></AnimatedPage></AppLayout></ProtectedRoute>} />
          <Route path="/planning" element={<ProtectedRoute><AppLayout><AnimatedPage><Planning /></AnimatedPage></AppLayout></ProtectedRoute>} />
          <Route path="/exercises" element={<ProtectedRoute><AppLayout><AnimatedPage><ExerciseLibrary /></AnimatedPage></AppLayout></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><AppLayout><AnimatedPage><Community /></AnimatedPage></AppLayout></ProtectedRoute>} />
          <Route path="/pr-tracker" element={<ProtectedRoute><AppLayout><AnimatedPage><PRTracker /></AnimatedPage></AppLayout></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AppLayout><AnimatedPage><AdminDashboard /></AnimatedPage></AppLayout></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>
      {showOnboarding && <GenderOnboardingModal onSelect={changeGender} />}
    </>
  );
};


const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppInner />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
