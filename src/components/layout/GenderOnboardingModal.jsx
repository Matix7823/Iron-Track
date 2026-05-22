import React from "react";
import { motion } from "framer-motion";
import { Zap, Sparkles, Trophy, Dumbbell } from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";

const GenderOnboardingModal = ({ onSelect }) => {
  const handleSelect = (gender) => {
    triggerHaptic([40, 30, 40]);
    onSelect(gender);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-3xl p-4 overflow-y-auto">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-pink-500/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl bg-slate-900/60 border border-white/5 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden backdrop-blur-md"
      >
        {/* Cyber grid lines */}
        <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />

        <div className="relative z-10 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 mb-4 animate-pulse">
            <Trophy size={28} className="text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Initialisation Biologique
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto mt-2">
            Configure ton profil métabolique et cinétique. Choisis ton archétype pour personnaliser tes objectifs, tes calculs énergétiques et ton système de rangs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          {/* ARCHETYPE MALE */}
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect("homme")}
            className="group relative rounded-2xl border border-blue-500/25 bg-[#090f1e]/40 p-6 text-center cursor-pointer overflow-hidden transition-all duration-300 hover:border-blue-400/80 hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] flex flex-col justify-between min-h-[220px]"
          >
            {/* Pulsing overlay */}
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Zap size={22} className="text-blue-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wide">
                Archétype Homme
              </h3>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1 text-amber-400/80">
                Dieu Grec ⚡
              </p>
              <p className="text-slate-400 text-xs leading-relaxed mt-3">
                Algorithmes de force brute, métabolisme de masse et de densité. Rangs ciblés sur le développement de la puissance absolue.
              </p>
            </div>
            
            <div className="mt-4 text-[10px] font-black text-blue-400 uppercase tracking-widest group-hover:text-blue-300 transition-colors">
              Activer l'Archétype →
            </div>
          </motion.div>

          {/* ARCHETYPE FEMALE */}
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect("femme")}
            className="group relative rounded-2xl border border-pink-500/25 bg-[#1a0c1a]/40 p-6 text-center cursor-pointer overflow-hidden transition-all duration-300 hover:border-pink-400/80 hover:shadow-[0_0_25px_rgba(236,72,153,0.25)] flex flex-col justify-between min-h-[220px]"
          >
            {/* Pulsing overlay */}
            <div className="absolute inset-0 bg-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div>
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Sparkles size={22} className="text-pink-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wide">
                Archétype Femme
              </h3>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1 text-emerald-400/80">
                Déesse Grecque ✨
              </p>
              <p className="text-slate-400 text-xs leading-relaxed mt-3">
                Algorithmes orientés galbe athlétique, puissance cinétique et définition. Rangs et XP calibrés sur la souveraineté physique.
              </p>
            </div>

            <div className="mt-4 text-[10px] font-black text-pink-400 uppercase tracking-widest group-hover:text-pink-300 transition-colors">
              Activer l'Archétype →
            </div>
          </motion.div>
        </div>

        <div className="mt-6 text-[9px] text-slate-500 uppercase tracking-widest relative z-10 flex items-center justify-center gap-1.5">
          <Dumbbell size={10} />
          Modifiable à tout moment dans les paramètres de profil
        </div>
      </motion.div>
    </div>
  );
};

export default GenderOnboardingModal;
