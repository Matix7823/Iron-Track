import React from "react";
import { BarChart2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getPerformanceMetrics } from "../../utils/metrics";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-dark border border-white/10 p-2 rounded-xl shadow-2xl">
        <p className="text-[10px] text-slate-400 font-bold mb-1">{label}</p>
        <p className="text-sm font-black text-white">{payload[0].value} <span className="text-[10px] text-slate-500 font-normal">pts</span></p>
      </div>
    );
  }
  return null;
};

const EvolutionChart = ({ data, metric = "weight", color = "#3b82f6" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex flex-col items-center justify-center glass rounded-2xl border border-white/5 text-slate-500 text-sm p-6">
        <BarChart2 className="mb-3 opacity-20" size={36} />
        <p className="font-semibold text-slate-400">Aucune donnée</p>
        <p className="text-xs mt-1 opacity-60 text-center">Enregistre une séance pour voir ta progression</p>
      </div>
    );
  }

  const chartData = data.map((d) => {
    let val = 0;
    if (metric === "bodyweight") val = parseFloat(d.value || 0);
    else {
      const metrics = getPerformanceMetrics(d.setsData);
      if (metrics) {
        if (metric === "weight") val = metrics.maxWeight;
        if (metric === "reps") val = metrics.avgRepsAtMax;
        if (metric === "sets") val = metrics.topSetsCount;
      }
    }
    const dateStr = String(d.date || '');
    const shortDate = dateStr.length >= 5 ? dateStr.slice(0,5) : dateStr;
    return { name: shortDate, value: Math.round(val * 10) / 10 };
  });

  const legendLabel =
    metric === "weight" ? "Charge Max (kg)" :
    metric === "reps" ? "Reps au Max" :
    metric === "bodyweight" ? "Poids Corps (kg)" :
    "Séries au Max";

  const minVal = Math.min(...chartData.map(d => d.value));
  const domainMin = minVal > 10 ? minVal * 0.9 : 0;

  return (
    <div className="w-full glass rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex justify-between items-center z-10 relative">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progression</span>
        <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-white/10">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
          <span className="text-xs font-bold text-slate-300">{legendLabel}</span>
        </div>
      </div>
      
      <div className="h-[220px] w-full -ml-3 -mb-2 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`colorValue-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.6}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
              <filter id={`glow-${metric}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} dy={5} />
            <YAxis hide={true} domain={[domainMin, 'auto']} />
            <Tooltip content={<CustomTooltip />} cursor={{stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4'}} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={3}
              fillOpacity={1} 
              fill={`url(#colorValue-${metric})`} 
              dot={{r: 4, fill: color, stroke: '#fff', strokeWidth: 2}}
              activeDot={{r: 6, fill: '#fff', stroke: color, strokeWidth: 3, boxShadow: `0 0 10px ${color}`}}
              style={{ filter: `url(#glow-${metric})` }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EvolutionChart;
