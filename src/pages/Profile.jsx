import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import EvolutionChart from "../components/charts/EvolutionChart";
import { motion } from "framer-motion";
import { Scale, Trophy, TrendingUp, TrendingDown, User, CheckCircle2, Dumbbell, Activity } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

const item = { hidden:{opacity:0,y:18}, visible:{opacity:1,y:0,transition:{duration:.4,ease:"easeOut"}} };
const container = { hidden:{}, visible:{transition:{staggerChildren:.09}} };

const Profile = () => {
  const { bodyWeightHistory, bodyMeasurements, currentBodyWeight, saveBodyData, progression, theme, setTheme } = useApp();
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

        {/* Level & Rank System */}
        <motion.div variants={item} className="glass-card p-0 mb-6 overflow-hidden border-white/5">
          <div className={`bg-gradient-to-r ${progression.rankColor} p-5 relative overflow-hidden`}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <Dumbbell className="absolute -right-4 -bottom-4 rotate-12" size={120} />
            </div>

            <div className="flex justify-between items-start relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Niveau {progression.level}</span>
                  {progression.isGod && <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[8px] font-bold text-white backdrop-blur-md border border-white/20">DIVIN</span>}
                </div>
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                  {progression.rankName} {progression.step}
                  <span className="text-2xl drop-shadow-lg">{progression.rankIcon}</span>
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-white/60 uppercase">Total XP</p>
                <p className="text-xl font-black text-white">{progression.xp.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6 relative z-10">
              <div className="flex justify-between text-[10px] font-bold text-white/80 mb-2 uppercase tracking-wider">
                <span>Progression</span>
                {progression.isMax ? <span>Niveau Max atteint</span> : <span>{progression.xpToNext.toLocaleString()} XP avant {progression.step === 3 ? "le rang suivant" : `le palier ${progression.step + 1}`}</span>}
              </div>
              <div className="h-3 w-full bg-black/30 rounded-full overflow-hidden backdrop-blur-sm border border-white/10 shadow-inner">
                <motion.div 
                  className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progression.progress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-slate-900/50 flex justify-center gap-4 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <Activity size={12} className="text-slate-500" />
              <span className="text-[10px] text-slate-400 font-medium">Statut: <span className="text-emerald-400 font-bold">Actif</span></span>
            </div>
            <div className="w-px h-3 bg-slate-800 self-center" />
            <div className="flex items-center gap-1.5">
              <Trophy size={12} className="text-slate-500" />
              <span className="text-[10px] text-slate-400 font-medium">Objectif: <span className="text-amber-400 font-bold">Dieu Grec</span></span>
            </div>
          </div>
        </motion.div>

        {/* Cyber Neon Themes Selector */}
        <motion.div variants={item} className="glass-card p-5 mb-6 border-white/5">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity size={14} className="text-blue-400" /> Ambiance Lumineuse Cyber
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: "blue", name: "Cyan Saphir", color: "from-blue-600 to-indigo-700", glow: "shadow-[0_0_15px_rgba(59,130,246,0.5)]", border: "border-blue-500/40" },
              { id: "pink", name: "Cyberpunk Pink", color: "from-pink-600 to-purple-700", glow: "shadow-[0_0_15px_rgba(236,72,153,0.5)]", border: "border-pink-500/40" },
              { id: "green", name: "Vert Volt", color: "from-emerald-600 to-cyan-700", glow: "shadow-[0_0_15px_rgba(16,185,129,0.5)]", border: "border-emerald-500/40" },
              { id: "orange", name: "Orange Ambre", color: "from-amber-600 to-red-700", glow: "shadow-[0_0_15px_rgba(245,158,11,0.5)]", border: "border-amber-500/40" }
            ].map((t) => (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setTheme(t.id);
                  triggerHaptic(15);
                }}
                className={`relative rounded-xl p-3 flex flex-col items-center justify-center text-center gap-2 border bg-slate-900/40 transition-all ${
                  theme === t.id 
                    ? `bg-gradient-to-br ${t.color} ${t.border} ${t.glow} text-white` 
                    : "border-white/5 text-slate-400 hover:border-white/10 hover:text-white"
                }`}
              >
                <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${t.color} border border-white/20`} />
                <span className="text-[10px] font-black tracking-wide uppercase">{t.name}</span>
                {theme === t.id && (
                  <motion.div 
                    layoutId="activeThemeDot" 
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center border border-black shadow"
                  >
                    <CheckCircle2 size={8} className="text-slate-950 stroke-[3]" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Info montée de niveau */}
        <motion.div variants={item} className="glass-card p-4 mb-6 border-blue-500/10">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Trophy size={14} className="text-blue-400" /> Comment monter de niveau ?
          </h3>
          <div className="space-y-2 text-xs text-slate-400">
            <p><span className="text-white font-bold">🏋️‍♂️ Entraînement</span> : Gagne de l'XP en validant tes séances (200 XP base + 1 XP par 10kg soulevés).</p>
            <p><span className="text-white font-bold">🔥 Énergie</span> : Plus ton niveau d'énergie est haut (score CNS), plus tu gagnes d'XP (jusqu'à 1.66x).</p>
            <p><span className="text-white font-bold">📉 Inactivité</span> : Attention, après 3 jours sans entraînement, tu perds 1% d'XP par jour.</p>
            <p><span className="text-white font-bold">⚡ Ultime</span> : Atteins le niveau 27 pour débloquer le rang <span className="text-yellow-400 font-black">Dieu Grec</span>.</p>
          </div>
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
        {bodyWeightHistory.length > 0 && (
          <motion.div variants={item} className="glass-card p-5 mb-6 border-violet-500/15">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <TrendingUp size={16} className="text-violet-400"/>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Évolution du Poids</p>
                <p className="text-[10px] text-slate-500">{bodyWeightHistory.length} mesure{bodyWeightHistory.length > 1 ? "s" : ""} enregistrée{bodyWeightHistory.length > 1 ? "s" : ""}</p>
              </div>
            </div>
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
