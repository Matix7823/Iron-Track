import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { sessions } from "../data/sessions";
import { parseDate } from "../utils/date";
import { normalizeHistory, getPerformanceMetrics, calculate1RM, getStrengthStandard, calculateCNSScore } from "../utils/metrics";
import {
  Dumbbell, TrendingUp, Zap, Activity, Target, Trophy,
  Moon, Frown, Brain, ArrowRight, Flame, BarChart2, Calendar,
  ChevronRight, Bolt, Droplets, Coffee, Utensils, WifiOff
} from "lucide-react";
import Heatmap from "../components/charts/Heatmap";
import { formatDateFR } from "../utils/date";

// ─── Animated counter ───────────────────────────────────────────
const AnimatedNumber = ({ value, suffix = "" }) => {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {value}{suffix}
    </motion.span>
  );
};

// ─── Circular Progress Ring ─────────────────────────────────────
const Ring = ({ score, size = 72, strokeWidth = 6, color = "#3b82f6" }) => {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * Math.min(score, 100)) / 100;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle className="ring-track" cx={size/2} cy={size/2} r={r} strokeWidth={strokeWidth} />
      <circle
        className="ring-fill"
        cx={size/2} cy={size/2} r={r}
        strokeWidth={strokeWidth}
        stroke={color}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
    </svg>
  );
};



const container = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

