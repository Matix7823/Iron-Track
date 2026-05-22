import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// French mapping of muscle keys to readable names
const MUSCLE_NAMES = {
  Pectoraux: "Pectoraux",
  Dos: "Dorsaux / Grand Dorsal",
  Lombaires: "Lombaires",
  Epaules: "Épaules (Deltoïdes)",
  Biceps: "Biceps",
  Triceps: "Triceps",
  AvantBras: "Avant-bras",
  Abdos: "Abdos & Obliques",
  Quadriceps: "Quadriceps",
  Ischios: "Ischios-jambiers",
  Fessiers: "Fessiers",
  Mollets: "Mollets"
};

// Map database session category tags to muscle keys
const DB_MUSCLE_MAP = {
  "Pecs": "Pectoraux",
  "Pectoraux": "Pectoraux",
  "Dos": "Dos",
  "Lombaires": "Lombaires",
  "Épaules": "Epaules",
  "Epaules": "Epaules",
  "Biceps": "Biceps",
  "Triceps": "Triceps",
  "Avant-bras": "AvantBras",
  "Abdos": "Abdos",
  "Obliques": "Abdos",
  "Quadriceps": "Quadriceps",
  "Ischios": "Ischios",
  "Fessiers": "Fessiers",
  "Mollets": "Mollets",
  "Jambes": "Quadriceps" // Fallback generic
};

