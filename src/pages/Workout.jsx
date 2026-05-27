import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { exerciseLibrary } from "../data/exerciseLibrary";
import { normalizeHistory, getPerformanceMetrics, calculate1RM, predictLoad } from "../utils/metrics";
import {
  Save, CheckCircle2, Circle, Timer, PlayCircle, Flame, Zap,
  Target, Activity, AlertTriangle, TrendingDown, Clock,
  ChevronDown, ChevronUp, Info, Trophy, X, Plus, Search, Share2, Play, Check, Calendar, Settings, Edit2
} from "lucide-react";
import { syncWorkoutToAppleHealth } from "../utils/health";
import { hapticLight, hapticMedium, hapticSuccess } from "../utils/native";
import { triggerHaptic } from "../utils/haptics";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const STATUS_ICONS = {
  good: '✅',
  super: '🏆',
  rest: '😴',
};

// ─── Coach Advice Logic ──────────────────────────────────────────
const getAdvice = (exo, exoHistory, currentSets, energyLevel, allExercises, currentInput) => {
  const isCardio = exo.muscle.includes("Cardio");
  const isTime = exo.unit === "seconds" || exo.unit === "minutes";
  let maxReps = parseInt(exo.reps);
  if (exo.reps?.includes("-")) maxReps = parseInt(exo.reps.split("-")[1]);
  const targetSets = parseInt(exo.sets);

  if (!isCardio) {
    let done = 0;
    Object.keys(currentInput).forEach(id => {
      const other = allExercises.find(e => e.id === id);
      if (other?.muscle === exo.muscle) done += (currentInput[id]||[]).filter(s => s.done && !s.isExtra).length;
    });
    if (done >= 8) return { text: `🛑 JUNK VOLUME — ${done} séries de ${exo.muscle}. Muscle épuisé, stop.`, color: "red" };
  }

  if (currentSets?.some(s => s.tag === "💧")) return { text: "👑 DROP SET activé ! Baisse de 30% et enchaîne directement.", color: "purple" };
  if (currentSets?.some(s => s.tag === "⚡")) return { text: "⚡ REST-PAUSE ! 15s de repos, même poids, quelques reps de plus.", color: "yellow" };
  if (currentSets?.some(s => s.tag === "🔥")) return { text: "🔥 ÉCHEC TOTAL ! Pousse jusqu'à la dernière répétition.", color: "red" };

  if (!exoHistory?.length) return { text: isCardio ? `🎯 Objectif : tenir ${maxReps} min minimum.` : `🎯 Première fois ! Trouve ta charge de travail.`, color: "blue" };

  const hist = normalizeHistory(exoHistory);
  const prev = getPerformanceMetrics(hist[hist.length-1]?.setsData);
  if (!prev) return { text: "Enregistre tes séries pour obtenir un conseil.", color: "blue" };
  if (isCardio) return { text: `🎯 Dernière fois : ${prev.avgRepsAtMax} min. Fais autant ou plus !`, color: "green" };

  if (hist.length >= 3) {
    const [m1,m2,m3] = [prev, getPerformanceMetrics(hist[hist.length-2]?.setsData), getPerformanceMetrics(hist[hist.length-3]?.setsData)];
    if (m1&&m2&&m3&&m1.maxWeight===m2.maxWeight&&m2.maxWeight===m3.maxWeight&&m1.avgRepsAtMax===m2.avgRepsAtMax&&m1.avgRepsAtMax<maxReps)
      return { text: `📉 STAGNATION — Décharge à ~${Math.round(m1.maxWeight*.9)}kg pour débloquer ton SNC.`, color: "purple" };
  }
  if (prev.topSetsCount < targetSets) return { text: `🎯 Consolide ! ${prev.maxWeight}kg pour finir tes ${targetSets} séries.`, color: "orange" };

  let target = prev.maxWeight;
  if (energyLevel === 5) target = Math.round(prev.maxWeight * 1.05);
  else if (energyLevel <= 2) target = Math.round(prev.maxWeight * 0.9);

  if (prev.avgRepsAtMax >= maxReps) return { text: `🎯 SURCHARGE ! Vise ~${target + 2}kg aujourd'hui.`, color: "green" };
  return { text: `🎯 Gagne des reps ! Reste à ${target}kg, bats ton record.`, color: "yellow" };
};

const advStyle = { green:"bg-emerald-950/40 border-emerald-500/25 text-emerald-300", orange:"bg-orange-950/40 border-orange-500/25 text-orange-300", yellow:"bg-amber-950/40 border-amber-500/25 text-amber-300", purple:"bg-purple-950/40 border-purple-500/25 text-purple-300", red:"bg-red-950/40 border-red-500/25 text-red-300", blue:"bg-blue-950/40 border-blue-500/25 text-blue-300" };

