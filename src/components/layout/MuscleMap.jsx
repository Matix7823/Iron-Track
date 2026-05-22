import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Noms affichés en français pour tous les groupes
const MUSCLE_NAMES = {
  Pectoraux:   "Pectoraux",
  Dos:         "Grand Dorsal",
  Lombaires:   "Lombaires",
  Epaules:     "Épaules",
  Biceps:      "Biceps",
  Triceps:     "Triceps",
  AvantBras:   "Avant-bras",
  Abdos:       "Abdos & Obliques",
  Quadriceps:  "Quadriceps",
  Ischios:     "Ischios-jambiers",
  Fessiers:    "Fessiers",
  Mollets:     "Mollets",
  Adducteurs:  "Adducteurs",
  Abducteurs:  "Abducteurs",
  Tibias:      "Tibias",
  Cou:         "Cou / Trapèzes",
  Cardio:      "Cardio"
};

// Map DB → SVG key
const DB_MUSCLE_MAP = {
  "Pecs": "Pectoraux", "Pectoraux": "Pectoraux",
  "Dos": "Dos", "Lombaires": "Lombaires", "Lombes": "Lombaires",
  "Épaules": "Epaules", "Epaules": "Epaules",
  "Biceps": "Biceps", "Triceps": "Triceps",
  "Avant-bras": "AvantBras", "Avant-Bras": "AvantBras",
  "Abdos": "Abdos", "Obliques": "Abdos",
  "Quadriceps": "Quadriceps", "Cuisses": "Quadriceps",
  "Ischios": "Ischios", "Fessiers": "Fessiers",
  "Mollets": "Mollets", "Adducteurs": "Adducteurs",
  "Abducteurs": "Abducteurs", "Tibias": "Tibias",
  "Cou": "Cou", "Trapèzes": "Cou",
  "Cardio": "Cardio", "Jambes": "Quadriceps"
};

// ── Fatigue color helper ──
const getFatigueColor = (fatigue, hovered, selected) => {
  const alpha = (hovered || selected) ? 0.72 : 0.38;
  const alphaS = (hovered || selected) ? 0.95 : 0.65;

  if (fatigue === 0) {
    if (selected) return { fill: "rgba(59,130,246,0.55)", stroke: "rgba(59,130,246,0.95)" };
    if (hovered)  return { fill: "rgba(59,130,246,0.35)", stroke: "rgba(59,130,246,0.75)" };
    return { fill: "rgba(148,163,184,0.12)", stroke: "rgba(148,163,184,0.28)" };
  }
  if (fatigue <= 30)
    return { fill: `rgba(16,185,129,${alpha})`, stroke: `rgba(16,185,129,${alphaS})` };
  if (fatigue <= 65)
    return { fill: `rgba(245,158,11,${alpha})`, stroke: `rgba(245,158,11,${alphaS})` };
  return { fill: `rgba(239,68,68,${alpha})`, stroke: `rgba(239,68,68,${alphaS})` };
};

// ── Reusable Muscle Renderer ──
const MuscleShape = ({ muscleKey, paths, hovered, selected, fatigueLevels, onMouseEnter, onMouseLeave, onClick, interactive, rx = "1" }) => {
  const fatigue = fatigueLevels[muscleKey] || 0;
  const isHovered = hovered === muscleKey;
  const isSelected = selected === muscleKey;
  const { fill, stroke } = getFatigueColor(fatigue, isHovered, isSelected);
  const glow = (isHovered || isSelected) ? `drop-shadow(0 0 5px ${stroke})` : "none";

  return (
    <>
      {paths.map((d, i) => (
        <path
          key={`${muscleKey}-${i}`}
          d={d}
          fill={fill}
          stroke={stroke}
          strokeWidth={isHovered || isSelected ? "1.5" : "0.9"}
          strokeLinejoin="round"
          className={`transition-all duration-200 ${interactive ? "cursor-pointer" : ""}`}
          style={{ filter: glow }}
          onClick={() => interactive && onClick && onClick(muscleKey)}
          onMouseEnter={() => interactive && onMouseEnter && onMouseEnter(muscleKey)}
          onMouseLeave={() => interactive && onMouseLeave && onMouseLeave()}
        />
      ))}
    </>
  );
};

