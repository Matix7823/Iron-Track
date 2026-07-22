import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { exerciseLibrary } from "../data/exerciseLibrary";
import { calculate1RM } from "../utils/metrics";
import {
  Trophy, Dumbbell, ArrowUp, Crown, Star, Clock,
  ChevronDown, ChevronUp, Search, X, Calendar, TrendingUp, Zap, Sparkles, Flame, History, Award, BookOpen, ChevronRight,
  Share2, Download
} from "lucide-react";
import { parseDate } from "../utils/date";
import { triggerHaptic } from "../utils/haptics";

// ─── Color Map (18 fine-grained muscles) ───────────────────────────
const muscleColors = {
  "Pectoraux":  { text: "text-blue-400",    bg: "bg-blue-500/12",    border: "border-blue-500/25"    },
  "Dos":        { text: "text-cyan-400",     bg: "bg-cyan-500/12",    border: "border-cyan-500/25"    },
  "Lombaires":  { text: "text-teal-400",     bg: "bg-teal-500/12",    border: "border-teal-500/25"    },
  "Quadriceps": { text: "text-emerald-400",  bg: "bg-emerald-500/12", border: "border-emerald-500/25" },
  "Ischios":    { text: "text-green-400",    bg: "bg-green-500/12",   border: "border-green-500/25"   },
  "Fessiers":   { text: "text-lime-400",     bg: "bg-lime-500/12",    border: "border-lime-500/25"    },
  "Épaules":    { text: "text-violet-400",   bg: "bg-violet-500/12",  border: "border-violet-500/25"  },
  "Biceps":     { text: "text-pink-400",     bg: "bg-pink-500/12",    border: "border-pink-500/25"    },
  "Triceps":    { text: "text-rose-400",     bg: "bg-rose-500/12",    border: "border-rose-500/25"    },
  "Avant-bras": { text: "text-red-400",      bg: "bg-red-500/12",     border: "border-red-500/25"     },
  "Abdos":      { text: "text-indigo-400",   bg: "bg-indigo-500/12",  border: "border-indigo-500/25"  },
  "Mollets":    { text: "text-orange-400",   bg: "bg-orange-500/12",  border: "border-orange-500/25"  },
  "Adducteurs": { text: "text-yellow-400",   bg: "bg-yellow-500/12",  border: "border-yellow-500/25"  },
  "Abducteurs": { text: "text-amber-400",    bg: "bg-amber-500/12",   border: "border-amber-500/25"   },
  "Tibias":     { text: "text-orange-300",   bg: "bg-orange-500/10",  border: "border-orange-400/25"  },
  "Cou":        { text: "text-slate-400",    bg: "bg-slate-500/12",   border: "border-slate-500/25"   },
  "Cardio":     { text: "text-sky-400",      bg: "bg-sky-500/12",     border: "border-sky-500/25"     },
  "Trapèzes":   { text: "text-purple-400",   bg: "bg-purple-500/12",  border: "border-purple-500/25"  },
};
const getCol = (m) => muscleColors[m] || { text: "text-slate-400", bg: "bg-slate-500/12", border: "border-slate-500/25" };
const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const MUSCLE_GROUPS = ["Tous", ...Object.keys(muscleColors)];

// Helper to look up an exercise in both standard library and user exercises
const getExoDef = (exoId, allExercises) => {
  return (allExercises || []).find(e => e.id === exoId) || exerciseLibrary.find(e => e.id === exoId);
};

