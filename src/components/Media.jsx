import React, { useState } from 'react';
import { imgSrc, gifSrc } from '../utils/media';
import { Play, Pause, Maximize2, Minimize2, Dumbbell, X, CheckCircle2, Flame, RefreshCw } from 'lucide-react';
import { MUSCLE_NAME_FR } from '../utils/muscles';

export default function Media({ ex, id, compact = false, minimizable = false, className = '' }) {
  const [playing, setPlaying] = useState(true);
  const [isMini, setIsMini] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!ex) return null;
  const image = imgSrc(ex);
  const gif = gifSrc(ex);

  if (!image && !gif) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50 text-slate-500 ${className}`}>
        <Dumbbell size={32} className="mb-2 opacity-50" />
        <span className="text-xs">Illustration non disponible</span>
      </div>
    );
  }

  const currentSrc = playing && gif ? gif : image;

  return (
    <div
      id={id}
      className={`relative group overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 transition-all duration-300 ${
        compact ? 'max-w-[120px]' : ''
      } ${isMini ? 'h-24' : ''} ${className}`}
      onClick={() => setPlaying(p => !p)}
    >
      {!imgError ? (
        <img
          src={currentSrc}
          alt={ex.name || ex.n || 'Exercice'}
          onError={() => setImgError(true)}
          decoding="async"
          loading="lazy"
          className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isMini ? 'h-full object-center' : 'max-h-[280px] min-h-[160px]'
          }`}
        />
      ) : (
        <div className="h-44 w-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-4 text-center">
          <Dumbbell size={36} className="text-cyan-500 mb-2 animate-bounce" />
          <span className="text-xs font-semibold">{ex.name || ex.n}</span>
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700">
          {playing ? <Pause size={12} className="text-cyan-400" /> : <Play size={12} className="text-cyan-400" />}
          <span>{playing ? 'Pause' : 'Lecture'}</span>
        </div>

        {minimizable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMini(m => !m);
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 hover:bg-slate-800"
          >
            {isMini ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            <span>{isMini ? 'Agrandir' : 'Réduire'}</span>
          </button>
        )}
      </div>

      {/* Status badge */}
      {gif && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[10px] font-bold text-cyan-300 flex items-center gap-1">
          <Flame size={10} className="text-cyan-400" />
          GIF Animé
        </div>
      )}
    </div>
  );
}

export function Thumb({ ex, className = '' }) {
  const image = imgSrc(ex);
  const [error, setError] = useState(false);

  if (!image || error) {
    return (
      <div className={`w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0 ${className}`}>
        <Dumbbell size={20} />
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={ex.name || ex.n || 'Exercice'}
      onError={() => setError(true)}
      loading="lazy"
      decoding="async"
      className={`w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-900 shrink-0 ${className}`}
    />
  );
}

export function ExerciseMediaModal({ ex, onClose }) {
  if (!ex) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-5 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700 transition-colors z-10"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            {ex.muscle || ex.bp || 'Exercice'}
          </span>
          <h2 className="text-xl font-black text-white mt-1 pr-8">
            {ex.name || ex.n}
          </h2>
          {ex.subMuscle && (
            <p className="text-xs text-slate-400 mt-1">Cible : {ex.subMuscle}</p>
          )}
        </div>

        {/* Media Preview */}
        <Media ex={ex} minimizable={false} />

        {/* Target Muscles */}
        {(ex.tg || ex.muscle || ex.sm) && (
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Muscles Sollicités</h4>
            <div className="flex flex-wrap gap-2">
              {ex.tg && (
                <span className="px-2.5 py-1 text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-lg font-semibold">
                  Principal : {ex.tg}
                </span>
              )}
              {ex.muscle && ex.muscle !== ex.tg && (
                <span className="px-2.5 py-1 text-xs bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded-lg font-semibold">
                  Groupe : {ex.muscle}
                </span>
              )}
              {Array.isArray(ex.sm) && ex.sm.map((s, i) => (
                <span key={i} className="px-2.5 py-1 text-xs bg-slate-800 text-slate-300 border border-slate-700 rounded-lg">
                  Synergiste : {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Step-by-Step Instructions */}
        {Array.isArray(ex.st) && ex.st.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Instructions d'Exécution</h4>
            <div className="space-y-2">
              {ex.st.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note / Tempo if present */}
        {(ex.note || ex.tempo || ex.eq) && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            {ex.eq && (
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Équipement</span>
                <span className="text-slate-200 font-medium capitalize">{ex.eq}</span>
              </div>
            )}
            {ex.tempo && (
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Tempo</span>
                <span className="text-cyan-400 font-bold">{ex.tempo}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
