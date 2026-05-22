import React, { useState } from "react";
import { schedules, sessions } from "../data/sessions";
import { Calendar, ChevronRight, Settings, Plus, Trash2, Edit2, Trash, Play, Check, X } from "lucide-react";
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
  const { setCurrentSession, customSchedule, updateCustomSchedule, userSessions, deleteCustomSession, renameCustomSession, applyProgram } = useApp();
  const [editingDay, setEditingDay] = useState(null);
  const [editingDayName, setEditingDayName] = useState(false);
  const [newDayName, setNewDayName] = useState("");
  const [previewSession, setPreviewSession] = useState(null);

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

  const handleApplyProgram = (prog) => {
    if (window.confirm(`Appliquer le programme "${prog.title}" à ta semaine ? Cela écrasera ton planning actuel.`)) {
      applyProgram(prog);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Programme Personnalisé</h3>
              <p className="text-xs text-indigo-400 font-medium mt-0.5">Clique sur un jour pour modifier</p>
            </div>
          </div>
          <button 
            onClick={() => document.getElementById('programs-lib')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-glass !py-1.5 !px-3 !text-[10px] !rounded-lg gap-1.5 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
          >
            <Settings size={12}/> Modèles
          </button>
        </div>

        <div className="p-5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pt-3 pb-2">
            {normalizedSchedule.map((d, i) => {
              const isRest = d.session === "-";
              const s = !isRest ? (sessions[d.session] || userSessions?.[d.session]) : null;
              return (
                <div key={i} className="flex flex-col items-center gap-2 shrink-0 group relative">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">{getDayLabel(d, i)}</span>
                  
                  <div className="relative">
                    <button
                      onClick={() => setEditingDay(i)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shadow-lg hover:scale-110 active:scale-95 transition-all ${isRest ? "bg-white/5 border border-dashed border-white/20 text-slate-500 hover:text-white" : "text-white bg-gradient-to-br " + getSessionColor(d.session, userSessions)}`}
                    >
                      {isRest ? "+" : d.session}
                    </button>
                    
                    {!isRest && (sessions[d.session] || userSessions?.[d.session]) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewSession(d.session);
                        }}
                        className="absolute -bottom-1 -left-1 w-5 h-5 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all backdrop-blur-sm border border-white/10 shadow-md"
                      >
                        <Play size={8} fill="currentColor" />
                      </button>
                    )}

                    {normalizedSchedule.length > 1 && (
                      <button
                        onClick={() => removeDay(i)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500/90 hover:bg-red-500 rounded-full flex items-center justify-center text-white z-10 shadow-md shadow-red-500/30 hover:scale-110 active:scale-90 transition-all"
                      >
                        <X size={10} strokeWidth={3.5} />
                      </button>
                    )}
                  </div>
                  
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
                {Object.entries(userSessions).map(([k, s]) => {
                  const isCustom = !sessions[k];
                  return (
                    <div key={k} className="relative group">
                      <button 
                        onClick={() => handleSelectSession(k)} 
                        className="w-full glass-card p-3 flex flex-col items-center justify-center gap-1 hover:border-blue-500/50"
                      >
                        <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getSessionColor(k, userSessions)} flex items-center justify-center text-white font-black text-xs`}>{k}</span>
                        <span className="text-[10px] font-bold text-white text-center leading-tight mt-1">{s.category}</span>
                      </button>
                      
                      {isCustom && (
                        <div className="absolute top-1.5 right-1.5 flex gap-1 z-10">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const newName = window.prompt("Nouveau nom de la séance :", s.category);
                              if (newName && newName.trim()) renameCustomSession(k, newName.trim());
                            }}
                            className="w-6 h-6 bg-blue-500 hover:bg-blue-400 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20 active:scale-90 transition-transform"
                            title="Renommer"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Supprimer définitivement la séance ${k} ?`)) {
                                deleteCustomSession(k);
                              }
                            }}
                            className="w-6 h-6 bg-red-500 hover:bg-red-400 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-500/20 active:scale-90 transition-transform"
                            title="Supprimer"
                          >
                            <Trash size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="space-y-5" id="programs-lib">
        <div className="flex justify-between items-center px-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bibliothèque de Programmes</p>
          <button onClick={() => updateCustomSchedule(Array.from({length:7}).map(() => ({ session: '-', label: '', status: null })))}
            className="text-[10px] font-bold text-red-400/70 hover:text-red-400 transition-colors uppercase">
            Réinitialiser tout
          </button>
        </div>

        {schedules.map((prog, idx) => (
          <motion.div key={idx} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:idx*.07}}
            className="glass-card overflow-hidden group hover:glow-blue transition-all duration-300">
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="font-black text-white text-base group-hover:text-blue-400 transition-colors">{prog.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{prog.desc}</p>
              </div>
              <button 
                onClick={() => handleApplyProgram(prog)}
                className="btn-primary !py-2 !px-4 !text-[10px] !rounded-xl gap-1.5"
              >
                <Check size={12} /> Appliquer
              </button>
            </div>
            
            <div className="p-5 bg-black/20">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pt-1 pb-3 px-1.5">
                {prog.days.map((d, i) => {
                  const isRest = d.session === "-";
                  const s = !isRest ? sessions[d.session] : null;
                  const daysShort = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{daysShort[i]}</span>
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s ? s.color : "from-slate-800 to-slate-900"} border border-white/5 flex flex-col items-center justify-center relative shadow-lg`}>
                        <span className="text-sm font-black text-white">{d.session}</span>
                        {s && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewSession(d.session);
                            }}
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-xl hover:scale-110 transition-transform"
                            title="Voir les exercices"
                          >
                            <Play size={10} fill="currentColor" />
                          </button>
                        )}
                      </div>
                      <span className="text-[8px] font-bold text-slate-500 text-center w-16 leading-tight truncate">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Session Preview Modal */}
      <AnimatePresence>
        {previewSession && (
          <div className="modal-overlay" onClick={() => setPreviewSession(null)}>
            <motion.div 
              className="glass-dark w-[95%] sm:w-full max-w-lg rounded-3xl overflow-hidden border border-white/10 flex flex-col max-h-[85vh] shadow-2xl"
              initial={{ y: 50, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 50, opacity: 0 }} 
              onClick={e => e.stopPropagation()}
            >
              {(() => {
                const s = sessions[previewSession] || userSessions?.[previewSession];
                if (!s) return null;
                return (
                  <>
                    <div className={`p-6 bg-gradient-to-br ${s.color || 'from-slate-800 to-slate-900'} relative`}>
                      <button onClick={() => setPreviewSession(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors">
                        <X size={16} />
                      </button>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-black text-white uppercase tracking-wider">{previewSession}</span>
                        <h3 className="text-xl font-black text-white">{s.title || s.category}</h3>
                      </div>
                      <p className="text-white/70 text-xs font-medium">{s.focus || "Séance d'entraînement"}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 scrollbar-hide">
                      {s.exercises?.map((exo, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                            <Plus size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{exo.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{exo.muscle}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-black text-blue-400">{exo.sets}x{exo.reps}</p>
                            <p className="text-[10px] text-slate-600 font-bold">{exo.rest}s</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 border-t border-white/5 flex gap-3">
                      <button onClick={() => setPreviewSession(null)} className="btn-glass flex-1 py-3 text-xs">Fermer</button>
                      <Link 
                        to="/workout" 
                        state={{ session: previewSession }}
                        onClick={() => {
                          setCurrentSession(previewSession);
                          setPreviewSession(null);
                        }}
                        className="btn-primary flex-1 py-3 text-xs gap-2"
                      >
                        <Play size={12} fill="currentColor" /> S'entraîner
                      </Link>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Planning;

