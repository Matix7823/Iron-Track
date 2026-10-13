import React, { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
  const { user, profile, isLoading, logout } = useAuth();
  
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

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition-colors"
            >
              <RefreshCw size={18} />
              Rafraîchir
            </button>
            <button 
              onClick={async () => await logout()}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-red-500/10 text-red-400 rounded-xl font-bold hover:bg-red-500/20 transition-colors"
            >
              Se déconnecter
            </button>
          </div>
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
  <div className="min-h-screen relative">
    <div className="bg-orbs">
      <div className="bg-orbs-particles"></div>
    </div>
    <Navbar />
    <main className="relative z-10">{children}</main>
    <BottomNav />
  </div>
);

import { motion, AnimatePresence } from "framer-motion";
import GenderOnboardingModal from "./components/layout/GenderOnboardingModal";

// Robust scroll & route persistence across navigation, page reload & app resume
const ScrollRestoration = () => {
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);

  // Continuously record scroll position in sessionStorage
  useEffect(() => {
    pathRef.current = pathname;
    try {
      localStorage.setItem('iron_track_last_route', pathname);
    } catch {
      // Storage unavailable
    }

    let timeoutId;
    const handleScroll = () => {
      const y = window.scrollY;
      try {
        sessionStorage.setItem('iron_scroll_' + pathRef.current, String(y));
      } catch {
        // Storage unavailable
      }
    };

    const debouncedScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 40);
    };

    window.addEventListener('scroll', debouncedScroll, { passive: true });
    
    // Save on beforeunload
    const handleUnload = () => {
      try {
        sessionStorage.setItem('iron_scroll_' + pathRef.current, String(window.scrollY));
      } catch {
        // Storage unavailable
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', debouncedScroll);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [pathname]);

  // Restore scroll position whenever pathname changes
  useEffect(() => {
    let savedY = 0;
    try {
      savedY = parseInt(sessionStorage.getItem('iron_scroll_' + pathname), 10) || 0;
    } catch {
      // Storage unavailable
    }

    if (savedY > 0) {
      // Try restoring at multiple key moments to account for AnimatePresence & layout rendering
      const restore = () => {
        window.scrollTo({ top: savedY, behavior: 'instant' });
      };

      restore();
      const raf1 = requestAnimationFrame(restore);
      const timer1 = setTimeout(restore, 60);
      const timer2 = setTimeout(restore, 180);
      const timer3 = setTimeout(restore, 320);

      return () => {
        cancelAnimationFrame(raf1);
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [pathname]);

  // When app comes back from background (switching apps or tabs), restore scroll immediately
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        let savedY = 0;
        try {
          savedY = parseInt(sessionStorage.getItem('iron_scroll_' + pathRef.current), 10) || 0;
        } catch {
          // Storage unavailable
        }
        if (savedY > 0) {
          window.scrollTo({ top: savedY, behavior: 'instant' });
          setTimeout(() => {
            window.scrollTo({ top: savedY, behavior: 'instant' });
          }, 60);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return null;
};

const AnimatedPage = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 15 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -15 }}
    transition={{ duration: 0.3, ease: "circOut" }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

const AppInner = () => {
  const { isDataLoading, gender, changeGender } = useApp();
  const { user, profile } = useAuth();
  const location = useLocation();
  
  // Forcer le rafraîchissement si l'app sort de veille (garantit la dernière version)
  React.useEffect(() => {
    let lastActiveTime = Date.now();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeIdle = Date.now() - lastActiveTime;
        // Si inactif pendant plus de 2 heures (7200000 ms) ou nouvelle version
        if (timeIdle > 7200000) {
          window.location.reload(true);
        }
      } else {
        lastActiveTime = Date.now();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
  
  if (isDataLoading) return <LoadingScreen />;
  
  const showOnboarding = user && profile && profile.status?.toLowerCase() === 'active' && !gender;
  
  return (
    <>
      <ScrollRestoration />
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
