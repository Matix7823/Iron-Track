import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar, BottomNav } from "./components/layout/Nav";
import Dashboard from "./pages/Dashboard";
import Workout from "./pages/Workout";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Planning from "./pages/Planning";
import ExerciseLibrary from "./pages/ExerciseLibrary";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { useApp } from "./context/AppContext";

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
  
  if (profile?.status?.toLowerCase() !== 'active') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 max-w-md shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Compte en attente</h2>
          <p className="text-slate-400 mb-2">Votre compte est en cours de validation par un administrateur.</p>
          {profile && (
            <p className="text-xs text-slate-500 mb-6 uppercase tracking-wider">Statut actuel : {profile.status}</p>
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

const AppInner = () => {
  const { isDataLoading } = useApp();
  if (isDataLoading) return <LoadingScreen />;
  
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/workout" element={<ProtectedRoute><AppLayout><Workout /></AppLayout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
      <Route path="/planning" element={<ProtectedRoute><AppLayout><Planning /></AppLayout></ProtectedRoute>} />
      <Route path="/exercises" element={<ProtectedRoute><AppLayout><ExerciseLibrary /></AppLayout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
