import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { exerciseLibrary } from "../data/exerciseLibrary";
import { normalizeHistory, getPerformanceMetrics, calculate1RM } from "../utils/metrics";
import {
  Trophy, TrendingUp, Zap, Search, Filter, Star,
  ChevronDown, ChevronUp, BarChart2, Clock, Target,
  Dumbbell, ArrowUp, Medal, Award, Crown
} from "lucide-react";
import { parseDate } from "../utils/date";

// ─── Helpers ─────────────────────────────────────────────────────
const muscleColors = {
  "Pectoraux":  { text: "text-blue-400",    bg: "bg-blue-500/12",    border: "border-blue-500/25" },
  "Dos":        { text: "text-cyan-400",     bg: "bg-cyan-500/12",    border: "border-cyan-500/25" },
  "Lombaires":  { text: "text-teal-400",     bg: "bg-teal-500/12",    border: "border-teal-500/25" },
  "Quadriceps": { text: "text-emerald-400",  bg: "bg-emerald-500/12", border: "border-emerald-500/25" },
  "Ischios":    { text: "text-green-400",    bg: "bg-green-500/12",   border: "border-green-500/25" },
  "Fessiers":   { text: "text-lime-400",     bg: "bg-lime-500/12",    border: "border-lime-500/25" },
  "Épaules":    { text: "text-violet-400",   bg: "bg-violet-500/12",  border: "border-violet-500/25" },
  "Biceps":     { text: "text-pink-400",     bg: "bg-pink-500/12",    border: "border-pink-500/25" },
  "Triceps":    { text: "text-rose-400",     bg: "bg-rose-500/12",    border: "border-rose-500/25" },
  "Avant-bras": { text: "text-red-400",      bg: "bg-red-500/12",     border: "border-red-500/25" },
  "Abdos":      { text: "text-indigo-400",   bg: "bg-indigo-500/12",  border: "border-indigo-500/25" },
  "Mollets":    { text: "text-orange-400",   bg: "bg-orange-500/12",  border: "border-orange-500/25" },
  "Adducteurs": { text: "text-yellow-400",   bg: "bg-yellow-500/12",  border: "border-yellow-500/25" },
  "Abducteurs": { text: "text-amber-400",    bg: "bg-amber-500/12",   border: "border-amber-500/25" },
  "Tibias":     { text: "text-orange-300",   bg: "bg-orange-500/10",  border: "border-orange-400/25" },
  "Cou":        { text: "text-slate-400",    bg: "bg-slate-500/12",   border: "border-slate-500/25" },
  "Cardio":     { text: "text-sky-400",      bg: "bg-sky-500/12",     border: "border-sky-500/25" },
};
const getCol = (m) => muscleColors[m] || { text: "text-slate-400", bg: "bg-slate-500/12", border: "border-slate-500/25" };

const MUSCLE_GROUPS = ["Tous", ...Object.keys(muscleColors)];

const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// PR rank medal
const RankMedal = ({ rank }) => {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return <span className="text-sm font-black text-slate-500">#{rank}</span>;
};

