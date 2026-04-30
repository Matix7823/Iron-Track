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

      <div className="sticky top-20 z-20 bg-[#03060f]/80 backdrop-blur-md pb-4 pt-1">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
          <input 
            type="text" 
            placeholder="Chercher un exercice (ex: Bench, Squat...)" 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="input-premium pl-10 py-4 text-base"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {muscles.map(m => (
            <button 
              key={m} 
              onClick={() => setMuscleFilter(m)}
              className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${muscleFilter === m ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20" : "glass border-white/5 text-slate-500 hover:text-white"}`}
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
