import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { exerciseLibrary } from "../data/exerciseLibrary";
import { parseDate, formatDateFR } from "../utils/date";
import { normalizeHistory, getPerformanceMetrics, calculate1RM, getStrengthStandard } from "../utils/metrics";
import EvolutionChart from "../components/charts/EvolutionChart";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, BarChart2, Award, Star, Target, Zap, Download,
  TrendingDown, ArrowRightLeft, AlertTriangle, Trophy, Flame
} from "lucide-react";

const item = { hidden:{opacity:0,y:18}, visible:{opacity:1,y:0,transition:{duration:.4,ease:"easeOut"}} };
const container = { hidden:{}, visible:{transition:{staggerChildren:.08}} };

const Analytics = () => {
  const { 
    history, allExercises, currentBodyWeight, exportToCSV, currentSession,
    dailyNutrition, logNutrition 
  } = useApp();
  const [selectedExo, setSelectedExo] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [metric, setMetric] = useState("weight");
  
  const [editP, setEditP] = useState("");
  const [editC, setEditC] = useState("");
  const [editF, setEditF] = useState("");

  // Weekly volume per muscle group
  const weekVolume = (() => {
    const now = new Date(), d7 = new Date(now - 7*864e5);
    const vol = { Pecs:0, Dos:0, Jambes:0, Épaules:0, Bras:0, Abdos:0 };
    const map = {
      "Pecs (Haut)":"Pecs","Pecs (Masse)":"Pecs","Pecs (Bas)":"Pecs","Pecs (Iso)":"Pecs","Finition":"Pecs",Pecs:"Pecs",
      "Dos (Largeur)":"Dos","Dos (Épaisseur)":"Dos","Dos (Bas)":"Dos","Dos (Isolation)":"Dos",Dos:"Dos",
      Cuisses:"Jambes",Ischios:"Jambes",Mollets:"Jambes",Jambes:"Jambes",
      "Épaules (Masse)":"Épaules","Épaules (Latéral)":"Épaules","Arr. Épaules":"Épaules",Épaules:"Épaules",Trapèzes:"Épaules",
      "Biceps (Long)":"Bras","Biceps (Court)":"Bras",Brachial:"Bras","Triceps (Masse)":"Bras","Triceps (Long)":"Bras","Triceps (Vaste)":"Bras","Avant-Bras":"Bras",Bras:"Bras",
      Abdos:"Abdos","Abdos (Bas)":"Abdos",Obliques:"Abdos",Transverse:"Abdos",Gainage:"Abdos",Lombaires:"Abdos",Taille:"Abdos",
    };
    Object.keys(history || {}).forEach(id => {
      const exo = allExercises.find(e=>e.id===id); if(!exo) return;
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
  })();

  const maxVol = Math.max(...Object.values(weekVolume), 1);
  const volPecs = weekVolume.Pecs||0, volDos = weekVolume.Dos||0;

  // Aesthetic score
  const aes = (() => {
    const now=new Date(),d7=new Date(now-7*864e5);
    let latDelts=0,upperChest=0,lats=0;
    Object.keys(history || {}).forEach(id=>{
      const exo=allExercises.find(e=>e.id===id); if(!exo) return;
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
        const baseId = id.split('_').slice(0, 3).join('_');
        const baseExo = exerciseLibrary.find(e => e.id === baseId);
        if (baseExo) {
          name = baseExo.name;
          muscle = baseExo.muscle;
        }
      }
      if (!map.has(name)) {
        map.set(name, { name, muscle, ids: [id] });
      } else {
        map.get(name).ids.push(id);
      }
    });
    return Array.from(map.values());
  }, [history, allExercises]);

  const selectedHist = useMemo(() => {
    if (!selectedExo) return [];
    const exoInfo = historyExercises.find(e => e.name === selectedExo);
    if (!exoInfo) return [];
    
    let combined = [];
    exoInfo.ids.forEach(id => {
      const hist = normalizeHistory(history[id] || []);
      combined.push(...hist);
    });
    
    return combined.sort((a, b) => parseDate(a.date) - parseDate(b.date));
  }, [selectedExo, historyExercises, history]);


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

        {/* Title */}
        <motion.div variants={item} className="section-title mb-6">
          <Activity size={20} className="text-blue-400" /> Analyses & Statistiques
        </motion.div>

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
          <select value={selectedExo} onChange={e=>setSelectedExo(e.target.value)} className="input-premium mb-4">
            <option value="">— Sélectionner un exercice —</option>
            {Object.entries(
              historyExercises.reduce((acc, exo) => {
                if (!acc[exo.muscle]) acc[exo.muscle] = [];
                acc[exo.muscle].push(exo);
                return acc;
              }, {})
            ).sort(([a],[b])=>a.localeCompare(b)).map(([muscle, exos]) => (
              <optgroup key={muscle} label={`── ${muscle} ──`}>
                {exos.map(exo => <option key={exo.name} value={exo.name} className="bg-[#0a0f1e]">{exo.name}</option>)}
              </optgroup>
            ))}
          </select>

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
                      <p className="text-white font-bold text-sm">{s.date}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{s.exos} exercices</p>
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
                <h2 className="text-xl font-black text-white mb-2">Détails de la séance</h2>
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
