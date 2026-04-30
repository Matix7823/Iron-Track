import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { parseDate } from "../utils/date";
import { normalizeHistory, getPerformanceMetrics, calculate1RM, getStrengthStandard } from "../utils/metrics";
import EvolutionChart from "../components/charts/EvolutionChart";
import { motion } from "framer-motion";
import {
  Activity, BarChart2, Award, Star, Target, Zap, Download,
  TrendingDown, ArrowRightLeft, AlertTriangle, Trophy, Flame
} from "lucide-react";

const item = { hidden:{opacity:0,y:18}, visible:{opacity:1,y:0,transition:{duration:.4,ease:"easeOut"}} };
const container = { hidden:{}, visible:{transition:{staggerChildren:.08}} };

const Analytics = () => {
  const { history, allExercises, currentBodyWeight, exportToCSV, currentSession } = useApp();
  const [selectedExo, setSelectedExo] = useState("");
  const [metric, setMetric] = useState("weight");

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
    Object.keys(history).forEach(id => {
      const exo = allExercises.find(e=>e.id===id); if(!exo) return;
      const g = map[exo.muscle]; if(!g) return;
      (history[id]||[]).forEach(entry => {
        const d = parseDate(entry.date);
        if(d>=d7&&d<=now) vol[g] += (entry.setsData||[]).filter(s=>s.done&&+s.weight>0&&!s.isExtra).length;
      });
    });
    return vol;
  })();

  const maxVol = Math.max(...Object.values(weekVolume), 1);
  const volPecs = weekVolume.Pecs||0, volDos = weekVolume.Dos||0;

  // Aesthetic score
  const aes = (() => {
    const now=new Date(),d7=new Date(now-7*864e5);
    let latDelts=0,upperChest=0,lats=0;
    Object.keys(history).forEach(id=>{
      const exo=allExercises.find(e=>e.id===id); if(!exo) return;
      (history[id]||[]).forEach(entry=>{
        const d=parseDate(entry.date);
        if(d>=d7&&d<=now){
          const v=(entry.setsData||[]).filter(s=>s.done&&+s.weight>0&&!s.isExtra).length;
          if(exo.muscle==="Épaules (Latéral)") latDelts+=v;
          if(exo.muscle==="Pecs (Haut)")       upperChest+=v;
          if(exo.muscle==="Dos (Largeur)")     lats+=v;
        }
      });
    });
    const g = Math.round((Math.min(100,(latDelts/10)*100)+Math.min(100,(upperChest/10)*100)+Math.min(100,(lats/10)*100))/3);
    return {latDelts,upperChest,lats,score:g};
  })();

  // Sessions history
  const sessionHistory = (() => {
    const m={};
    Object.keys(history).forEach(id=>{
      (history[id]||[]).forEach(entry=>{
        if(!entry.date) return;
        if(!m[entry.date]) m[entry.date]={date:entry.date,tonnage:0,exos:0};
        (entry.setsData||[]).forEach(s=>{ if(+s.weight>0&&+s.reps>0&&s.done!==false) m[entry.date].tonnage+=+s.weight*+s.reps; });
        if(m[entry.date].tonnage>0) m[entry.date].exos++;
      });
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

  const selectedHist = selectedExo ? normalizeHistory(history[selectedExo]||[]) : [];

  const carbInfo = (() => {
    const w=currentBodyWeight, maint=Math.round(w*33), prot=Math.round(w*2);
    const isHigh=["A","B","C","D","E","F","G"].includes(currentSession);
    return {cal:isHigh?maint+300:maint-300,prot,isHigh};
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
          <div className="grid grid-cols-3 gap-2">
            {[["Épaules 3D",aes.latDelts,"text-violet-400"],["Haut Pecs",aes.upperChest,"text-blue-400"],["V-Taper Dos",aes.lats,"text-cyan-400"]].map(([l,v,c])=>(
              <div key={l} className="glass rounded-xl p-3 text-center">
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
          <div className="grid grid-cols-3 gap-3">
            {top1RMs.map(lift=>(
              <div key={lift.label} className="glass rounded-2xl p-4 text-center">
                <p className="text-[9px] uppercase font-bold text-slate-500 mb-2">{lift.label.split(" ").pop()}</p>
                <p className="text-2xl font-black text-white">{lift.best||"—"}</p>
                {lift.best>0&&<p className="text-[9px] text-slate-600 mt-0.5">kg 1RM</p>}
                <p className={`text-[9px] font-bold mt-2 ${lift.std.color}`}>{lift.std.rank}</p>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-slate-600 text-center mt-3">*Basé sur {currentBodyWeight}kg (poids de corps)</p>
        </motion.div>

        {/* Carb cycling */}
        <motion.div variants={item} className="glass-card p-5 mb-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white flex items-center gap-2"><Flame size={16} className={carbInfo.isHigh?"text-emerald-400":"text-orange-400"}/>Nutrition du Jour</h3>
            <span className={`badge ${carbInfo.isHigh?"badge-green":"badge-orange"}`}>{carbInfo.isHigh?"High Carb 💪":"Low Carb 🔥"}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[["Protéines",`${carbInfo.prot}g`,"text-blue-400"],["Calories",`${carbInfo.cal} kcal`,carbInfo.isHigh?"text-emerald-400":"text-orange-400"]].map(([l,v,c])=>(
              <div key={l} className="glass rounded-xl p-4 text-center">
                <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">{l}</p>
                <p className={`text-xl font-black ${c}`}>{v}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Exercise progression */}
        <motion.div variants={item} className="glass-card p-5 mb-5">
          <h3 className="font-bold text-white flex items-center gap-2 mb-4"><BarChart2 size={16} className="text-blue-400"/>Progression par Exercice</h3>
          <select value={selectedExo} onChange={e=>setSelectedExo(e.target.value)} className="input-premium mb-4">
            <option value="">— Sélectionner un exercice —</option>
            {allExercises.map(exo=><option key={exo.id} value={exo.id} className="bg-[#0a0f1e]">{exo.name}</option>)}
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
                    className="glass-card p-4 flex justify-between items-center">
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
      </motion.div>
    </div>
  );
};

export default Analytics;
