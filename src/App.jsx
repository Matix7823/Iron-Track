import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { Navbar, BottomNav } from "./components/layout/Nav";
import Dashboard from "./pages/Dashboard";
import Workout from "./pages/Workout";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Planning from "./pages/Planning";
import ExerciseLibrary from "./pages/ExerciseLibrary";
import { RefreshCw } from "lucide-react";
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

const AppInner = () => {
  const { isDataLoading } = useApp();
  if (isDataLoading) return <LoadingScreen />;
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/exercises" element={<ExerciseLibrary />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <AppProvider>
      <AppInner />
    </AppProvider>
  </BrowserRouter>
);

export default App;