// ── Main Component ──
const MuscleMap = ({
  fatigueLevels = {},
  selectedMuscle = null,
  onMuscleClick = null,
  interactive = true
}) => {
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left + 14, y: e.clientY - rect.top - 40 });
  };

  const sharedProps = {
    hovered,
    selected: selectedMuscle,
    fatigueLevels,
    onMouseEnter: setHovered,
    onMouseLeave: () => setHovered(null),
    onClick: onMuscleClick,
    interactive
  };

  // ─────────────────── FRONT VIEW PATHS ───────────────────
  // ViewBox: 0 0 100 220  — atlas anatomique vectorisé

  const FRONT = {
    Cou: [
      // Cou + trapèzes haut (vue face)
      "M 45 28 C 44 30, 44 33, 44 36 L 56 36 C 56 33, 56 30, 55 28 C 52 26, 48 26, 45 28 Z",
      // Trap gauche
      "M 44 36 C 40 36, 34 38, 32 41 C 34 40, 40 39, 44 40 Z",
      // Trap droit
      "M 56 36 C 60 36, 66 38, 68 41 C 66 40, 60 39, 56 40 Z"
    ],
    Epaules: [
      // Deltoïde gauche (face)
      "M 32 41 C 28 43, 26 46, 26 51 C 26 55, 28 58, 30 59 C 32 57, 34 53, 34 48 C 34 44, 33 41, 32 41 Z",
      // Deltoïde droit (face)
      "M 68 41 C 72 43, 74 46, 74 51 C 74 55, 72 58, 70 59 C 68 57, 66 53, 66 48 C 66 44, 67 41, 68 41 Z"
    ],
    Pectoraux: [
      // Pec gauche
      "M 44 40 C 41 40, 37 42, 33 46 C 31 49, 30 53, 31 57 C 34 60, 39 63, 44 63 C 46 63, 48 62, 49 61 L 49 42 C 47 40, 45 40, 44 40 Z",
      // Pec droit
      "M 56 40 C 59 40, 63 42, 67 46 C 69 49, 70 53, 69 57 C 66 60, 61 63, 56 63 C 54 63, 52 62, 51 61 L 51 42 C 53 40, 55 40, 56 40 Z"
    ],
    Abdos: [
      // Rectus abdominis — 6 blocs avec linea alba
      // Col 1 (gauche) — 3 rangées
      "M 43 64 Q 45 64, 48 64 L 48 71 Q 46 72, 43 71 Z",
      "M 43 73 Q 45 73, 48 73 L 48 80 Q 46 81, 43 80 Z",
      "M 44 82 Q 46 82, 48 82 L 48 90 Q 46 91, 44 90 Z",
      // Col 2 (droite) — 3 rangées
      "M 52 64 Q 55 64, 57 64 L 57 71 Q 54 72, 52 71 Z",
      "M 52 73 Q 55 73, 57 73 L 57 80 Q 54 81, 52 80 Z",
      "M 52 82 Q 54 82, 56 82 L 56 90 Q 54 91, 52 90 Z"
    ],
    Biceps: [
      // Biceps gauche
      "M 27 60 C 25 65, 24 70, 24 75 C 26 77, 28 76, 30 74 C 31 70, 32 64, 30 60 Z",
      // Biceps droit
      "M 73 60 C 75 65, 76 70, 76 75 C 74 77, 72 76, 70 74 C 69 70, 68 64, 70 60 Z"
    ],
    AvantBras: [
      // Avant-bras gauche
      "M 24 76 C 22 83, 20 90, 18 98 C 20 100, 23 99, 25 96 C 27 89, 28 82, 27 76 Z",
      // Avant-bras droit
      "M 76 76 C 78 83, 80 90, 82 98 C 80 100, 77 99, 75 96 C 73 89, 72 82, 73 76 Z"
    ],
    Adducteurs: [
      // Adducteur gauche (face interne cuisse)
      "M 41 100 C 39 108, 38 118, 38 128 C 40 130, 43 130, 45 128 C 45 118, 46 108, 46 100 Z",
      // Adducteur droit
      "M 59 100 C 61 108, 62 118, 62 128 C 60 130, 57 130, 55 128 C 55 118, 54 108, 54 100 Z"
    ],
    Quadriceps: [
      // Quad gauche (extérieur + vaste)
      "M 33 98 C 30 108, 28 122, 30 138 C 33 143, 38 145, 42 143 C 45 137, 46 122, 45 108 C 42 102, 37 98, 33 98 Z",
      // Quad droit
      "M 67 98 C 70 108, 72 122, 70 138 C 67 143, 62 145, 58 143 C 55 137, 54 122, 55 108 C 58 102, 63 98, 67 98 Z"
    ],
    Tibias: [
      // Tibias gauche (muscle tibial antérieur)
      "M 33 152 C 31 162, 30 172, 31 182 C 33 184, 36 183, 37 181 C 38 172, 38 162, 37 152 Z",
      // Tibias droit
      "M 67 152 C 69 162, 70 172, 69 182 C 67 184, 64 183, 63 181 C 62 172, 62 162, 63 152 Z"
    ],
    Mollets: [
      // Mollet gauche face
      "M 36 152 C 34 162, 33 172, 35 184 C 37 186, 39 185, 40 183 C 42 174, 42 163, 40 152 Z",
      // Mollet droit face
      "M 64 152 C 66 162, 67 172, 65 184 C 63 186, 61 185, 60 183 C 58 174, 58 163, 60 152 Z"
    ],
    Triceps: [
      // Triceps gauche (visible de face, creux latéral)
      "M 27 59 C 25 63, 24 68, 24 73 C 26 74, 28 73, 29 70 C 30 66, 30 61, 28 59 Z",
      // Triceps droit
      "M 73 59 C 75 63, 76 68, 76 73 C 74 74, 72 73, 71 70 C 70 66, 70 61, 72 59 Z"
    ],
  };

  // ─────────────────── BACK VIEW PATHS ───────────────────
  const BACK = {
    Cou: [
      // Cou dos
      "M 45 28 C 44 30, 44 33, 44 36 L 56 36 C 56 33, 56 30, 55 28 C 52 26, 48 26, 45 28 Z",
      // Trapèze gauche (vue dos, plus large)
      "M 44 36 C 38 38, 33 42, 30 46 C 34 44, 40 42, 44 42 Z",
      // Trapèze droit
      "M 56 36 C 62 38, 67 42, 70 46 C 66 44, 60 42, 56 42 Z"
    ],
    Epaules: [
      // Deltoïde postérieur gauche
      "M 32 42 C 27 44, 25 48, 25 53 C 25 57, 27 61, 30 62 C 32 59, 33 55, 33 50 C 33 46, 32 43, 32 42 Z",
      // Deltoïde postérieur droit
      "M 68 42 C 73 44, 75 48, 75 53 C 75 57, 73 61, 70 62 C 68 59, 67 55, 67 50 C 67 46, 68 43, 68 42 Z"
    ],
    Dos: [
      // Grand dorsal gauche (grande aile du dos)
      "M 49 38 C 43 40, 35 46, 31 53 C 29 58, 30 66, 33 71 C 37 75, 43 77, 49 77 Z",
      // Grand dorsal droit
      "M 51 38 C 57 40, 65 46, 69 53 C 71 58, 70 66, 67 71 C 63 75, 57 77, 51 77 Z"
    ],
    Lombaires: [
      // Erector spinae colonnes
      "M 44 78 C 43 84, 43 91, 44 97 C 46 99, 48 99, 49 97 L 49 78 Z",
      "M 56 78 C 57 84, 57 91, 56 97 C 54 99, 52 99, 51 97 L 51 78 Z"
    ],
    Triceps: [
      // Triceps gauche (fer à cheval)
      "M 27 60 C 25 65, 24 71, 24 76 C 26 78, 29 77, 30 75 C 31 70, 31 64, 30 60 Z",
      // Triceps droit
      "M 73 60 C 75 65, 76 71, 76 76 C 74 78, 71 77, 70 75 C 69 70, 69 64, 70 60 Z"
    ],
    AvantBras: [
      // Avant-bras gauche dos
      "M 24 77 C 22 84, 20 91, 18 99 C 20 101, 23 100, 25 97 C 27 90, 28 83, 27 77 Z",
      // Avant-bras droit dos
      "M 76 77 C 78 84, 80 91, 82 99 C 80 101, 77 100, 75 97 C 73 90, 72 83, 73 77 Z"
    ],
    Fessiers: [
      // Fessier gauche (grand fessier)
      "M 34 98 C 31 106, 31 116, 35 122 C 39 126, 45 127, 49 123 C 50 116, 49 107, 46 98 Z",
      // Fessier droit
      "M 66 98 C 69 106, 69 116, 65 122 C 61 126, 55 127, 51 123 C 50 116, 51 107, 54 98 Z"
    ],
    Abducteurs: [
      // Abducteur gauche (face externe cuisse arrière)
      "M 33 122 C 30 130, 29 140, 31 150 C 33 152, 36 152, 37 150 C 38 141, 38 130, 36 122 Z",
      // Abducteur droit
      "M 67 122 C 70 130, 71 140, 69 150 C 67 152, 64 152, 63 150 C 62 141, 62 130, 64 122 Z"
    ],
    Ischios: [
      // Ischio gauche (biceps fémoral, semi-tendineux)
      "M 37 122 C 36 132, 35 143, 37 153 C 39 156, 43 156, 45 153 C 46 143, 46 132, 45 122 Z",
      // Ischio droit
      "M 63 122 C 64 132, 65 143, 63 153 C 61 156, 57 156, 55 153 C 54 143, 54 132, 55 122 Z"
    ],
    Mollets: [
      // Gastrocnemius gauche (deux chefs)
      "M 35 154 C 33 165, 32 176, 34 188 C 36 191, 39 190, 40 187 C 42 177, 42 165, 40 154 Z",
      // Gastrocnemius droit
      "M 65 154 C 67 165, 68 176, 66 188 C 64 191, 61 190, 60 187 C 58 177, 58 165, 60 154 Z"
    ],
  };

  // ── Body skeleton outline ──
  const BodyOutline = () => (
    <>
      {/* Silhouette tête */}
      <ellipse cx="50" cy="20" rx="8" ry="9.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2"/>
      {/* Cou silhouette */}
      <path d="M 46 29 L 46 35 M 54 29 L 54 35" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      {/* Épaules */}
      <path d="M 44 37 C 38 37, 28 41, 26 47 M 56 37 C 62 37, 72 41, 74 47" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" fill="none"/>
      {/* Bras gauche */}
      <path d="M 26 51 C 24 62, 22 80, 18 100" stroke="rgba(255,255,255,0.07)" strokeWidth="1.2" fill="none"/>
      {/* Bras droit */}
      <path d="M 74 51 C 76 62, 78 80, 82 100" stroke="rgba(255,255,255,0.07)" strokeWidth="1.2" fill="none"/>
      {/* Torse */}
      <path d="M 34 37 L 34 97 M 66 37 L 66 97 M 34 97 L 66 97" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none"/>
      {/* Bassin */}
      <path d="M 34 97 C 36 101, 44 103, 50 103 C 56 103, 64 101, 66 97" stroke="rgba(255,255,255,0.09)" strokeWidth="1.2" fill="none"/>
      {/* Jambe gauche */}
      <path d="M 34 102 C 32 130, 32 160, 34 205 M 46 102 C 46 130, 46 160, 44 205" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none"/>
      {/* Jambe droite */}
      <path d="M 66 102 C 68 130, 68 160, 66 205 M 54 102 C 54 130, 54 160, 56 205" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none"/>
      {/* Pieds */}
      <path d="M 34 205 C 31 207, 28 209, 30 211 L 40 211 L 42 205 Z" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      <path d="M 66 205 C 69 207, 72 209, 70 211 L 60 211 L 58 205 Z" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      {/* Mains */}
      <ellipse cx="17" cy="103" rx="3" ry="4" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      <ellipse cx="83" cy="103" rx="3" ry="4" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      {/* Genoux */}
      <circle cx="40" cy="150" r="2.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
      <circle cx="60" cy="150" r="2.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
      {/* Linea alba (abdos) */}
      <path d="M 50 63 L 50 91" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" strokeDasharray="2,2"/>
    </>
  );

  // ── Fatigue label helper ──
  const fatigueLabel = (key) => {
    const f = fatigueLevels[key] || 0;
    if (f === 0) return { text: "Frais", color: "#94a3b8" };
    if (f <= 30) return { text: `Actif — ${f}%`, color: "#34d399" };
    if (f <= 65) return { text: `Actif — ${f}%`, color: "#f59e0b" };
    return { text: `Fatigué — ${f}%`, color: "#ef4444" };
  };

  return (
    <div className="relative w-full select-none" onMouseMove={handleMouseMove}>
      {/* ── Label row ── */}
      <div className="flex justify-around mb-2">
        {["Vue Face", "Vue Dos"].map(label => (
          <span key={label} className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        ))}
      </div>

      {/* ── SVG pair ── */}
      <div className="flex gap-3 w-full">
        {/* FRONT */}
        <div className="flex-1 relative border border-white/6 bg-slate-950/30 rounded-2xl overflow-hidden shadow-inner"
          style={{ aspectRatio: "1/2.2", minHeight: 200 }}>
          <svg viewBox="0 0 100 220" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Background grid */}
            <defs>
              <pattern id="grid-f" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.018)" strokeWidth="0.5"/>
              </pattern>
              <radialGradient id="body-glow-f" cx="50%" cy="45%" r="50%">
                <stop offset="0%" stopColor="rgba(59,130,246,0.06)"/>
                <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
              </radialGradient>
            </defs>
            <rect width="100" height="220" fill="url(#grid-f)"/>
            <ellipse cx="50" cy="100" rx="45" ry="95" fill="url(#body-glow-f)"/>

            <BodyOutline />

            {/* Muscles FRONT */}
            <MuscleShape muscleKey="Cou"        paths={FRONT.Cou}        {...sharedProps} />
            <MuscleShape muscleKey="Epaules"    paths={FRONT.Epaules}    {...sharedProps} />
            <MuscleShape muscleKey="Pectoraux"  paths={FRONT.Pectoraux}  {...sharedProps} />
            <MuscleShape muscleKey="Triceps"    paths={FRONT.Triceps}    {...sharedProps} />
            <MuscleShape muscleKey="Biceps"     paths={FRONT.Biceps}     {...sharedProps} />
            <MuscleShape muscleKey="AvantBras"  paths={FRONT.AvantBras}  {...sharedProps} />
            <MuscleShape muscleKey="Abdos"      paths={FRONT.Abdos}      {...sharedProps} />
            <MuscleShape muscleKey="Adducteurs" paths={FRONT.Adducteurs} {...sharedProps} />
            <MuscleShape muscleKey="Quadriceps" paths={FRONT.Quadriceps} {...sharedProps} />
            <MuscleShape muscleKey="Tibias"     paths={FRONT.Tibias}     {...sharedProps} />
            <MuscleShape muscleKey="Mollets"    paths={FRONT.Mollets}    {...sharedProps} />

            {/* Central line */}
            <path d="M 50 10 L 50 210" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3,5"/>
          </svg>
        </div>

        {/* BACK */}
        <div className="flex-1 relative border border-white/6 bg-slate-950/30 rounded-2xl overflow-hidden shadow-inner"
          style={{ aspectRatio: "1/2.2", minHeight: 200 }}>
          <svg viewBox="0 0 100 220" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="grid-b" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.018)" strokeWidth="0.5"/>
              </pattern>
              <radialGradient id="body-glow-b" cx="50%" cy="45%" r="50%">
                <stop offset="0%" stopColor="rgba(59,130,246,0.06)"/>
                <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
              </radialGradient>
            </defs>
            <rect width="100" height="220" fill="url(#grid-b)"/>
            <ellipse cx="50" cy="100" rx="45" ry="95" fill="url(#body-glow-b)"/>

            <BodyOutline />

            {/* Muscles BACK */}
            <MuscleShape muscleKey="Cou"        paths={BACK.Cou}        {...sharedProps} />
            <MuscleShape muscleKey="Epaules"    paths={BACK.Epaules}    {...sharedProps} />
            <MuscleShape muscleKey="Dos"        paths={BACK.Dos}        {...sharedProps} />
            <MuscleShape muscleKey="Lombaires"  paths={BACK.Lombaires}  {...sharedProps} />
            <MuscleShape muscleKey="Triceps"    paths={BACK.Triceps}    {...sharedProps} />
            <MuscleShape muscleKey="AvantBras"  paths={BACK.AvantBras}  {...sharedProps} />
            <MuscleShape muscleKey="Fessiers"   paths={BACK.Fessiers}   {...sharedProps} />
            <MuscleShape muscleKey="Abducteurs" paths={BACK.Abducteurs} {...sharedProps} />
            <MuscleShape muscleKey="Ischios"    paths={BACK.Ischios}    {...sharedProps} />
            <MuscleShape muscleKey="Mollets"    paths={BACK.Mollets}    {...sharedProps} />

            <path d="M 50 10 L 50 210" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3,5"/>
          </svg>
        </div>
      </div>

      {/* ── Muscle legend grid ── */}
      <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-1.5">
        {Object.entries(MUSCLE_NAMES).map(([key, name]) => {
          const f = fatigueLevels[key] || 0;
          const { fill } = getFatigueColor(f, false, selectedMuscle === key);
          const dotColor = f === 0 ? "#475569" : f <= 30 ? "#34d399" : f <= 65 ? "#f59e0b" : "#ef4444";
          return (
            <button
              key={key}
              onClick={() => interactive && onMuscleClick && onMuscleClick(key)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all text-left ${
                selectedMuscle === key
                  ? "border-blue-500/50 bg-blue-500/10"
                  : "border-white/6 bg-white/3 hover:border-white/15 hover:bg-white/6"
              } ${interactive ? "cursor-pointer" : ""}`}
            >
              <span className="w-2 h-2 rounded-full shrink-0 transition-colors" style={{ background: dotColor }}/>
              <span className="text-[9px] font-bold text-slate-400 leading-tight truncate">{name}</span>
              {f > 0 && (
                <span className={`ml-auto text-[8px] font-black shrink-0 ${f <= 30 ? "text-emerald-400" : f <= 65 ? "text-amber-400" : "text-red-400"}`}>
                  {f}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── HUD Tooltip ── */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="absolute z-30 pointer-events-none"
            style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
          >
            <div className="px-3 py-2 rounded-xl border border-slate-700/80 bg-slate-950/95 backdrop-blur-xl shadow-2xl min-w-[120px]">
              <p className="text-[11px] font-black text-white uppercase tracking-wider">{MUSCLE_NAMES[hovered]}</p>
              {(() => {
                const { text, color } = fatigueLabel(hovered);
                return (
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }}/>
                    <span className="text-[9px] font-bold" style={{ color }}>{text}</span>
                  </div>
                );
              })()}
              {interactive && (
                <p className="text-[8px] text-slate-600 mt-1">Cliquer pour filtrer</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { MuscleMap, DB_MUSCLE_MAP, MUSCLE_NAMES };
