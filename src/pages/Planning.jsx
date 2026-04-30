import React, { useState } from "react";
import { schedules, sessions } from "../data/sessions";
import { Calendar, ChevronRight, Settings, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";

const sessionColors = {
  A:"from-blue-600 to-blue-800", B:"from-cyan-600 to-cyan-800", C:"from-emerald-600 to-emerald-800",
  D:"from-violet-600 to-violet-800", E:"from-orange-600 to-orange-800", F:"from-sky-600 to-sky-800",
  G:"from-teal-600 to-teal-800", H:"from-red-600 to-red-800", I:"from-pink-600 to-pink-800", J:"from-rose-600 to-rose-800",
  K:"from-indigo-600 to-indigo-800"
};

const getSessionColor = (key, userSessions) => {
  if (sessionColors[key]) return sessionColors[key];
  return userSessions?.[key]?.color || "from-purple-600 to-purple-800";
};

const Planning = () => {
  const { setCurrentSession, customSchedule, updateCustomSchedule, userSessions } = useApp();
  const [editingDay, setEditingDay] = useState(null);
  const [editingDayName, setEditingDayName] = useState(false);
  const [newDayName, setNewDayName] = useState("");

  const days = ["L","M","M","J","V","S","D"];

  // customSchedule is now an array of {session, label, status} objects or old string format
  const normalizedSchedule = Array.isArray(customSchedule) ? customSchedule.map(d =>
    typeof d === 'string' ? { session: d, label: '', status: null } : { session: d?.session || '-', label: d?.label || '', status: d?.status || null }
  ) : Array.from({length:7}).map(() => ({ session: '-', label: '', status: null }));

  const STATUS_ICONS = { super: '🏆', good: '✅', rest: '😴', none: null };
  const STATUS_LABELS = { super: 'Super', good: 'Bonne', rest: 'Repos', none: '' };

  const handleSelectSession = (sessionKey) => {
    if (editingDay !== null) {
      const newSchedule = [...normalizedSchedule];
      newSchedule[editingDay] = { ...newSchedule[editingDay], session: sessionKey };
      updateCustomSchedule(newSchedule);
      setEditingDay(null);
    }
  };

  const addDay = () => {
    const newSchedule = [...normalizedSchedule, { session: '-', label: newDayName || `Jour ${normalizedSchedule.length + 1}` }];
    updateCustomSchedule(newSchedule);
    setNewDayName('');
    setEditingDayName(false);
  };

  const removeDay = (idx) => {
    if (normalizedSchedule.length <= 1) return;
    const newSchedule = normalizedSchedule.filter((_, i) => i !== idx);
    updateCustomSchedule(newSchedule);
  };

  const cycleStatus = (idx) => {
    const d = normalizedSchedule[idx];
    const cycle = { null: 'rest', rest: 'good', good: 'super', super: null };
    const nextStatus = cycle[d.status ?? 'null'] !== undefined ? cycle[d.status ?? 'null'] : 'rest';
    const newSchedule = [...normalizedSchedule];
    newSchedule[idx] = { ...d, status: nextStatus === 'null' ? null : nextStatus };
    updateCustomSchedule(newSchedule);
  };

  const getDayLabel = (d, i) => {
    if (d.label) return d.label;
    const defaults = ["L", "M", "M", "J", "V", "S", "D"];
    return defaults[i] || `J${i+1}`;
  };

  return (
    <div className="page-container">
      <div className="bg-orbs"/>
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="mb-8">
        <p className="section-title"><Calendar size={20} className="text-blue-400"/>Programmes d'Entraînement</p>
        <p className="text-sm text-slate-400 -mt-2">Choisis un programme ou crée le tien</p>
      </motion.div>

      {/* Mon Programme Personnalisé */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="glass-card overflow-hidden mb-8 border-indigo-500/30 glow-purple">
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="font-black text-white text-base">Programme Personnalisé</h3>
            <p className="text-xs text-indigo-400 font-medium mt-0.5">Crée ta semaine sur mesure (clique sur un jour)</p>
          </div>
        </div>

        <div className="p-5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {normalizedSchedule.map((d, i) => {
              const isRest = d.session === "-";
              const s = !isRest ? (sessions[d.session] || userSessions?.[d.session]) : null;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 group relative">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{getDayLabel(d, i)}</span>
                  
                  <button
                    onClick={() => setEditingDay(i)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shadow-lg hover:scale-110 active:scale-95 transition-all ${isRest ? "bg-white/5 border border-dashed border-white/20 text-slate-500 hover:text-white" : "text-white bg-gradient-to-br " + getSessionColor(d.session, userSessions)}`}
                  >
                    {isRest ? "+" : d.session}
                  </button>
                  
                  {/* Status icon — click to cycle */}
                  <button
                    onClick={() => cycleStatus(i)}
                    title="Cliquer pour changer le statut"
                    className="text-base leading-none hover:scale-125 transition-transform"
                  >
                    {d.status ? STATUS_ICONS[d.status] : (
                      <span className="w-4 h-1 rounded-full bg-white/10 block mt-0.5" />
                    )}
                  </button>

                  {/* Remove day button (visible on hover) */}
                  {normalizedSchedule.length > 1 && (
                    <button
                      onClick={() => removeDay(i)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500/80 rounded-full hidden group-hover:flex items-center justify-center text-white text-[9px] font-black hover:bg-red-400"
                    >×</button>
                  )}
                </div>
              );
            })}

            {/* Add day button */}
            {editingDayName ? (
              <div className="flex flex-col items-center gap-1 shrink-0">
                <input
                  type="text"
                  value={newDayName}
                  onChange={e => setNewDayName(e.target.value)}
                  placeholder="Nom..."
                  className="w-20 text-center text-xs bg-slate-800 border border-blue-500/50 rounded-xl px-1 py-1.5 text-white outline-none"
                  autoFocus
                  onKeyDown={e => { if(e.key==='Enter') addDay(); if(e.key==='Escape') setEditingDayName(false); }}
                />
                <button onClick={addDay} className="text-[9px] text-blue-400 font-bold hover:text-blue-300">OK</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <span className="text-[9px] text-transparent">+</span>
                <button
                  onClick={() => setEditingDayName(true)}
                  className="w-12 h-12 rounded-2xl border border-dashed border-indigo-500/40 text-indigo-500 hover:text-indigo-300 hover:border-indigo-400 flex items-center justify-center transition-all"
                >
                  <Plus size={18} />
                </button>
                <span className="text-[8px] text-indigo-600 uppercase font-bold">Jour +</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-end">
            <Link to="/workout" state={{session:normalizedSchedule.find(d=>d.session!=="-")?.session}}
              onClick={()=>{const first=normalizedSchedule.find(d=>d.session!=="-");if(first)setCurrentSession(first.session);}}
              className={`btn-primary text-xs gap-1.5 ${normalizedSchedule.every(d=>d.session==="-") ? "opacity-50 pointer-events-none" : ""}`}>
              Commencer ma semaine <ChevronRight size={13}/>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Selector Modal for Custom Schedule */}
      <AnimatePresence>
        {editingDay !== null && (
          <div className="modal-overlay" onClick={() => setEditingDay(null)}>
            <motion.div className="modal-card !p-0 overflow-hidden flex flex-col max-h-[80vh]" initial={{ y:50, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:50, opacity:0 }} onClick={e=>e.stopPropagation()}>
              <div className="p-5 border-b border-white/5">
                <h3 className="font-black text-white">Séance du {getDayLabel(normalizedSchedule[editingDay] || {}, editingDay)}</h3>
                <p className="text-xs text-slate-400">Choisis la séance à effectuer ce jour-là.</p>
              </div>
              <div className="p-4 overflow-y-auto grid grid-cols-2 gap-2">
                <button onClick={() => handleSelectSession("-")} className="glass-card p-3 flex flex-col items-center justify-center gap-1 hover:border-slate-500/50">
                  <span className="text-xl">😴</span>
                  <span className="text-xs font-bold text-slate-400">Repos</span>
                </button>
                {Object.entries(userSessions).map(([k, s]) => (
                  <button key={k} onClick={() => handleSelectSession(k)} className="glass-card p-3 flex flex-col items-center justify-center gap-1 hover:border-blue-500/50">
                    <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getSessionColor(k, userSessions)} flex items-center justify-center text-white font-black text-xs`}>{k}</span>
                    <span className="text-[10px] font-bold text-white text-center leading-tight mt-1">{s.category}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="space-y-5">
        {schedules.map((prog, idx) => (
          <motion.div key={idx} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:idx*.07}}
            className="glass-card overflow-hidden group hover:glow-blue transition-all duration-300">
            <div className="p-5 border-b border-white/5">
              <h3 className="font-black text-white text-base group-hover:text-blue-400 transition-colors">{prog.title}</h3>
              <p className="text-xs text-blue-400 font-medium mt-0.5">{prog.desc}</p>
            </div>
            <div className="p-5">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {prog.days.map((d, i) => {
                  const isRest = d.session === "-";
                  const s = !isRest ? sessions[d.session] : null;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">{days[i]}</span>
                      {isRest ? (
                        <div className="w-12 h-12 rounded-2xl bg-white/3 border border-dashed border-white/8 flex items-center justify-center text-slate-700 text-xs font-bold">
                          —
                        </div>
                      ) : (
                        <Link to="/workout" state={{session:d.session}} onClick={()=>setCurrentSession(d.session)}
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${sessionColors[d.session]||"from-blue-600 to-blue-800"} flex items-center justify-center text-white text-sm font-black shadow-lg hover:scale-110 active:scale-95 transition-all`}>
                          {d.session}
                        </Link>
                      )}
                      <span className={`text-[8px] font-bold uppercase tracking-wider text-center max-w-[52px] leading-tight ${isRest?"text-slate-700":"text-slate-400"}`}>
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-end">
                <Link to="/workout" state={{session:prog.days.find(d=>d.session!=="-")?.session}}
                  onClick={()=>{const first=prog.days.find(d=>d.session!=="-");if(first)setCurrentSession(first.session);}}
                  className="btn-glass text-xs gap-1.5">
                  Commencer ce programme <ChevronRight size={13}/>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Planning;

