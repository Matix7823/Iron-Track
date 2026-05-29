import React, { useState, useMemo } from "react";
import { exerciseLibrary } from "../data/exerciseLibrary";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Dumbbell, Activity, Play, Grid, List, ChevronDown, ChevronUp, X, Filter } from "lucide-react";
import { MuscleMap } from "../components/layout/MuscleMap";
import { triggerHaptic } from "../utils/haptics";


const muscleColors = {
  "Machine":    { bg: "bg-fuchsia-500/12", text: "text-fuchsia-400", border: "border-fuchsia-500/30" },
  "Pectoraux":  { bg: "bg-blue-500/12",    text: "text-blue-400",    border: "border-blue-500/30"    },
  "Dos":        { bg: "bg-cyan-500/12",     text: "text-cyan-400",    border: "border-cyan-500/30"    },
  "Lombaires":  { bg: "bg-teal-500/12",     text: "text-teal-400",    border: "border-teal-500/30"    },
  "Quadriceps": { bg: "bg-emerald-500/12",  text: "text-emerald-400", border: "border-emerald-500/30" },
  "Ischios":    { bg: "bg-green-500/12",    text: "text-green-400",   border: "border-green-500/30"   },
  "Fessiers":   { bg: "bg-lime-500/12",     text: "text-lime-400",    border: "border-lime-500/30"    },
  "Adducteurs": { bg: "bg-yellow-500/12",   text: "text-yellow-400",  border: "border-yellow-500/30"  },
  "Abducteurs": { bg: "bg-amber-500/12",    text: "text-amber-400",   border: "border-amber-500/30"   },
  "Mollets":    { bg: "bg-orange-500/12",   text: "text-orange-400",  border: "border-orange-500/30"  },
  "Tibias":     { bg: "bg-orange-500/10",   text: "text-orange-300",  border: "border-orange-400/30"  },
  "Épaules":    { bg: "bg-violet-500/12",   text: "text-violet-400",  border: "border-violet-500/30"  },
  "Biceps":     { bg: "bg-pink-500/12",     text: "text-pink-400",    border: "border-pink-500/30"    },
  "Triceps":    { bg: "bg-rose-500/12",     text: "text-rose-400",    border: "border-rose-500/30"    },
  "Avant-bras": { bg: "bg-red-500/12",      text: "text-red-400",     border: "border-red-500/30"     },
  "Abdos":      { bg: "bg-indigo-500/12",   text: "text-indigo-400",  border: "border-indigo-500/30"  },
  "Cardio":     { bg: "bg-sky-500/12",      text: "text-sky-400",     border: "border-sky-500/30"     },
  "Cou":        { bg: "bg-slate-500/12",    text: "text-slate-400",   border: "border-slate-500/30"   },
};

const getColor = (muscle) => muscleColors[muscle] || { bg: "bg-slate-500/12", text: "text-slate-400", border: "border-slate-500/30" };

// Detect equipment from exercise name/note
const detectEquipment = (exo) => {
  const name = (exo.name + " " + (exo.note || "")).toLowerCase();
  if (name.includes("machine") || name.includes("câble") || name.includes("cable") || name.includes("poulie")) return "Machine";
  if (name.includes("haltère") || name.includes("dumbell") || name.includes("dumbbell")) return "Haltères";
  if (name.includes("barre") || name.includes("barbell") || name.includes("soulevé de terre") || name.includes("squat") || name.includes("développé couché")) return "Barre";
  if (name.includes("traction") || name.includes("pompe") || name.includes("dips") || name.includes("propre") || name.includes("élévation")) return "Poids du corps";
  if (name.includes("élastique") || name.includes("bande")) return "Élastique";
  return "Autre";
};

// Detect difficulty level
const detectDifficulty = (exo) => {
  const reps = exo.reps?.toString() || "";
  const sets = exo.sets || 3;
  const name = exo.name.toLowerCase();
  if (name.includes("soulevé de terre") && !name.includes("roumain") || name.includes("squat avant") || name.includes("épaulé")) return "Avancé";
  if (sets >= 4 && (reps.includes("6") || reps.includes("4") || reps.includes("5"))) return "Intermédiaire";
  if (name.includes("isolation") || name.includes("extension") || name.includes("curl") || reps.includes("15") || reps.includes("20")) return "Débutant";
  return "Intermédiaire";
};

