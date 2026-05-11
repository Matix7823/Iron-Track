import React, { useState, useMemo } from "react";
import { exerciseLibrary } from "../data/exerciseLibrary";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Dumbbell, Activity, Play } from "lucide-react";

const muscleColors = {
  "Pectoraux":  { bg: "bg-blue-500/20",    text: "text-blue-400",    border: "border-blue-500/50"    },
  "Dos":        { bg: "bg-cyan-500/20",     text: "text-cyan-400",    border: "border-cyan-500/50"    },
  "Lombaires":  { bg: "bg-teal-500/20",     text: "text-teal-400",    border: "border-teal-500/50"    },
  "Quadriceps": { bg: "bg-emerald-500/20",  text: "text-emerald-400", border: "border-emerald-500/50" },
  "Ischios":    { bg: "bg-green-500/20",    text: "text-green-400",   border: "border-green-500/50"   },
  "Fessiers":   { bg: "bg-lime-500/20",     text: "text-lime-400",    border: "border-lime-500/50"    },
  "Adducteurs": { bg: "bg-yellow-500/20",   text: "text-yellow-400",  border: "border-yellow-500/50"  },
  "Abducteurs": { bg: "bg-amber-500/20",    text: "text-amber-400",   border: "border-amber-500/50"   },
  "Mollets":    { bg: "bg-orange-500/20",   text: "text-orange-400",  border: "border-orange-500/50"  },
  "Tibias":     { bg: "bg-orange-500/20",   text: "text-orange-300",  border: "border-orange-400/50"  },
  "Épaules":    { bg: "bg-violet-500/20",   text: "text-violet-400",  border: "border-violet-500/50"  },
  "Biceps":     { bg: "bg-pink-500/20",     text: "text-pink-400",    border: "border-pink-500/50"    },
  "Triceps":    { bg: "bg-rose-500/20",     text: "text-rose-400",    border: "border-rose-500/50"    },
  "Avant-bras": { bg: "bg-red-500/20",      text: "text-red-400",     border: "border-red-500/50"     },
  "Abdos":      { bg: "bg-indigo-500/20",   text: "text-indigo-400",  border: "border-indigo-500/50"  },
  "Cardio":     { bg: "bg-sky-500/20",      text: "text-sky-400",     border: "border-sky-500/50"     },
  "Cou":        { bg: "bg-slate-500/20",    text: "text-slate-400",   border: "border-slate-500/50"   },
};

const getColor = (muscle) => muscleColors[muscle] || { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/50" };

const ExerciseLibrary = () => {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("Tous");

  const muscles = useMemo(() => ["Tous", ...new Set(exerciseLibrary.map(e => e.muscle))], []);

  const filtered = useMemo(() => exerciseLibrary.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.muscle.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = muscleFilter === "Tous" || e.muscle === muscleFilter;
    return matchSearch && matchMuscle;
  }), [search, muscleFilter]);

  return (
    <div className="page-container">
      <div className="bg-orbs" />
      
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Dumbbell size={22} className="text-amber-400" />
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Encyclopédie</h1>
        </div>
        <p className="text-sm text-slate-400">{exerciseLibrary.length} exercices • Toutes les catégories</p>
      </motion.div>

      {/* Sticky filter bar */}
      <div className="sticky top-16 sm:top-20 z-20 -mx-4 px-4 pb-4 pt-2 mb-4"
           style={{ background: "linear-gradient(to bottom, #03060f 70%, transparent)" }}>
        
        {/* Search input */}
        <div className="relative mb-3 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
          <input
            type="text"
            placeholder="Rechercher un exercice..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/60 text-white text-sm rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-xl placeholder-slate-500"
          />
        </div>

        {/* Muscle filter bubbles */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {muscles.map(m => {
            const isActive = muscleFilter === m;
            const colors = m === "Tous" ? null : getColor(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMuscleFilter(m)}
                className={[
                  "shrink-0 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 border whitespace-nowrap",
                  isActive && m === "Tous" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-500/20" :
                  isActive && colors ? `${colors.bg} ${colors.text} ${colors.border} shadow-lg` :
                  "bg-slate-800/40 border-slate-700/30 text-slate-400 hover:text-white hover:bg-slate-800/80"
                ].join(" ")}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-slate-600 mb-4 font-medium">
        {filtered.length} exercice{filtered.length > 1 ? "s" : ""}
        {muscleFilter !== "Tous" ? ` · ${muscleFilter}` : ""}
        {search ? ` · "${search}"` : ""}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((exo) => {
            const colors = getColor(exo.muscle);
            return (
              <motion.div
                key={exo.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`glass-card p-4 group hover:${colors.border} transition-all duration-200`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors.bg} ${colors.text} ${colors.border}`}>
                    {exo.muscle}
                  </span>
                  <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center`}>
                    <Activity size={13} className={colors.text} />
                  </div>
                </div>
                <h3 className={`text-sm font-black text-white group-hover:${colors.text} transition-colors mb-1.5 leading-tight`}>{exo.name}</h3>
                <p className="text-[11px] text-slate-500 italic leading-relaxed mb-3 line-clamp-2">"{exo.note}"</p>
                <div className="flex gap-4 pt-2.5 border-t border-white/5">
                  <div className="flex-1">
                    <p className="text-[9px] uppercase font-bold text-slate-600">Séries/Reps</p>
                    <p className="text-xs font-bold text-white">{exo.sets} × {exo.reps}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] uppercase font-bold text-slate-600">Tempo</p>
                    <p className={`text-xs font-bold ${colors.text}`}>{exo.tempo}</p>
                  </div>
                  <div className="flex-1 shrink-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://www.youtube.com/results?search_query=how+to+do+${exo.name.replace(/\s+/g, '+')}+fitness`, '_blank');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${colors.bg} ${colors.text} border ${colors.border} hover:scale-105 active:scale-95 transition-all text-[10px] font-black uppercase mt-1`}
                    >
                      <Play size={10} fill="currentColor" /> Vidéo
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <Dumbbell size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">Aucun exercice trouvé</p>
          <p className="text-slate-600 text-sm mt-1">Essaie un autre terme ou catégorie</p>
        </div>
      )}
      <div className="h-24" />
    </div>
  );
};

export default ExerciseLibrary;

