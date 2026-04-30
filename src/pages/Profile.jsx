import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import EvolutionChart from "../components/charts/EvolutionChart";
import { motion } from "framer-motion";
import { Scale, Trophy, TrendingUp, TrendingDown, User, CheckCircle2, Dumbbell, Activity } from "lucide-react";

const item = { hidden:{opacity:0,y:18}, visible:{opacity:1,y:0,transition:{duration:.4,ease:"easeOut"}} };
const container = { hidden:{}, visible:{transition:{staggerChildren:.09}} };

const Profile = () => {
  const { bodyWeightHistory, bodyMeasurements, currentBodyWeight, saveBodyData } = useApp();
  const [weight, setWeight] = useState("");
  const [shoulders, setShoulders] = useState("");
  const [waist, setWaist] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!weight && !shoulders && !waist) return;
    setSaving(true);
    await saveBodyData(weight, shoulders, waist);
    setWeight(""); setShoulders(""); setWaist("");
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const lastRatio = bodyMeasurements.length > 0 ? parseFloat(bodyMeasurements[bodyMeasurements.length-1].ratio) : null;
  const prevW = bodyWeightHistory.length > 1 ? parseFloat(bodyWeightHistory[bodyWeightHistory.length-2].value) : null;
  const diff = prevW ? (currentBodyWeight - prevW).toFixed(1) : null;

  // Gold ratio progress
  const ratioProgress = lastRatio ? Math.min(100, (lastRatio / 1.8) * 100) : 0;
  const isGodLevel = lastRatio && lastRatio >= 1.6;

  return (
    <div className="page-container">
      <div className="bg-orbs" />
      <motion.div variants={container} initial="hidden" animate="visible">

        {/* Header */}
        <motion.div variants={item} className="section-title mb-8">
          <User size={20} className="text-blue-400" /> Mon Profil Corporel
        </motion.div>

        {/* Hero stats */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3 mb-6">
          <div className={`glass-card p-5 ${isGodLevel ? "glow-gold border-amber-500/20" : "glow-blue border-blue-500/10"}`}>
            <div className="flex items-center gap-2 mb-2">
              <Scale size={14} className="text-blue-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Poids actuel</span>
            </div>
            <p className="text-4xl font-black text-white">{currentBodyWeight}</p>
            <p className="text-sm text-slate-500">kg</p>
            {diff !== null && (
              <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${parseFloat(diff)<0?"text-emerald-400":"text-red-400"}`}>
                {parseFloat(diff)<0?<TrendingDown size={11}/>:<TrendingUp size={11}/>}
                {parseFloat(diff)>0?"+":""}{diff} kg
              </p>
            )}
          </div>

          {lastRatio ? (
            <div className={`glass-card p-5 ${isGodLevel?"glow-gold border-amber-500/20":""}`}>
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={14} className="text-amber-400"/>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Index d'Adonis</span>
              </div>
              <p className="text-4xl font-black text-gradient-gold">{lastRatio}</p>
              <p className="text-xs text-slate-500 mt-1">cible: 1.61 (Φ)</p>
              {isGodLevel && <p className="text-[10px] font-bold text-amber-400 mt-2 animate-bounce-sm">⚡ DIEU GREC !</p>}
            </div>
          ) : (
            <div className="glass-card p-5 flex flex-col items-center justify-center text-center">
              <Trophy size={28} className="text-slate-600 mb-2"/>
              <p className="text-xs text-slate-500">Entre tes mensurations pour calculer l'Index d'Adonis</p>
            </div>
          )}
        </motion.div>

        {/* Weight chart */}
        {bodyWeightHistory.length > 1 && (
          <motion.div variants={item} className="mb-6">
            <p className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-3"><TrendingUp size={14} className="text-violet-400"/>Évolution du Poids</p>
            <EvolutionChart data={bodyWeightHistory} metric="bodyweight" color="#8b5cf6"/>
          </motion.div>
        )}

        {/* Adonis card */}
        <motion.div variants={item} className="glass-card p-5 mb-6 border-amber-500/15 glow-gold">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/12 flex items-center justify-center">
              <Trophy size={20} className="text-amber-400"/>
            </div>
            <div>
              <h3 className="font-bold text-white">Index d'Adonis</h3>
              <p className="text-[10px] text-slate-500">Ratio Doré : Épaules / Taille = 1.618 (Φ)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {[["Tour d'Épaules (cm)","ex: 120",shoulders,setShoulders],["Tour de Taille (cm)","ex: 78",waist,setWaist]].map(([l,p,v,sv])=>(
              <div key={l}>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">{l}</label>
                <input type="number" placeholder={p} value={v} onChange={e=>sv(e.target.value)} className="input-premium"/>
              </div>
            ))}
          </div>

          {lastRatio && (
            <div className="glass rounded-2xl p-4 text-center mb-4 border border-white/5">
              <p className="text-xs text-slate-500 mb-2">Ton ratio actuel</p>
              <p className="text-5xl font-black text-gradient-gold mb-3">{lastRatio}</p>
              <div className="progress-track">
                <motion.div className="progress-fill bg-gradient-to-r from-amber-600 to-amber-400"
                  initial={{width:0}} animate={{width:`${ratioProgress}%`}} transition={{duration:1.2,ease:"easeOut"}}/>
              </div>
              <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                <span>0</span><span className="text-amber-500">1.61 (Φ)</span><span>1.8+</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Add weight form */}
        <motion.div variants={item} className="glass-card p-5 mb-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Scale size={14} className="text-blue-400"/>Enregistrer mon Poids</h3>
          <div className="flex gap-2">
            <input type="number" placeholder="00.0" value={weight} onChange={e=>setWeight(e.target.value)}
              className="input-premium text-xl text-center flex-1 font-black"/>
            <span className="self-center text-slate-400 font-semibold text-sm">kg</span>
            <motion.button
              whileTap={{scale:.95}}
              onClick={handleSave}
              disabled={saving}
              className={`btn-primary px-6 ${saved?"!bg-emerald-600 !border-emerald-400/40":""}`}>
              {saved ? <CheckCircle2 size={18}/> : saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : "OK"}
            </motion.button>
          </div>
          <p className="text-[10px] text-slate-600 text-center mt-2">Valide les mensurations ci-dessus en même temps</p>
        </motion.div>

        {/* History */}
        {bodyWeightHistory.length > 0 && (
          <motion.div variants={item}>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Historique du Poids</p>
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
              {bodyWeightHistory.slice().reverse().map((e,i)=>(
                <motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*.03}}
                  className="glass-card p-3 flex justify-between items-center">
                  <span className="text-slate-500 text-xs font-mono">{e.date}</span>
                  <span className="text-white font-black">{e.value} <span className="text-slate-500 font-normal text-xs">kg</span></span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
