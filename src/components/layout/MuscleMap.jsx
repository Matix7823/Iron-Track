import React, { useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Float } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";

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

const getFatigueColor = (fatigue, isHovered, isSelected) => {
  let baseColor;
  if (fatigue === 0) baseColor = isSelected ? "#3b82f6" : "#475569";
  else if (fatigue <= 30) baseColor = "#10b981"; // Emerald
  else if (fatigue <= 65) baseColor = "#f59e0b"; // Amber
  else baseColor = "#ef4444"; // Red

  const emissiveIntensity = isHovered || isSelected ? 2 : (fatigue === 0 ? 0 : 0.8);
  const opacity = fatigue === 0 && !isSelected && !isHovered ? 0.3 : 0.9;

  return { color: baseColor, emissive: baseColor, emissiveIntensity, opacity };
};

const MusclePart = ({ name, position, rotation = [0,0,0], scale = [1,1,1], geometry = "capsule", fatigueLevels, hovered, selected, setHovered, onClick, interactive }) => {
  const meshRef = useRef();
  
  const fatigue = fatigueLevels[name] || 0;
  const isHovered = hovered === name;
  const isSelected = selected === name;
  const { color, emissive, emissiveIntensity, opacity } = getFatigueColor(fatigue, isHovered, isSelected);

  // Subtle breathing animation
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      // Only animate Y position slightly based on time and original position to create a breathing effect
      meshRef.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.02;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={(e) => { 
        if (!interactive) return;
        e.stopPropagation(); 
        setHovered(name); 
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        if (!interactive) return;
        setHovered(null);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => { 
        if (!interactive) return;
        e.stopPropagation(); 
        onClick && onClick(name); 
      }}
    >
      {geometry === "capsule" && <capsuleGeometry args={[0.5, 1, 16, 16]} />}
      {geometry === "box" && <boxGeometry args={[1, 1, 1]} />}
      {geometry === "sphere" && <sphereGeometry args={[0.5, 32, 32]} />}
      
      <meshPhysicalMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        transparent
        opacity={opacity}
        roughness={0.2}
        metalness={0.8}
        clearcoat={1}
        clearcoatRoughness={0.1}
        toneMapped={false}
      />
    </mesh>
  );
};

