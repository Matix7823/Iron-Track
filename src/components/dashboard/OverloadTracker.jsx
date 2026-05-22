import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { parseDate } from '../../utils/date';
import { getPerformanceMetrics } from '../../utils/metrics';

const OverloadTracker = ({ history }) => {
  const overloadData = useMemo(() => {
    if (!history) return null;

    // Group history by date to identify distinct workout sessions
    const sessionsByDate = {};
    Object.keys(history).forEach(exoId => {
      const records = history[exoId];
      if (Array.isArray(records)) {
        records.forEach(entry => {
          if (!entry.date) return;
          if (!sessionsByDate[entry.date]) sessionsByDate[entry.date] = [];
          
          const metrics = getPerformanceMetrics(entry.setsData);
          if (metrics && metrics.totalVolume > 0) {
            sessionsByDate[entry.date].push({ exoId, ...metrics });
          }
        });
      }
    });

    const sortedDates = Object.keys(sessionsByDate)
      .map(d => parseDate(d))
      .filter(d => d.getTime() > 0)
      .sort((a, b) => b - a);

    if (sortedDates.length < 2) return null;

    // Get the most recent session
    const lastSessionDate = sortedDates[0];
    const lastSessionDateStr = lastSessionDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const lastSessionData = sessionsByDate[lastSessionDateStr] || [];

    if (lastSessionData.length === 0) return null;

    // Find a previous session that shares at least one exercise
    let previousSessionData = [];
    let previousSessionDateStr = null;

    const currentExoIds = lastSessionData.map(d => d.exoId);
    
    for (let i = 1; i < sortedDates.length; i++) {
      const dStr = sortedDates[i].toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const sessData = sessionsByDate[dStr] || [];
      const overlap = sessData.some(d => currentExoIds.includes(d.exoId));
      if (overlap) {
        previousSessionData = sessData;
        previousSessionDateStr = dStr;
        break;
      }
    }

    if (!previousSessionDateStr) return null;

    // Calculate total volume for overlapping exercises
    let currentVolume = 0;
    let previousVolume = 0;
    let overlappingCount = 0;

    lastSessionData.forEach(curr => {
      const prev = previousSessionData.find(p => p.exoId === curr.exoId);
      if (prev) {
        currentVolume += curr.totalVolume;
        previousVolume += prev.totalVolume;
        overlappingCount++;
      }
    });

    if (overlappingCount === 0 || previousVolume === 0) return null;

    const diff = currentVolume - previousVolume;
    const percentChange = (diff / previousVolume) * 100;

    return {
      currentVolume,
      previousVolume,
      percentChange,
      diff,
      date: lastSessionDateStr,
      prevDate: previousSessionDateStr,
      overlappingCount
    };
  }, [history]);

  if (!overloadData) return null;

  const { percentChange, diff, currentVolume, previousVolume } = overloadData;
  const isPositive = percentChange > 0;
  const isNeutral = percentChange === 0;

  const Icon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown;
  const colorClass = isPositive ? 'text-emerald-400' : isNeutral ? 'text-slate-400' : 'text-red-400';
  const bgColorClass = isPositive ? 'bg-emerald-500/10 border-emerald-500/20' : isNeutral ? 'bg-slate-500/10 border-slate-500/20' : 'bg-red-500/10 border-red-500/20';
  const glowClass = isPositive ? 'shadow-[0_0_15px_rgba(52,211,153,0.15)]' : isNeutral ? '' : 'shadow-[0_0_15px_rgba(248,113,113,0.15)]';

  return (
    <div className={`glass-card p-4 ${bgColorClass} ${glowClass} relative overflow-hidden transition-all duration-300 hover:scale-[1.02]`}>
      <div className="absolute -right-4 -top-4 opacity-10">
        <Icon size={80} />
      </div>
      
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Surcharge Progressive</p>
          <p className="text-[11px] text-slate-500">Séance vs. Précédente équivalente</p>
        </div>
        <div className={`flex items-center gap-1 font-black ${colorClass} bg-black/20 px-2 py-1 rounded-lg`}>
          <Icon size={14} />
          {isPositive ? '+' : ''}{percentChange.toFixed(1)}%
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div>
          <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Dernière Séance</p>
          <p className="text-xl font-black text-white">{Math.round(currentVolume)} <span className="text-xs text-slate-500 font-normal">kg</span></p>
        </div>
        <div>
          <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Séance Précédente</p>
          <p className="text-xl font-black text-slate-400">{Math.round(previousVolume)} <span className="text-xs text-slate-500 font-normal">kg</span></p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 relative z-10">
        <p className={`text-xs font-bold ${colorClass}`}>
          {isPositive ? `🔥 Excellent ! Tu as soulevé ${Math.round(diff)} kg de plus.` : 
           isNeutral ? `Stabilité maintenue.` : 
           `Baisse de ${Math.round(Math.abs(diff))} kg. Le repos est peut-être nécessaire.`}
        </p>
      </div>
    </div>
  );
};

export default OverloadTracker;