const MuscleMap = ({ 
  fatigueLevels = {}, // Values from 0 (completely fresh/green) to 100 (fully fatigued/red)
  selectedMuscle = null, 
  onMuscleClick = null,
  interactive = true 
}) => {
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top - 35
    });
  };

  // Helper to resolve colors based on fatigue level (0 to 100)
  // 0 = Fresh (Neon Cyan/Blue or Green), 100 = Fatigued (Neon Red/Orange)
  const getMuscleColor = (muscleKey, isHovered, isSelected) => {
    const fatigue = fatigueLevels[muscleKey] || 0;
    
    // Custom neon glow color interpolation based on fatigue
    // 0-30: Fresh (Greenish-Cyan)
    // 31-70: Recovering (Yellow-Orange)
    // 71-100: Fatigued (Red)
    let baseColor = "rgba(59, 130, 246, 0.2)"; // default semi-transparent blue
    let strokeColor = "rgba(255, 255, 255, 0.25)";
    
    if (fatigue > 0) {
      if (fatigue <= 35) {
        // Fresh green
        baseColor = `rgba(16, 185, 129, ${isHovered || isSelected ? 0.65 : 0.3})`;
        strokeColor = "rgba(16, 185, 129, 0.85)";
      } else if (fatigue <= 70) {
        // Medium fatigue orange/yellow
        baseColor = `rgba(245, 158, 11, ${isHovered || isSelected ? 0.65 : 0.3})`;
        strokeColor = "rgba(245, 158, 11, 0.85)";
      } else {
        // High fatigue red
        baseColor = `rgba(239, 68, 68, ${isHovered || isSelected ? 0.65 : 0.3})`;
        strokeColor = "rgba(239, 68, 68, 0.9)";
      }
    } else {
      // Default inactive state
      if (isSelected) {
        baseColor = "rgba(59, 130, 246, 0.6)";
        strokeColor = "rgba(59, 130, 246, 0.9)";
      } else if (isHovered) {
        baseColor = "rgba(59, 130, 246, 0.4)";
        strokeColor = "rgba(59, 130, 246, 0.7)";
      }
    }

    return { fill: baseColor, stroke: strokeColor };
  };

  const renderMuscle = (muscleKey, paths, isFront) => {
    const isHovered = hovered === muscleKey;
    const isSelected = selectedMuscle === muscleKey;
    const colors = getMuscleColor(muscleKey, isHovered, isSelected);

    return paths.map((d, index) => (
      <path
        key={`${muscleKey}-${isFront ? "F" : "B"}-${index}`}
        d={d}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="1.2"
        className={`transition-all duration-300 ${interactive ? "cursor-pointer" : ""}`}
        onClick={() => interactive && onMuscleClick && onMuscleClick(muscleKey)}
        onMouseEnter={() => {
          if (interactive) {
            setHovered(muscleKey);
          }
        }}
        onMouseLeave={() => {
          if (interactive) {
            setHovered(null);
          }
        }}
        style={{
          filter: isHovered || isSelected ? "drop-shadow(0px 0px 4px var(--glow-color, rgba(59, 130, 246, 0.6)))" : "none"
        }}
      />
    ));
  };

  // Highly-precise, beautiful symmetric HUD geometric paths for coordinates 0-100 x 0-220
  const musclesPaths = {
    // FRONT
    Pectoraux: [
      "M 39 48 L 49 48 L 49 60 L 39 57 Z", // Left chest
      "M 51 48 L 61 48 L 61 57 L 51 60 Z"  // Right chest
    ],
    Abdos: [
      "M 41 62 L 59 62 L 57 88 L 43 88 Z"  // Centered core grid
    ],
    Epaules: [
      // Deltoids Front
      "M 32 40 L 38 43 L 38 52 L 31 49 Z", // Left Front Deltoid
      "M 68 40 L 62 43 L 62 52 L 69 49 Z", // Right Front Deltoid
      // Deltoids Back
      "M 31 41 L 37 44 L 37 53 L 30 50 Z", // Left Back Deltoid
      "M 69 41 L 63 44 L 63 53 L 70 50 Z"  // Right Back Deltoid
    ],
    Biceps: [
      "M 28 51 L 35 53 L 34 71 L 28 66 Z", // Left biceps front
      "M 72 51 L 65 53 L 66 71 L 72 66 Z"  // Right biceps front
    ],
    AvantBras: [
      "M 27 68 L 33 72 L 28 100 L 23 94 Z", // Left forearm front
      "M 73 68 L 67 72 L 72 100 L 77 94 Z", // Right forearm front
      "M 26 69 L 32 73 L 27 101 L 22 95 Z", // Left forearm back
      "M 74 69 L 68 73 L 73 101 L 78 95 Z"  // Right forearm back
    ],
    Quadriceps: [
      "M 35 102 L 48 102 L 45 152 L 36 150 Z", // Left quad
      "M 65 102 L 52 102 L 55 152 L 64 150 Z"  // Right quad
    ],
    Mollets: [
      "M 35 159 L 43 159 L 41 202 L 36 202 Z", // Left calf front
      "M 65 159 L 57 159 L 59 202 L 64 202 Z", // Right calf front
      "M 35 160 L 43 160 L 41 203 L 36 203 Z", // Left calf back
      "M 65 160 L 57 160 L 59 203 L 64 203 Z"  // Right calf back
    ],

    // BACK
    Dos: [
      // Trapezius & Lats (Dorsaux)
      "M 37 46 L 49 43 L 49 76 L 38 68 Z", // Left Lat
      "M 63 46 L 51 43 L 51 76 L 62 68 Z"  // Right Lat
    ],
    Lombaires: [
      "M 42 77 L 58 77 L 57 93 L 43 93 Z"  // Lower Back lumbar spine
    ],
    Triceps: [
      "M 27 52 L 34 54 L 33 70 L 27 65 Z", // Left triceps
      "M 73 52 L 66 54 L 67 70 L 73 65 Z"  // Right triceps
    ],
    Fessiers: [
      "M 35 95 L 49 95 L 48 116 L 36 114 Z", // Left glute
      "M 65 95 L 51 95 L 52 116 L 64 114 Z"  // Right glute
    ],
    Ischios: [
      "M 35 118 L 47 118 L 45 155 L 36 153 Z", // Left hamstring
      "M 65 118 L 53 118 L 55 155 L 64 153 Z"  // Right hamstring
    ]
  };

  // Decorative outlines (static parts of body HUD)
  const drawOutline = () => (
    <>
      {/* Tête */}
      <circle cx="50" cy="22" r="10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      <path d="M 46 32 L 54 32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      {/* Mains */}
      <circle cx="21" cy="98" r="2.5" fill="none" stroke="rgba(255,255,255,0.06)" />
      <circle cx="79" cy="98" r="2.5" fill="none" stroke="rgba(255,255,255,0.06)" />
      {/* Pieds */}
      <path d="M 34 205 L 38 210 L 32 210 Z" fill="none" stroke="rgba(255,255,255,0.05)" />
      <path d="M 66 205 L 62 210 L 68 210 Z" fill="none" stroke="rgba(255,255,255,0.05)" />
      {/* Articulations repères */}
      <circle cx="35" cy="40" r="1.5" fill="rgba(255,255,255,0.2)" />
      <circle cx="65" cy="40" r="1.5" fill="rgba(255,255,255,0.2)" />
      <circle cx="37" cy="155" r="1.5" fill="rgba(255,255,255,0.2)" />
      <circle cx="63" cy="155" r="1.5" fill="rgba(255,255,255,0.2)" />
    </>
  );

  return (
    <div 
      className="relative w-full flex flex-col items-center justify-center p-3 select-none"
      onMouseMove={handleMouseMove}
    >
      <div className="flex w-full max-w-sm justify-around gap-4">
        {/* FACE (FRONT) */}
        <div className="flex flex-col items-center flex-1">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Vue Face</span>
          <div className="relative w-full aspect-[1/2] border border-white/5 bg-slate-950/20 rounded-2xl p-2 overflow-hidden shadow-inner">
            <svg 
              viewBox="0 0 100 220" 
              className="w-full h-full"
              style={{
                "--glow-color": selectedMuscle && getMuscleColor(selectedMuscle, false, true).stroke
              }}
            >
              {drawOutline()}
              
              {/* Backing body silhouette grid */}
              <path d="M 50 10 L 50 210" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" strokeDasharray="2,4" />
              <path d="M 10 110 L 90 110" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" strokeDasharray="2,4" />

              {/* Muscles clickable */}
              {renderMuscle("Epaules", musclesPaths.Epaules.slice(0, 2), true)}
              {renderMuscle("Pectoraux", musclesPaths.Pectoraux, true)}
              {renderMuscle("Biceps", musclesPaths.Biceps, true)}
              {renderMuscle("AvantBras", musclesPaths.AvantBras.slice(0, 2), true)}
              {renderMuscle("Abdos", musclesPaths.Abdos, true)}
              {renderMuscle("Quadriceps", musclesPaths.Quadriceps, true)}
              {renderMuscle("Mollets", musclesPaths.Mollets.slice(0, 2), true)}
            </svg>
          </div>
        </div>

        {/* DOS (BACK) */}
        <div className="flex flex-col items-center flex-1">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Vue Dos</span>
          <div className="relative w-full aspect-[1/2] border border-white/5 bg-slate-950/20 rounded-2xl p-2 overflow-hidden shadow-inner">
            <svg 
              viewBox="0 0 100 220" 
              className="w-full h-full"
              style={{
                "--glow-color": selectedMuscle && getMuscleColor(selectedMuscle, false, true).stroke
              }}
            >
              {drawOutline()}
              
              <path d="M 50 10 L 50 210" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" strokeDasharray="2,4" />
              <path d="M 10 110 L 90 110" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" strokeDasharray="2,4" />

              {/* Muscles clickable */}
              {renderMuscle("Epaules", musclesPaths.Epaules.slice(2, 4), false)}
              {renderMuscle("Triceps", musclesPaths.Triceps, false)}
              {renderMuscle("AvantBras", musclesPaths.AvantBras.slice(2, 4), false)}
              {renderMuscle("Dos", musclesPaths.Dos, false)}
              {renderMuscle("Lombaires", musclesPaths.Lombaires, false)}
              {renderMuscle("Fessiers", musclesPaths.Fessiers, false)}
              {renderMuscle("Ischios", musclesPaths.Ischios, false)}
              {renderMuscle("Mollets", musclesPaths.Mollets.slice(2, 4), false)}
            </svg>
          </div>
        </div>
      </div>

      {/* Futuristic Floating HUD Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 pointer-events-none px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950/90 backdrop-blur-md shadow-2xl flex flex-col"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`
            }}
          >
            <span className="text-[10px] font-black text-white uppercase tracking-wider">
              {MUSCLE_NAMES[hovered]}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[8px] font-bold text-slate-500 uppercase">Fatigue:</span>
              <span className={`text-[9px] font-black ${
                (fatigueLevels[hovered] || 0) <= 35 ? "text-emerald-400" :
                (fatigueLevels[hovered] || 0) <= 70 ? "text-amber-400" : "text-red-400"
              }`}>
                {fatigueLevels[hovered] || 0}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { MuscleMap, DB_MUSCLE_MAP, MUSCLE_NAMES };
