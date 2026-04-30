import React from "react";
import { BarChart2 } from "lucide-react";
import { getPerformanceMetrics } from "../../utils/metrics";

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

  const height = 240;
  const paddingTop = 36;
  const paddingBottom = 50;
  const paddingX = 24;
  const chartWidth = 300;

  const values = data.map((d) => {
    if (metric === "bodyweight") return parseFloat(d.value || 0);
    const metrics = getPerformanceMetrics(d.setsData);
    if (!metrics) return 0;
    if (metric === "weight") return metrics.maxWeight;
    if (metric === "reps") return metrics.avgRepsAtMax;
    if (metric === "sets") return metrics.topSetsCount;
    return 0;
  });

  const minVal = Math.min(...values) * 0.93;
  const maxVal = Math.max(...values) * 1.07;
  const range = maxVal - minVal || 1;

  const getY = (val) =>
    height - paddingBottom - ((val - minVal) / range) * (height - paddingBottom - paddingTop);
  const getX = (index) => {
    if (data.length === 1) return chartWidth / 2;
    return paddingX + (index / (data.length - 1)) * (chartWidth - paddingX * 2);
  };

  const points = data.map((d, i) => `${getX(i)},${getY(values[i])}`).join(" ");

  // Area fill gradient
  const areaPoints = `${getX(0)},${height - paddingBottom} ${points} ${getX(data.length - 1)},${height - paddingBottom}`;

  const legendLabel =
    metric === "weight" ? "Charge Max (kg)" :
    metric === "reps" ? "Reps au Max" :
    metric === "bodyweight" ? "Poids Corps (kg)" :
    "Séries au Max";

  return (
    <div className="w-full glass rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
      <div className="px-4 pt-4 pb-1 flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progression</span>
        <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-white/10">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
          <span className="text-xs font-bold text-slate-300">{legendLabel}</span>
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-hidden">
        <svg viewBox={`0 0 ${chartWidth} ${height}`} className="w-full overflow-visible min-w-[300px]" style={{ height: `${height}px` }}>
          <defs>
            <linearGradient id={`areaGrad-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pos, i) => (
            <line key={i}
              x1="0" y1={paddingTop + (height - paddingBottom - paddingTop) * pos}
              x2={chartWidth} y2={paddingTop + (height - paddingBottom - paddingTop) * pos}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1"
            />
          ))}

          {/* Area fill */}
          {data.length > 1 && (
            <polygon
              fill={`url(#areaGrad-${metric})`}
              points={areaPoints}
            />
          )}

          {/* Line */}
          {data.length > 1 && (
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
              filter="url(#glow)"
            />
          )}

          {/* Data points */}
          {data.map((d, i) => {
            const xPos = getX(i);
            const yPos = getY(values[i]);
            return (
              <g key={i}>
                <circle cx={xPos} cy={yPos} r="8" fill={color} opacity="0.1" />
                <circle cx={xPos} cy={yPos} r="4" fill="#0d1117" stroke={color} strokeWidth="2" />
                <text x={xPos} y={yPos - 13} textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="800">
                  {Math.round(values[i] * 10) / 10}
                </text>
                <text
                  x={xPos} y={height - 14}
                  textAnchor="end" fill="#475569" fontSize="7"
                  transform={`rotate(-40, ${xPos}, ${height - 14})`}
                  fontFamily="monospace"
                >
                  {d.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default EvolutionChart;
