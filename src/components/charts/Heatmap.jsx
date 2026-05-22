import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const Heatmap = ({ history }) => {
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);

  const currentMonthDate = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + currentMonthOffset, 1);
  }, [currentMonthOffset]);

  const formattedMonthName = useMemo(() => {
    const monthName = currentMonthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  }, [currentMonthDate]);

  const days = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    // Convert Sunday (0) to 6, and Monday (1) to 0
    let startDayIndex = firstDay.getDay();
    startDayIndex = startDayIndex === 0 ? 6 : startDayIndex - 1;

    const numDays = new Date(year, month + 1, 0).getDate();
    
    const result = [];
    
    // Add padding days for the start of the month
    for (let i = 0; i < startDayIndex; i++) {
      result.push({ isPadding: true });
    }
    
    // Add real days
    for (let d = 1; d <= numDays; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = dateObj.toLocaleDateString('fr-FR', {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
      
      // Check if any exercise was completed on this day
      let workedOut = false;
      if (history) {
        Object.keys(history).forEach(exoId => {
          const entries = history[exoId];
          if (Array.isArray(entries) && entries.some(entry => entry.date === dateStr)) {
            workedOut = true;
          }
        });
      }
      
      result.push({
        dayNum: d,
        dateStr,
        workedOut,
        isToday: dateObj.toDateString() === new Date().toDateString()
      });
    }
    
    return result;
  }, [currentMonthDate, history]);

  const activeDaysCount = useMemo(() => {
    return days.filter(d => !d.isPadding && d.workedOut).length;
  }, [days]);

  return (
    <div className="glass-card p-5 mb-6 relative overflow-hidden">
      {/* Subtle glowing background orbs */}
      <div className="absolute -right-10 -top-10 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

      {/* Header with Navigation */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Régularité</h3>
        </div>
        
        <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setCurrentMonthOffset(p => p - 1)}
            className="p-1.5 hover:bg-white/5 active:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
            title="Mois précédent"
          >
            <ChevronLeft size={16} />
          </button>
          
          <span className="text-xs font-black text-white px-2 uppercase tracking-wide min-w-[110px] text-center select-none">
            {formattedMonthName}
          </span>
          
          <button 
            onClick={() => setCurrentMonthOffset(p => p + 1)}
            disabled={currentMonthOffset >= 0}
            className={`p-1.5 rounded-xl transition-all ${
              currentMonthOffset >= 0 
                ? 'opacity-20 cursor-not-allowed text-slate-600' 
                : 'hover:bg-white/5 active:bg-white/10 text-slate-400 hover:text-white'
            }`}
            title="Mois suivant"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekdays Headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2.5">
        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((w, idx) => (
          <span key={idx} className="text-[10px] font-black text-slate-500 uppercase tracking-wider py-1">
            {w}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {days.map((day, idx) => {
          if (day.isPadding) {
            return <div key={`pad-${idx}`} className="aspect-square" />;
          }

          return (
            <motion.div
              key={`day-${day.dayNum}`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all relative cursor-pointer select-none
                ${day.workedOut 
                  ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.15)]' 
                  : 'bg-white/[0.02] text-slate-400 border border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                }
                ${day.isToday ? 'ring-2 ring-amber-500/50 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]' : ''}
              `}
              title={day.dateStr}
            >
              <span className={day.workedOut ? 'font-extrabold text-white text-sm' : ''}>
                {day.dayNum}
              </span>
              {day.workedOut && (
                <span className="w-1 h-1 bg-blue-400 rounded-full mt-0.5 absolute bottom-1.5 shadow-[0_0_4px_#3b82f6]" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend & Stats */}
      <div className="flex justify-between items-center mt-5 pt-3.5 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[4px] bg-blue-600/30 border border-blue-500/40 shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Séance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[4px] border-2 border-amber-500/50 bg-white/[0.02]" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Aujourd'hui</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.05)]">
          <span className="text-[11px] text-blue-400 font-black tracking-wide uppercase">
            {activeDaysCount} {activeDaysCount > 1 ? 'jours actifs' : 'jour actif'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