const DIFFICULTY_STYLE = {
  "Débutant":     { badge: "badge-beginner",     icon: "🟢" },
  "Intermédiaire":{ badge: "badge-intermediate",  icon: "🟡" },
  "Avancé":       { badge: "badge-advanced",      icon: "🔴" },
};

const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// ─── Exercise Card (Grid) ────────────────────────────────────────
const ExerciseCardGrid = ({ exo }) => {
  const [open, setOpen] = useState(false);
  const colors = getColor(exo.muscle);
  const diff = detectDifficulty(exo);
  const diffStyle = DIFFICULTY_STYLE[diff];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="glass-card glass-card-interactive p-4 group"
    >
      {/* Top */}
      <div className="flex justify-between items-start mb-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${colors.bg} ${colors.text} ${colors.border}`}>
          {exo.muscle}
        </span>
        <span className={`badge ${diffStyle.badge}`}>{diffStyle.icon} {diff}</span>
      </div>

      {/* Name */}
      <h3 className={`text-sm font-black text-white group-hover:${colors.text} transition-colors mb-1.5 leading-tight`}>{exo.name}</h3>
      
      {/* Note */}
      <p className="text-[10px] text-slate-500 italic leading-relaxed mb-3 line-clamp-2">"{exo.note}"</p>

      {/* Stats */}
      <div className="flex gap-3 pt-2.5 border-t border-white/6">
        <div>
          <p className="text-[9px] uppercase font-bold text-slate-600">Séries</p>
          <p className="text-xs font-black text-white">{exo.sets}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase font-bold text-slate-600">Reps</p>
          <p className="text-xs font-black text-white">{exo.reps}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase font-bold text-slate-600">Tempo</p>
          <p className={`text-xs font-black ${colors.text}`}>{exo.tempo}</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => window.open(`https://www.youtube.com/results?search_query=how+to+${exo.name.replace(/\s+/g, '+')}+fitness`, '_blank')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg ${colors.bg} ${colors.text} border ${colors.border} hover:scale-105 active:scale-95 transition-all text-[9px] font-black uppercase`}
          >
            <Play size={9} fill="currentColor" />Vidéo
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Exercise Row (List) ─────────────────────────────────────────
const ExerciseCardList = ({ exo }) => {
  const colors = getColor(exo.muscle);
  const diff = detectDifficulty(exo);
  const diffStyle = DIFFICULTY_STYLE[diff];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2 }}
      className="list-row group"
    >
      {/* Color dot */}
      <div className={`w-2 h-10 rounded-full ${colors.bg} border ${colors.border} shrink-0 self-stretch`} />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[9px] font-bold uppercase tracking-wider ${colors.text}`}>{exo.muscle}</span>
          <span className="text-slate-700">·</span>
          <span className={`badge ${diffStyle.badge} text-[8px]`}>{diffStyle.icon} {diff}</span>
        </div>
        <p className="text-sm font-black text-white leading-snug mt-0.5 truncate">{exo.name}</p>
        <p className="text-[10px] text-slate-500 italic truncate mt-0.5">"{exo.note}"</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 shrink-0 text-right">
        <div className="hidden sm:block">
          <p className="text-[9px] text-slate-600 uppercase font-bold">Tempo</p>
          <p className={`text-xs font-black ${colors.text}`}>{exo.tempo}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-600 uppercase font-bold">Sets</p>
          <p className="text-xs font-black text-white">{exo.sets}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-600 uppercase font-bold">Reps</p>
          <p className="text-xs font-black text-white">{exo.reps}</p>
        </div>
        <button
          onClick={() => window.open(`https://www.youtube.com/results?search_query=how+to+${exo.name.replace(/\s+/g, '+')}+fitness`, '_blank')}
          className={`shrink-0 w-7 h-7 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center hover:scale-110 active:scale-95 transition-all`}
        >
          <Play size={10} className={colors.text} fill="currentColor" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── ExerciseLibrary Page ────────────────────────────────────────
