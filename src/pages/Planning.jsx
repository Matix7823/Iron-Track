import React from "react";
import { schedules, sessions } from "../data/sessions";
import { Calendar, Dumbbell, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";

const sessionColors = {
  A:"from-blue-600 to-blue-800", B:"from-cyan-600 to-cyan-800", C:"from-emerald-600 to-emerald-800",
  D:"from-violet-600 to-violet-800", E:"from-orange-600 to-orange-800", F:"from-sky-600 to-sky-800",
  G:"from-teal-600 to-teal-800", H:"from-red-600 to-red-800", I:"from-pink-600 to-pink-800", J:"from-rose-600 to-rose-800",
};

const Planning = () => {
  const { setCurrentSession } = useApp();
  const days = ["L","M","M","J","V","S","D"];

  return (
    <div className="page-container">
      <div className="bg-orbs"/>
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="mb-8">
        <p className="section-title"><Calendar size={20} className="text-blue-400"/>Programmes d'Entraînement</p>
        <p className="text-sm text-slate-400 -mt-2">6 splits scientifiques pour chaque objectif</p>
      </motion.div>

      <div className="space-y-5">
        {schedules.map((prog, idx) => (
          <motion.div key={idx} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:idx*.07}}
            className="glass-card overflow-hidden group hover:glow-blue transition-all duration-300">

            {/* Program header */}
            <div className="p-5 border-b border-white/5">
              <h3 className="font-black text-white text-base group-hover:text-blue-400 transition-colors">{prog.title}</h3>
              <p className="text-xs text-blue-400 font-medium mt-0.5">{prog.desc}</p>
            </div>

            {/* Week strip */}
            <div className="p-5">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {prog.days.map((d, i) => {
                  const isRest = d.session === "-";
                  const s = !isRest ? sessions[d.session] : null;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                      {/* Day label */}
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">{days[i]}</span>

                      {/* Session bubble */}
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

                      {/* Label */}
                      <span className={`text-[8px] font-bold uppercase tracking-wider text-center max-w-[52px] leading-tight ${isRest?"text-slate-700":"text-slate-400"}`}>
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
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
