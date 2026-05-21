import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { exerciseLibrary } from "../data/exerciseLibrary";
import { parseDate, formatDateFR } from "../utils/date";
import { normalizeHistory, getPerformanceMetrics, calculate1RM, getStrengthStandard } from "../utils/metrics";
import EvolutionChart from "../components/charts/EvolutionChart";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, BarChart2, Award, Star, Target, Zap, Download,
  TrendingDown, ArrowRightLeft, AlertTriangle, Trophy, Flame, Search, X
} from "lucide-react";

const item = { hidden:{opacity:0,y:18}, visible:{opacity:1,y:0,transition:{duration:.4,ease:"easeOut"}} };
const container = { hidden:{}, visible:{transition:{staggerChildren:.08}} };

const removeAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const Analytics = () => {
  const { 
    history, allExercises, currentBodyWeight, exportToCSV, currentSession,
    dailyNutrition, logNutrition, userSessions
  } = useApp();
  const [selectedExo, setSelectedExo] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [metric, setMetric] = useState("weight");
  
  const [searchExo, setSearchExo] = useState("");
  const [showExoList, setShowExoList] = useState(false);

  // Unify the exercises from sessions and the library
  const unifiedCatalog = useMemo(() => {
    const list = [...allExercises];
    exerciseLibrary.forEach(libExo => {
      if (!list.some(e => e.name.toLowerCase().trim() === libExo.name.toLowerCase().trim())) {
        list.push(libExo);
      }
    });
    return list;
  }, [allExercises]);

  const filteredExos = useMemo(() => {
    if (!searchExo) return unifiedCatalog.slice(0, 50);
    const searchNormalized = removeAccents(searchExo.toLowerCase());
    return unifiedCatalog.filter(e => removeAccents(e.name.toLowerCase()).includes(searchNormalized)).slice(0, 50);
  }, [searchExo, unifiedCatalog]);

  const [editP, setEditP] = useState("");
  const [editC, setEditC] = useState("");
  const [editF, setEditF] = useState("");

  // Weekly volume per muscle group (all 18 detailed groups)
  const weekVolume = useMemo(() => {
    const now = new Date(), d7 = new Date(now - 7*864e5);
    const vol = {
      Pectoraux: 0, Dos: 0, Lombaires: 0, Quadriceps: 0, Ischios: 0, Fessiers: 0,
      Adducteurs: 0, Abducteurs: 0, Mollets: 0, Tibias: 0, Épaules: 0, Trapèzes: 0,
      Biceps: 0, Triceps: 0, "Avant-bras": 0, Abdos: 0, Cou: 0, Cardio: 0
    };
    const map = {
      "Pecs (Haut)": "Pectoraux", "Pecs (Masse)": "Pectoraux", "Pecs (Bas)": "Pectoraux", "Pecs (Iso)": "Pectoraux", "Finition": "Pectoraux", "Pecs": "Pectoraux", "Pectoraux": "Pectoraux",
      "Dos (Largeur)": "Dos", "Dos (Épaisseur)": "Dos", "Dos (Bas)": "Dos", "Dos (Isolation)": "Dos", "Dos": "Dos",
      "Lombaires": "Lombaires", "Lombes": "Lombaires",
      "Cuisses": "Quadriceps", "Quadriceps": "Quadriceps",
      "Ischios": "Ischios",
      "Fessiers": "Fessiers",
      "Adducteurs": "Adducteurs",
      "Abducteurs": "Abducteurs",
      "Mollets": "Mollets",
      "Tibias": "Tibias",
      "Épaules (Masse)": "Épaules", "Épaules (Latéral)": "Épaules", "Arr. Épaules": "Épaules", "Épaules": "Épaules",
      "Trapèzes": "Trapèzes",
      "Biceps (Long)": "Biceps", "Biceps (Court)": "Biceps", "Brachial": "Biceps", "Biceps": "Biceps",
      "Triceps (Masse)": "Triceps", "Triceps (Long)": "Triceps", "Triceps (Vaste)": "Triceps", "Triceps": "Triceps",
      "Avant-Bras": "Avant-bras", "Avant-bras": "Avant-bras",
      "Abdos": "Abdos", "Abdos (Bas)": "Abdos", "Obliques": "Abdos", "Transverse": "Abdos", "Gainage": "Abdos", "Taille": "Abdos",
      "Cou": "Cou",
      "Cardio": "Cardio"
    };
    Object.keys(history || {}).forEach(id => {
      const exo = allExercises.find(e=>e.id===id) || exerciseLibrary.find(e=>e.id===id); if(!exo) return;
      const g = map[exo.muscle]; if(!g) return;
      const entries = history[id];
      if (Array.isArray(entries)) {
        entries.forEach(entry => {
          if (!entry || !entry.date) return;
          const d = parseDate(entry.date);
          if(d>=d7&&d<=now) vol[g] += (entry.setsData||[]).filter(s=>s.done&&+s.weight>0&&!s.isExtra).length;
        });
      }
    });
    return vol;
  }, [history, allExercises]);

  const maxVol = Math.max(...Object.values(weekVolume), 1);
  const volPecs = weekVolume.Pectoraux||0, volDos = weekVolume.Dos||0;

  // Aesthetic score
  const aes = (() => {
    const now=new Date(),d7=new Date(now-7*864e5);
    let latDelts=0,upperChest=0,lats=0;
    Object.keys(history || {}).forEach(id=>{
      const exo=allExercises.find(e=>e.id===id) || exerciseLibrary.find(e=>e.id===id); if(!exo) return;
      const entries = history[id];
      if (Array.isArray(entries)) {
        entries.forEach(entry=>{
          if (!entry || !entry.date) return;
          const d=parseDate(entry.date);
          if(d>=d7&&d<=now){
            const v=(entry.setsData||[]).filter(s=>s.done&&+s.weight>0&&!s.isExtra).length;
            if(exo.muscle==="Épaules (Latéral)") latDelts+=v;
            if(exo.muscle==="Pecs (Haut)")       upperChest+=v;
            if(exo.muscle==="Dos (Largeur)")     lats+=v;
          }
        });
      }
    });
    const g = Math.round((Math.min(100,(latDelts/10)*100)+Math.min(100,(upperChest/10)*100)+Math.min(100,(lats/10)*100))/3);
    return {latDelts,upperChest,lats,score:g};
  })();

  // Sessions history
  const sessionHistory = (() => {
    const m={};
    Object.keys(history || {}).forEach(id=>{
      const entries = history[id];
      const exoDef = allExercises.find(e => e.id === id) || exerciseLibrary.find(e => e.id === id);
      const name = exoDef ? exoDef.name : id;
      
      if (Array.isArray(entries)) {
        entries.forEach(entry=>{
          if(!entry || !entry.date) return;
          if(!m[entry.date]) m[entry.date]={date:entry.date,tonnage:0,exos:0, details: []};
          
          let exoTonnage = 0;
          const sets = [];
          (entry.setsData||[]).forEach(s=>{
            if(s && +s.weight>0&&+s.reps>0&&s.done!==false) {
              m[entry.date].tonnage+=+s.weight*+s.reps;
              exoTonnage += +s.weight*+s.reps;
              sets.push(s);
            }
          });
          
          if (sets.length > 0) {
            m[entry.date].exos++;
            m[entry.date].details.push({ name, tonnage: exoTonnage, sets });
          }
        });
      }
    });
    
    // Auto-match session titles from preset/custom sessions
    Object.values(m).forEach(sessionData => {
      let bestSessionTitle = "";
      let maxMatches = 0;
      
      if (userSessions) {
        Object.values(userSessions).forEach(sess => {
          if (sess && Array.isArray(sess.exercises)) {
            let matches = 0;
            sess.exercises.forEach(se => {
              const completedHasExo = sessionData.details.some(d => d.name.toLowerCase().trim() === se.name.toLowerCase().trim());
              if (completedHasExo) matches++;
            });
            if (matches > maxMatches) {
              maxMatches = matches;
              bestSessionTitle = sess.title || `${sess.category}`;
            }
          }
        });
      }
      
      if (!bestSessionTitle) {
        const muscleCounts = {};
        sessionData.details.forEach(d => {
          const exoDef = allExercises.find(e => e.name.toLowerCase().trim() === d.name.toLowerCase().trim()) || 
                         exerciseLibrary.find(e => e.name.toLowerCase().trim() === d.name.toLowerCase().trim());
          if (exoDef) {
            const mus = exoDef.muscle;
            muscleCounts[mus] = (muscleCounts[mus] || 0) + 1;
          }
        });
        let dominantMuscle = "";
        let maxCount = 0;
        Object.entries(muscleCounts).forEach(([mus, count]) => {
          if (count > maxCount) {
            maxCount = count;
            dominantMuscle = mus;
          }
        });
        if (dominantMuscle) {
          bestSessionTitle = `Séance : ${dominantMuscle}`;
        } else {
          bestSessionTitle = `Séance Libre`;
        }
      }
      
      sessionData.sessionTitle = bestSessionTitle;
    });

    const arr=Object.values(m).filter(d=>d.tonnage>0).sort((a,b)=>parseDate(b.date)-parseDate(a.date));
    const tons=arr.map(a=>a.tonnage).sort((a,b)=>a-b);
    const p75=tons[Math.floor(tons.length*.75)]||0, p25=tons[Math.floor(tons.length*.25)]||0;
    return arr.map(d=>({...d,rank:d.tonnage>=p75&&d.tonnage>0?"super":d.tonnage<=p25?"bad":"medium"}));
  })();

  // 1RMs
  const top1RMs = [
    {label:"Développé Couché",ids:["a2","f1"],type:"bench"},
    {label:"Squat",ids:["c1","g1"],type:"squat"},
    {label:"Tractions",ids:["b1"],type:"pullup"},
  ].map(lift=>{
    let best=0;
    lift.ids.forEach(id=>normalizeHistory(history[id]||[]).forEach(h=>
      (h.setsData||[]).forEach(s=>{if(+s.weight>0&&+s.reps>0&&s.done&&!s.isExtra){const rm=calculate1RM(+s.weight,+s.reps);if(rm>best)best=rm;}})
    ));
    return {...lift,best,std:getStrengthStandard(lift.type,best,currentBodyWeight)};
  });

  const historyExercises = useMemo(() => {
    const map = new Map();
    Object.keys(history || {}).forEach(id => {
      const exo = allExercises.find(e => e.id === id) || exerciseLibrary.find(e => e.id === id);
      let name = id;
      let muscle = "Inconnu";
      if (exo) {
        name = exo.name;
        muscle = exo.muscle;
      } else {
        const baseId = id.replace(/_\d+$/, '');
        const baseExo = allExercises.find(e => e.id === baseId) || exerciseLibrary.find(e => e.id === baseId);
        if (baseExo) {
          name = baseExo.name;
          muscle = baseExo.muscle;
        }
      }
      const cleanName = name.trim();
      const lowerName = cleanName.toLowerCase();
      if (!map.has(lowerName)) {
        map.set(lowerName, { name: cleanName, muscle, ids: [id] });
      } else {
        map.get(lowerName).ids.push(id);
      }
    });
    return Array.from(map.values());
  }, [history, allExercises]);

  const selectedHist = useMemo(() => {
    if (!selectedExo) return [];
    
    let combined = [];
    Object.keys(history || {}).forEach(id => {
      const exo = allExercises.find(e => e.id === id) || exerciseLibrary.find(e => e.id === id);
      if (exo && exo.name.toLowerCase().trim() === selectedExo.toLowerCase().trim()) {
        combined.push(...normalizeHistory(history[id] || []));
      } else if (!exo) {
        const baseId = id.replace(/_\d+$/, '');
        const baseExo = allExercises.find(e => e.id === baseId) || exerciseLibrary.find(e => e.id === baseId);
        if (baseExo && baseExo.name.toLowerCase().trim() === selectedExo.toLowerCase().trim()) {
          combined.push(...normalizeHistory(history[id] || []));
        }
      }
    });
    
    return combined.sort((a, b) => parseDate(a.date) - parseDate(b.date));
  }, [selectedExo, history, allExercises]);


  // Nutrition science-based calculations
  const [nutritionGoal, setNutritionGoal] = useState(
    () => localStorage.getItem('iron_nutrition_goal') || 'maintien'
  );
  const [userHeight, setUserHeight] = useState(
    () => parseInt(localStorage.getItem('iron_user_height')) || 175
  );
  const [userAge, setUserAge] = useState(
    () => parseInt(localStorage.getItem('iron_user_age')) || 25
  );
  const [userGender, setUserGender] = useState(
    () => localStorage.getItem('iron_user_gender') || 'homme'
  );
  const [activityLevel, setActivityLevel] = useState(
    () => parseFloat(localStorage.getItem('iron_activity_level')) || 1.55
  );
  const [showNutritionSetup, setShowNutritionSetup] = useState(false);

  const saveNutritionPref = (goal, height, age, gender, activity) => {
    localStorage.setItem('iron_nutrition_goal', goal);
    localStorage.setItem('iron_user_height', height);
    localStorage.setItem('iron_user_age', age);
    localStorage.setItem('iron_user_gender', gender);
    localStorage.setItem('iron_activity_level', activity);
    setNutritionGoal(goal); setUserHeight(height); setUserAge(age); setUserGender(gender); setActivityLevel(activity);
    setShowNutritionSetup(false);
  };

  const nutri = (() => {
    const w = currentBodyWeight, h = userHeight, age = userAge, gender = userGender;
    // Mifflin-St Jeor BMR (plus précis)
    let bmr = (10 * w) + (6.25 * h) - (5 * age);
    bmr = gender === 'homme' ? bmr + 5 : bmr - 161;
    
    const tdee = Math.round(bmr * activityLevel);
    const isTrainingDay = ["A","B","C","D","E","F","G","H","I","J","K"].includes(currentSession);
    
    const goals = {
      seche:    { calMod: -500, protFactor: 2.4, lipFactor: 0.8,  label: 'Sèche',        badge: 'badge-orange', icon: '🔥', color: 'text-orange-400' },
      maintien: { calMod: 0,    protFactor: 2.0, lipFactor: 1.0,  label: 'Maintien',     badge: 'badge-blue',   icon: '⚖️',  color: 'text-blue-400'   },
      masse:    { calMod: +400, protFactor: 1.8, lipFactor: 1.1,  label: 'Prise de Masse', badge: 'badge-green', icon: '💪', color: 'text-emerald-400' }
    };
    const g = goals[nutritionGoal] || goals.maintien;
    const baseCal = tdee + g.calMod + (isTrainingDay ? 150 : 0);
    const prot = Math.round(w * g.protFactor);
    const lip = Math.round(w * g.lipFactor);
    const glucides = Math.round((baseCal - prot*4 - lip*9) / 4);
    return { bmr, tdee, cal: baseCal, prot, lip, glucides: Math.max(0, glucides), ...g, isTrainingDay };
  })();

  return (
    <div className="page-container">
      <div className="bg-orbs" />
      <motion.div variants={container} initial="hidden" animate="visible">

        {/* ── PREMIUM HEADER ── */}
        <motion.div variants={item} className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">Analyses & Stats</h1>
              <p className="text-sm text-slate-500">Données scientifiques de progression</p>
            </div>
          </div>
        </motion.div>

        {/* ── DONUT CHART — Répartition Volume ALL muscles ── */}
        {(() => {
          const total = Object.values(weekVolume).reduce((a, b) => a + b, 0);
          
          const muscleColorMap = {
            Pectoraux:  "#3b82f6", // Blue
            Dos:        "#06b6d4", // Cyan
            Lombaires:  "#14b8a6", // Teal
            Quadriceps: "#10b981", // Emerald
            Ischios:    "#22c55e", // Green
            Fessiers:   "#84cc16", // Lime
            Adducteurs: "#eab308", // Yellow
            Abducteurs: "#f59e0b", // Amber
            Mollets:    "#f97316", // Orange
            Tibias:     "#fdba74", // Light Orange
            Épaules:    "#8b5cf6", // Violet
            Trapèzes:   "#a855f7", // Purple
            Biceps:     "#ec4899", // Pink
            Triceps:    "#f43f5e", // Rose
            "Avant-bras": "#ef4444", // Red
            Abdos:      "#6366f1", // Indigo
            Cou:        "#64748b", // Slate
            Cardio:     "#0ea5e9", // Sky
          };

          // Advice engine
          const advices = [];
          
          const p = weekVolume.Pectoraux || 0;
          const d = weekVolume.Dos || 0;
          const b = weekVolume.Biceps || 0;
          const t = weekVolume.Triceps || 0;
          const q = weekVolume.Quadriceps || 0;
          const isc = weekVolume.Ischios || 0;
          const add = weekVolume.Adducteurs || 0;
          const abd = weekVolume.Abducteurs || 0;
          
          // Pecs vs Dos Balance
          if (p > 0 || d > 0) {
            if (p > d * 1.2) {
              advices.push({
                muscle: "Déséquilibre Pecs/Dos",
                icon: "⚠️",
                text: `Volume Pecs (${p} séries) supérieur au Dos (${d} séries). Risque d'arrondissement des épaules (cyphose). Ajoute des exercices de tirage (Rowing, Oiseau) !`,
                level: "danger"
              });
            } else if (d > p * 1.5) {
              advices.push({
                muscle: "Dominance Dos",
                icon: "💡",
                text: `Ton Dos (${d} séries) est très entraîné par rapport à tes Pecs (${p} séries). C'est excellent pour la posture et la stabilité des épaules.`,
                level: "ok"
              });
            } else {
              advices.push({
                muscle: "Équilibre Pecs/Dos",
                icon: "✅",
                text: "Parfait équilibre postural antéro-postérieur. Continue à répartir ton volume ainsi !",
                level: "ok"
              });
            }
          }
          
          // Biceps vs Triceps Balance
          if (b > 0 || t > 0) {
            if (b > t * 1.3) {
              advices.push({
                muscle: "Déséquilibre Bras",
                icon: "⚠️",
                text: `Tu effectues plus de séries de Biceps (${b}) que de Triceps (${t}). Rappelle-toi que les triceps représentent 60% de la masse de tes bras !`,
                level: "warning"
              });
            } else if (t > b * 1.5) {
              advices.push({
                muscle: "Dominance Triceps",
                icon: "💡",
                text: `Excellent volume Triceps (${t} séries). N'oublie pas les Biceps (${b} séries) pour conserver la stabilité des coudes.`,
                level: "ok"
              });
            }
          }
          
          // Quads vs Ischios Balance
          if (q > 0 || isc > 0) {
            if (q > isc * 1.5) {
              advices.push({
                muscle: "Déséquilibre Cuisse",
                icon: "⚠️",
                text: `Tes Quadriceps (${q} séries) reçoivent beaucoup plus de volume que tes Ischios (${isc} séries). Risque accru de blessures aux ligaments du genou. Ajoute du Leg Curl ou SDT Roumain !`,
                level: "danger"
              });
            }
          }

          // Adducteurs vs Abducteurs Balance
          if (add > 0 || abd > 0) {
            if (Math.abs(add - abd) > 6) {
              advices.push({
                muscle: "Stabilité Bassin",
                icon: "⚠️",
                text: `Écart important entre Adducteurs (${add} séries) et Abducteurs (${abd} séries). Harmonise pour stabiliser ton bassin lors de tes squats lourds.`,
                level: "warning"
              });
            }
          }

          // Under-trained stabilizers & forgotten muscles
          const crucialStabilizers = [
            { name: "Cou", vol: weekVolume.Cou || 0, icon: "🧠", text: "Le Cou a 0 série. Renforcer le cou prévient les tensions cervicales et stabilise le haut du dos." },
            { name: "Tibias", vol: weekVolume.Tibias || 0, icon: "🦵", text: "Les Tibias ont 0 série. Entraîner le tibial antérieur protège contre les périostites." },
            { name: "Mollets", vol: weekVolume.Mollets || 0, icon: "👟", text: "Les Mollets ont 0 série. Un mollet fort soutient tes chevilles et ta détente verticale." },
            { name: "Lombaires", vol: weekVolume.Lombaires || 0, icon: "🪵", text: "Les Lombaires ont 0 série. Le bas du dos doit être solide pour sécuriser tous tes portés de charges." }
          ];

          crucialStabilizers.forEach(m => {
            if (m.vol === 0) {
              advices.push({
                muscle: `Muscle oublié : ${m.name}`,
                icon: m.icon,
                text: m.text,
                level: "warning"
              });
            }
          });

          // active muscles (sets > 0)
          const activeMuscles = Object.entries(weekVolume)
            .filter(([_, sets]) => sets > 0)
            .map(([muscle, sets]) => ({
              muscle,
              sets,
              color: muscleColorMap[muscle] || "#64748b"
            }))
            .sort((a, b) => b.sets - a.sets);

          // Donut segments calculations
          const r = 50, cx = 68, cy = 68, circumference = 2 * Math.PI * r;
          let segments = [];
          if (total === 0) {
            segments = [{
              muscle: "Aucun",
              sets: 0,
              pct: 1,
              strokeDashoffset: 0,
              strokeDasharray: circumference,
              rotation: -90,
              color: "rgba(255,255,255,0.06)"
            }];
          } else {
            let cumulative = 0;
            segments = activeMuscles.map(({ muscle, sets, color }) => {
              const pct = sets / total;
              const strokeDasharray = circumference;
              const strokeDashoffset = circumference * (1 - pct);
              const rotation = (cumulative / total) * 360 - 90;
              cumulative += sets;
              return { muscle, sets, pct, strokeDashoffset, strokeDasharray, rotation, color };
            });
          }

          return (
            <motion.div variants={item} className="glass-card p-5 mb-5">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                <BarChart2 size={16} className="text-blue-400" />Répartition du Volume (7j)
                <span className="ml-auto text-[10px] text-slate-500 font-normal">Total : {total} séries</span>
              </h3>

              <div className="flex flex-col md:flex-row items-center gap-6 mb-5">
                {/* Donut SVG */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <svg width="136" height="136">
                    {segments.map(({ muscle, sets, strokeDashoffset, strokeDasharray, rotation, color }) => (
                      <circle key={muscle} cx={cx} cy={cy} r={r}
                        fill="none" stroke={color} strokeWidth="15"
                        strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
                        strokeLinecap="butt"
                        style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: "all 0.4s ease" }}
                      />
                    ))}
                    <circle cx={cx} cy={cy} r={r - 9} fill="rgba(2,5,9,0.92)" />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white leading-none">{total}</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">séries</span>
                  </div>
                </div>

                {/* Legend - Only active muscles */}
                <div className="flex-1 w-full">
                  {activeMuscles.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-4">Aucun exercice validé sur les 7 derniers jours.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {activeMuscles.map(({ muscle, sets, color }) => (
                        <div key={muscle} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                          <span className="text-[10px] font-bold text-slate-400 flex-1 truncate">{muscle}</span>
                          <span className="text-[10px] font-black text-white shrink-0">
                            {sets} <span className="text-slate-600 font-bold">({Math.round((sets / total) * 100)}%)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Advice list */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2 flex items-center gap-1.5">
                  <Zap size={10} className="text-amber-400" />Moteur d'analyses posturales & cinétiques (Science)
                </p>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-hide">
                  {advices.map(({ muscle, icon, text, level }) => (
                    <div key={muscle} className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${
                      level === "ok"      ? "bg-emerald-950/20 border-emerald-500/12 text-emerald-200" :
                      level === "warning" ? "bg-amber-950/20 border-amber-500/12 text-amber-200" :
                                            "bg-red-950/20 border-red-500/12 text-red-200"
                    }`}>
                      <span className="text-sm shrink-0 w-5 h-5 flex items-center justify-center mt-px">{icon}</span>
                      <div className="text-[10px] sm:text-xs leading-relaxed">
                        <span className={`font-black uppercase tracking-wide mr-1.5 ${
                          level === "ok" ? "text-emerald-400" : level === "warning" ? "text-amber-400" : "text-red-400"
                        }`}>{muscle}</span>
                        <span className="text-slate-300 font-medium">{text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* Posture alert */}
        {volPecs > 5 && volPecs > volDos*1.5 && (
          <motion.div variants={item} className="glass-card border-red-500/25 p-4 mb-5 glow-red">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18}/>
              <div><p className="font-bold text-red-400 text-sm mb-1">Alerte Posturale !</p>
              <p className="text-xs text-slate-300">{volPecs} séries Pecs vs {volDos} Dos — risque d'arrondissement des épaules. Ajoute du tirage !</p></div>
            </div>
          </motion.div>
        )}
        {volDos > 0 && volDos >= volPecs && (
          <motion.div variants={item} className="glass-card border-emerald-500/20 p-3 mb-5 flex items-center gap-3">
            <ArrowRightLeft size={16} className="text-emerald-400 shrink-0"/>
            <p className="text-sm text-emerald-300 font-semibold">Équilibre Postural ✓</p>
          </motion.div>
        )}

        {/* Aesthetic score */}
        <motion.div variants={item} className="glass-card p-5 mb-5 glow-gold border-amber-500/15">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2"><Star size={16} className="text-amber-400"/>Esthétique Dieu Grec</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">V-Taper score (7 jours)</p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-black ${aes.score>=80?"text-gradient-gold":aes.score>=50?"text-emerald-400":"text-slate-400"}`}>{aes.score}</p>
              <p className="text-[10px] text-slate-500">/100</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {[["Épaules 3D",aes.latDelts,"text-violet-400"],["Haut Pecs",aes.upperChest,"text-blue-400"],["V-Taper Dos",aes.lats,"text-cyan-400"]].map(([l,v,c])=>(
              <div key={l} className="glass rounded-xl p-2 sm:p-3 text-center">
                <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">{l}</p>
                <p className={`text-xl font-black ${c}`}>{v}</p>
                <p className="text-[9px] text-slate-600">séries</p>
                <div className="progress-track mt-2"><div className="progress-fill" style={{width:`${Math.min(100,(v/12)*100)}%`,background:c.includes("violet")?"#8b5cf6":c.includes("blue")?"#3b82f6":"#06b6d4"}}/></div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Weekly volume */}
        <motion.div variants={item} className="glass-card p-5 mb-5">
          <h3 className="font-bold text-white flex items-center gap-2 mb-4"><Target size={16} className="text-blue-400"/>Volume Hebdomadaire</h3>
          <div className="space-y-3.5">
            {Object.entries(weekVolume).map(([muscle,sets])=>{
              const optimal=sets>=10&&sets<=20, low=sets>0&&sets<10, high=sets>20;
              const pct=Math.min(100,(sets/25)*100);
              const barColor=optimal?"bg-emerald-500":low?"bg-amber-500":high?"bg-red-500":"bg-slate-700";
              return(
                <div key={muscle}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-white">{muscle}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${optimal?"text-emerald-400":low?"text-amber-400":high?"text-red-400":"text-slate-600"}`}>{sets}</span>
                      {optimal&&<span className="badge badge-green">Optimal</span>}
                      {low&&sets>0&&<span className="badge badge-yellow">Faible</span>}
                      {high&&<span className="badge badge-red">Excessif</span>}
                    </div>
                  </div>
                  <div className="progress-track">
                    <motion.div className={`progress-fill ${barColor}`}
                      initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:.8,delay:.1,ease:"easeOut"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 1RM + Standards */}
        <motion.div variants={item} className="glass-card p-5 mb-5">
          <h3 className="font-bold text-white flex items-center gap-2 mb-4"><Zap size={16} className="text-amber-400"/>Records 1RM Estimés</h3>
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 mb-4 text-left">
            <p className="text-[10px] text-amber-300 font-bold flex items-center gap-1.5 mb-1">
              💡 Le 1RM Estimé, c'est quoi ?
            </p>
            <p className="text-[9px] text-slate-400 leading-relaxed font-medium">
              C'est la charge maximale théorique que tu pourrais soulever sur <strong>une seule répétition</strong>. Il est calculé scientifiquement d'après tes meilleures performances (poids × répétitions) pour mesurer ta force maximale sans avoir à tester tes limites physiques réelles en toute sécurité.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {top1RMs.map(lift=>(
              <div key={lift.label} className="glass rounded-2xl p-2 sm:p-4 text-center">
                <p className="text-[9px] uppercase font-bold text-slate-500 mb-2">{lift.label.split(" ").pop()}</p>
                <p className="text-2xl font-black text-white">{lift.best||"—"}</p>
                {lift.best>0&&<p className="text-[9px] text-slate-600 mt-0.5">kg 1RM</p>}
                <p className={`text-[9px] font-bold mt-2 ${lift.std.color}`}>{lift.std.rank}</p>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-slate-600 text-center mt-3">*Basé sur {currentBodyWeight}kg (poids de corps)</p>
        </motion.div>

        {/* Nutrition du Jour */}
        <motion.div variants={item} className="glass-card p-5 mb-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white flex items-center gap-2"><Flame size={16} className={nutri.color}/>Nutrition du Jour</h3>
            <div className="flex items-center gap-2">
              <span className={`badge ${nutri.badge}`}>{nutri.icon} {nutri.label}</span>
              <button onClick={() => setShowNutritionSetup(v => !v)} className="text-slate-500 hover:text-white transition-colors">
                <Target size={14}/>
              </button>
            </div>
          </div>
          
          {/* Macro Logger */}
          <div className="glass rounded-2xl p-4 mb-4 border border-blue-500/10">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Journal Alimentaire (Aujourd'hui)</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <label className="text-[8px] text-slate-500 uppercase font-bold block mb-1">Prot (g)</label>
                <input 
                  type="number" 
                  placeholder={nutri.prot} 
                  value={editP}
                  onChange={e => setEditP(e.target.value)}
                  className="input-premium !py-1.5 !text-xs text-center"
                />
              </div>
              <div>
                <label className="text-[8px] text-slate-500 uppercase font-bold block mb-1">Glu (g)</label>
                <input 
                  type="number" 
                  placeholder={nutri.glucides} 
                  value={editC}
                  onChange={e => setEditC(e.target.value)}
                  className="input-premium !py-1.5 !text-xs text-center"
                />
              </div>
              <div>
                <label className="text-[8px] text-slate-500 uppercase font-bold block mb-1">Lip (g)</label>
                <input 
                  type="number" 
                  placeholder={nutri.lip} 
                  value={editF}
                  onChange={e => setEditF(e.target.value)}
                  className="input-premium !py-1.5 !text-xs text-center"
                />
              </div>
            </div>
            <button 
              onClick={() => {
                logNutrition(editP || nutri.prot, editC || nutri.glucides, editF || nutri.lip);
                setEditP(""); setEditC(""); setEditF("");
              }}
              className="w-full py-2 bg-blue-500/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl text-[10px] font-black transition-all"
            >
              Enregistrer mes macros ✓
            </button>
            
            {/* Real-time progress bars vs targets */}
            {(() => {
              const today = dailyNutrition[formatDateFR()];
              if (!today || (!today.p && !today.c && !today.f)) return null;
              return (
                <div className="mt-4 space-y-2 pt-3 border-t border-white/5">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-slate-400">Progression Calories</span>
                    <span className="text-white font-bold">{Math.round(today.p*4 + today.c*4 + today.f*9)} / {nutri.cal} kcal</span>
                  </div>
                  <div className="progress-track h-1">
                    <div className="progress-fill bg-blue-500" style={{ width: `${Math.min(100, ((today.p*4 + today.c*4 + today.f*9)/nutri.cal)*100)}%` }} />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Setup form */}
          {showNutritionSetup && (
            <div className="glass rounded-2xl p-4 mb-4 border border-white/5 space-y-4 animate-scale-in">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tes informations physiologiques</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex gap-1 p-1 bg-black/30 rounded-xl">
                  {['homme','femme'].map(g => (
                    <button key={g} onClick={() => { localStorage.setItem('iron_user_gender', g); setUserGender(g); }}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${userGender===g ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                      {g==='homme'?'HOMME':'FEMME'}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1 ml-1">Âge</label>
                  <input type="number" placeholder="Âge" defaultValue={userAge} onChange={e => {localStorage.setItem('iron_user_age', e.target.value); setUserAge(+e.target.value);}} className="input-premium text-center !py-2 !text-xs"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1 ml-1">Taille (cm)</label>
                  <input type="number" defaultValue={userHeight} onChange={e => {localStorage.setItem('iron_user_height', e.target.value); setUserHeight(+e.target.value);}} className="input-premium text-center !py-2 !text-xs"/>
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1 ml-1">Activité</label>
                  <select value={activityLevel} onChange={e => {localStorage.setItem('iron_activity_level', e.target.value); setActivityLevel(+e.target.value);}} className="input-premium !py-2 !text-[10px]">
                    <option value="1.2" className="bg-[#0a0f1e]">Sédentaire</option>
                    <option value="1.375" className="bg-[#0a0f1e]">Léger (1-2j)</option>
                    <option value="1.55" className="bg-[#0a0f1e]">Modéré (3-5j)</option>
                    <option value="1.725" className="bg-[#0a0f1e]">Intense (6-7j)</option>
                    <option value="1.9" className="bg-[#0a0f1e]">Athlète</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <button onClick={() => setShowNutritionSetup(false)} className="btn-primary w-full !py-2 !text-xs">Valider les réglages</button>
              </div>
            </div>
          )}

          {/* Goal selector tabs */}
          <div className="flex gap-1.5 mb-4">
            {[['seche','🔥 Sèche'],['maintien','⚖️ Maintien'],['masse','💪 Masse']].map(([g, l]) => (
              <button key={g} onClick={() => { localStorage.setItem('iron_nutrition_goal', g); setNutritionGoal(g); }}
                className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all border ${ nutritionGoal===g ? 'bg-blue-600/30 border-blue-500/50 text-blue-300' : 'border-white/8 text-slate-500 hover:text-slate-300'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Main macros grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">Calories</p>
              <p className={`text-2xl font-black ${nutri.color}`}>{nutri.cal}</p>
              <p className="text-[9px] text-slate-600">kcal/jour</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">Protéines</p>
              <p className="text-2xl font-black text-blue-400">{nutri.prot}g</p>
              <p className="text-[9px] text-slate-600">{(nutri.prot/currentBodyWeight).toFixed(1)}g/kg</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Glucides</p>
              <p className="text-lg font-black text-amber-400">{nutri.glucides}g</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Lipides</p>
              <p className="text-lg font-black text-orange-400">{nutri.lip}g</p>
            </div>
          </div>
          <div className="text-[9px] text-slate-600 text-center space-y-0.5">
            <p>BMR : {nutri.bmr} kcal • TDEE (x{activityLevel}) : {nutri.tdee} kcal • {currentBodyWeight}kg</p>
            {nutri.isTrainingDay && <p className="text-blue-500/70">+150 kcal jour d'entraînement inclus</p>}
          </div>
        </motion.div>

        {/* Objectifs Élite - 5% Bodyfat */}
        <motion.div variants={item} className="glass-card p-5 mb-5 border-blue-500/30 glow-blue overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 -rotate-12">
            <Trophy size={80} className="text-blue-400" />
          </div>
          <h3 className="font-bold text-white flex items-center gap-2 mb-3">
            <Target size={16} className="text-blue-400"/> Objectifs Élite : Road to 5% BF
          </h3>
          <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
            Atteindre 5% de masse grasse est le Graal du bodybuilding. Voici les pré-requis estimés pour y parvenir sans sacrifier ton muscle.
          </p>
          <div className="space-y-3">
            {[
              { label: "Protéines", val: "2.6 - 3.0g / kg", desc: "Nécessaire pour protéger le muscle en déficit extrême." },
              { label: "Cardio NEAT", val: "12,000 pas / jour", desc: "Maintien de la dépense calorique hors salle." },
              { label: "Force", val: "Maintenir 1RM", desc: "Si ta force chute de >10%, tu perds du muscle." },
              { label: "Patience", val: "12 - 20 semaines", desc: "Une sèche réussie est lente et contrôlée." }
            ].map((obj, i) => (
              <div key={i} className="flex gap-3 items-start bg-black/20 p-2.5 rounded-xl border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0 shadow-[0_0_8px_#3b82f6]" />
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px] font-black text-white uppercase">{obj.label}</span>
                    <span className="text-[10px] font-black text-blue-400">{obj.val}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-tight">{obj.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Exercise progression */}
        <motion.div variants={item} className="glass-card p-5 mb-5">
          <h3 className="font-bold text-white flex items-center gap-2 mb-4"><BarChart2 size={16} className="text-blue-400"/>Progression par Exercice</h3>
          {/* Searchable Custom Select */}
          <div className="relative mb-4">
            <div className="flex items-center bg-slate-900/80 border border-slate-700/60 rounded-2xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-blue-500/50">
              <Search size={16} className="text-slate-500 mr-2" />
              <input
                type="text"
                placeholder="Rechercher un exercice..."
                value={searchExo}
                onChange={e => {
                  setSearchExo(e.target.value);
                  setShowExoList(true);
                }}
                onFocus={() => setShowExoList(true)}
                className="bg-transparent w-full text-white text-sm focus:outline-none placeholder-slate-500"
              />
              {selectedExo && !showExoList && (
                <button onClick={() => { setSelectedExo(""); setSearchExo(""); }} className="text-slate-500 hover:text-white">
                  <X size={16} />
                </button>
              )}
            </div>
            
            <AnimatePresence>
              {showExoList && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl shadow-black/50 z-50 max-h-60 overflow-y-auto"
                >
                  {filteredExos.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">Aucun exercice trouvé</div>
                  ) : (
                    filteredExos.map(exo => (
                      <button
                        key={exo.id}
                        onClick={() => {
                          setSelectedExo(exo.name);
                          setSearchExo(exo.name);
                          setShowExoList(false);
                        }}
                        className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-slate-700 transition-colors flex items-center justify-between"
                      >
                        <span className="text-white text-sm font-medium">{exo.name}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 bg-black/20 rounded-lg">{exo.muscle}</span>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedExo && (
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-4">
              <div className="flex glass rounded-xl p-1 gap-1">
                {[["weight","Poids Max","blue"],["reps","Reps au Max","green"],["sets","Séries","orange"]].map(([m,l,c])=>(
                  <button key={m} onClick={()=>setMetric(m)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${metric===m?`bg-${c}-600 text-white shadow-lg`:"text-slate-500 hover:text-slate-300"}`}>{l}</button>
                ))}
              </div>
              <EvolutionChart data={selectedHist} metric={metric}
                color={metric==="weight"?"#3b82f6":metric==="reps"?"#34d399":"#f97316"}/>
              {selectedHist.length>0&&(()=>{
                const last=getPerformanceMetrics(selectedHist[selectedHist.length-1].setsData);
                const maxW=Math.max(...selectedHist.flatMap(h=>h.setsData.map(s=>+s.weight||0)));
                return(
                  <div className="grid grid-cols-2 gap-3">
                    {[["Record Poids",`${maxW} kg`,"text-white"],["Dernier Volume",`${last?.totalVolume||0} kg`,"text-blue-400"]].map(([l,v,c])=>(
                      <div key={l} className="glass rounded-xl p-3 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-500">{l}</p>
                        <p className={`text-xl font-black ${c} mt-1`}>{v}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </motion.div>

        {/* Session history */}
        <motion.div variants={item} className="mb-6">
          <h3 className="section-title"><Award size={20} className="text-amber-400"/>Panthéon des Séances</h3>
          {sessionHistory.length===0
            ? <p className="text-slate-500 text-sm glass-card p-6 text-center">Aucune séance enregistrée</p>
            : <div className="space-y-2">
                {sessionHistory.map((s,i)=>(
                  <motion.div key={i} initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:i*.04}}
                    className="glass-card p-4 flex justify-between items-center cursor-pointer hover:border-blue-500/30"
                    onClick={() => setSelectedSession(s)}>
                    <div>
                      <p className="text-white font-bold text-sm">{s.sessionTitle}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{s.date} • {s.exos} exercices</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-base font-black text-blue-400">{s.tonnage.toLocaleString()} <span className="text-xs text-slate-500 font-normal">kg</span></p>
                      {s.rank==="super"&&<Trophy size={18} className="text-amber-400"/>}
                      {s.rank==="medium"&&<Flame size={18} className="text-blue-400"/>}
                      {s.rank==="bad"&&<TrendingDown size={18} className="text-slate-500"/>}
                    </div>
                  </motion.div>
                ))}
              </div>
          }
        </motion.div>

        {/* Export */}
        <motion.div variants={item}>
          <button onClick={exportToCSV} className="btn-glass w-full py-4">
            <Download size={16}/> Exporter les données (CSV)
          </button>
        </motion.div>

        <AnimatePresence>
          {selectedSession && (
            <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
              <motion.div 
                className="modal-card max-h-[80vh] overflow-y-auto" 
                initial={{ scale:.8, opacity:0 }} 
                animate={{ scale:1, opacity:1 }} 
                exit={{ scale:.8, opacity:0 }} 
                onClick={e=>e.stopPropagation()}
              >
                <h2 className="text-xl font-black text-white mb-2">{selectedSession.sessionTitle}</h2>
                <p className="text-sm text-blue-400 mb-4">{selectedSession.date}</p>
                
                <div className="space-y-3">
                  {selectedSession.details.map((exo, idx) => (
                    <div key={idx} className="glass-card p-3 border-white/5">
                      <p className="text-sm font-bold text-white mb-1">{exo.name}</p>
                      <p className="text-[10px] text-slate-500 mb-2">{exo.tonnage.toLocaleString()} kg total</p>
                      <div className="space-y-1">
                        {exo.sets.map((s, si) => (
                          <div key={si} className="text-xs text-slate-300 flex justify-between">
                            <span>Série {si + 1}</span>
                            <span className="font-mono">{s.weight} kg × {s.reps}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <button onClick={() => setSelectedSession(null)} className="btn-glass w-full mt-5">Fermer</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Analytics;