// ─── Muscle Colors & Helpers ─────────────────────────────────────
const muscleColors = {
  "Machine":    { bg: "bg-fuchsia-500/20",  text: "text-fuchsia-400", border: "border-fuchsia-500/50" },
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

const removeAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// ─── Add Exercise Modal ──────────────────────────────────────────
const AddExerciseModal = ({ sessionId, onClose }) => {
  const { addExerciseToSession } = useApp();
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("Tous");
  const [visibleCount, setVisibleCount] = useState(50);

  const muscles = useMemo(() => ["Tous", ...Object.keys(muscleColors)], []);

  const filtered = useMemo(() => exerciseLibrary.filter(e => {
    const searchNormalized = removeAccents(search.toLowerCase());
    const nameMatch = removeAccents(e.name.toLowerCase()).includes(searchNormalized);
    const muscleMatchSearch = removeAccents(e.muscle.toLowerCase()).includes(searchNormalized);
    const matchSearch = nameMatch || muscleMatchSearch;
    
    let matchMuscle = false;
    if (muscleFilter === "Tous") {
      matchMuscle = true;
    } else if (muscleFilter === "Machine") {
      matchMuscle = e.name.toLowerCase().includes("machine");
    } else if (muscleFilter === "Adducteurs") {
      matchMuscle = e.muscle === "Adducteurs" || e.name.toLowerCase().includes("adduc");
    } else if (muscleFilter === "Abducteurs") {
      matchMuscle = e.muscle === "Abducteurs" || e.name.toLowerCase().includes("abduc");
    } else if (muscleFilter === "Lombaires") {
      matchMuscle = e.muscle === "Lombaires" || e.name.toLowerCase().includes("lombaire") || e.name.toLowerCase().includes("hyperextension");
    } else {
      matchMuscle = e.muscle === muscleFilter;
    }

    return matchSearch && matchMuscle;
  }), [search, muscleFilter]);

  const displayed = filtered.slice(0, visibleCount);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ y: 50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="glass-dark w-[95%] sm:w-full max-w-xl max-h-[85vh] rounded-3xl p-4 sm:p-6 overflow-hidden flex flex-col border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white">Bibliothèque</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X size={20}/></button>
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
          <input
            type="text"
            placeholder="Rechercher un exercice..."
            value={search}
            onChange={e => { setSearch(e.target.value); setVisibleCount(50); }}
            className="w-full bg-slate-900/80 border border-slate-700/60 text-white text-sm rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-xl placeholder-slate-500"
          />
        </div>

        {/* Muscle filter bubbles */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0 mb-2">
          {muscles.map(m => {
            const isActive = muscleFilter === m;
            const colors = m === "Tous" ? null : getColor(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => { setMuscleFilter(m); setVisibleCount(50); }}
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

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
          {displayed.length === 0 && (
            <p className="text-center text-slate-500 text-sm mt-8">Aucun exercice trouvé.</p>
          )}
          {displayed.map(exo => (
            <button 
              key={exo.id}
              onClick={() => { addExerciseToSession(sessionId, exo); onClose(); }}
              className="w-full glass-card p-4 flex items-center justify-between hover:border-blue-500/30 group"
            >
              <div className="text-left">
                <p className="text-sm font-bold text-white group-hover:text-blue-400">{exo.name}</p>
                <p className="text-[10px] text-slate-500 uppercase">{exo.muscle}</p>
              </div>
              <Plus size={18} className="text-blue-400"/>
            </button>
          ))}
          {filtered.length > visibleCount && (
            <button 
              onClick={() => setVisibleCount(v => v + 50)} 
              className="w-full py-3 mt-2 text-sm font-bold text-blue-400 bg-blue-500/10 rounded-xl hover:bg-blue-500/20 transition-colors"
            >
              Voir plus d'exercices ({filtered.length - visibleCount} restants)
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const AddSessionModal = ({ onClose }) => {
  const { userSessions, currentSession, addExerciseToSession } = useApp();
  
  const handleAddSession = (sessKey) => {
    const sessionToAdd = userSessions[sessKey];
    if (sessionToAdd && Array.isArray(sessionToAdd.exercises)) {
      sessionToAdd.exercises.forEach(exo => {
        addExerciseToSession(currentSession, exo);
      });
    }
    if (window.navigator.vibrate) window.navigator.vibrate(15);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ y: 50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="glass-dark w-[95%] sm:w-full max-w-xl max-h-[85vh] rounded-3xl p-4 sm:p-6 overflow-hidden flex flex-col border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white flex items-center gap-2"><Target size={20} className="text-purple-400" /> Ajouter une séance complète</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
          {Object.entries(userSessions || {}).filter(([k]) => k !== currentSession && userSessions[k].exercises?.length > 0).map(([key, sess]) => (
            <button 
              key={key}
              onClick={() => handleAddSession(key)}
              className="w-full glass-card p-4 flex items-center justify-between hover:border-purple-500/30 group text-left"
            >
              <div>
                <p className="text-sm font-bold text-white group-hover:text-purple-400">{sess.title}</p>
                <p className="text-[10px] text-slate-500 uppercase">{sess.exercises?.length || 0} exercices</p>
              </div>
              <Plus size={18} className="text-purple-400"/>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ─── ExerciseCard ────────────────────────────────────────────────
const ExerciseCard = ({ exo, index, sessionId, onRemoveRequest }) => {
  const { history, currentInput, getSetsForExo, handleSetChange, toggleSetDone, cycleSetTag, startTimer, stopTimer, energyLevel, allExercises, gender, age, currentBodyWeight, height } = useApp();
  const [open, setOpen] = useState(true);
  const [isBypassed, setIsBypassed] = useState(false);

  const sets = getSetsForExo(exo.id);
  const advice = getAdvice(exo, history[exo.id]||[], sets, energyLevel, allExercises, currentInput);
  const hasJunkWarning = advice.text.includes("JUNK VOLUME");
  const isJunk = hasJunkWarning && !isBypassed;
  const isTime = exo.unit === "seconds" || exo.unit === "minutes";
  const isCardio = exo.muscle.includes("Cardio");
  const style = advStyle[advice.color] || advStyle.blue;

  const prev = normalizeHistory(history[exo.id]||[]);
  const prevMetrics = prev.length ? getPerformanceMetrics(prev[prev.length-1].setsData) : null;
  const targetW = prevMetrics?.maxWeight || 0;
  const needsWarmup = targetW >= 30 && !isTime && !isCardio;
  const warmups = needsWarmup ? [
    { p: 50, r: 8, w: Math.round(targetW*.5) },
    { p: 70, r: 4, w: Math.round(targetW*.7) },
    { p: 90, r: 1, w: Math.round(targetW*.9) },
  ] : [];

  const doneSets = sets.filter(s => s.done && !s.isExtra).length;
  const totalSets = parseInt(exo.sets)||0;
  const progress = totalSets > 0 ? (doneSets / totalSets) * 100 : 0;
  const currentMetrics = getPerformanceMetrics(sets.filter(s => s.done));
  const oneRM = currentMetrics?.maxWeight && !isCardio ? calculate1RM(currentMetrics.maxWeight, currentMetrics.avgRepsAtMax) : 0;
  const repsPlaceholder = exo.reps ? (exo.reps.includes("-") ? exo.reps.split("-")[1] : exo.reps.replace(/\D/g,"")) : "—";
  
  const targetReps = parseInt(repsPlaceholder) || 10;
  const prevMetricsForLoad = prevMetrics || currentMetrics;
  const prev1RM = prevMetricsForLoad?.maxWeight && !isCardio ? calculate1RM(prevMetricsForLoad.maxWeight, prevMetricsForLoad.avgRepsAtMax) : 0;
  
  let suggestedLoad = prev1RM > 0 ? predictLoad(prev1RM, targetReps) : 0;
  
  const userAge = parseInt(age) || 30;
  let adaptedRest = parseInt(exo.rest) || 60;
  if (userAge >= 50) adaptedRest += 30; // +30s pour récupération système nerveux après 50 ans
  
  if (suggestedLoad === 0 && currentBodyWeight > 0 && !isCardio && !isTime) {
    const isFemale = gender === 'femme';
    let pct = 0.2;
    const nameLo = exo.name.toLowerCase();
    if (nameLo.includes('squat') || nameLo.includes('presse')) pct = isFemale ? 0.35 : 0.6;
    else if (nameLo.includes('deadlift') || nameLo.includes('soulevé')) pct = isFemale ? 0.4 : 0.7;
    else if (nameLo.includes('couché') || nameLo.includes('bench')) pct = isFemale ? 0.15 : 0.4;
    else if (exo.muscle === 'Dos') pct = isFemale ? 0.2 : 0.3;
    else if (exo.muscle === 'Biceps' || exo.muscle === 'Triceps') pct = 0.05;
    
    // Levier biomécanique : les personnes plus grandes ont des bras de levier plus longs (difficile sur le couché/squat)
    const userHeight = parseInt(height) || 175;
    let heightFactor = 1;
    if (userHeight > 185 && (nameLo.includes('squat') || nameLo.includes('couché'))) heightFactor = 0.9;
    else if (userHeight < 170 && (nameLo.includes('squat') || nameLo.includes('couché'))) heightFactor = 1.1;

    suggestedLoad = Math.round((currentBodyWeight * pct * (userAge > 50 ? 0.8 : 1) * heightFactor) / 2.5) * 2.5;
    if (suggestedLoad < 2.5) suggestedLoad = 2.5;
  }

  return (
    <motion.div
      initial={{ opacity:0, y:16 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay: index * 0.055, duration: 0.4 }}
      className={`glass-card mb-4 overflow-hidden transition-all relative ${isJunk ? "opacity-60 grayscale" : ""}`}
    >
      {/* Overtraining Overlay */}
      {isJunk && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-[#0f172a] p-5 rounded-2xl border border-red-500/30 text-center shadow-2xl max-w-[85%]">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3 animate-pulse" />
            <p className="text-red-400 font-black mb-1 text-sm uppercase tracking-wide">Surcharge Musculaire</p>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed font-medium">Continuer pourrait entraîner un surentraînement. Muscle épuisé.</p>
            <button onClick={() => setIsBypassed(true)} className="px-4 py-2.5 bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all w-full border border-red-500/30 active:scale-95">
               Pousser quand même
            </button>
          </div>
        </div>
      )}

      {/* Progress bar at top */}
      {doneSets > 0 && (
        <div className="h-0.5 bg-white/5 w-full">
          <motion.div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
            initial={{ width:0 }} animate={{ width:`${progress}%` }}
            transition={{ duration:.6, ease:"easeOut" }} />
        </div>
      )}

      {/* Card header */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`badge ${isCardio ? "badge-orange" : "badge-slate"}`}>{isCardio && <Flame size={8} />} {exo.muscle}</span>
            {doneSets > 0 && <span className="badge badge-blue">{doneSets}/{totalSets} ✓</span>}
            {doneSets === totalSets && totalSets > 0 && <span className="badge badge-green">Complet ✓</span>}
          </div>
          <h3 className="text-base font-bold text-white leading-tight">{exo.name}</h3>
          {exo.note && <p className="text-[11px] text-slate-500 italic mt-0.5">{exo.note}</p>}
          {exo.tempo && !isCardio && <p className="text-[10px] text-blue-400 mt-1 font-mono tracking-wider">⏱ {exo.tempo}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => window.open(`https://www.youtube.com/results?search_query=how+to+do+${exo.name.replace(/\s+/g, '+')}+fitness`, '_blank')}
            className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 hover:bg-amber-500/20 active:scale-90 transition-all"
            title="Voir la vidéo"
          >
            <Play size={14} fill="currentColor" />
          </button>
          {exo.rest > 0 && (
            <button onClick={() => startTimer(adaptedRest)}
              className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 active:scale-90 transition-all">
              <Timer size={14} />
            </button>
          )}
          <button onClick={() => onRemoveRequest(exo)}
            className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 active:scale-90 transition-all">
            <X size={14} />
          </button>
          <button onClick={() => setOpen(!open)}
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }}
            transition={{ duration:.25, ease:"easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Warmup */}
              {needsWarmup && (
                <div className="bg-orange-950/20 border border-orange-500/12 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Flame size={9} /> Échauffement Pyramidal</p>
                  <div className="flex gap-2">
                    {warmups.map((w,i) => (
                      <div key={i} className="flex-1 bg-black/20 rounded-lg p-2 text-center">
                        <p className="text-[8px] text-slate-600 mb-0.5">{w.p}%</p>
                        <p className="text-xs font-bold text-white font-mono">{w.r}@{w.w}kg</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coach advice */}
              <div className={`p-3 rounded-xl border text-xs leading-snug ${style}`}>
                {advice.text}
              </div>

              {/* Header row */}
              <div className="flex items-center justify-between text-[10px] font-bold text-blue-400 px-1">
                <span className="flex items-center gap-1"><Activity size={10} /> Obj: {exo.sets} × {exo.reps} {isTime ? (exo.unit==="minutes"?"min":"sec") : "reps"}</span>
                <div className="flex gap-2">
                  {suggestedLoad > 0 && <span className="text-emerald-400">Sug. : {suggestedLoad}kg</span>}
                  {oneRM > 0 && <span className="text-slate-500">1RM est. : <span className="text-white">{oneRM}kg</span></span>}
                </div>
              </div>

              {(() => {
                const lastEntry = prev.length ? prev[prev.length - 1] : null;
                if (!lastEntry?.setsData) return null;
                return (
                  <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold bg-white/5 px-2 py-1 rounded-lg flex items-center justify-between gap-1 mt-1 border border-white/5 overflow-hidden">
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-slate-500 font-black shrink-0">Précédent</span>
                    <div className="flex items-center gap-1 font-mono text-slate-300 text-[8px] sm:text-[10px] whitespace-nowrap overflow-hidden">
                      {lastEntry.setsData.map((s, idx) => (
                        <span key={idx} className="bg-white/5 px-1 rounded shrink-0">
                          ({s.weight}kg × {s.reps})
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Column labels */}
              <div className="flex gap-1 sm:gap-1.5 text-[8px] sm:text-[9px] text-slate-600 font-bold uppercase text-center px-0.5 sm:px-1">
                <div className="w-5 sm:w-6">Set</div>
                <div className="flex-1">{isCardio?"Niv.":isTime?"Lest (kg)":"Poids (kg)"}</div>
                <div className="flex-1">{isTime?(exo.unit==="minutes"?"Min":"Sec"):"Reps"}</div>
                {!isCardio && <div className="flex-1">RPE</div>}
                <div className="w-6 sm:w-7">✓</div>
              </div>

              {/* Sets */}
              {sets.map((set, si) => {
                const isDone = set.done;
                const isExtra = set.isExtra;
                const canTag = si >= parseInt(exo.sets)-1 && !isExtra && !isCardio;
                let label = si+1;
                if (isExtra && (!set.tag||set.tag==="drop_child")) label="⏬";
                if (isExtra && set.tag==="pause_child") label="⏱";
                if (set.tag==="🔥") label="🔥";
                if (set.tag==="💧") label="💧";
                if (set.tag==="⚡") label="⚡";
                const tagCls = set.tag==="🔥"?"text-red-400 bg-red-950/50 border-red-500/30"
                  :set.tag==="💧"?"text-purple-400 bg-purple-950/50 border-purple-500/30"
                  :set.tag==="⚡"?"text-amber-400 bg-amber-950/50 border-amber-500/30"
                  :isDone?"text-blue-400":"text-slate-600 bg-white/4";

                return (
                  <motion.div key={si}
                    initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay: si*0.03 }}
                    className={`set-row ${isDone?"done":""}`}>
                    <button
                      onClick={() => canTag && cycleSetTag(exo.id, si)}
                      disabled={!canTag}
                      className={`w-5 h-6 sm:w-6 sm:h-7 text-[9px] sm:text-[10px] font-bold rounded-md flex items-center justify-center shrink-0 border transition-all ${tagCls} ${canTag?"cursor-pointer hover:scale-110 active:scale-90":"cursor-default border-transparent"}`}>
                      {label}
                    </button>
                    <input type="number" disabled={isDone||isJunk} value={set.weight}
                      onChange={e => handleSetChange(exo.id, si, "weight", e.target.value)}
                      className="set-input border-l border-white/6 text-sm sm:text-base" placeholder="—" />
                    <input type="number" disabled={isDone||isJunk} value={set.reps}
                      onChange={e => handleSetChange(exo.id, si, "reps", e.target.value)}
                      className="set-input border-l border-white/6 text-sm sm:text-base" placeholder={repsPlaceholder} />
                    {!isCardio && (
                      <div className="flex-1 border-l border-white/6">
                        <select disabled={isDone||isJunk} value={set.rpe}
                          onChange={e => handleSetChange(exo.id, si, "rpe", e.target.value)}
                          className="w-full bg-transparent text-center font-bold text-xs sm:text-sm py-1 sm:py-1.5 appearance-none outline-none cursor-pointer text-blue-400 disabled:text-slate-600">
                          <option value="">—</option>
                          {[
                            {v: 1, l: "1 - Très Facile"},
                            {v: 2, l: "2 - Facile"},
                            {v: 3, l: "3 - Modéré"},
                            {v: 4, l: "4 - Assez Difficile"},
                            {v: 5, l: "5 - Difficile"},
                            {v: 6, l: "6 - 4 reps en réserve"},
                            {v: 7, l: "7 - 3 reps en réserve"},
                            {v: 8, l: "8 - 2 reps en réserve"},
                            {v: 9, l: "9 - 1 rep en réserve"},
                            {v: 10, l: "10 - Impossible"}
                          ].map(o=><option key={o.v} value={o.v} className="bg-[#0a0f1e] text-left">{o.l}</option>)}
                        </select>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (!isJunk) {
                          const isCurrentlyDone = set.done;
                          toggleSetDone(exo.id, si, adaptedRest);
                          if (!isCurrentlyDone) {
                            hapticMedium();
                          } else {
                            hapticLight();
                            stopTimer();
                          }
                        }
                      }}
                      className="w-6 sm:w-7 flex justify-center items-center active:scale-90 transition-transform shrink-0">
                      {isDone
                        ? <CheckCircle2 className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,.7)] w-5 h-5 sm:w-6 sm:h-6" />
                        : <Circle className="text-slate-700 hover:text-blue-400 transition-colors w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Session Summary Modal ───────────────────────────────────────
const SummaryModal = ({ rank, tonnage, calories, onClose, onShare, hasShared, onSyncAppleHealth }) => (
  <div className="modal-overlay" onClick={onClose}>
    <motion.div className="modal-card" initial={{ scale:.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
      transition={{ type:"spring", stiffness:280, damping:20 }} onClick={e=>e.stopPropagation()}>
      <div className="mb-6">
        {rank==="super" ? <div className="text-6xl animate-bounce-sm">🏆</div>
          : rank==="medium" ? <div className="text-6xl animate-bounce-sm">💪</div>
          : <div className="text-6xl">📈</div>}
      </div>
      <h2 className="text-2xl font-black text-white mb-2">Séance terminée !</h2>
      <p className={`font-bold mb-6 ${rank==="super"?"text-gradient-gold":rank==="medium"?"text-blue-400":"text-slate-400"}`}>
        {rank==="super"?"Performance légendaire !":rank==="medium"?"Séance solide 🔥":"Récupération active 📉"}
      </p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="glass rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Tonnage</p>
          <p className="text-3xl font-black text-gradient">{tonnage.toLocaleString()}<span className="text-sm text-slate-500 font-normal ml-1">kg</span></p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Calories</p>
          <p className="text-3xl font-black text-orange-400">{calories}<span className="text-sm text-orange-500/50 font-normal ml-1">kcal</span></p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button 
          onClick={onSyncAppleHealth}
          className="btn-primary w-full flex items-center justify-center gap-2 !bg-white !text-black !border-none hover:!bg-slate-200 transition-all font-bold"
        >
          <Activity size={18} />
          Sync avec Apple Santé
        </button>
        <button 
          onClick={onShare} 
          disabled={hasShared}
          className={`btn-primary w-full flex items-center justify-center gap-2 ${hasShared ? '!bg-emerald-600/50 !text-white/50 !border-emerald-500/30' : ''}`}
        >
          {hasShared ? <CheckCircle2 size={18} /> : <Share2 size={18} />}
          {hasShared ? "Séance partagée !" : "Partager ma séance"}
        </button>
        <button onClick={onClose} className="btn-glass w-full">Continuer</button>
      </div>
    </motion.div>
  </div>
);

// ─── Workout page ────────────────────────────────────────────────
const Workout = () => {
  const {
    currentSession, setCurrentSession, userSessions, handlePreSave,
    showConfirmModal, setShowConfirmModal,
    showErrorModal, setShowErrorModal,
    saveWorkout, sessionTonnage, sessionRank, showSummary, setShowSummary,
    isTimerRunning, timerSeconds, stopTimer, cnsScore,
    removeExerciseFromSession, createCustomSession, createCustomSessionWithExercises, deleteCustomSession, renameCustomSession,
    currentInput, updateCustomSchedule, schedules, gender, age
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [hasShared, setHasShared] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [sessionStartTime] = useState(() => Date.now());
  const [elapsedMin, setElapsedMin] = useState(0);

  // Smart Session Builder Wizard State
  const [showSmartBuilder, setShowSmartBuilder] = useState(false);
  const [smartStep, setSmartStep] = useState(1);
  const [smartDuration, setSmartDuration] = useState("standard");
  const [smartEquipment, setSmartEquipment] = useState("salle");
  const [smartTarget, setSmartTarget] = useState("fullbody");

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedMin(Math.floor((Date.now() - sessionStartTime) / 60000));
    }, 30000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const location = useLocation();
  useEffect(() => { 
    if (location.state?.session) {
      setCurrentSession(location.state.session); 
      // eslint-disable-next-line
      setHasShared(false); 
    }
  }, [location.state, setCurrentSession]);

  const session = userSessions[currentSession] || { category: "Perso", exercises: [], color: "from-indigo-600 to-indigo-800", title: "Séance Personnalisée", focus: "Ta séance sur mesure" };

  // Progress computation
  const progressPct = useMemo(() => {
    const total = session.exercises.length;
    if (total === 0) return 0;
    let done = 0;
    session.exercises.forEach(exo => {
      const sets = currentInput[exo.id] || [];
      const doneSets = sets.filter(s => s.done).length;
      const targetSets = parseInt(exo.sets) || 3;
      if (doneSets >= targetSets) done++;
    });
    return Math.round((done / total) * 100);
  }, [session.exercises, currentInput]);

  const generateSmartSession = () => {
    // Adapter selon le profil (âge, genre)
    const isFemale = gender === "femme";
    const userAge = parseInt(age) || 30;
    const isOlder = userAge >= 50;
    // 1. Durée / Nombre d'exercices
    let numExercises = 5;
    if (smartDuration === "express") numExercises = 3;
    if (smartDuration === "standard") numExercises = 5;
    if (smartDuration === "extreme") numExercises = 7;

    // 2. Muscles ciblés
    let muscles = [];
    if (smartTarget === "pecs_triceps") muscles = ["Pectoraux", "Triceps"];
    else if (smartTarget === "dos_biceps") muscles = ["Dos", "Lombaires", "Biceps"];
    else if (smartTarget === "jambes") muscles = ["Quadriceps", "Ischios", "Fessiers", "Mollets"];
    else if (smartTarget === "bras_epaules") muscles = ["Épaules", "Biceps", "Triceps", "Avant-bras"];
    else if (smartTarget === "fullbody") muscles = ["Pectoraux", "Dos", "Quadriceps", "Ischios", "Épaules", "Biceps", "Triceps", "Abdos"];
    else if (smartTarget === "upper") muscles = ["Pectoraux", "Dos", "Épaules", "Biceps", "Triceps"];
    else if (smartTarget === "lower") muscles = ["Quadriceps", "Ischios", "Fessiers", "Mollets"];

    // 3. Filtrer la bibliothèque
    let pool = exerciseLibrary.filter(exo => muscles.includes(exo.muscle));

    // Filtrer par équipement
    if (smartEquipment === "halteres") {
      pool = pool.filter(exo => 
        exo.name.toLowerCase().includes("haltère") || 
        exo.name.toLowerCase().includes("dumbbell") || 
        exo.name.toLowerCase().includes("écarté") ||
        exo.name.toLowerCase().includes("fentes") ||
        exo.name.toLowerCase().includes("bulgare")
      );
    } else if (smartEquipment === "barre") {
      pool = pool.filter(exo => 
        exo.name.toLowerCase().includes("barre") || 
        exo.name.toLowerCase().includes("barbell") || 
        exo.name.toLowerCase().includes("guidé") || 
        exo.name.toLowerCase().includes("smith")
      );
    } else if (smartEquipment === "poulies") {
      pool = pool.filter(exo => 
        exo.name.toLowerCase().includes("poulie") || 
        exo.name.toLowerCase().includes("cable") || 
        exo.name.toLowerCase().includes("vis-à-vis") || 
        exo.name.toLowerCase().includes("haltère") || 
        exo.name.toLowerCase().includes("dumbbell") ||
        exo.name.toLowerCase().includes("écarté")
      );
    } else if (smartEquipment === "bodyweight") {
      pool = pool.filter(exo => 
        exo.name.toLowerCase().includes("pompes") || 
        exo.name.toLowerCase().includes("push-up") || 
        exo.name.toLowerCase().includes("tractions") || 
        exo.name.toLowerCase().includes("pull-up") || 
        exo.name.toLowerCase().includes("chin-up") || 
        exo.name.toLowerCase().includes("dips") || 
        exo.name.toLowerCase().includes("sissy") || 
        exo.name.toLowerCase().includes("nordic") || 
        exo.name.toLowerCase().includes("crunch") || 
        exo.name.toLowerCase().includes("gainage") || 
        exo.name.toLowerCase().includes("squat poids du corps") ||
        exo.name.toLowerCase().includes("fentes")
      );
    }

    // fallback si aucun match n'est trouvé pour assurer une séance magnifique et robuste
    if (pool.length === 0) {
      const allPool = exerciseLibrary.filter(exo => muscles.includes(exo.muscle));
      pool = allPool.slice(0, 15);
    }

    // 4. Classer en polyarticulaires (compounds) et isolation pour un entraînement scientifique équilibré
    const compounds = pool.filter(exo => 
      exo.name.toLowerCase().includes("squat") || 
      exo.name.toLowerCase().includes("presse") || 
      exo.name.toLowerCase().includes("couché") || 
      exo.name.toLowerCase().includes("bench") || 
      exo.name.toLowerCase().includes("incliné") || 
      exo.name.toLowerCase().includes("deadlift") || 
      exo.name.toLowerCase().includes("soulevé de terre") || 
      exo.name.toLowerCase().includes("rowing") || 
      exo.name.toLowerCase().includes("tirage vertical") || 
      exo.name.toLowerCase().includes("tirage poitrine") || 
      exo.name.toLowerCase().includes("développé militaire") || 
      exo.name.toLowerCase().includes("military press") || 
      exo.name.toLowerCase().includes("tractions") || 
      exo.name.toLowerCase().includes("pull-up") || 
      exo.name.toLowerCase().includes("dips")
    );

    const isolations = pool.filter(exo => !compounds.some(c => c.id === exo.id));

    // Sélectionner les exercices de manière équilibrée
    const selected = [];
    const targetCompounds = Math.ceil(numExercises / 2);

    const shuffleArray = (arr) => [...arr].sort(() => 0.5 - Math.random());
    const shuffledCompounds = shuffleArray(compounds.length > 0 ? compounds : pool);
    const shuffledIsolations = shuffleArray(isolations.length > 0 ? isolations : pool);

    // Sélectionner les compounds
    for (let i = 0; i < Math.min(targetCompounds, shuffledCompounds.length); i++) {
      selected.push(shuffledCompounds[i]);
    }
    // Sélectionner les isolations (sans doublons)
    for (let i = 0; i < shuffledIsolations.length; i++) {
      if (selected.length >= numExercises) break;
      if (!selected.some(s => s.id === shuffledIsolations[i].id)) {
        selected.push(shuffledIsolations[i]);
      }
    }

    // --- Adaptation par Genre : pour femme, favoriser les fessiers si jambes sont ciblées
    if (isFemale && muscles.includes("Fessiers")) {
      const glutesExos = pool.filter(e => e.muscle === "Fessiers");
      glutesExos.forEach(gEx => {
        if (!selected.some(s => s.id === gEx.id) && selected.length < numExercises) {
           selected.push(gEx); // Remplacer ou forcer l'ajout
        }
      });
    }

    // Si on n'a toujours pas assez d'exercices, on pioche au hasard dans le pool global de départ
    if (selected.length < numExercises) {
      const shuffledPool = shuffleArray(pool);
      for (let i = 0; i < shuffledPool.length; i++) {
        if (selected.length >= numExercises) break;
        if (!selected.some(s => s.id === shuffledPool[i].id)) {
          selected.push(shuffledPool[i]);
        }
      }
    }

    // Assurer un ordre logique : Compounds d'abord, Isolation ensuite
    selected.sort((a, b) => {
      const aIsCompound = compounds.some(c => c.id === a.id);
      const bIsCompound = compounds.some(c => c.id === b.id);
      if (aIsCompound && !bIsCompound) return -1;
      if (!aIsCompound && bIsCompound) return 1;
      return 0;
    });

    let titleStr = "";
    if (smartTarget === "pecs_triceps") titleStr += "Pecs & Tri";
    else if (smartTarget === "dos_biceps") titleStr += "Dos & Bi";
    else if (smartTarget === "jambes") titleStr += "Jambes";
    else if (smartTarget === "bras_epaules") titleStr += "Bras & Épaules";
    else if (smartTarget === "fullbody") titleStr += "Full Body";
    else if (smartTarget === "upper") titleStr += "Upper Body";
    else if (smartTarget === "lower") titleStr += "Lower Body";

    // Couleur assortie thématique
    const colors = [
      "from-blue-600 to-indigo-800",
      "from-pink-600 to-purple-800",
      "from-emerald-600 to-cyan-800",
      "from-amber-600 to-red-800"
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // Créer la séance
    const adaptedExercises = selected.map((exo, idx) => {
      let sets = 3;
      let reps = "8-12";
      const isCompound = compounds.some(c => c.id === exo.id);
      
      // Adapter le volume et les répétitions pour les séniors (prévention blessures / santé articulaire)
      if (isOlder) {
        sets = 3;
        reps = "10-15"; 
      } else {
        if (isCompound) {
           sets = 4;
           reps = "5-8";
        } else {
           sets = 3;
           reps = "10-15";
        }
      }

      return {
        ...exo,
        sets: String(sets),
        reps: reps,
        rest: isOlder ? "120s" : (isCompound ? "120s" : "90s"),
        notes: isOlder ? "Privilégie l'exécution à la charge. Temps sous tension lent." : (idx === 0 ? "Exercice principal. Surcharge progressive." : "Concentration sur la contraction (mind-muscle connection).")
      };
    });

    const nextKey = createCustomSessionWithExercises(titleStr, adaptedExercises, randomColor);
    if (nextKey) {
      setCurrentSession(nextKey);
      triggerHaptic([60, 50, 60]);
    }

    // Réinitialiser les états
    setShowSmartBuilder(false);
    setSmartStep(1);
  };

  const fmt = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

  const applyProgram = (prog) => {
    if (window.confirm(`Appliquer le programme "${prog.title}" à ta semaine ?`)) {
      const newSchedule = prog.days.map(d => ({
        session: d.session,
        label: d.label,
        status: null
      }));
      updateCustomSchedule(newSchedule);
      setShowTemplates(false);
    }
  };

  const handleShareWorkout = async () => {
    if (hasShared) return;
    try {
      // Get session from supabase client directly
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      if (!authSession?.user) return;
      
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', authSession.user.id).single();
      const userName = profile?.email ? profile.email.split('@')[0] : "Utilisateur";
      const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

      // Collect exercises done
      const exercisesDone = [];
      Object.keys(currentInput).forEach(exoId => {
        const exoDef = session.exercises.find(e => e.id === exoId);
        if (exoDef) {
          const doneSets = currentInput[exoId].filter(s => s.done).length;
          if (doneSets > 0) exercisesDone.push({ name: exoDef.name, sets: doneSets });
        }
      });

      const workoutData = {
        sessionTitle: session.title,
        tonnage: sessionTonnage,
        rank: sessionRank,
        exercises: exercisesDone
      };

      await supabase.from('messages').insert([{
        user_id: authSession.user.id,
        user_email: capitalizedName,
        content: `J'ai terminé ma séance ! 🚀`,
        workout_data: workoutData
      }]);
      
      setHasShared(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncAppleHealth = async () => {
    // Collect exercises done
    const exercisesDone = [];
    Object.keys(currentInput).forEach(exoId => {
      const exoDef = session.exercises.find(e => e.id === exoId);
      if (exoDef) {
        const doneSets = currentInput[exoId].filter(s => s.done).length;
        if (doneSets > 0) exercisesDone.push(`${exoDef.name} (${doneSets} séries)`);
      }
    });

    const sessionData = {
      title: session.title,
      tonnage: sessionTonnage,
      date: new Date().toLocaleDateString('fr-FR'),
      type: "Musculation",
      exercises: exercisesDone.join(', ')
    };
    
    await syncWorkoutToAppleHealth(sessionData);
  };

  return (
    <div className="page-container">
      

      {/* ── SESSION PROGRESS BAR (sticky top) ── */}
      {session.exercises.length > 0 && (
        <div className="session-progress-bar">
          <motion.div className="session-progress-fill" style={{ width: 0 }}
            animate={{ width: `${progressPct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
        </div>
      )}

      {/* ── SESSION LIVE STATS ── */}
      {session.exercises.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-400">En cours</span>
            {elapsedMin > 0 && <span className="badge badge-slate text-[9px]">⏱ {elapsedMin} min</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500">{progressPct}% complété</span>
            {sessionTonnage > 0 && <span className="badge badge-blue text-[9px]">⚡ {sessionTonnage}kg</span>}
          </div>
        </motion.div>
      )}







        <AnimatePresence>
          {showTemplates && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-2.5 mt-4 p-1">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1 mb-1">Programmes recommandés</p>
                {schedules.map((prog, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => applyProgram(prog)}
                    className="glass-card p-4 flex justify-between items-center hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                        <Zap size={18} fill={idx === 0 ? "currentColor" : "none"} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{prog.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{prog.desc}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-slate-600 group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <Check size={14} />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showErrorModal && (
          <div className="modal-overlay" onClick={() => setShowErrorModal(false)}>
            <motion.div className="modal-card" initial={{ scale:.8, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.8, opacity:0 }} transition={{ type:"spring", stiffness:280, damping:22 }} onClick={e=>e.stopPropagation()}>
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-black text-white mb-2">Rien à valider</h3>
              <p className="text-sm text-slate-400 mb-6">Coche au moins une série avec un poids pour terminer la séance.</p>
              <button onClick={() => setShowErrorModal(false)} className="btn-glass w-full">Compris</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="modal-overlay">
            <motion.div className="modal-card" initial={{ scale:.8, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.8, opacity:0 }} transition={{ type:"spring", stiffness:280, damping:22 }}>
              <CheckCircle2 size={52} className="text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white mb-2">Valider la séance ?</h3>
              <p className="text-sm text-slate-400 mb-6">Veux-tu vraiment valider ta séance ?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="btn-glass flex-1">Non, continuer</button>
                <button onClick={() => { saveWorkout(); hapticSuccess(); }} className="btn-primary flex-1">Oui, valider !</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSummary && (
          <SummaryModal 
            rank={sessionRank} 
            tonnage={sessionTonnage}
            calories={Math.round(Math.max(10, elapsedMin) * 5 * ((currentBodyWeight || 75) / 70))} 
            onClose={() => setShowSummary(false)} 
            onShare={handleShareWorkout} 
            hasShared={hasShared}
            onSyncAppleHealth={handleSyncAppleHealth}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exerciseToDelete && (
          <div className="modal-overlay" onClick={() => setExerciseToDelete(null)}>
            <motion.div className="modal-card" initial={{ scale:.8, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.8, opacity:0 }} transition={{ type:"spring", stiffness:280, damping:22 }} onClick={e=>e.stopPropagation()}>
              <AlertTriangle size={52} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white mb-2">Supprimer l'exercice ?</h3>
              <p className="text-sm text-slate-400 mb-6">Es-tu sûr de vouloir retirer <span className="font-bold text-white">{exerciseToDelete.name}</span> de cette séance ?</p>
              <div className="flex gap-3">
                <button onClick={() => setExerciseToDelete(null)} className="btn-glass flex-1">Annuler</button>
                <button onClick={() => {
                  removeExerciseFromSession(currentSession, exerciseToDelete.id);
                  setExerciseToDelete(null);
                }} className="btn-primary flex-1 !bg-red-600/20 !border-red-500/50 !text-red-500 hover:!bg-red-600/40 hover:!border-red-500">Oui, supprimer</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && <AddExerciseModal sessionId={currentSession} onClose={() => setShowAddModal(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showAddSessionModal && <AddSessionModal onClose={() => setShowAddSessionModal(false)} />}
      </AnimatePresence>

      {/* Floating timer — premium circular style */}
      <AnimatePresence>
        {isTimerRunning && (
          <motion.div className="timer-float cursor-grab active:cursor-grabbing"
            drag
            dragConstraints={{ 
              left: -(typeof window !== 'undefined' ? window.innerWidth - 80 : 300), 
              right: 0, 
              top: -(typeof window !== 'undefined' ? window.innerHeight - 100 : 500), 
              bottom: 0 
            }}
            dragMomentum={false}
            dragElastic={0.2}
            whileDrag={{ scale: 1.05 }}
            initial={{ opacity:0, y:20, scale:.9 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:20, scale:.9 }}>
            {/* Circular progress ring */}
            <svg width="64" height="64" className="-rotate-90 mb-1">
              <circle cx="32" cy="32" r="26" strokeWidth="4" fill="none" stroke="rgba(255,255,255,0.07)" />
              <circle cx="32" cy="32" r="26" strokeWidth="4" fill="none" stroke="#3b82f6"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - Math.min(timerSeconds / 120, 1))}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px #3b82f690)', transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black font-mono text-white leading-none">{fmt(timerSeconds)}</span>
              <span className="text-[7px] text-blue-400 uppercase font-bold tracking-wider">Repos</span>
            </div>
            <button onClick={() => { stopTimer(); }} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
              <X size={9} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session selector */}
      <div className="flex gap-3 overflow-x-auto pt-3 pb-4 mb-5 scrollbar-hide snap-x px-1">
        {Object.entries(userSessions).map(([key, s]) => {
          const isActive = currentSession === key;
          return (
            <div key={key} className={`relative snap-center shrink-0 transition-all duration-300 ${isActive ? "scale-[1.02]" : "hover:scale-[1.01]"}`}>
              <button 
                onClick={() => setCurrentSession(key)}
                className={`w-[88px] h-[80px] rounded-2xl flex flex-col items-center justify-center border transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? "bg-gradient-to-br from-blue-600/90 to-indigo-700/90 border-blue-400/50 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/10"
                    : "bg-white/4 border-white/5 text-slate-400 hover:border-white/12 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                )}
                <span className="text-base font-black tracking-tight">{key}</span>
                <span className="text-[8.5px] font-black uppercase tracking-wider mt-1 w-full px-1 text-center truncate">
                  {s.category}
                </span>
              </button>
              
              {/* Croix rouge supprimer - visible sur iPhone */}
              {!['A','B','C','D','E','F','G','H','I','J','K','L'].includes(key) && (
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (window.confirm(`Supprimer définitivement la séance ${key} ?`)) {
                      deleteCustomSession(key); 
                      if(currentSession===key) setCurrentSession('A'); 
                    }
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-white z-20 shadow-md shadow-red-500/30 hover:scale-110 active:scale-90 transition-all"
                >
                  <X size={10} strokeWidth={3} />
                </button>
              )}
            </div>
          );
        })}
        {/* Bouton Créer */}
        <button
          onClick={() => { setNewSessionName(""); setShowCreateSession(true); }}
          className="snap-center shrink-0 w-[88px] h-[80px] rounded-2xl border border-dashed border-white/20 text-slate-500 hover:text-white hover:border-white/40 flex flex-col items-center justify-center gap-1 transition-all bg-white/2"
        >
          <Plus size={16}/>
          <span className="text-[8.5px] uppercase tracking-wider font-black">Créer</span>
        </button>

        {/* Bouton Smart Builder */}
        <button
          onClick={() => {
            setSmartStep(1);
            setShowSmartBuilder(true);
            triggerHaptic(15);
          }}
          className="snap-center shrink-0 w-[88px] h-[80px] rounded-2xl border border-dashed border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 transition-all bg-cyan-950/20 hover:bg-cyan-950/40 glow-blue/20"
        >
          <Zap size={16} className="animate-pulse text-cyan-400" />
          <span className="text-[8.5px] uppercase tracking-wider font-black">Smart ⚡</span>
        </button>
      </div>

      {/* Session info banner */}
      <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} key={currentSession}
        className="glass-card p-4 mb-6 card-accent-blue flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-white mb-0.5">{session.title}</h2>
          <p className="text-sm text-blue-400 font-medium">{session.focus}</p>
          {cnsScore !== null && (
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              CNS Score : <span className="font-bold text-white">{cnsScore}/100</span>
            </p>
          )}
        </div>
        {!['A','B','C','D','E','F','G','H','I','J','K','L'].includes(currentSession) && (
          <button 
            onClick={() => {
              const newName = window.prompt("Nouveau nom de la séance :", session.category);
              if (newName && newName.trim()) renameCustomSession(currentSession, newName.trim());
            }}
            className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center hover:bg-blue-500/20 active:scale-95 transition-all shrink-0 ml-2"
            title="Renommer la séance"
          >
            <Edit2 size={16} />
          </button>
        )}
      </motion.div>

      {/* Create session modal */}
      <AnimatePresence>
        {showCreateSession && (
          <div className="modal-overlay" onClick={() => setShowCreateSession(false)}>
            <motion.div className="modal-card" initial={{ scale:.8, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.8, opacity:0 }} onClick={e=>e.stopPropagation()}>
              <Plus size={40} className="text-indigo-400 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white mb-2">Créer une séance</h3>
              <p className="text-sm text-slate-400 mb-5">Donne un nom à ta nouvelle séance personnalisée.</p>
              <input
                type="text"
                placeholder="Ex: Épaules Lourd, Cardio HIIT..."
                value={newSessionName}
                onChange={e => setNewSessionName(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter' && newSessionName.trim()) { createCustomSession(newSessionName.trim()); setShowCreateSession(false); }}}
                className="input-premium mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setShowCreateSession(false)} className="btn-glass flex-1">Annuler</button>
                <button
                  onClick={() => { if(newSessionName.trim()) { createCustomSession(newSessionName.trim()); setShowCreateSession(false); }}}
                  disabled={!newSessionName.trim()}
                  className="btn-primary flex-1 disabled:opacity-50"
                >Créer ✓</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Smart Builder Modal */}
      <AnimatePresence>
        {showSmartBuilder && (
          <div className="modal-overlay" onClick={() => setShowSmartBuilder(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              onClick={e => e.stopPropagation()}
              className="glass-dark w-[95%] sm:w-full max-w-lg rounded-3xl p-5 border border-cyan-500/20 shadow-2xl flex flex-col relative overflow-hidden"
            >
              {/* Background decorative orbs for wizard */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Wizard header */}
              <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center border border-cyan-500/30">
                    <Zap size={16} className="text-cyan-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Smart Builder</h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Algorithme Scientifique</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSmartBuilder(false)} 
                  className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Dynamic steps indicator */}
              <div className="flex items-center gap-2 mb-6 relative z-10">
                {[1, 2, 3].map(step => (
                  <div key={step} className="flex-1 flex flex-col gap-1.5">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${
                      smartStep >= step 
                        ? "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]" 
                        : "bg-slate-800"
                    }`} />
                    <span className={`text-[8.5px] font-black uppercase tracking-wider text-center ${
                      smartStep === step ? "text-cyan-400" : "text-slate-600"
                    }`}>
                      {step === 1 ? "1. Durée" : step === 2 ? "2. Matériel" : "3. Cible"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Wizard steps content */}
              <div className="flex-1 min-h-[220px] mb-6 relative z-10">
                {/* STEP 1: DURATION */}
                {smartStep === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <p className="text-sm font-bold text-slate-300 mb-2">Sélectionne la durée souhaitée :</p>
                    {[
                      { id: "express", name: "Séance Express ⚡", desc: "30 min • 3 exercices intenses ciblés", color: "border-amber-500/25 bg-amber-500/5 hover:border-amber-400" },
                      { id: "standard", name: "Séance Standard 🏋️‍♂️", desc: "60 min • 5 exercices • Idéal pour l'hypertrophie", color: "border-blue-500/25 bg-blue-500/5 hover:border-blue-400" },
                      { id: "extreme", name: "Séance Extrême 🔥", desc: "90 min • 7 exercices • Volume & Intensité max", color: "border-red-500/25 bg-red-500/5 hover:border-red-400" }
                    ].map(opt => {
                      const isSelected = smartDuration === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setSmartDuration(opt.id);
                            triggerHaptic(15);
                          }}
                          className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isSelected 
                              ? "bg-slate-900 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.15)]" 
                              : "bg-slate-950/40 border-white/5 hover:bg-slate-900/60"
                          }`}
                        >
                          <div>
                            <p className={`text-sm font-black ${isSelected ? "text-cyan-400" : "text-white"}`}>{opt.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-cyan-400 bg-cyan-400/20" : "border-slate-700"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}

                {/* STEP 2: EQUIPMENT */}
                {smartStep === 2 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-2.5"
                  >
                    <p className="text-sm font-bold text-slate-300 mb-2">Équipement disponible :</p>
                    {[
                      { id: "salle", name: "Salle Complète 🏢", desc: "Accès à toutes les machines, barres & poulies" },
                      { id: "halteres", name: "Haltères Uniquement 🧴", desc: "Parfait pour s'entraîner à la maison ou en voyage" },
                      { id: "poulies", name: "Poulies + Haltères 🔌", desc: "Idéal pour une tension continue et isolation" },
                      { id: "barre", name: "Barre Libre & Guidée 🏋️", desc: "Focus sur les mouvements de force fondamentaux" },
                      { id: "bodyweight", name: "Poids du Corps 🤸", desc: "Calisthénie et exercices au poids de corps" }
                    ].map(opt => {
                      const isSelected = smartEquipment === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setSmartEquipment(opt.id);
                            triggerHaptic(15);
                          }}
                          className={`w-full px-4 py-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isSelected 
                              ? "bg-slate-900 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.15)]" 
                              : "bg-slate-950/40 border-white/5 hover:bg-slate-900/60"
                          }`}
                        >
                          <div>
                            <p className={`text-xs font-black ${isSelected ? "text-cyan-400" : "text-white"}`}>{opt.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                          </div>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-cyan-400 bg-cyan-400/20" : "border-slate-700"
                          }`}>
                            {isSelected && <div className="w-1.2 h-1.2 rounded-full bg-cyan-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}

                {/* STEP 3: TARGET MUSCLES */}
                {smartStep === 3 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-2 gap-2"
                  >
                    <p className="text-sm font-bold text-slate-300 col-span-2 mb-1">Cible anatomique :</p>
                    {[
                      { id: "fullbody", name: "Full Body 🌍", desc: "Corps Complet" },
                      { id: "upper", name: "Upper Body 🔼", desc: "Haut du Corps" },
                      { id: "lower", name: "Lower Body 🔽", desc: "Bas du Corps" },
                      { id: "pecs_triceps", name: "Pecs & Tri 🦖", desc: "Push Ciblé" },
                      { id: "dos_biceps", name: "Dos & Bi 🦅", desc: "Pull Ciblé" },
                      { id: "bras_epaules", name: "Bras & Épaules ⚡", desc: "Focus Esthétique" },
                      { id: "jambes", name: "Jambes 🦾", desc: "Focus Bas" }
                    ].map(opt => {
                      const isSelected = smartTarget === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setSmartTarget(opt.id);
                            triggerHaptic(15);
                          }}
                          className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                            isSelected 
                              ? "bg-slate-900 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.15)] col-span-2" 
                              : "bg-slate-950/40 border-white/5 hover:bg-slate-900/60"
                          }`}
                        >
                          <span className={`text-xs font-black ${isSelected ? "text-cyan-400" : "text-white"}`}>{opt.name}</span>
                          <span className="text-[9px] text-slate-500">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </div>

              {/* Wizard footer action buttons */}
              <div className="flex gap-3 relative z-10 border-t border-white/5 pt-4">
                {smartStep > 1 ? (
                  <button 
                    onClick={() => {
                      setSmartStep(prev => prev - 1);
                      triggerHaptic(15);
                    }}
                    className="btn-glass flex-1 py-3 text-xs"
                  >
                    Retour
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowSmartBuilder(false)} 
                    className="btn-glass flex-1 py-3 text-xs"
                  >
                    Annuler
                  </button>
                )}

                {smartStep < 3 ? (
                  <button 
                    onClick={() => {
                      setSmartStep(prev => prev + 1);
                      triggerHaptic(15);
                    }}
                    className="btn-primary flex-1 py-3 text-xs !bg-gradient-to-r !from-cyan-500 !to-blue-600 !border-cyan-400/30"
                  >
                    Suivant
                  </button>
                ) : (
                  <button 
                    onClick={generateSmartSession}
                    className="btn-primary flex-1 py-3 text-xs !bg-gradient-to-r !from-cyan-500 !to-indigo-600 !border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.35)] animate-pulse"
                  >
                    Générer Séance ✓
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Intensity legend */}
      <div className="glass-card p-4 mb-6 border-purple-500/15">
        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Zap size={10}/> Techniques d'Intensité (Clic sur N° dernière série)</p>
        <div className="flex flex-wrap gap-2">
          {[["🔥","Échec","red"],["💧","Drop Set","purple"],["⚡","Myo-Reps","yellow"]].map(([e,l,c])=>(
            <span key={e} className={`badge badge-${c}`}>{e} {l}</span>
          ))}
        </div>
      </div>

      {/* Exercises */}
      {session.exercises.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 mb-6 border-indigo-500/30 text-center flex flex-col items-center gap-4"
        >
          <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${session.color || 'from-indigo-600 to-indigo-800'} flex items-center justify-center shadow-2xl text-white text-3xl font-black`}>
            {currentSession}
          </div>
          <div>
            <h3 className="text-xl font-black text-white mb-2">{session.category || 'Séance Personnalisée'}</h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">Cette séance est vide. Ajoute les exercices de ton choix depuis la bibliothèque.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddModal(true)} className="btn-primary px-4 py-3 text-sm gap-2">
              <Plus size={18} /> Exercice
            </button>
            <button onClick={() => setShowAddSessionModal(true)} className="btn-glass px-4 py-3 text-sm gap-2 border-dashed">
              <Target size={18} /> Séance complète
            </button>
          </div>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">Sauvegardés automatiquement</p>
        </motion.div>
      ) : (
        <>
          {session.exercises.map((exo, i) => <ExerciseCard key={exo.id} exo={exo} index={i} sessionId={currentSession} onRemoveRequest={setExerciseToDelete} />)}
          {/* Add exercise / session buttons */}
          <div className="flex gap-2 w-full mb-12">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 glass border-dashed border-white/20 py-6 rounded-2xl flex flex-col items-center gap-2 text-slate-500 hover:text-blue-400 hover:border-blue-500/50 transition-all"
            >
              <Plus size={24}/>
              <span className="text-sm font-bold text-center">Ajouter un exercice</span>
            </button>
            <button
              onClick={() => setShowAddSessionModal(true)}
              className="flex-1 glass border-dashed border-white/20 py-6 rounded-2xl flex flex-col items-center gap-2 text-slate-500 hover:text-purple-400 hover:border-purple-500/50 transition-all"
            >
              <Target size={24}/>
              <span className="text-sm font-bold text-center">Ajouter une séance</span>
            </button>
          </div>
        </>
      )}


      {/* Save button */}
      <div className="fixed-save-bar glass-dark border-t border-white/5 px-4 pt-3 pb-3 flex justify-center">
        <motion.button
          whileTap={{ scale:.97 }}
          onClick={handlePreSave}
          className="btn-primary w-full max-w-lg text-base py-4 neon-border shadow-2xl">
          <Save size={20} /> Valider la Séance
        </motion.button>
      </div>
      <div className="h-52" />
    </div>
  );
};

export default Workout;
