import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { parseDate } from '../../utils/date';

const Heatmap = ({ history }) => {
  const days = useMemo(() => {
    const today = new Date();
    const result = [];
    // Show last 5 months approx (150 days)
    for (let i = 150; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('fr-FR');
      
      // Check if any exercise was done on this day
      let workedOut = false;
      Object.keys(history).forEach(exoId => {
        if (history[exoId].some(entry => entry.date === dateStr)) {
          workedOut = true;
        }
      });
      
      result.push({ date: dateStr, workedOut });
    }
    return result;
  }, [history]);

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Régularité (150 derniers jours)</h3>
        <span className="text-[10px] text-blue-400 font-bold">{days.filter(d => d.workedOut).length} jours actifs</span>
      </div>
      
      <div className="flex flex-wrap gap-1.5 justify-center">
        {days.map((day, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.002 }}
            className={`w-2.5 h-2.5 rounded-[2px] ${day.workedOut ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-white/5'}`}
            title={day.date}
          />
        ))}
      </div>
      
      <div className="flex justify-between mt-3 text-[9px] text-slate-600 font-bold uppercase tracking-tighter">
        <span>Il y a 5 mois</span>
        <span>Aujourd'hui</span>
      </div>
    </div>
  );
};

export default Heatmap;
