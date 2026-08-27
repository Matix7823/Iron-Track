import React, { useState } from 'react';
import bodyPaths from '../data/bodyPaths';
import { MUSCLES, INERT, MUSCLE_NAME_FR, levelsOf, rankOf } from '../utils/muscles';
import { User, Sparkles, AlertCircle, Info, ChevronRight } from 'lucide-react';

const LEVEL_COLORS = {
  0: 'rgba(255, 255, 255, 0.05)',
  1: 'rgba(59, 130, 246, 0.35)',   // Blue soft
  2: 'rgba(6, 182, 212, 0.65)',   // Cyan bright
  3: 'rgba(16, 185, 129, 0.85)',  // Emerald strong
  4: '#f59e0b',                   // Amber / Gold Peak
};

const LEVEL_STROKES = {
  0: 'rgba(255, 255, 255, 0.12)',
  1: 'rgba(96, 165, 250, 0.6)',
  2: 'rgba(34, 211, 238, 0.8)',
  3: 'rgba(52, 211, 153, 0.9)',
  4: '#fbbf24',
};

function SVGView({ view, levels, selected, onMuscle }) {
  if (!view) return null;
  return (
    <svg className="w-full h-auto max-h-[380px] drop-shadow-xl select-none" viewBox={view.vb} role="img">
      {/* Inert silhouette elements (head, hands, feet, etc) */}
      {INERT.map(slug =>
        (view.p[slug] || []).map((d, i) => (
          <path
            key={`inert-${slug}-${i}`}
            d={d}
            fill="rgba(255, 255, 255, 0.06)"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        ))
      )}

      {/* Shaded muscle regions */}
      {MUSCLES.map(slug => {
        const level = levels[slug] || 0;
        const isSelected = selected === slug;
        const fill = isSelected ? '#38bdf8' : LEVEL_COLORS[level];
        const stroke = isSelected ? '#ffffff' : LEVEL_STROKES[level];

        return (view.p[slug] || []).map((d, i) => (
          <path
            key={`muscle-${slug}-${i}`}
            d={d}
            fill={fill}
            stroke={stroke}
            strokeWidth={isSelected ? '2.5' : '1.2'}
            strokeLinejoin="round"
            className="transition-all duration-300 cursor-pointer hover:opacity-90 hover:scale-[1.01]"
            onClick={() => onMuscle && onMuscle(slug)}
          >
            <title>{`${MUSCLE_NAME_FR[slug] || slug} (Niveau ${level})`}</title>
          </path>
        ));
      })}
    </svg>
  );
}

export function BodyMapLegend() {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400">
      <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Sollicitation :</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-slate-500">Repos</span>
        <div className="w-3.5 h-3.5 rounded-sm bg-white/5 border border-white/20" title="Aucun travail" />
        <div className="w-3.5 h-3.5 rounded-sm bg-blue-500/40 border border-blue-400/60" title="Faible" />
        <div className="w-3.5 h-3.5 rounded-sm bg-cyan-500/70 border border-cyan-400" title="Modéré" />
        <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500/90 border border-emerald-400" title="Élevé" />
        <div className="w-3.5 h-3.5 rounded-sm bg-amber-500 border border-amber-400 shadow-sm shadow-amber-500/50" title="Maximal" />
        <span className="text-[11px] text-slate-300 font-medium">Intense</span>
      </div>
    </div>
  );
}

export default function BodyMap({
  load = {},
  selectedMuscle = null,
  onSelectMuscle,
  showControls = true,
  showUntrained = true,
  className = '',
}) {
  const [gender, setGender] = useState('male'); // 'male' | 'female'
  const levels = levelsOf(load);
  const { worked, missed } = rankOf(load);

  const modelData = bodyPaths[gender] || bodyPaths.male;

  return (
    <div className={`flex flex-col gap-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-4 rounded-3xl shadow-2xl ${className}`}>
      {/* Header controls */}
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Carte Musculaire</h3>
              <p className="text-xs text-slate-400">Anatomie & volume de travail</p>
            </div>
          </div>

          {/* Homme / Femme toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setGender('male')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                gender === 'male'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Homme
            </button>
            <button
              onClick={() => setGender('female')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                gender === 'female'
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Femme
            </button>
          </div>
        </div>
      )}

      {/* SVG Front & Back view */}
      <div className="grid grid-cols-2 gap-4 items-center justify-center py-2 bg-slate-950/40 rounded-2xl border border-slate-800/50 p-2 relative">
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1">Face</span>
          <SVGView
            view={modelData?.front}
            levels={levels}
            selected={selectedMuscle}
            onMuscle={onSelectMuscle}
          />
        </div>
        <div className="flex flex-col items-center border-l border-slate-800/60 pl-2">
          <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1">Dos</span>
          <SVGView
            view={modelData?.back}
            levels={levels}
            selected={selectedMuscle}
            onMuscle={onSelectMuscle}
          />
        </div>
      </div>

      {/* Legend */}
      <BodyMapLegend />

      {/* Selected Muscle detail preview */}
      {selectedMuscle && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-3 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-blue-400 shrink-0" />
            <div>
              <span className="font-bold text-white uppercase tracking-wide">
                {MUSCLE_NAME_FR[selectedMuscle] || selectedMuscle}
              </span>
              <p className="text-[11px] text-blue-300 mt-0.5">
                Volume effectué : <strong className="text-white">{(load[selectedMuscle] || 0).toFixed(1)} séries</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectMuscle && onSelectMuscle(null)}
            className="text-[11px] text-blue-400 hover:text-white underline font-semibold px-2"
          >
            Réinitialiser
          </button>
        </div>
      )}

      {/* Untrained Muscles List */}
      {showUntrained && missed.length > 0 && (
        <div className="mt-1 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className="text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Muscles négligés sur la période ({missed.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {missed.map(slug => (
              <span
                key={slug}
                onClick={() => onSelectMuscle && onSelectMuscle(slug)}
                className="px-2.5 py-1 text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 cursor-pointer transition-colors"
              >
                {MUSCLE_NAME_FR[slug] || slug}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
