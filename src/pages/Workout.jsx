import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { exerciseLibrary } from "../data/exerciseLibrary";
import { normalizeHistory, getPerformanceMetrics, calculate1RM } from "../utils/metrics";
import {
  Save, CheckCircle2, Circle, Timer, PlayCircle, Flame, Zap,
  Target, Activity, AlertTriangle, TrendingDown, Clock,
  ChevronDown, ChevronUp, Info, Trophy, X, Plus, Search, Share2, Play, Check, Calendar, Settings
} from "lucide-react";

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

// ─── Add Exercise Modal ──────────────────────────────────────────
const AddExerciseModal = ({ sessionId, onClose }) => {
  const { addExerciseToSession } = useApp();
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("Tous");

  const muscles = ["Tous", ...new Set(exerciseLibrary.map(e => e.muscle))];
  const filtered = exerciseLibrary.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = muscleFilter === "Tous" || e.muscle === muscleFilter;
    return matchSearch && matchMuscle;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ y: 50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="glass-dark w-[95%] sm:w-full max-w-xl max-h-[80vh] rounded-3xl p-4 sm:p-6 overflow-hidden flex flex-col border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white">Bibliothèque</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X size={20}/></button>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
            <input 
              type="text" 
              placeholder="Chercher un exercice..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="input-premium pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2">
          {muscles.map(m => (
            <button 
              key={m} 
              onClick={() => setMuscleFilter(m)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${muscleFilter === m ? "bg-blue-600 text-white" : "glass text-slate-400 hover:text-white"}`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
          {filtered.map(exo => (
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
        </div>
      </motion.div>
    </div>
  );
};

// ─── ExerciseCard ────────────────────────────────────────────────
const ExerciseCard = ({ exo, index, sessionId, onRemoveRequest }) => {
  const { history, currentInput, getSetsForExo, handleSetChange, toggleSetDone, cycleSetTag, startTimer, energyLevel, allExercises } = useApp();
  const [open, setOpen] = useState(true);

  const sets = getSetsForExo(exo.id);
  const advice = getAdvice(exo, history[exo.id]||[], sets, energyLevel, allExercises, currentInput);
  const isJunk = advice.text.includes("JUNK VOLUME");
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

  return (
    <motion.div
      initial={{ opacity:0, y:16 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay: index * 0.055, duration: 0.4 }}
      className={`glass-card mb-4 overflow-hidden transition-all ${isJunk ? "opacity-40 grayscale pointer-events-none" : ""}`}
    >
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
            <button onClick={() => startTimer(exo.rest)}
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
                {oneRM > 0 && <span className="text-slate-500">1RM est. : <span className="text-white">{oneRM}kg</span></span>}
              </div>

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
                          {[6,7,8,9,10].map(n=><option key={n} value={n} className="bg-[#0a0f1e]">{n}</option>)}
                        </select>
                      </div>
                    )}
                    <button
                      onClick={() => !isJunk && toggleSetDone(exo.id, si, exo.rest)}
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
const SummaryModal = ({ rank, tonnage, onClose, onShare, hasShared }) => (
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
      <div className="glass rounded-2xl p-5 border border-white/5 mb-5">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Tonnage total soulevé</p>
        <p className="text-5xl font-black text-gradient">{tonnage.toLocaleString()}<span className="text-xl text-slate-500 font-normal ml-1">kg</span></p>
      </div>
      <div className="flex flex-col gap-2">
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
    removeExerciseFromSession, createCustomSession, deleteCustomSession,
    currentInput, customSchedule, updateCustomSchedule, schedules
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [hasShared, setHasShared] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");

  const location = useLocation();
  useEffect(() => { 
    if (location.state?.session) setCurrentSession(location.state.session); 
    setHasShared(false); 
  }, [location.state, setCurrentSession]);

  const session = userSessions[currentSession] || { category: "Perso", exercises: [], color: "from-indigo-600 to-indigo-800", title: "Séance Personnalisée", focus: "Ta séance sur mesure" };
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
      const { supabase } = await import('../supabaseClient');
      const { useAuth } = await import('../context/AuthContext');
      // Nous ne pouvons pas appeler de hooks ici, alors on récupère la session via supabase
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

  return (
    <div className="page-container">
      <div className="bg-orbs" />







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
      </div>

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
              <h3 className="text-xl font-black text-white mb-2">Terminer la séance ?</h3>
              <p className="text-sm text-slate-400 mb-6">Tu as bien tout complété ?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="btn-glass flex-1">Non, continuer</button>
                <button onClick={saveWorkout} className="btn-primary flex-1">Oui, valider !</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSummary && <SummaryModal rank={sessionRank} tonnage={sessionTonnage} onClose={() => setShowSummary(false)} onShare={handleShareWorkout} hasShared={hasShared} />}
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

      {/* Floating timer */}
      <AnimatePresence>
        {isTimerRunning && (
          <motion.div className="timer-float"
            initial={{ opacity:0, y:20, scale:.9 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:20, scale:.9 }}>
            <span className="text-3xl font-black font-mono text-white tracking-wider">{fmt(timerSeconds)}</span>
            <span className="text-[9px] text-blue-400 uppercase font-bold tracking-wider mt-1 flex items-center gap-1"><Clock size={9}/> Repos</span>
            <button onClick={stopTimer} className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
              <X size={11} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session selector */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-5 scrollbar-hide snap-x">
        {Object.entries(userSessions).map(([key, s]) => (
          <div key={key} className="relative group snap-center shrink-0">
            <button onClick={() => setCurrentSession(key)}
              className={`flex flex-col items-center px-4 py-3 rounded-2xl border transition-all duration-200 ${
                currentSession===key
                  ? "bg-gradient-to-br from-blue-600 to-blue-700 border-blue-400/50 text-white shadow-xl shadow-blue-500/25 scale-105"
                  : "glass border-white/8 text-slate-500 hover:border-white/16 hover:text-slate-300"
              }`}>
              <span className="text-lg font-black">{key}</span>
              <span className="text-[9px] uppercase font-bold tracking-wider opacity-80 mt-0.5 max-w-[50px] truncate">{s.category}</span>
            </button>
            {/* Delete button for custom sessions (K and beyond are deletable) */}
            {!['A','B','C','D','E','F','G','H','I','J'].includes(key) && (
              <button
                onClick={() => { deleteCustomSession(key); if(currentSession===key) setCurrentSession('A'); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full hidden group-hover:flex items-center justify-center text-white text-[10px] font-black hover:bg-red-400"
              >×</button>
            )}
          </div>
        ))}
        {/* Add new session button */}
        <button
          onClick={() => { setNewSessionName(""); setShowCreateSession(true); }}
          className="snap-center shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl border border-dashed border-white/20 text-slate-600 hover:text-white hover:border-white/40 transition-all"
        >
          <Plus size={20}/>
          <span className="text-[9px] font-bold mt-0.5">Créer</span>
        </button>
      </div>

      {/* Session info banner */}
      <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} key={currentSession}
        className="glass-card p-4 mb-6 card-accent-blue">
        <h2 className="text-xl font-black text-white mb-0.5">{session.title}</h2>
        <p className="text-sm text-blue-400 font-medium">{session.focus}</p>
        {cnsScore !== null && (
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            CNS Score : <span className="font-bold text-white">{cnsScore}/100</span>
          </p>
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
          <button onClick={() => setShowAddModal(true)} className="btn-primary px-8 py-3 text-sm gap-2">
            <Plus size={18} /> Construire ma séance
          </button>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">Sauvegardés automatiquement</p>
        </motion.div>
      ) : (
        <>
          {session.exercises.map((exo, i) => <ExerciseCard key={exo.id} exo={exo} index={i} sessionId={currentSession} onRemoveRequest={setExerciseToDelete} />)}
          {/* Add exercise button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full glass border-dashed border-white/20 py-6 rounded-2xl flex flex-col items-center gap-2 text-slate-500 hover:text-blue-400 hover:border-blue-500/50 transition-all mb-12"
          >
            <Plus size={24}/>
            <span className="text-sm font-bold">Ajouter un exercice</span>
          </button>
        </>
      )}


      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 glass-dark border-t border-white/5 p-4 pb-safe flex justify-center z-30">
        <motion.button
          whileTap={{ scale:.97 }}
          onClick={handlePreSave}
          className="btn-primary w-full max-w-lg text-base py-4 neon-border">
          <Save size={20} /> Valider la Séance
        </motion.button>
      </div>
      <div className="h-24" />
    </div>
  );
};

export default Workout;