// ─── Subcomponent: Exercise Detail Card ───────────────────────────
const ExerciseDetailCard = ({ exo, getCol }) => {
  const [open, setOpen] = useState(false);
  const col = getCol(exo.muscle);

  // Compute coordinates for the mini strength progress SVG chart
  const miniCoords = useMemo(() => {
    if (!exo.historyFeed || exo.historyFeed.length < 2) return null;
    const paddingX = 15;
    const paddingY = 12;
    const width = 300;
    const height = 70;
    const usableW = width - paddingX * 2;
    const usableH = height - paddingY * 2;

    const weights = exo.historyFeed.map(h => h.maxWeight);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const range = maxW - minW;

    return exo.historyFeed.map((h, i) => {
      const x = paddingX + (i / (exo.historyFeed.length - 1)) * usableW;
      const y = range > 0
        ? height - paddingY - ((h.maxWeight - minW) / range) * usableH
        : height / 2;
      return { x, y, weight: h.maxWeight, date: h.date };
    });
  }, [exo.historyFeed]);

  const overallBestWeight = exo.bestWeight;

  return (
    <div className={`glass-card border transition-all duration-300 overflow-hidden ${open ? "border-amber-500/35 shadow-lg shadow-amber-500/5 bg-[#0d1527]/60" : "border-white/5 hover:border-white/10 hover:bg-[#070b13]/60"}`}>
      <div className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${col.bg} ${col.text} ${col.border}`}>
              {exo.muscle}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {exo.workoutCount} séance{exo.workoutCount > 1 ? "s" : ""}
            </span>
          </div>
          <h3 className="text-sm font-black text-white leading-snug truncate">{exo.name}</h3>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-xs font-black text-amber-400">🏆 {exo.best1RM} kg</div>
            <p className="text-[9px] text-slate-500 mt-0.5">Max 1RM</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-black text-white">{exo.bestWeight} kg</div>
            <p className="text-[9px] text-slate-500 mt-0.5">Charge Max</p>
          </div>
          <button className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5 bg-slate-950/20"
          >
            <div className="p-4 space-y-4">
              {/* Mini SVG Chart */}
              {miniCoords ? (
                <div className="bg-[#0b101b]/80 border border-white/5 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={11} className="text-emerald-400" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Courbe de Force (Max Poids)</p>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-mono font-bold">
                      +{Math.round(exo.bestWeight - exo.historyFeed[0].maxWeight)} kg prog.
                    </span>
                  </div>
                  <svg viewBox="0 0 300 70" className="w-full h-16 overflow-visible">
                    <defs>
                      <linearGradient id={`miniChartGrad-${exo.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                      <filter id={`miniGlow-${exo.id}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Area Path */}
                    <path
                      d={`${miniCoords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ")} L ${miniCoords[miniCoords.length - 1].x} 60 L ${miniCoords[0].x} 60 Z`}
                      fill={`url(#miniChartGrad-${exo.id})`}
                    />

                    {/* Line Path */}
                    <path
                      d={miniCoords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ")}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter={`url(#miniGlow-${exo.id})`}
                    />

                    {/* Data Points */}
                    {miniCoords.map((c, idx) => {
                      const isPeak = c.weight === overallBestWeight;
                      return (
                        <g key={idx}>
                          <circle
                            cx={c.x}
                            cy={c.y}
                            r={isPeak ? "3.5" : "2.5"}
                            fill={isPeak ? "#ffffff" : "#10b981"}
                            stroke="#10b981"
                            strokeWidth="1"
                          />
                          {(idx === 0 || idx === miniCoords.length - 1 || isPeak) && (
                            <text
                              x={c.x}
                              y={c.y - 7}
                              fill={isPeak ? "#f59e0b" : "#10b981"}
                              fontSize="7"
                              fontWeight="bold"
                              textAnchor="middle"
                              fontFamily="monospace"
                            >
                              {c.weight}k
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              ) : (
                <div className="bg-[#0b101b]/50 border border-white/5 rounded-xl p-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400 shrink-0" />
                  <p className="text-[10px] text-slate-500">
                    Première séance enregistrée. Fais un autre entraînement pour dessiner ton graphique de force !
                  </p>
                </div>
              )}

              {/* Workout chronological feed */}
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2.5 flex items-center gap-1.5">
                  <History size={11} /> Historique des séances (10 dernières)
                </p>
                <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider px-2 mb-2 gap-2">
                  <span className="w-20 shrink-0">Date</span>
                  <span className="flex-1 text-center">Séries (Poids × Répétitions)</span>
                  <span className="w-16 text-right shrink-0">1RM Estimé</span>
                </div>
                <div className="space-y-1 bg-[#090d16] border border-white/5 rounded-xl p-2.5 max-h-[220px] overflow-y-auto scrollbar-hide">
                  {[...exo.historyFeed].reverse().slice(0, 10).map((h, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 hover:bg-white/2 px-1 rounded transition-colors gap-2">
                      <span className="text-[10px] text-slate-400 font-mono w-20 flex items-center gap-1 shrink-0">
                        <Calendar size={9} className="text-slate-600" />
                        {h.date.split("-").reverse().slice(0, 2).join("/")}
                      </span>
                      <div className="flex items-center gap-1.5 flex-1 justify-center flex-wrap">
                        {h.sets.map((s, idx) => {
                          const isBestSet = s.weight === overallBestWeight;
                          return (
                            <span
                              key={idx}
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-lg border transition-all ${isBestSet ? "bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold" : "bg-[#0b101b] border-white/5 text-slate-400"}`}
                            >
                              {s.weight} kg × {s.reps} reps{s.rpe ? <span className="text-[7px] text-slate-500"> @RPE {s.rpe}</span> : ""}
                            </span>
                          );
                        })}
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 w-16 text-right shrink-0">
                        {h.best1RM} kg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main PRTracker Component ─────────────────────────────────────
const PRTracker = () => {
  const { history, allExercises } = useApp();
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("Tous");
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(null);
  const [sortBy, setSortBy] = useState("best1RM");

  const handleExportCSV = () => {
    triggerHaptic(15);
    // BOM UTF-8 for Excel compatibility with accents
    let csv = "\ufeffDate,Catégorie Muscle,Exercice,Série,Poids (kg),Répétitions,RPE,Intensité\n";
    
    practicedExercises.forEach((exo) => {
      if (exo.historyFeed) {
        exo.historyFeed.forEach((h) => {
          h.sets.forEach((s, idx) => {
            const cleanExoName = exo.name.replace(/"/g, '""');
            const cleanMuscle = (exo.muscle || "Inconnu").replace(/"/g, '""');
            csv += `${h.date},"${cleanMuscle}","${cleanExoName}",${idx + 1},${s.weight},${s.reps},${s.rpe || "-"},${s.tag || "-"}\n`;
          });
        });
      }
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "iron_track_performance_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute all sessions grouped by date with total tonnage and exercise detail
  const allSessions = useMemo(() => {
    const dateMap = {};
    Object.keys(history || {}).forEach(exoId => {
      const exoDef = getExoDef(exoId, allExercises);
      const entries = history[exoId];
      if (!Array.isArray(entries)) return;
      entries.forEach(entry => {
        if (!entry?.date || !Array.isArray(entry.setsData)) return;
        const hasDone = entry.setsData.some(s => s?.done && (s.weight!=="" && !isNaN(s.weight) && parseFloat(s.weight)>=0));
        if (!hasDone) return;
        if (!dateMap[entry.date]) dateMap[entry.date] = { date: entry.date, exercices: [], tonnage: 0 };
        
        let exoTonnage = 0;
        let maxWeight = 0;
        const validSets = entry.setsData.filter(s => s?.done && +s.weight >= 0);
        validSets.forEach(s => {
          const w = +s.weight || 0;
          const r = +s.reps || 1;
          exoTonnage += w * r;
          if (w > maxWeight) maxWeight = w;
        });

        dateMap[entry.date].tonnage += exoTonnage;
        dateMap[entry.date].exercices.push({
          id: exoId,
          name: exoDef ? exoDef.name : exoId,
          muscle: exoDef ? exoDef.muscle : "Inconnu",
          maxWeight,
          setsCount: validSets.length,
          sets: entry.setsData.map(s => ({ weight: +s.weight || 0, reps: +s.reps || 0, done: s.done || false, rpe: s.rpe || "" })),
        });
      });
    });
    return Object.values(dateMap).sort((a, b) => parseDate(b.date) - parseDate(a.date));
  }, [history, allExercises]);

  // Compute Top 3 sessions by total tonnage
  const topSessions = useMemo(() => {
    return [...allSessions]
      .sort((a, b) => b.tonnage - a.tonnage)
      .slice(0, 3);
  }, [allSessions]);

  // Compute all exercises practiced by the user with their history feeds
  const practicedExercises = useMemo(() => {
    const list = [];
    Object.keys(history || {}).forEach(exoId => {
      const exoDef = getExoDef(exoId, allExercises);
      const entries = history[exoId];
      if (!Array.isArray(entries) || entries.length === 0) return;

      const completedEntries = entries.filter(entry =>
        entry?.setsData && entry.setsData.some(s => s?.done && (s.weight!=="" && !isNaN(s.weight) && parseFloat(s.weight)>=0))
      );
      if (completedEntries.length === 0) return;

      let bestWeight = 0;
      let best1RM = 0;
      let lastDate = "";
      const historyFeed = [];

      completedEntries.forEach(entry => {
        let entryMaxWeight = 0;
        let entryBest1RM = 0;
        const setsList = [];

        entry.setsData.forEach(s => {
          if (s?.done && (s.weight!=="" && !isNaN(s.weight) && parseFloat(s.weight)>=0)) {
            const w = +s.weight;
            const r = +s.reps || 1;
            const rpe = s.rpe || "";
            setsList.push({ weight: w, reps: r, rpe, tag: s.tag || "" });
            if (w > entryMaxWeight) entryMaxWeight = w;
            const rm = calculate1RM(w, r);
            if (rm > entryBest1RM) entryBest1RM = rm;
          }
        });

        if (setsList.length > 0) {
          historyFeed.push({
            date: entry.date,
            maxWeight: entryMaxWeight,
            best1RM: entryBest1RM,
            sets: setsList
          });

          if (entryMaxWeight > bestWeight) bestWeight = entryMaxWeight;
          if (entryBest1RM > best1RM) best1RM = entryBest1RM;
          if (!lastDate || parseDate(entry.date) > parseDate(lastDate)) {
            lastDate = entry.date;
          }
        }
      });

      // Sort chronological history
      historyFeed.sort((a, b) => parseDate(a.date) - parseDate(b.date));

      if (historyFeed.length > 0) {
        list.push({
          id: exoId,
          name: exoDef ? exoDef.name : exoId,
          muscle: exoDef ? exoDef.muscle : "Inconnu",
          bestWeight,
          best1RM,
          lastDate,
          workoutCount: historyFeed.length,
          historyFeed
        });
      }
    });
    return list;
  }, [history, allExercises]);

  // Global chronological session tonnage data for the evolution chart
  const chartData = useMemo(() => {
    if (allSessions.length === 0) return [];
    return [...allSessions].sort((a, b) => parseDate(a.date) - parseDate(b.date));
  }, [allSessions]);

  // Set default selected session index to the last (latest) session in the list
  // Mettre à jour la sélection automatiquement à la fin
  // On utilise un effet qui vérifie si on a besoin de se mettre à jour uniquement lors d'un changement MAJEUR
  useEffect(() => {
    if (chartData.length > 0) {
      // Pour éviter les re-rendus en cascade, on vérifie si la sélection actuelle est hors limites
      setSelectedSessionIndex(prev => {
        if (prev === null || prev >= chartData.length) return chartData.length - 1;
        return prev;
      });
    }
  }, [chartData.length]);

  // SVG coordinates for Global Tonnage Evolution Chart
  const svgCoords = useMemo(() => {
    if (chartData.length === 0) return [];
    const paddingX = 40;
    const paddingY = 20;
    const width = 500;
    const height = 150;
    const usableW = width - paddingX - 25; // 435
    const usableH = height - paddingY - 30; // 100

    const tonnages = chartData.map(d => d.tonnage);
    const minT = Math.min(...tonnages);
    const maxT = Math.max(...tonnages);
    const rangeT = maxT - minT;

    return chartData.map((d, idx) => {
      const x = chartData.length > 1
        ? paddingX + (idx / (chartData.length - 1)) * usableW
        : paddingX + usableW / 2;
      const y = rangeT > 0
        ? height - 30 - ((d.tonnage - minT) / rangeT) * usableH
        : height - 30 - usableH / 2;
      return { x, y, date: d.date, tonnage: d.tonnage };
    });
  }, [chartData]);

  // Line & Area path strings for Global Tonnage SVG Chart
  const linePath = useMemo(() => {
    return svgCoords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  }, [svgCoords]);

  const areaPath = useMemo(() => {
    if (svgCoords.length === 0) return "";
    return `${linePath} L ${svgCoords[svgCoords.length - 1].x} 120 L ${svgCoords[0].x} 120 Z`;
  }, [svgCoords, linePath]);

  // Tonnage stats helpers
  const stats = useMemo(() => {
    if (allSessions.length === 0) {
      return { maxTonnage: 0, totalVolume: 0, count: 0, activeExos: 0 };
    }
    const tonnages = allSessions.map(s => s.tonnage);
    const maxTonnage = Math.round(Math.max(...tonnages));
    const totalVolume = Math.round(tonnages.reduce((a, b) => a + b, 0));
    return {
      maxTonnage,
      totalVolume,
      count: allSessions.length,
      activeExos: practicedExercises.length
    };
  }, [allSessions, practicedExercises]);

  // Filter & sort practiced exercises
  const filtered = useMemo(() => {
    const q = removeAccents(search.toLowerCase());
    return practicedExercises
      .filter(exo => {
        const nameMatch = removeAccents(exo.name.toLowerCase()).includes(q);
        const muscleMatch = muscleFilter === "Tous" || exo.muscle === muscleFilter;
        return nameMatch && muscleMatch;
      })
      .sort((a, b) => {
        if (sortBy === "best1RM") return b.best1RM - a.best1RM;
        if (sortBy === "recent") return parseDate(b.lastDate) - parseDate(a.lastDate);
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [practicedExercises, search, muscleFilter, sortBy]);

  const musclesWithPRs = [...new Set(practicedExercises.map(exo => exo.muscle))];

  return (
    <div className="page-container">
      

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Records Personnels</h1>
            <p className="text-sm text-slate-500">Vitrine de performances & annuaire de force</p>
          </div>
        </div>
      </motion.div>

      {/* Tonnage & Progress Stats Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
      >
        {[
          { icon: Crown, label: "Record Séance", value: stats.maxTonnage ? `${stats.maxTonnage.toLocaleString()} kg` : "—", sub: "Tonnage max / séance", color: "text-amber-400", bg: "from-amber-500/15 to-orange-500/8", border: "border-amber-500/25" },
          { icon: Flame, label: "Volume Cumulé", value: stats.totalVolume ? `${stats.totalVolume.toLocaleString()} kg` : "—", sub: "Tonnage total soulevé", color: "text-red-400", bg: "from-red-500/15 to-orange-500/8", border: "border-red-500/25" },
          { icon: Calendar, label: "Séances Validées", value: stats.count, sub: "Entraînements enregistrés", color: "text-blue-400", bg: "from-blue-500/15 to-cyan-500/8", border: "border-blue-500/25" },
          { icon: Dumbbell, label: "Exercices Pratiqués", value: stats.activeExos, sub: "Mouvements uniques trackés", color: "text-violet-400", bg: "from-violet-500/15 to-purple-500/8", border: "border-violet-500/25" },
        ].map(({ icon: Icon, label, value, sub, color, bg, border }) => (
          <div key={label} className={`glass-card p-3.5 border ${border} bg-gradient-to-br ${bg} text-center`}>
            <Icon size={16} className={`${color} mx-auto mb-2`} />
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">{label}</p>
            <p className={`text-base font-black ${color} leading-none`}>{value}</p>
            <p className="text-[9px] text-slate-600 mt-1">{sub}</p>
          </div>
        ))}
      </motion.div>

      {allSessions.length === 0 ? (
        /* Welcome empty state if user has absolutely 0 history */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-12 text-center my-6 border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
          <Trophy size={54} className="text-amber-500/30 mx-auto mb-5 animate-bounce" />
          <h2 className="text-xl font-black text-white mb-2">Prêt à forger tes records ?</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6 leading-relaxed">
            Ici s'afficheront la vitrine dorée de tes 3 meilleures séances, ta courbe de progression de tonnage global et l'historique complet de ta force au fil du temps.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black">
            <Sparkles size={13} /> Rends-toi dans l'onglet Séance pour valider tes entraînements !
          </div>
        </motion.div>
      ) : (
        /* Complete Premium Dashboard */
        <div className="space-y-6">
          {/* SECTION 1: TOP 3 TONNAGE SESSIONS (GOLD SHOWCASE) */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <Crown size={14} className="text-amber-400" /> Vitrine Dorée · Top 3 Séances (Tonnage)
              </h2>
              <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full px-2 py-0.5 font-bold">
                Force Pure
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topSessions.map((session, i) => {
                const rankLabels = ["🥇 Premier", "🥈 Second", "🥉 Troisième"];
                return (
                  <motion.div
                    key={session.date}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-gradient-to-br from-amber-500/12 to-orange-500/5 border border-amber-500/35 shadow-lg shadow-amber-500/5 hover:border-amber-500/60 rounded-2xl p-4 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                          {rankLabels[i]}
                        </span>
                        <div className="flex items-center gap-1 text-[9px] text-slate-500">
                          <Clock size={10} />
                          {session.date.split("-").reverse().join("/")}
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Tonnage Total</p>
                        <p className="text-2xl font-black text-white leading-none mt-0.5 flex items-baseline gap-1">
                          {Math.round(session.tonnage).toLocaleString()}
                          <span className="text-xs font-bold text-amber-400">kg</span>
                        </p>
                      </div>

                      <div className="space-y-1.5 border-t border-amber-500/20 pt-2.5">
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-1">Mouvements effectués</p>
                        {session.exercices.map((exo, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-300 font-medium truncate max-w-[140px]">
                              {exo.name.split("(")[0].trim()}
                            </span>
                            <span className="text-slate-500 font-mono text-[10px] shrink-0 font-bold ml-1">
                              {exo.setsCount}s × {exo.maxWeight}kg
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: GLOBAL TONNAGE EVOLUTION CHART */}
          <div className="glass-card p-4 border-white/5 relative">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <TrendingUp size={14} className="text-amber-400" /> Évolution du Tonnage Global
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Tonnage total soulevé chronologiquement sur chaque entraînement</p>
              </div>
              <span className="text-[9px] bg-slate-900 border border-white/10 text-slate-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 font-mono">
                {chartData.length} Points
              </span>
            </div>

            {chartData.length >= 2 ? (
              <>
                {/* SVG Line Chart */}
                <div className="w-full aspect-[2.5/1] sm:aspect-[3/1] bg-slate-950/40 border border-white/5 rounded-2xl p-4 overflow-visible">
                  <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Dotted Grid lines */}
                    <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

                    {/* Baseline Tonnage labels */}
                    {svgCoords.length > 0 && (() => {
                      const tonnages = chartData.map(d => d.tonnage);
                      const minT = Math.min(...tonnages);
                      const maxT = Math.max(...tonnages);
                      return (
                        <>
                          <text x="35" y="24" fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end" fontFamily="monospace">{Math.round(maxT)}kg</text>
                          <text x="35" y="74" fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end" fontFamily="monospace">{Math.round((maxT + minT) / 2)}kg</text>
                          <text x="35" y="124" fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end" fontFamily="monospace">{Math.round(minT)}kg</text>
                        </>
                      );
                    })()}

                    {/* Area under the curve */}
                    {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

                    {/* Gradient glowing line */}
                    {linePath && (
                      <path
                        d={linePath}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                      />
                    )}

                    {/* X-axis date labels */}
                    {svgCoords.length > 0 && (
                      <>
                        <text x={svgCoords[0].x} y="142" fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="start" fontFamily="sans-serif">
                          {chartData[0].date.split("-").reverse().slice(0,2).join("/")}
                        </text>
                        {svgCoords.length > 2 && (
                          <text x={svgCoords[Math.floor(svgCoords.length / 2)].x} y="142" fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle" fontFamily="sans-serif">
                            {chartData[Math.floor(chartData.length / 2)].date.split("-").reverse().slice(0,2).join("/")}
                          </text>
                        )}
                        {svgCoords.length > 1 && (
                          <text x={svgCoords[svgCoords.length - 1].x} y="142" fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="end" fontFamily="sans-serif">
                            {chartData[chartData.length - 1].date.split("-").reverse().slice(0,2).join("/")}
                          </text>
                        )}
                      </>
                    )}

                    {/* Dots representing each session */}
                    {svgCoords.map((c, idx) => {
                      const isSelected = idx === selectedSessionIndex;
                      return (
                        <g key={idx} className="cursor-pointer" onClick={() => setSelectedSessionIndex(idx)}>
                          {/* Transparent click target area */}
                          <circle cx={c.x} cy={c.y} r="14" fill="transparent" />
                          {/* Selected glow halo */}
                          {isSelected && (
                            <circle cx={c.x} cy={c.y} r="8" fill="#f59e0b" opacity="0.4" className="animate-pulse" />
                          )}
                          <circle
                            cx={c.x}
                            cy={c.y}
                            r={isSelected ? "5.5" : "3.5"}
                            fill={isSelected ? "#ffffff" : "#ea580c"}
                            stroke={isSelected ? "#f59e0b" : "rgba(0,0,0,0.5)"}
                            strokeWidth={isSelected ? "2.5" : "1.5"}
                            className="transition-all duration-300"
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Session Inspector Detail (shows under chart) */}
                {selectedSessionIndex !== null && chartData[selectedSessionIndex] && (() => {
                  const session = chartData[selectedSessionIndex];
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#0b101b]/80 border border-white/5 rounded-2xl p-4 mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                          <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">
                            Inspection de séance
                          </h4>
                        </div>
                        <p className="text-sm font-black text-white mt-1">
                          {session.date.split("-").reverse().join("/")} · Volume de {Math.round(session.tonnage).toLocaleString()} kg
                        </p>
                      </div>

                      <div className="flex-1 flex flex-wrap gap-1.5 md:justify-end">
                        {session.exercices.map((exo, idx) => {
                          const col = getCol(exo.muscle);
                          return (
                            <div
                              key={idx}
                              className={`text-[10px] bg-slate-900 border border-white/5 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 font-medium`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${col.text} bg-current`} />
                              <span className="text-slate-300 truncate max-w-[130px]">{exo.name.split("(")[0].trim()}</span>
                              <span className="text-slate-500 font-mono text-[9px]">({exo.setsCount}s)</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })()}
              </>
            ) : (
              <div className="bg-[#0b101b]/40 border border-white/5 rounded-2xl p-6 text-center">
                <TrendingUp size={24} className="text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  Pas assez d'entraînements pour afficher ta courbe d'évolution temporelle. Continue de t'entraîner !
                </p>
              </div>
            )}
          </div>

          {/* SECTION 3: SEARCHABLE COMPLETED EXERCISE DIRECTORY */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <BookOpen size={14} className="text-amber-400" /> Annuaire des Exercices Pratiqués
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Cherche tes mouvements et analyse l'historique complet de ta force</p>
            </div>

            {/* Filter controls */}
            <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-3.5 space-y-3">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={15} />
                <input
                  type="text"
                  placeholder="Rechercher un exercice..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#050912]/80 border border-white/5 text-white text-sm rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all placeholder-slate-600 font-medium"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Sorting selectors */}
              <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500 font-bold uppercase tracking-wider border-t border-white/5 pt-3">
                <span className="mr-1">Trier par :</span>
                {[
                  { key: "best1RM", label: "🏆 Meilleur 1RM" },
                  { key: "recent", label: "🕐 Plus récent" },
                  { key: "name", label: "🔤 Nom alphabétique" }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    className={`flex items-center justify-center h-9 px-3.5 rounded-xl border text-[10px] font-bold transition-all ${sortBy === key ? "bg-amber-500/12 text-amber-400 border-amber-500/35 font-black shadow-md shadow-amber-500/5" : "bg-white/4 text-slate-400 border-white/5 hover:text-white"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-2.5">
              <AnimatePresence>
                {filtered.map(exo => (
                  <ExerciseDetailCard
                    key={exo.id}
                    exo={exo}
                    getCol={getCol}
                  />
                ))}
              </AnimatePresence>

              {filtered.length === 0 && (
                <div className="text-center py-12 bg-slate-900/10 border border-dashed border-white/5 rounded-2xl">
                  <Search size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold text-sm">Aucun exercice ne correspond à ta recherche</p>
                  <button onClick={() => { setSearch(""); setMuscleFilter("Tous"); }} className="text-amber-400 text-xs font-black mt-1 hover:underline">
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSV Export Action Button */}
      {allSessions.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-400/80 text-amber-400 hover:text-amber-300 text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.04)] hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] w-full max-w-sm sm:w-auto"
          >
            <Download size={14} /> Export des Records (CSV UTF-8 Excel)
          </button>
        </div>
      )}

      <div className="h-24" />
    </div>
  );
};

export default PRTracker;