// ─── Dashboard ───────────────────────────────────────────────────
const Dashboard = () => {
  const { 
    history, bodyWeightHistory, allExercises, currentBodyWeight, 
    setStressLevel, sorenessLevel, setSorenessLevel, calculateCNS, resetCNS,
    updateDayStatus, dailyNutrition, logWater, isOffline
  } = useApp();
  const { profile } = useAuth();
  const [showYesterdayCheck, setShowYesterdayCheck] = useState(false);

  useEffect(() => {
    const lastCheck = localStorage.getItem('iron_last_yesterday_check');
    const today = new Date().toDateString();
    if (lastCheck !== today) {
      setShowYesterdayCheck(true);
    }
  }, []);

  const handleYesterdayAnswer = (answer) => {
    // yesterday index (0-6)
    const todayIdx = (new Date().getDay() + 6) % 7; // 0=Mon, 6=Sun
    const yesterdayIdx = (todayIdx + 6) % 7;
    
    if (answer === 'repos') {
      updateDayStatus(yesterdayIdx, 'rest');
    }
    localStorage.setItem('iron_last_yesterday_check', new Date().toDateString());
    setShowYesterdayCheck(false);
  };

  const todayStr = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  
  const userName = profile?.email ? profile.email.split('@')[0] : "";
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

  // Streak
  const streak = useMemo(() => {
    const dates = new Set();
    Object.values(history).forEach(e => e.forEach(h => { if (h.date) dates.add(h.date); }));
    const sorted = [...dates].map(d => parseDate(d)).sort((a, b) => b - a);
    if (!sorted.length) return 0;
    const msDay = 864e5;
    const now = new Date(); now.setHours(0,0,0,0);
    if (Math.floor((now - sorted[0]) / msDay) > 1) return 0;
    let s = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (Math.floor((sorted[i-1] - sorted[i]) / msDay) === 1) s++;
      else break;
    }
    return s;
  }, [history]);

  // Weekly stats
  const weekStats = useMemo(() => {
    const now = new Date(), d7 = new Date(now - 7*864e5);
    let tonnage = 0; const dates = new Set();
    Object.values(history).forEach(entries => entries.forEach(e => {
      const d = parseDate(e.date);
      if (d >= d7 && d <= now) {
        dates.add(e.date);
        (e.setsData || []).forEach(s => { if (s.done && +s.weight > 0 && +s.reps > 0) tonnage += +s.weight * +s.reps; });
      }
    }));
    return { sessions: dates.size, tonnage: Math.round(tonnage) };
  }, [history]);

  // Total sessions
  const totalSessions = useMemo(() => {
    const d = new Set();
    Object.values(history).forEach(e => e.forEach(h => { if (h.date) d.add(h.date); }));
    return d.size;
  }, [history]);

  // Muscle recovery
  const recovery = useMemo(() => {
    const groups = { Pecs: ["Pecs (Haut)","Pecs (Masse)","Pecs (Bas)","Pecs (Iso)","Finition","Pecs"], Dos: ["Dos (Largeur)","Dos (Épaisseur)","Dos (Bas)","Dos (Isolation)","Dos"], Jambes: ["Cuisses","Ischios","Mollets","Jambes"], Épaules: ["Épaules (Masse)","Épaules (Latéral)","Arr. Épaules","Épaules","Trapèzes"], Bras: ["Biceps (Long)","Biceps (Court)","Brachial","Triceps (Masse)","Triceps (Long)","Triceps (Vaste)","Avant-Bras","Bras"], Abdos: ["Abdos","Abdos (Bas)","Obliques","Transverse","Gainage"] };
    const last = {}; const now = new Date();
    Object.keys(history).forEach(id => {
      const hist = history[id]; if (!hist?.length) return;
      const d = parseDate(hist[hist.length-1].date);
      const exo = allExercises.find(e => e.id === id); if (!exo) return;
      Object.entries(groups).forEach(([g, subs]) => { if (subs.includes(exo.muscle) && (!last[g] || d > last[g])) last[g] = d; });
    });
    return Object.keys(groups).map(g => {
      const d = last[g];
      if (!d) return { group: g, label: "Frais", pct: 100, color: "#34d399" };
      const days = Math.ceil(Math.abs(now - d) / 864e5);
      if (days <= 1) return { group: g, label: "Épuisé", pct: 15, color: "#ef4444" };
      if (days <= 2) return { group: g, label: "En récup", pct: 55, color: "#f59e0b" };
      return { group: g, label: "Frais", pct: 100, color: "#34d399" };
    });
  }, [history, allExercises]);

  // Top 1RMs
  const top1RMs = useMemo(() => [
    { label: "Couché", ids: ["a2","f1"], type: "bench" },
    { label: "Squat",  ids: ["c1","g1"], type: "squat" },
    { label: "Trac.",  ids: ["b1"],      type: "pullup" },
  ].map(lift => {
    let best = 0;
    lift.ids.forEach(id => normalizeHistory(history[id]||[]).forEach(h =>
      (h.setsData||[]).forEach(s => { if (+s.weight>0&&+s.reps>0&&s.done&&!s.isExtra) { const rm=calculate1RM(+s.weight,+s.reps); if(rm>best)best=rm; } })
    ));
    return { ...lift, best, std: getStrengthStandard(lift.type, best, currentBodyWeight) };
  }), [history, currentBodyWeight]);

  const cnsColor = !cnsScore ? "#3b82f6" : cnsScore >= 85 ? "#f59e0b" : cnsScore >= 45 ? "#34d399" : "#ef4444";

  return (
    <div className="page-container">
      <div className="bg-orbs" />

      {/* ── OFFLINE INDICATOR ── */}
      <AnimatePresence>
        {isOffline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-500/20 border-b border-red-500/30 p-2 text-center flex items-center justify-center gap-2 mb-4 rounded-xl"
          >
            <WifiOff size={14} className="text-red-400" />
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Mode Hors-ligne — Sauvegarde locale active</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEATMAP ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Heatmap history={history} />
      </motion.div>

      {/* ── YESTERDAY PROMPT ── */}
      <AnimatePresence>
        {showYesterdayCheck && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-card p-5 mb-6 border-blue-500/30 glow-blue relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
              <Calendar size={60} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-black text-white mb-1">Hier ? Repos ou Séance ?</h3>
            <p className="text-xs text-slate-400 mb-4">Mets à jour ton calendrier de la semaine.</p>
            <div className="flex gap-2">
              <button onClick={() => handleYesterdayAnswer('seance')} className="btn-primary flex-1 py-2 text-xs">J'ai poussé ! 💪</button>
              <button onClick={() => handleYesterdayAnswer('repos')} className="btn-glass flex-1 py-2 text-xs">C'était Repos 😴</button>
              <button onClick={() => setShowYesterdayCheck(false)} className="px-3 text-slate-500 hover:text-white transition-colors">
                <Bolt size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <motion.div variants={item} initial="hidden" animate="visible" className="mb-8">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1 capitalize">{todayStr}</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
          {greeting} <span className="text-blue-400">{capitalizedName}</span> 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Prêt à <span className="text-gradient font-bold">dominer</span> ta séance ?</p>
      </motion.div>

      {/* ── HERO STATS ROW ── */}
      <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        {[
          { label: "Séries 7j", value: weekStats.sessions, icon: Dumbbell, color: "text-blue-400", bg: "bg-blue-500/12" },
          { label: "Streak", value: streak, suffix: "🔥", icon: Flame, color: "text-orange-400", bg: "bg-orange-500/12" },
          { label: "Total", value: totalSessions, icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/12" },
        ].map(({ label, value, suffix = "", icon: Icon, color, bg }) => (
          <motion.div key={label} variants={item} className="stat-card text-center !p-2 sm:!p-4">
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-black text-white"><AnimatedNumber value={value} suffix={suffix} /></p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── NUTRITION WIDGETS ── */}
      <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3 mb-6">
        {/* Water Tracker */}
        <motion.div variants={item} className="glass-card p-4 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Hydratation</p>
              <p className="text-2xl font-black text-blue-400">
                {(dailyNutrition[formatDateFR()]?.water || 0).toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">L</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Droplets size={16} />
            </div>
          </div>
          <div className="flex gap-1 mt-4">
            {[0.25, 0.5].map(amount => (
              <button 
                key={amount}
                onClick={() => logWater(amount)}
                className="flex-1 py-1 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-[9px] font-bold text-blue-400 transition-all active:scale-95"
              >
                +{amount}L
              </button>
            ))}
          </div>
        </motion.div>

        {/* Quick Nutrition Info */}
        <motion.div variants={item} className="glass-card p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Calories Jour</p>
              {(() => {
                const nut = dailyNutrition[formatDateFR()] || { p: 0, c: 0, f: 0 };
                const cals = Math.round(nut.p * 4 + nut.c * 4 + nut.f * 9);
                return <p className="text-2xl font-black text-emerald-400">{cals} <span className="text-[10px] text-slate-500 font-normal">kcal</span></p>;
              })()}
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Utensils size={16} />
            </div>
          </div>
          <Link to="/analytics" className="mt-4 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-[9px] font-bold text-emerald-400 text-center transition-all block">
            Détails Macros
          </Link>
        </motion.div>
      </motion.div>



      {/* ── TONNAGE HERO ── */}
      {weekStats.tonnage > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="glass-card p-5 mb-6 neon-border glow-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1 flex items-center gap-1.5"><TrendingUp size={10} className="text-blue-400" /> Tonnage cette semaine</p>
              <p className="hero-number text-gradient">{weekStats.tonnage >= 1000 ? `${(weekStats.tonnage/1000).toFixed(1)}t` : `${weekStats.tonnage}kg`}</p>
            </div>
            <BarChart2 size={40} className="text-blue-400/20" />
          </div>
        </motion.div>
      )}

      {/* ── CNS LAB ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/12 flex items-center justify-center"><Brain size={17} className="text-blue-400" /></div>
          <div><p className="text-sm font-bold text-white">Laboratoire CNS</p><p className="text-[10px] text-slate-500">Calibre ton système nerveux</p></div>
        </div>
        {cnsScore === null ? (
          <div className="space-y-5">
            {[
              { label: "Sommeil", icon: Moon, color: "text-blue-400", cls: "accent-blue", val: sleepHours, set: setSleepHours, min: 3, max: 10, fmt: v => `${v}h` },
              { label: "Stress Mental", icon: Activity, color: "text-orange-400", cls: "accent-orange", val: stressLevel, set: setStressLevel, min: 1, max: 10, fmt: v => `${v}/10` },
              { label: "Courbatures", icon: Frown, color: "text-red-400", cls: "accent-red", val: sorenessLevel, set: setSorenessLevel, min: 1, max: 10, fmt: v => `${v}/10` },
            ].map(({ label, icon: Icon, color, cls, val, set, min, max, fmt }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-2">
                  <label className={`text-xs font-semibold text-slate-300 flex items-center gap-1.5`}><Icon size={12} className={color} />{label}</label>
                  <span className="text-sm font-black text-white">{fmt(val)}</span>
                </div>
                <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)} className={`w-full ${cls}`} />
              </div>
            ))}
            <button onClick={calculateCNS} className="btn-primary w-full mt-2"><Zap size={16} /> Scanner mon CNS</button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Ring score={cnsScore} color={cnsColor} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-black text-white">{cnsScore}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Score CNS</p>
                <p className="text-base font-bold mt-0.5" style={{ color: cnsColor }}>
                  {cnsScore >= 85 ? "⚡ Berserker" : cnsScore >= 70 ? "🟢 Optimal" : cnsScore >= 45 ? "🔵 Correct" : "🛡️ Fatigué"}
                </p>
                <p className="text-[10px] text-slate-600 mt-1">
                  {cnsScore >= 85 ? "+5% sur les charges" : cnsScore <= 30 ? "−10% recommandé" : "Séance normale"}
                </p>
              </div>
            </div>
            <button onClick={resetCNS} className="btn-glass text-xs shrink-0">Réévaluer</button>
          </div>
        )}
      </motion.div>

      {/* ── QUICK START ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-6">
        <p className="section-title"><Target size={18} className="text-blue-400" />Démarrer une séance</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {Object.entries(sessions).slice(0, 6).map(([key, s], i) => (
            <motion.div key={key} initial={{ opacity: 0, scale: .93 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .3 + i * .05 }}>
              <Link to="/workout" state={{ session: key }} className="glass-card glass-card-interactive p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 hover:glow-blue block no-underline group">
                <div className="flex items-center justify-between">
                  <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-sm font-black shadow-lg`}>{key}</span>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{s.category}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{s.exercises.length - 1} exercices</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── MUSCLE RECOVERY ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="glass-card p-5 mb-6">
        <p className="section-title text-base"><Activity size={16} className="text-emerald-400" />Récupération Musculaire</p>
        <div className="space-y-3">
          {recovery.map(({ group, label, pct, color }) => (
            <div key={group} className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300 w-16 shrink-0">{group}</span>
              <div className="flex-1 progress-track">
                <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
              </div>
              <span className="text-xs font-bold shrink-0" style={{ color }}>{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── 1RM RECORDS ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} className="glass-card p-4 sm:p-5 mb-6 glow-gold border-amber-500/15">
        <p className="section-title text-base"><Trophy size={16} className="text-amber-400" />Records Personnels</p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {top1RMs.map(lift => (
            <div key={lift.label} className="glass rounded-2xl p-2 sm:p-3 text-center">
              <p className="text-[9px] uppercase font-bold text-slate-500 mb-2">{lift.label}</p>
              <p className="text-xl font-black text-white">{lift.best || "—"}</p>
              {lift.best > 0 && <p className="text-[9px] text-slate-600">kg 1RM</p>}
              <p className={`text-[9px] font-bold mt-2 ${lift.std.color}`}>{lift.std.rank}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 text-center mt-3">*Ratios basés sur {currentBodyWeight} kg de poids de corps</p>
      </motion.div>

      {/* ── BODY WEIGHT ── */}
      {bodyWeightHistory.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}>
          <Link to="/profile" className="glass-card p-4 flex items-center justify-between hover:glow-purple block no-underline group">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Poids actuel</p>
              <p className="text-3xl font-black text-white mt-0.5">{currentBodyWeight} <span className="text-base text-slate-500 font-normal">kg</span></p>
            </div>
            <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-300 transition-colors">
              <span className="text-xs">Voir profil</span>
              <ArrowRight size={14} />
            </div>
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
