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

  // Highly-precise, anatomically realistic vector paths for coordinates 0-100 x 0-220
  const musclesPaths = {
    // FRONT
    Pectoraux: [
      // Left Pec: sculpted pectoralis major sweeping from sternum to armpit
      "M 49 45 C 44 45, 38 43, 35 48 C 34 50, 33 53, 31 55 C 33 59, 39 61, 43 62 C 46 62, 49 61, 49 45 Z",
      // Right Pec: sculpted pectoralis major sweeping from sternum to armpit
      "M 51 45 C 56 45, 62 43, 65 48 C 66 50, 67 53, 69 55 C 67 59, 61 61, 57 62 C 54 62, 51 61, 51 45 Z"
    ],
    Abdos: [
      // Detailed six-pack with central linea alba and sculpted abdominal intersections
      "M 43 64 C 46 64, 49 64, 49 70 C 49 70, 46 70, 43 70 Z M 51 64 C 54 64, 57 64, 57 70 C 57 70, 54 70, 51 70 Z M 43 72 C 46 72, 49 72, 49 78 C 49 78, 46 78, 43 78 Z M 51 72 C 54 72, 57 72, 57 78 C 57 78, 54 78, 51 78 Z M 44 80 C 46 80, 49 80, 49 87 C 49 87, 46 87, 44 87 Z M 51 80 C 54 80, 56 80, 56 87 C 56 87, 54 87, 51 87 Z"
    ],
    Epaules: [
      // Deltoids Front (Left & Right): rounded caps wrapping the shoulder joint
      "M 34 38 C 31 38, 28 42, 28 47 C 28 51, 30 54, 32 55 C 34 53, 35 50, 35 46 C 35 43, 35 40, 34 38 Z",
      "M 66 38 C 69 38, 72 42, 72 47 C 72 51, 70 54, 68 55 C 66 53, 65 50, 65 46 C 65 43, 65 40, 66 38 Z",
      // Deltoids Back (Left & Right)
      "M 34 38 C 31 38, 28 42, 28 47 C 28 51, 30 54, 32 55 C 34 53, 35 50, 35 46 C 35 43, 35 40, 34 38 Z",
      "M 66 38 C 69 38, 72 42, 72 47 C 72 51, 70 54, 68 55 C 66 53, 65 50, 65 46 C 65 43, 65 40, 66 38 Z"
    ],
    Biceps: [
      // Left Bicep: fusiform biceps brachii running down upper arm
      "M 29 55 C 28 59, 27 63, 26 66 C 28 68, 30 67, 32 65 C 33 62, 33 58, 31 55 Z",
      // Right Bicep: fusiform biceps brachii running down upper arm
      "M 71 55 C 72 59, 73 63, 74 66 C 72 68, 70 67, 68 65 C 67 62, 67 58, 69 55 Z"
    ],
    AvantBras: [
      // Left Forearm: beautiful brachioradialis tapering to the wrist
      "M 26 67 C 25 73, 23 80, 20 88 C 22 90, 24 88, 26 84 C 28 79, 29 73, 28 67 Z",
      // Right Forearm: beautiful brachioradialis tapering to the wrist
      "M 74 67 C 75 73, 77 80, 80 88 C 78 90, 76 88, 74 84 C 72 79, 71 73, 72 67 Z",
      // Left Forearm Back
      "M 26 67 C 25 73, 23 80, 20 88 C 22 90, 24 88, 26 84 C 28 79, 29 73, 28 67 Z",
      // Right Forearm Back
      "M 74 67 C 75 73, 77 80, 80 88 C 78 90, 76 88, 74 84 C 72 79, 71 73, 72 67 Z"
    ],
    Quadriceps: [
      // Left Quad: sweeping vastus lateralis & teardrop vastus medialis
      "M 33 100 C 31 112, 30 126, 32 140 C 35 144, 38 145, 41 145 C 44 140, 46 126, 47 112 C 44 104, 39 100, 33 100 Z",
      // Right Quad: sweeping vastus lateralis & teardrop vastus medialis
      "M 67 100 C 69 112, 70 126, 68 140 C 65 144, 62 145, 59 145 C 56 140, 54 126, 53 112 C 56 104, 61 100, 67 100 Z"
    ],
    Mollets: [
      // Left Calf: bulging gastrocnemius heads tapering down
      "M 34 152 C 32 163, 31 174, 33 186 C 35 188, 37 187, 38 184 C 39 175, 40 164, 38 152 Z",
      // Right Calf: bulging gastrocnemius heads tapering down
      "M 66 152 C 68 163, 69 174, 67 186 C 65 188, 63 187, 62 184 C 61 175, 60 164, 62 152 Z",
      // Left Calf Back
      "M 34 152 C 32 163, 31 174, 33 186 C 35 188, 37 187, 38 184 C 39 175, 40 164, 38 152 Z",
      // Right Calf Back
      "M 66 152 C 68 163, 69 174, 67 186 C 65 188, 63 187, 62 184 C 61 175, 60 164, 62 152 Z"
    ],
    // BACK
    Dos: [
      // Left Lat & Trap: majestic wing sweep of the latissimus dorsi
      "M 49 38 C 45 38, 40 42, 35 47 C 33 52, 33 59, 35 65 C 38 69, 43 71, 49 72 Z",
      // Right Lat & Trap: majestic wing sweep of the latissimus dorsi
      "M 51 38 C 55 38, 60 42, 65 47 C 67 52, 67 59, 65 65 C 62 69, 57 71, 51 72 Z"
    ],
    Lombaires: [
      // Lower Back: deep lumbar columns (erector spinae)
      "M 43 73 C 43 78, 44 83, 45 89 C 47 90, 53 90, 55 89 C 56 83, 57 78, 57 73 Z"
    ],
    Triceps: [
      // Left Tricep: horseshoe lateral/long head sweeps
      "M 29 55 C 28 58, 27 61, 26 64 C 28 66, 30 65, 31 63 C 32 60, 31 57, 30 55 Z",
      // Right Tricep: horseshoe lateral/long head sweeps
      "M 71 55 C 72 58, 73 61, 74 64 C 72 66, 70 65, 69 63 C 68 60, 69 57, 70 55 Z"
    ],
    Fessiers: [
      // Left Glute: full rounded athletic sweep of gluteus maximus
      "M 33 92 C 31 99, 32 106, 35 111 C 38 114, 44 114, 48 111 C 49 105, 47 99, 45 92 Z",
      // Right Glute: full rounded athletic sweep of gluteus maximus
      "M 67 92 C 69 99, 68 106, 65 111 C 62 114, 56 114, 52 111 C 51 105, 53 99, 55 92 Z"
    ],
    Ischios: [
      // Left Hamstring: long running sweeping cords of the back thigh
      "M 33 112 C 32 122, 32 132, 34 142 C 36 144, 41 144, 43 142 C 44 132, 44 122, 43 112 Z",
      // Right Hamstring: long running sweeping cords of the back thigh
      "M 67 112 C 68 122, 68 132, 66 142 C 64 144, 59 144, 57 142 C 56 132, 56 122, 57 112 Z"
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
