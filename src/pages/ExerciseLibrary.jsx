import React, { useState } from "react";
import { exerciseLibrary } from "../data/exerciseLibrary";
import { motion } from "framer-motion";
import { Search, Dumbbell, Zap, Target, Activity } from "lucide-react";

const ExerciseLibrary = () => {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("Tous");

  const muscles = ["Tous", ...new Set(exerciseLibrary.map(e => e.muscle))];
  const filtered = exerciseLibrary.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = muscleFilter === "Tous" || e.muscle === muscleFilter;
    return matchSearch && matchMuscle;
  });

  const container = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="page-container">
      <div className="bg-orbs" />
      
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="section-header flex items-center gap-2 mb-2">
          <Dumbbell size={24} className="text-blue-400" />
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Encyclopédie</h1>
        </div>
        <p className="text-sm text-slate-400">Tous les exercices pour sculpter ton corps</p>
      </motion.div>

      <div className="sticky top-20 z-20 bg-[#03060f]/90 backdrop-blur-xl pb-4 pt-2 border-b border-white/5 mb-6">
        <div className="relative mb-5 max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-blue-400" />
          </div>
          <input 
            type="text" 
            placeholder="Chercher un exercice (ex: Bench, Squat...)" 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700/50 text-white text-sm rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 block pl-12 p-4 transition-all shadow-lg placeholder-slate-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 pt-1 px-1 scrollbar-hide snap-x">
          {muscles.map(m => (
            <button 
              key={m} 
              onClick={() => setMuscleFilter(m)}
              className={`snap-start flex-shrink-0 px-4 py-2 rounded-xl text-[13px] font-bold tracking-wide transition-all border ${
                muscleFilter === m 
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 border-blue-400 text-white shadow-lg shadow-blue-500/30" 
                  : "bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4"
      >
        {filtered.map((exo) => (
          <motion.div 
            key={exo.id} 
            variants={item}
            className="glass-card p-5 group hover:glow-blue transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="badge badge-slate">{exo.muscle}</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Activity size={14}/>
              </div>
            </div>
            <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors mb-2">{exo.name}</h3>
            <div className="space-y-2">
              <p className="text-xs text-slate-400 leading-relaxed italic">"{exo.note}"</p>
              <div className="flex gap-4 pt-2 border-t border-white/5 mt-3">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-600">Séries/Reps</p>
                  <p className="text-xs font-bold text-white">{exo.sets} x {exo.reps}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-600">Tempo</p>
                  <p className="text-xs font-bold text-blue-400">{exo.tempo}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-600">Repos</p>
                  <p className="text-xs font-bold text-white">{exo.rest}s</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-slate-500 font-bold">Aucun exercice trouvé...</p>
        </div>
      )}
    </div>
  );
};

export default ExerciseLibrary;