// ─── Single PR Card ───────────────────────────────────────────────
const PRCard = ({ pr, rank }) => {
  const [open, setOpen] = useState(false);
  const col = getCol(pr.muscle);

  const improvement = pr.history.length > 1
    ? ((pr.best1RM - pr.history[pr.history.length - 2].best1RM) / pr.history[pr.history.length - 2].best1RM * 100).toFixed(1)
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={rank <= 3 ? "pr-card" : "glass-card p-4"}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <RankMedal rank={rank} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border mb-1 ${col.bg} ${col.text} ${col.border}`}>
                {pr.muscle}
              </span>
              <h3 className="text-sm font-black text-white leading-snug line-clamp-2">{pr.name}</h3>
            </div>
            <div className="shrink-0 text-right">
              <div className="pr-badge">
                🏆 {pr.best1RM} kg
              </div>
              <p className="text-[9px] text-slate-600 mt-1">1RM estimé</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <Dumbbell size={11} className="text-slate-500" />
              <span className="text-[10px] text-slate-400 font-medium">{pr.bestWeight}kg × {pr.bestReps} reps</span>
            </div>
            {improvement !== null && parseFloat(improvement) > 0 && (
              <div className="flex items-center gap-1 text-emerald-400">
                <ArrowUp size={10} />
                <span className="text-[10px] font-bold">+{improvement}%</span>
              </div>
            )}
            {pr.history.length > 0 && (
              <div className="flex items-center gap-1 text-slate-500 ml-auto">
                <Clock size={10} />
                <span className="text-[9px]">{pr.lastDate}</span>
              </div>
            )}
          </div>
        </div>

        <button onClick={() => setOpen(!open)} className="shrink-0 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Expanded history */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 pt-4 border-t border-white/8 space-y-2">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-3">Historique des records</p>
              {pr.history.slice().reverse().slice(0, 8).map((h, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-b-0">
                  <span className="text-[10px] text-slate-500 font-mono">{h.date}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">{h.weight}kg × {h.reps} reps</span>
                    <span className="text-[10px] font-black" style={{ color: i === 0 ? "#f59e0b" : "#94a3b8" }}>
                      {h.best1RM} kg
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── PR Tracker Page ──────────────────────────────────────────────
const PRTracker = () => {
  const { history } = useApp();
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("best1RM"); // best1RM | recent | name

  // Compute PR for every exercise that has history
  const allPRs = useMemo(() => {
    const prs = [];

    Object.keys(history || {}).forEach(exoId => {
      const exoDef = exerciseLibrary.find(e => e.id === exoId);
      if (!exoDef) return;

      const entries = history[exoId];
      if (!Array.isArray(entries) || entries.length === 0) return;

      // Build history of best 1RM per date
      const histByDate = {};
      entries.forEach(entry => {
        if (!entry?.date || !Array.isArray(entry.setsData)) return;
        let bestWeight = 0, bestReps = 0, best1RM = 0;
        entry.setsData.forEach(s => {
          if (s?.done && +s.weight > 0 && +s.reps > 0 && !s.isExtra) {
            const rm = calculate1RM(+s.weight, +s.reps);
            if (rm > best1RM) { best1RM = rm; bestWeight = +s.weight; bestReps = +s.reps; }
          }
        });
        if (best1RM > 0) {
          if (!histByDate[entry.date] || histByDate[entry.date].best1RM < best1RM) {
            histByDate[entry.date] = { date: entry.date, weight: bestWeight, reps: bestReps, best1RM };
          }
        }
      });

      const histArr = Object.values(histByDate).sort((a, b) => {
        const da = parseDate(a.date), db = parseDate(b.date);
        return da - db;
      });

      if (histArr.length === 0) return;

      const allTimeMax = histArr.reduce((max, h) => h.best1RM > max.best1RM ? h : max, histArr[0]);

      prs.push({
        id: exoId,
        name: exoDef.name,
        muscle: exoDef.muscle,
        best1RM: allTimeMax.best1RM,
        bestWeight: allTimeMax.weight,
        bestReps: allTimeMax.reps,
        lastDate: histArr[histArr.length - 1].date,
        sessionCount: entries.length,
        history: histArr,
      });
    });

    return prs;
  }, [history]);

  // Filter + sort
  const filtered = useMemo(() => {
    const q = removeAccents(search.toLowerCase());
    return allPRs
      .filter(pr => {
        const nameMatch = removeAccents(pr.name.toLowerCase()).includes(q);
        const muscleMatch = muscleFilter === "Tous" || pr.muscle === muscleFilter;
        return nameMatch && muscleMatch;
      })
      .sort((a, b) => {
        if (sortBy === "best1RM") return b.best1RM - a.best1RM;
        if (sortBy === "recent") return parseDate(b.lastDate) - parseDate(a.lastDate);
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [allPRs, search, muscleFilter, sortBy]);

  // Top stats
  const totalPRs = allPRs.length;
  const bestExo = allPRs.reduce((m, pr) => pr.best1RM > (m?.best1RM || 0) ? pr : m, null);
  const mostTrained = allPRs.reduce((m, pr) => pr.sessionCount > (m?.sessionCount || 0) ? pr : m, null);

  const musclesWithPRs = [...new Set(allPRs.map(pr => pr.muscle))];
  const topMuscle = musclesWithPRs.reduce((m, muscle) => {
    const count = allPRs.filter(pr => pr.muscle === muscle).length;
    return count > (m.count || 0) ? { muscle, count } : m;
  }, {});

  return (
    <div className="page-container">
      <div className="bg-orbs" />

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Records Personnels</h1>
            <p className="text-sm text-slate-500">{totalPRs} exercice{totalPRs > 1 ? "s" : ""} tracké{totalPRs > 1 ? "s" : ""}</p>
          </div>
        </div>
      </motion.div>

      {/* ── HERO STATS ── */}
      {totalPRs === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-12 text-center mb-6">
          <Trophy size={48} className="text-slate-700 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white mb-2">Aucun record encore</h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">Commence à valider tes séances avec des poids et des répétitions pour voir tes records apparaître ici !</p>
        </motion.div>
      ) : (
        <>
          {/* Top 3 cards */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-2 mb-6">
            {[
              { icon: Crown, label: "Top 1RM", value: bestExo ? `${bestExo.best1RM}kg` : "—", sub: bestExo?.name?.split("(")[0].trim().slice(0,18) || "—", color: "text-amber-400", bg: "from-amber-500/15 to-orange-500/8", border: "border-amber-500/25" },
              { icon: Dumbbell, label: "PRs trackés", value: totalPRs, sub: `${musclesWithPRs.length} muscles`, color: "text-blue-400", bg: "from-blue-500/15 to-cyan-500/8", border: "border-blue-500/25" },
              { icon: Star, label: "Muscle fétiche", value: topMuscle.muscle || "—", sub: `${topMuscle.count || 0} exercices`, color: "text-violet-400", bg: "from-violet-500/15 to-purple-500/8", border: "border-violet-500/25" },
            ].map(({ icon: Icon, label, value, sub, color, bg, border }) => (
              <div key={label} className={`glass-card p-3 border ${border} bg-gradient-to-br ${bg} text-center`}>
                <Icon size={16} className={`${color} mx-auto mb-1.5`} />
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">{label}</p>
                <p className={`text-sm font-black ${color} leading-tight`}>{value}</p>
                <p className="text-[9px] text-slate-600 mt-0.5 leading-tight line-clamp-1">{sub}</p>
              </div>
            ))}
          </motion.div>

          {/* Search + Filters */}
          <div className="sticky top-16 sm:top-20 z-20 -mx-4 px-4 pb-4 pt-3 mb-4 bg-[#020509]/95 backdrop-blur-xl border-b border-white/5">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={15} />
              <input type="text" placeholder="Rechercher un exercice..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/50 text-white text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all placeholder-slate-600" />
            </div>
            {/* Sort pills */}
            <div className="flex gap-2 mb-2 overflow-x-auto scrollbar-hide">
              {[["best1RM", "🏆 Meilleur 1RM"], ["recent", "🕐 Plus récent"], ["name", "🔤 Nom"]].map(([val, label]) => (
                <button key={val} onClick={() => setSortBy(val)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border whitespace-nowrap ${
                    sortBy === val ? "bg-amber-500/15 text-amber-400 border-amber-500/35" : "bg-white/4 text-slate-500 border-white/8 hover:text-white"
                  }`}>
                  {label}
                </button>
              ))}
              <div className="w-px h-5 bg-white/8 self-center mx-1 shrink-0" />
              {/* Muscle filter */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {MUSCLE_GROUPS.filter(m => m === "Tous" || musclesWithPRs.includes(m)).map(m => (
                  <button key={m} onClick={() => setMuscleFilter(m)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border whitespace-nowrap ${
                      muscleFilter === m
                        ? m === "Tous" ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-transparent" : `${getCol(m).bg} ${getCol(m).text} ${getCol(m).border}`
                        : "bg-white/4 text-slate-500 border-white/8 hover:text-white"
                    }`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-slate-600 font-medium">
              {filtered.length} record{filtered.length > 1 ? "s" : ""}
              {muscleFilter !== "Tous" ? ` · ${muscleFilter}` : ""}
              {search ? ` · "${search}"` : ""}
            </p>
          </div>

          {/* PR List */}
          <motion.div className="space-y-3">
            <AnimatePresence>
              {filtered.map((pr, i) => (
                <PRCard key={pr.id} pr={pr} rank={sortBy === "best1RM" ? i + 1 : i + 1} />
              ))}
            </AnimatePresence>
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Trophy size={36} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">Aucun résultat</p>
              <p className="text-slate-600 text-sm mt-1">Essaie un autre filtre ou terme de recherche</p>
            </div>
          )}
        </>
      )}
      <div className="h-24" />
    </div>
  );
};

export default PRTracker;