const ExerciseLibrary = () => {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("Tous");
  const [diffFilter, setDiffFilter] = useState("Tous");
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [visibleCount, setVisibleCount] = useState(50);
  const [showMap, setShowMap] = useState(false);

  const activeMuscleOnMap = useMemo(() => {
    const LIB_TO_SVG = {
      "Pectoraux": "Pectoraux",
      "Dos": "Dos",
      "Lombaires": "Lombaires",
      "Épaules": "Epaules",
      "Biceps": "Biceps",
      "Triceps": "Triceps",
      "Avant-bras": "AvantBras",
      "Abdos": "Abdos",
      "Quadriceps": "Quadriceps",
      "Ischios": "Ischios",
      "Fessiers": "Fessiers",
      "Mollets": "Mollets"
    };
    return LIB_TO_SVG[muscleFilter] || null;
  }, [muscleFilter]);

  const handleMuscleMapClick = (muscleKey) => {
    const SVG_TO_LIB = {
      Pectoraux: "Pectoraux",
      Dos: "Dos",
      Lombaires: "Lombaires",
      Epaules: "Épaules",
      Biceps: "Biceps",
      Triceps: "Triceps",
      AvantBras: "Avant-bras",
      Abdos: "Abdos",
      Quadriceps: "Quadriceps",
      Ischios: "Ischios",
      Fessiers: "Fessiers",
      Mollets: "Mollets"
    };
    const targetMuscle = SVG_TO_LIB[muscleKey];
    if (targetMuscle) {
      triggerHaptic(15);
      if (muscleFilter === targetMuscle) {
        setMuscleFilter("Tous"); // deselect
      } else {
        setMuscleFilter(targetMuscle);
      }
    }
  };

  const muscles = useMemo(() => ["Tous", ...Object.keys(muscleColors).filter(m => m !== "Machine")], []);
  const difficulties = ["Tous", "Débutant", "Intermédiaire", "Avancé"];


  const filtered = useMemo(() => exerciseLibrary.filter(e => {
    const q = removeAccents(search.toLowerCase());
    const nameMatch = removeAccents(e.name.toLowerCase()).includes(q);
    const muscleMatchSearch = e.muscle ? removeAccents(e.muscle.toLowerCase()).includes(q) : false;
    const matchSearch = !search || nameMatch || muscleMatchSearch;

    let matchMuscle = false;
    if (muscleFilter === "Tous") matchMuscle = true;
    else if (muscleFilter === "Machine") matchMuscle = e.name.toLowerCase().includes("machine");
    else if (muscleFilter === "Adducteurs") matchMuscle = e.muscle === "Adducteurs" || e.name.toLowerCase().includes("adduc");
    else if (muscleFilter === "Abducteurs") matchMuscle = e.muscle === "Abducteurs" || e.name.toLowerCase().includes("abduc");
    else if (muscleFilter === "Lombaires") matchMuscle = e.muscle === "Lombaires" || e.name.toLowerCase().includes("lombaire") || e.name.toLowerCase().includes("hyperextension");
    else matchMuscle = e.muscle === muscleFilter;

    const matchDiff = diffFilter === "Tous" || detectDifficulty(e) === diffFilter;

    return matchSearch && matchMuscle && matchDiff;
  }), [search, muscleFilter, diffFilter]);

  React.useEffect(() => { setVisibleCount(50); }, [search, muscleFilter, diffFilter]);

  const displayed = filtered.slice(0, visibleCount);

  return (
    <div className="page-container">
      

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Dumbbell size={17} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">Encyclopédie</h1>
            </div>
            <p className="text-sm text-slate-500 ml-11">{exerciseLibrary.length} exercices · Tous groupes musculaires</p>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 glass rounded-xl p-1 border border-white/10">
            <button onClick={() => { setShowMap(!showMap); triggerHaptic(15); }}
              className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-bold ${showMap ? "bg-amber-500/25 text-amber-400 border border-amber-500/20" : "text-slate-500 hover:text-white"}`}>
              <Activity size={12} />
              <span className="hidden sm:inline">Carte Muscles</span>
            </button>
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <button onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-amber-500/15 text-amber-400" : "text-slate-500 hover:text-white"}`}>
              <Grid size={15} />
            </button>
            <button onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-amber-500/15 text-amber-400" : "text-slate-500 hover:text-white"}`}>
              <List size={15} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Interactive Muscle Map */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden mb-4 glass-card p-4 border-amber-500/10 shadow-lg"
          >
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={13} className="text-amber-500" />
                Sélection Visuelle Par Muscle
              </span>
              <button 
                onClick={() => { setMuscleFilter("Tous"); triggerHaptic(10); }}
                className="text-[9px] font-black uppercase text-slate-500 hover:text-white px-2 py-1 rounded bg-slate-900 border border-white/5"
              >
                Réinitialiser
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mb-3 px-1">
              Clique sur un muscle pour filtrer les exercices correspondants.
            </p>
            <MuscleMap 
              selectedMuscle={activeMuscleOnMap}
              onMuscleClick={handleMuscleMapClick}
              interactive={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky filter bar */}
      <div className="sticky top-16 sm:top-20 z-20 -mx-4 px-4 pb-4 pt-3 mb-4 bg-[#020509]/95 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/50">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={15} />
          <input type="text" placeholder="Rechercher un exercice ou muscle..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/50 text-white text-sm rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all placeholder-slate-600" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Muscle filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide mb-2">
          {muscles.map(m => {
            const isActive = muscleFilter === m;
            const colors = m === "Tous" ? null : getColor(m);
            return (
              <button key={m} type="button" onClick={() => setMuscleFilter(m)}
                className={[
                  "shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition-all border whitespace-nowrap",
                  isActive && m === "Tous" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-transparent shadow-lg shadow-amber-500/20" :
                  isActive && colors ? `${colors.bg} ${colors.text} ${colors.border}` :
                  "bg-slate-800/40 border-slate-700/30 text-slate-500 hover:text-white hover:bg-slate-800/70"
                ].join(" ")}>
                {m}
              </button>
            );
          })}
        </div>

        {/* Difficulty filter */}
        <div className="flex gap-1.5">
          <span className="text-[9px] text-slate-600 uppercase tracking-wider self-center font-bold mr-1 shrink-0">Niveau :</span>
          {difficulties.map(d => (
            <button key={d} onClick={() => setDiffFilter(d)}
              className={`shrink-0 px-3 py-1 rounded-xl text-[10px] font-bold transition-all border whitespace-nowrap ${
                diffFilter === d
                  ? d === "Tous" ? "bg-white/10 text-white border-white/20" : d === "Débutant" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : d === "Intermédiaire" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-red-500/15 text-red-400 border-red-500/30"
                  : "bg-white/4 text-slate-500 border-white/8 hover:text-white"
              }`}>
              {d === "Débutant" ? "🟢 " : d === "Intermédiaire" ? "🟡 " : d === "Avancé" ? "🔴 " : ""}{d}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-[10px] text-slate-600 mb-4 font-medium">
        {filtered.length} exercice{filtered.length > 1 ? "s" : ""}
        {muscleFilter !== "Tous" ? ` · ${muscleFilter}` : ""}
        {diffFilter !== "Tous" ? ` · ${diffFilter}` : ""}
        {search ? ` · "${search}"` : ""}
      </p>

      {/* Grid / List */}
      <AnimatePresence mode="wait">
        {viewMode === "grid" ? (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {displayed.map(exo => <ExerciseCardGrid key={exo.id} exo={exo} />)}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            <AnimatePresence>
              {displayed.map(exo => <ExerciseCardList key={exo.id} exo={exo} />)}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {visibleCount < filtered.length && (
        <div className="mt-8 flex justify-center">
          <button onClick={() => setVisibleCount(v => v + 50)}
            className="px-6 py-3 rounded-2xl bg-amber-500/10 text-amber-400 font-bold text-sm border border-amber-500/25 hover:bg-amber-500/20 transition-all flex items-center gap-2">
            Voir plus ({filtered.length - visibleCount} restants)
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <Dumbbell size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">Aucun exercice trouvé</p>
          <p className="text-slate-600 text-sm mt-1">Essaie un autre terme, muscle ou niveau</p>
        </div>
      )}
      <div className="h-24" />
    </div>
  );
};

export default ExerciseLibrary;
