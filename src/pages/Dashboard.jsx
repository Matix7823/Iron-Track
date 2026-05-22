import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { sessions } from "../data/sessions";
import { exerciseLibrary } from "../data/exerciseLibrary";
import { parseDate, formatDateFR } from "../utils/date";
import { normalizeHistory, getPerformanceMetrics, calculate1RM, getStrengthStandard, calculateCNSScore } from "../utils/metrics";
import {
  Dumbbell, TrendingUp, Zap, Activity, Target, Trophy,
  Moon, Frown, Brain, ArrowRight, Flame, BarChart2, Calendar,
  ChevronRight, Bolt, Droplets, Coffee, Utensils, WifiOff, Lightbulb,
  Star, PlayCircle
} from "lucide-react";
import Heatmap from "../components/charts/Heatmap";
import OverloadTracker from "../components/dashboard/OverloadTracker";
import OnboardingModal from "../components/dashboard/OnboardingModal";


// ─── Daily Tips ────────────────────────────────────────────────────
const DAILY_TIPS = [
  { icon: "💪", tip: "Les muscles se développent au repos, pas pendant l'entraînement. Priorité : 7-9h de sommeil.", tag: "Récupération" },
  { icon: "🥩", tip: "Vise 1.6 à 2.2g de protéines par kg de poids de corps pour maximiser la synthèse musculaire.", tag: "Nutrition" },
  { icon: "📈", tip: "La surcharge progressive est la clé. Ajoute 2.5kg ou 1-2 reps à chaque séance.", tag: "Progression" },
  { icon: "⚡", tip: "L'hypertrophie maximale se produit entre 6 et 30 répétitions. Varie les plages selon l'exercice.", tag: "Science" },
  { icon: "🎯", tip: "La tension mécanique dans l'étirement (position basse) est le signal anabolique le plus puissant.", tag: "Science" },
  { icon: "💧", tip: "Boire 2.5L d'eau par jour améliore la force, l'endurance et la récupération musculaire.", tag: "Hydratation" },
  { icon: "🧠", tip: "La connexion esprit-muscle augmente l'activation de 50%. Concentre-toi sur le muscle cible.", tag: "Mind-Muscle" },
  { icon: "⏱️", tip: "60-120 secondes de repos entre les séries = équilibre parfait force/endurance/hypertrophie.", tag: "Technique" },
  { icon: "🔥", tip: "Le Myo-Rep : une série principale à l'échec + mini-séries de 3-5 reps. Maximise le volume utile.", tag: "Intensité" },
  { icon: "🏆", tip: "La cohérence bat l'intensité. 3 séances/semaine tout l'année > 6 mois à fond + abandon.", tag: "Mentalité" },
  { icon: "🌙", tip: "La créatine mono-hydrate (5g/jour) est le supplément le plus documenté et le plus efficace.", tag: "Nutrition" },
  { icon: "🦵", tip: "Les Bulgarians Split Squats sont l'exercice unilatéral le plus efficace pour les quadriceps.", tag: "Exercice" },
  { icon: "📊", tip: "Le volume hebdomadaire optimal : 10-20 séries par groupe musculaire pour l'hypertrophie.", tag: "Volume" },
  { icon: "🛌", tip: "La fenêtre anabolique post-entraînement dure 24h, pas 30 min. Mange bien toute la journée.", tag: "Mythe brisé" },
  { icon: "⚡", tip: "Les Drop Sets sur la dernière série augmentent le volume sans allonger le temps de séance.", tag: "Technique" },
  { icon: "🧬", tip: "La GH (hormone de croissance) est libérée massivement pendant le sommeil profond. Couche-toi avant 23h.", tag: "Science" },
  { icon: "🍌", tip: "Avant l'entraînement, 30-40g de glucides rapides (banane, riz blanc) boostent ta puissance de 7-12%.", tag: "Nutrition" },
  { icon: "🏋️", tip: "Le tempo 3-1-1-0 (3s descente, 1s bas, 1s montée) maximise la tension mécanique et active plus de fibres.", tag: "Technique" },
  { icon: "🔄", tip: "Alterner exercices compound et isolation dans la même séance améliore le stimulus métabolique global.", tag: "Programmation" },
  { icon: "🦶", tip: "Renforcer les mollets améliore l'explosivité, la stabilité des chevilles et prévient les blessures au genou.", tag: "Exercice" },
  { icon: "😤", tip: "La respiration Valsalva (bloquer l'air) pendant les levées lourdes protège la colonne et augmente la force de 10-15%.", tag: "Technique" },
  { icon: "☕", tip: "200mg de caféine 45min avant l'entraînement améliore la force max et la résistance à la douleur musculaire.", tag: "Nutrition" },
  { icon: "🌿", tip: "Les Oméga-3 (3g/j) réduisent l'inflammation musculaire et accélèrent la récupération entre les séances.", tag: "Nutrition" },
  { icon: "📐", tip: "Dans le développé couché, une prise légèrement plus large que les épaules maximise l'activation des pectoraux.", tag: "Biomécanique" },
  { icon: "🧊", tip: "Le bain froid (10-15°C, 10 min) réduit les courbatures de 30%. À ne pas utiliser après chaque séance.", tag: "Récupération" },
  { icon: "🎵", tip: "Écouter de la musique motivante augmente les performances de 15% et réduit la perception de l'effort.", tag: "Mental" },
  { icon: "📉", tip: "La décharge (Deload Week) toutes les 4-8 semaines prévient le plateau et permet une supercompensation maximale.", tag: "Programmation" },
  { icon: "🦴", tip: "Les tendons et ligaments s'adaptent 2-3x plus lentement que les muscles. Augmente les charges progressivement !", tag: "Science" },
  { icon: "⚖️", tip: "Le stress chronique élève le cortisol, qui catabolise le muscle. Mindfulness et repos = gains préservés.", tag: "Mental" },
  { icon: "🌅", tip: "10 min de marche post-repas améliorent la sensibilité à l'insuline et favorisent le partitionnement vers les muscles.", tag: "Récupération" },
];