const Mannequin = ({ fatigueLevels, hovered, selected, setHovered, onClick, interactive }) => {
  const p = { fatigueLevels, hovered, selected, setHovered, onClick, interactive };

  return (
    <group position={[0, 0.5, 0]} scale={[0.4, 0.4, 0.4]}>
      {/* Tête */}
      <mesh position={[0, 5, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshPhysicalMaterial color="#1e293b" transparent opacity={0.6} roughness={0.5} />
      </mesh>

      {/* Cou */}
      <MusclePart name="Cou" position={[0, 3.8, -0.2]} scale={[1.8, 0.8, 1]} geometry="box" {...p} />

      {/* Epaules */}
      <MusclePart name="Epaules" position={[-2, 3.5, 0]} rotation={[0, 0, 0.3]} scale={[1.2, 1.2, 1.2]} geometry="sphere" {...p} />
      <MusclePart name="Epaules" position={[2, 3.5, 0]} rotation={[0, 0, -0.3]} scale={[1.2, 1.2, 1.2]} geometry="sphere" {...p} />

      {/* Pectoraux */}
      <MusclePart name="Pectoraux" position={[-0.8, 2.2, 0.4]} scale={[1.4, 1.4, 0.5]} geometry="box" {...p} />
      <MusclePart name="Pectoraux" position={[0.8, 2.2, 0.4]} scale={[1.4, 1.4, 0.5]} geometry="box" {...p} />

      {/* Dos */}
      <MusclePart name="Dos" position={[-0.8, 1.8, -0.5]} scale={[1.6, 2.5, 0.4]} geometry="box" {...p} />
      <MusclePart name="Dos" position={[0.8, 1.8, -0.5]} scale={[1.6, 2.5, 0.4]} geometry="box" {...p} />

      {/* Lombaires */}
      <MusclePart name="Lombaires" position={[0, -0.2, -0.5]} scale={[1.8, 1.4, 0.4]} geometry="box" {...p} />

      {/* Abdos */}
      <MusclePart name="Abdos" position={[0, 0.2, 0.4]} scale={[1.6, 2.2, 0.4]} geometry="box" {...p} />

      {/* Bras supérieurs */}
      <group position={[-2.4, 1.8, 0]} rotation={[0, 0, 0.15]}>
        <MusclePart name="Biceps" position={[0, 0, 0.3]} scale={[0.7, 1.6, 0.7]} geometry="capsule" {...p} />
        <MusclePart name="Triceps" position={[0, 0, -0.3]} scale={[0.7, 1.6, 0.7]} geometry="capsule" {...p} />
      </group>
      <group position={[2.4, 1.8, 0]} rotation={[0, 0, -0.15]}>
        <MusclePart name="Biceps" position={[0, 0, 0.3]} scale={[0.7, 1.6, 0.7]} geometry="capsule" {...p} />
        <MusclePart name="Triceps" position={[0, 0, -0.3]} scale={[0.7, 1.6, 0.7]} geometry="capsule" {...p} />
      </group>

      {/* Avant-bras */}
      <MusclePart name="AvantBras" position={[-2.8, -0.8, 0]} rotation={[0, 0, 0.1]} scale={[0.6, 1.6, 0.6]} geometry="capsule" {...p} />
      <MusclePart name="AvantBras" position={[2.8, -0.8, 0]} rotation={[0, 0, -0.1]} scale={[0.6, 1.6, 0.6]} geometry="capsule" {...p} />

      {/* Bassin/Fessiers */}
      <MusclePart name="Fessiers" position={[-0.8, -1.6, -0.5]} scale={[1.4, 1.4, 0.9]} geometry="sphere" {...p} />
      <MusclePart name="Fessiers" position={[0.8, -1.6, -0.5]} scale={[1.4, 1.4, 0.9]} geometry="sphere" {...p} />

      {/* Cuisses */}
      <group position={[-1, -3.8, 0]}>
        <MusclePart name="Quadriceps" position={[0, 0, 0.3]} scale={[0.9, 2.2, 0.9]} geometry="capsule" {...p} />
        <MusclePart name="Ischios" position={[0, 0, -0.3]} scale={[0.9, 2.2, 0.9]} geometry="capsule" {...p} />
        <MusclePart name="Adducteurs" position={[0.5, 0.5, 0]} scale={[0.4, 1.6, 0.4]} geometry="capsule" {...p} />
        <MusclePart name="Abducteurs" position={[-0.5, 0.5, 0]} scale={[0.4, 1.6, 0.4]} geometry="capsule" {...p} />
      </group>
      <group position={[1, -3.8, 0]}>
        <MusclePart name="Quadriceps" position={[0, 0, 0.3]} scale={[0.9, 2.2, 0.9]} geometry="capsule" {...p} />
        <MusclePart name="Ischios" position={[0, 0, -0.3]} scale={[0.9, 2.2, 0.9]} geometry="capsule" {...p} />
        <MusclePart name="Adducteurs" position={[-0.5, 0.5, 0]} scale={[0.4, 1.6, 0.4]} geometry="capsule" {...p} />
        <MusclePart name="Abducteurs" position={[0.5, 0.5, 0]} scale={[0.4, 1.6, 0.4]} geometry="capsule" {...p} />
      </group>

      {/* Jambes inférieures */}
      <group position={[-1, -7.2, 0]}>
        <MusclePart name="Tibias" position={[0, 0, 0.2]} scale={[0.7, 1.9, 0.6]} geometry="capsule" {...p} />
        <MusclePart name="Mollets" position={[0, 0, -0.3]} scale={[0.8, 1.7, 0.8]} geometry="capsule" {...p} />
      </group>
      <group position={[1, -7.2, 0]}>
        <MusclePart name="Tibias" position={[0, 0, 0.2]} scale={[0.7, 1.9, 0.6]} geometry="capsule" {...p} />
        <MusclePart name="Mollets" position={[0, 0, -0.3]} scale={[0.8, 1.7, 0.8]} geometry="capsule" {...p} />
      </group>
    </group>
  );
};

const MuscleMap = ({
  fatigueLevels = {},
  selectedMuscle = null,
  onMuscleClick = null,
  interactive = true
}) => {
  const [hovered, setHovered] = useState(null);

  const fatigueLabel = (key) => {
    const f = fatigueLevels[key] || 0;
    if (f === 0) return { text: "Frais", color: "#94a3b8" };
    if (f <= 30) return { text: `Actif — ${f}%`, color: "#34d399" };
    if (f <= 65) return { text: `Actif — ${f}%`, color: "#f59e0b" };
    return { text: `Fatigué — ${f}%`, color: "#ef4444" };
  };

  return (
    <div className="relative w-full flex flex-col gap-4">
      {/* 3D Canvas */}
      <div className="relative w-full h-[400px] sm:h-[500px] border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/10">
        
        {/* Overlays / Labels */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <p className="text-[10px] font-black text-blue-400 tracking-widest uppercase mb-1">Modèle 3D Cybernétique</p>
          <p className="text-xs text-slate-400">Glisse pour faire pivoter le modèle</p>
        </div>

        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#3b82f6" />
          
          <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            <Mannequin 
              fatigueLevels={fatigueLevels}
              hovered={hovered}
              selected={selectedMuscle}
              setHovered={setHovered}
              onClick={onMuscleClick}
              interactive={interactive}
            />
          </Float>

          <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 1.5}
            autoRotate={!hovered && !selectedMuscle}
            autoRotateSpeed={1}
          />
          <Environment preset="city" />
        </Canvas>

        {/* Hover Tooltip (HTML overlay) */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
            >
              <div className="px-4 py-2.5 rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-md shadow-2xl text-center min-w-[150px]">
                <p className="text-sm font-black text-white uppercase tracking-wider mb-0.5">{MUSCLE_NAMES[hovered]}</p>
                {(() => {
                  const { text, color } = fatigueLabel(hovered);
                  return (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full shadow-lg" style={{ background: color, boxShadow: `0 0 8px ${color}` }}/>
                      <span className="text-xs font-bold" style={{ color }}>{text}</span>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Muscle List */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {Object.entries(MUSCLE_NAMES).map(([key, name]) => {
          const f = fatigueLevels[key] || 0;
          const isSelected = selectedMuscle === key;
          const { color } = getFatigueColor(f, false, isSelected);
          
          return (
            <button
              key={key}
              onClick={() => interactive && onMuscleClick && onMuscleClick(key)}
              onMouseEnter={() => interactive && setHovered(key)}
              onMouseLeave={() => interactive && setHovered(null)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left ${
                isSelected
                  ? "border-blue-500/50 bg-blue-500/20 shadow-lg shadow-blue-500/20"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
              } ${interactive ? "cursor-pointer" : ""}`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors shadow-sm" style={{ background: color, boxShadow: `0 0 5px ${color}` }}/>
              <span className={`text-[10px] sm:text-xs font-bold truncate leading-tight ${isSelected ? "text-white" : "text-slate-400"}`}>
                {name}
              </span>
              {f > 0 && (
                <span className="ml-auto text-[9px] font-black shrink-0" style={{ color }}>
                  {f}%
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { MuscleMap, DB_MUSCLE_MAP, MUSCLE_NAMES };
