import React from "react";
import { BarChart2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getPerformanceMetrics } from "../../utils/metrics";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-dark border border-white/10 p-3 rounded-xl shadow-2xl">
        <p className="text-[10px] text-slate-400 font-bold mb-1">{label}</p>
        <p className="text-sm font-black text-white">{payload[0].value} <span className="text-[10px] text-slate-500 font-normal">pts</span></p>
      </div>
    );
  }
  return null;
}

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
  const maxVal = Math.max(...chartData.map(d => d.value));
  const domainMin = Math.max(0, Math.floor(minVal - (maxVal - minVal) * 0.1));
  const domainMax = Math.ceil(maxVal + (maxVal - minVal) * 0.1);

  return (
    <div className="w-full glass rounded-2xl border border-white/5 shadow-xl p-4">
      <div className="flex justify-between items-center mb-6">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progression</span>
        <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-white/10">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
          <span className="text-xs font-bold text-slate-300">{legendLabel}</span>
        </div>
      </div>
      
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{fill: '#64748b', fontSize: 10}} dy={10} />
            <YAxis stroke="rgba(255,255,255,0.2)" tick={{fill: '#64748b', fontSize: 10}} domain={[domainMin, domainMax]} />
            <Tooltip content={<CustomTooltip />} cursor={{stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4'}} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={3}
              dot={{r: 4, fill: '#0f172a', stroke: color, strokeWidth: 2}}
              activeDot={{r: 6, fill: color, stroke: '#fff', strokeWidth: 2, boxShadow: `0 0 10px ${color}`}}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EvolutionChart;