// ─── Animated counter ────────────────────────────────────────────
const AnimatedNumber = ({ value, suffix = "" }) => (
  <motion.span key={value} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
    {value}{suffix}
  </motion.span>
);

// ─── Circular Progress Ring ──────────────────────────────────────
const Ring = ({ score, size = 76, strokeWidth = 7, color = "#3b82f6" }) => {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * Math.min(score, 100)) / 100;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle className="ring-track" cx={size/2} cy={size/2} r={r} strokeWidth={strokeWidth} />
      <circle className="ring-fill" cx={size/2} cy={size/2} r={r}
        strokeWidth={strokeWidth} stroke={color}
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ filter: `drop-shadow(0 0 8px ${color}90)` }}
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
    cnsScore, energyLevel, sleepHours, setSleepHours, stressLevel,
    setStressLevel, sorenessLevel, setSorenessLevel, calculateCNS, resetCNS,
    updateDayStatus, dailyNutrition, logWater, isOffline
  } = useApp();
  const { profile } = useAuth();
  const [showYesterdayCheck, setShowYesterdayCheck] = useState(false);

  useEffect(() => {
    const lastCheck = localStorage.getItem('iron_last_yesterday_check');
    const today = new Date().toDateString();
    if (lastCheck !== today) setShowYesterdayCheck(true);
  }, []);

  const handleYesterdayAnswer = (answer) => {
    const todayIdx = (new Date().getDay() + 6) % 7;
    const yesterdayIdx = (todayIdx + 6) % 7;
    if (answer === 'repos') updateDayStatus(yesterdayIdx, 'rest');
    localStorage.setItem('iron_last_yesterday_check', new Date().toDateString());
    setShowYesterdayCheck(false);
  };

  const todayStr = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const userName = profile?.email ? profile.email.split('@')[0] : "";
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

  // Daily Tip (changes each day)
  const todayTip = useMemo(() => {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
  }, []);

  // Streak
  const streak = useMemo(() => {
    const dates = new Set();
    Object.values(history || {}).forEach(entries => {
      if (Array.isArray(entries)) entries.forEach(h => { if (h?.date) dates.add(h.date); });
    });
    const sorted = [...dates].map(d => parseDate(d)).filter(d => d.getTime() > 0).sort((a, b) => b - a);
    if (!sorted.length) return 0;
    const msDay = 864e5;
    const now = new Date(); now.setHours(0,0,0,0);
    if (Math.round((now - sorted[0]) / msDay) > 1) return 0;
    let s = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (Math.round((sorted[i-1] - sorted[i]) / msDay) === 1) s++;
      else break;
    }
    return s;
  }, [history]);

  // Weekly stats
  const weekStats = useMemo(() => {
    const now = new Date(), d7 = new Date(now - 7*864e5);
    let tonnage = 0; const dates = new Set();
    Object.values(history || {}).forEach(entries => {
      if (Array.isArray(entries)) entries.forEach(e => {
        if (!e?.date) return;
        const d = parseDate(e.date);
        if (d >= d7 && d <= now) {
          dates.add(e.date);
          (e.setsData || []).forEach(s => { if (s?.done && +s.weight > 0 && +s.reps > 0) tonnage += +s.weight * +s.reps; });
        }
      });
    });
    return { sessions: dates.size, tonnage: Math.round(tonnage) };
  }, [history]);

  const totalSessions = useMemo(() => {
    const d = new Set();
    Object.values(history || {}).forEach(entries => {
      if (Array.isArray(entries)) entries.forEach(h => { if (h?.date) d.add(h.date); });
    });
    return d.size;
  }, [history]);

  // Muscle recovery
  const recovery = useMemo(() => {
    const groups = {
      Pecs: ["Pecs (Haut)", "Pecs (Masse)", "Pecs (Bas)", "Pecs (Iso)", "Finition", "Pecs", "Pectoraux"],
      Dos: ["Dos (Largeur)", "Dos (Épaisseur)", "Dos (Bas)", "Dos (Isolation)", "Dos", "Lombaires"],
      Jambes: ["Cuisses", "Ischios", "Mollets", "Jambes", "Quadriceps", "Adducteurs", "Abducteurs", "Fessiers", "Tibias"],
      Épaules: ["Épaules (Masse)", "Épaules (Latéral)", "Arr. Épaules", "Épaules", "Trapèzes"],
      Bras: ["Biceps (Long)", "Biceps (Court)", "Brachial", "Triceps (Masse)", "Triceps (Long)", "Triceps (Vaste)", "Avant-Bras", "Avant-bras", "Bras", "Biceps", "Triceps"],
      Abdos: ["Abdos", "Abdos (Bas)", "Obliques", "Transverse", "Gainage", "Taille"]
    };
    const now = new Date(); now.setHours(0,0,0,0);
    return Object.keys(groups).map(g => {
      const subs = groups[g];
      let records = [];
      Object.keys(history || {}).forEach(id => {
        const exo = allExercises.find(e => e.id === id) || exerciseLibrary.find(e => e.id === id);
        if (exo && subs.includes(exo.muscle)) {
          const hist = history[id];
          if (Array.isArray(hist)) hist.forEach(entry => {
            if (entry?.date) records.push({
              dateStr: entry.date, date: parseDate(entry.date),
              setsCount: (entry.setsData || []).filter(s => s?.done && parseFloat(s.weight) > 0).length
            });
          });
        }
      });
      if (!records.length) return { group: g, label: "Frais", pct: 100, color: "#34d399", desc: "Aucune séance récente. Prêt à performer !" };
      records.sort((a, b) => b.date - a.date);
      const lastDate = records[0].date, lastDateStr = records[0].dateStr;
      let vol = 0; records.forEach(r => { if (r.dateStr === lastDateStr) vol += r.setsCount; });
      const elapsedDays = Math.max(0, Math.floor((now.getTime() - lastDate.getTime()) / 864e5));
      let pct = 100, label = "Frais", color = "#34d399", desc = "Pleinement récupéré. Prêt à s'entraîner !";
      if (vol <= 3) {
        if (elapsedDays <= 1) { pct = 80; label = "Légère fatigue"; color = "#10b981"; desc = `${vol} série(s) ${elapsedDays === 0 ? "aujourd'hui" : "hier"}. Récupération très rapide.`; }
      } else if (vol <= 8) {
        if (elapsedDays === 0) { pct = 40; label = "Fatigué"; color = "#f59e0b"; desc = `${vol} séries aujourd'hui. Phase de récupération initiale.`; }
        else if (elapsedDays === 1) { pct = 75; label = "En récup"; color = "#84cc16"; desc = `${vol} séries hier. Muscle en bonne voie.`; }
        else if (elapsedDays === 2) { pct = 90; label = "Quasi frais"; color = "#a3e635"; desc = `${vol} séries il y a 2j. Récupération presque totale.`; }
      } else {
        if (elapsedDays === 0) { pct = 15; label = "Épuisé"; color = "#ef4444"; desc = `Séance intense (${vol} séries) aujourd'hui. Repos impératif !`; }
        else if (elapsedDays === 1) { pct = 45; label = "Fatigué"; color = "#f59e0b"; desc = `Séance intense hier. Courbatures probables, repos conseillé.`; }
        else if (elapsedDays === 2) { pct = 70; label = "En récup"; color = "#eab308"; desc = `Séance intense il y a 2j. Reconstruction en cours.`; }
        else if (elapsedDays === 3) { pct = 85; label = "Quasi récupéré"; color = "#84cc16"; desc = `Séance intense il y a 3j. Presque prêt pour une nouvelle stimulation.`; }
      }
      return { group: g, label, pct, color, desc };
    });
  }, [history, allExercises]);

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
  const heroGradient = hour < 12
    ? "from-blue-900/60 via-blue-800/40 to-cyan-900/30"
    : hour < 18
    ? "from-indigo-900/60 via-purple-800/40 to-blue-900/30"
    : "from-violet-900/60 via-purple-900/40 to-indigo-900/30";

  return (
    <div className="page-container">
      <OnboardingModal />

      {/* ── OFFLINE BANNER ── */}
      <AnimatePresence>
        {isOffline && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-red-500/15 border border-red-500/25 p-2.5 text-center flex items-center justify-center gap-2 mb-5 rounded-2xl">
            <WifiOff size={13} className="text-red-400" />
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Mode Hors-ligne — Sauvegarde locale active</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO BANNER ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className={`hero-banner bg-gradient-to-br ${heroGradient} mb-6 relative`}
      >
        <div className="mesh-bg opacity-40 rounded-3xl" />
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold mb-2 capitalize">{todayStr}</p>
              <motion.h1
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
                className="text-2xl sm:text-3xl font-black text-white leading-tight mb-1"
              >
                {greeting}{capitalizedName ? `, ` : " "}<span className="text-gradient">{capitalizedName}</span> 
                {streak > 2 ? " 🔥" : " 👋"}
              </motion.h1>
              <p className="text-sm text-white/60 mt-1">
                {streak > 0
                  ? <><span className="text-orange-400 font-black">{streak} jours</span> de streak actif</>
                  : "Prêt à dominer ta séance ?"}
              </p>
            </div>
            {/* CNS ring */}
            {cnsScore !== null && (
              <div className="relative shrink-0">
                <Ring score={cnsScore} color={cnsColor} size={70} strokeWidth={6} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-black text-white leading-none">{cnsScore}</span>
                  <span className="text-[8px] text-white/50 uppercase">CNS</span>
                </div>
              </div>
            )}
          </div>
          {/* Quick link */}
          <Link to="/workout"
            className="mt-5 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95">
            <PlayCircle size={16} className="text-blue-300" />
            Démarrer ma séance
            <ArrowRight size={14} className="opacity-60" />
          </Link>
        </div>
      </motion.div>

      {/* ── YESTERDAY CHECK ── */}
      <AnimatePresence>
        {showYesterdayCheck && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }} className="glass-card p-5 mb-6 border-blue-500/25 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-8 rotate-12"><Calendar size={60} className="text-blue-400" /></div>
            <h3 className="text-base font-black text-white mb-1">Hier ? Repos ou Séance ?</h3>
            <p className="text-xs text-slate-500 mb-4">Mets à jour ton calendrier de la semaine.</p>
            <div className="flex gap-2">
              <button onClick={() => handleYesterdayAnswer('seance')} className="btn-primary flex-1 py-2.5 text-xs !rounded-xl">J'ai poussé ! 💪</button>
              <button onClick={() => handleYesterdayAnswer('repos')} className="btn-glass flex-1 py-2.5 text-xs">C'était Repos 😴</button>
              <button onClick={() => setShowYesterdayCheck(false)} className="px-3 text-slate-600 hover:text-white transition-colors rounded-xl hover:bg-white/5"><Bolt size={14} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STATS ROW ── */}
      <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Séances 7j", value: weekStats.sessions, icon: Dumbbell, color: "text-blue-400", bg: "bg-blue-500/12", border: "border-blue-500/15" },
          { label: "Streak",     value: streak,             icon: Flame,   color: "text-orange-400", bg: "bg-orange-500/12", border: "border-orange-500/15", suffix: streak > 0 ? "🔥" : "" },
          { label: "Total",      value: totalSessions,      icon: Calendar, color: "text-violet-400", bg: "bg-violet-500/12", border: "border-violet-500/15" },
          { label: "Tonnage 7j", value: weekStats.tonnage >= 1000 ? `${(weekStats.tonnage/1000).toFixed(1)}t` : `${weekStats.tonnage}kg`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/12", border: "border-emerald-500/15" },
        ].map(({ label, value, suffix = "", icon: Icon, color, bg, border }) => (
          <motion.div key={label} variants={item} className={`stat-card text-center border ${border}`}>
            <div className={`w-7 h-7 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
              <Icon size={14} className={color} />
            </div>
            <p className="text-lg font-black text-white leading-none mb-0.5"><AnimatedNumber value={value} suffix={suffix} /></p>
            <p className="text-[8px] text-slate-600 uppercase tracking-wider">{label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── PROGRESSIVE OVERLOAD ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mb-6">
        <OverloadTracker history={history} />
      </motion.div>

      {/* ── CONSEIL DU JOUR ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="tip-card mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0 text-xl">
            {todayTip.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest">Conseil du Jour</p>
              <span className="badge badge-blue text-[8px] py-0.5 px-2">{todayTip.tag}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{todayTip.tip}</p>
          </div>
        </div>
      </motion.div>

      {/* ── HEATMAP ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
        <Heatmap history={history} />
      </motion.div>

      {/* ── HYDRATATION + CALORIES ── */}
      <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3 mb-6">
        <motion.div variants={item} className="glass-card p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Hydratation</p>
              <p className="text-2xl font-black text-blue-400">
                {((dailyNutrition && dailyNutrition[formatDateFR()])?.water || 0).toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">L</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-500/12 flex items-center justify-center border border-blue-500/15"><Droplets size={15} className="text-blue-400" /></div>
          </div>
          <div className="flex gap-1.5">
            {[0.25, 0.5].map(amount => (
              <button key={amount} onClick={() => logWater(amount)}
                className="flex-1 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 rounded-lg text-[9px] font-bold text-blue-400 transition-all border border-blue-500/15">
                +{amount}L
              </button>
            ))}
          </div>
        </motion.div>
        <motion.div variants={item} className="glass-card p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Calories Jour</p>
              {(() => {
                const nut = (dailyNutrition && dailyNutrition[formatDateFR()]) || { p: 0, c: 0, f: 0 };
                const cals = Math.round((nut.p || 0) * 4 + (nut.c || 0) * 4 + (nut.f || 0) * 9);
                return <p className="text-2xl font-black text-emerald-400">{cals} <span className="text-[10px] text-slate-500 font-normal">kcal</span></p>;
              })()}
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/12 flex items-center justify-center border border-emerald-500/15"><Utensils size={15} className="text-emerald-400" /></div>
          </div>
          <Link to="/analytics" className="block py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-[9px] font-bold text-emerald-400 text-center transition-all border border-emerald-500/15">
            Détails Macros →
          </Link>
        </motion.div>
      </motion.div>

      {/* ── DÉMARRER UNE SÉANCE ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="mb-6">
        <p className="section-title"><Target size={17} className="text-blue-400" />Démarrer une séance</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {Object.entries(sessions).slice(0, 6).map(([key, s], i) => (
            <motion.div key={key} initial={{ opacity: 0, scale: .93 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .3 + i * .05 }}>
              <Link to="/workout" state={{ session: key }}
                className="glass-card glass-card-interactive glass-card-3d p-3 sm:p-4 flex flex-col gap-2 hover:glow-blue block no-underline group">
                <div className="flex items-center justify-between">
                  <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-sm font-black shadow-lg`}>{key}</span>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight group-hover:text-blue-300 transition-colors">{s.category}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{s.exercises.length} exercices</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── CNS LAB ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="glass-card p-5 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/12 flex items-center justify-center border border-blue-500/15"><Brain size={17} className="text-blue-400" /></div>
          <div>
            <p className="text-sm font-bold text-white">Laboratoire CNS</p>
            <p className="text-[10px] text-slate-500">Calibre ton système nerveux avant de soulever</p>
          </div>
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
                  <label className={`text-xs font-semibold text-slate-300 flex items-center gap-1.5`}><Icon size={12} className={color}/>{label}</label>
                  <span className="text-sm font-black text-white">{fmt(val)}</span>
                </div>
                <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)} className={`w-full ${cls}`} />
              </div>
            ))}
            <button onClick={calculateCNS} className="btn-primary w-full mt-2"><Zap size={16} />Scanner mon CNS</button>
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

      {/* ── RÉCUPÉRATION MUSCULAIRE ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }} className="glass-card p-5 mb-6">
        <p className="section-title text-base"><Activity size={16} className="text-emerald-400" />Récupération Musculaire</p>
        
        <div className="space-y-4">
          {recovery.map(({ group, label, pct, color, desc }) => (
            <div key={group} className="pb-3 border-b border-white/5 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-300">{group}</span>
                <span className="text-xs font-black uppercase tracking-wider" style={{ color }}>{label}</span>
              </div>
              <div className="progress-track h-2 mb-2 bg-white/5">
                <motion.div className="progress-fill h-full rounded-full" style={{ width: 0, background: `linear-gradient(90deg, ${color}80, ${color})`, filter: `drop-shadow(0 0 4px ${color}60)` }}
                  animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut", delay: 0.1 }} />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── 1RM RECORDS ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass-card p-4 sm:p-5 mb-6 glow-gold border-amber-500/15">
        <div className="flex items-center justify-between mb-4">
          <p className="section-title text-base mb-0"><Trophy size={16} className="text-amber-400" />Records Personnels</p>
          <Link to="/pr-tracker" className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
            Tout voir <ArrowRight size={11} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {top1RMs.map(lift => (
            <div key={lift.label} className="glass rounded-2xl p-3 text-center border border-amber-500/10">
              <p className="text-[9px] uppercase font-bold text-slate-500 mb-2">{lift.label}</p>
              <p className="text-xl font-black text-white">{lift.best || "—"}</p>
              {lift.best > 0 && <p className="text-[9px] text-slate-600">kg 1RM</p>}
              <p className={`text-[9px] font-bold mt-2 ${lift.std.color}`}>{lift.std.rank}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 text-center mt-3">*Ratios basés sur {currentBodyWeight} kg de poids de corps</p>
      </motion.div>

      {/* ── POIDS ── */}
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
