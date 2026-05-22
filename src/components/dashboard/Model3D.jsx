import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';

// Helper to get neon color based on fatigue level (0 to 10)
// 0 = Rested (Cyan/Green), 10 = Fatigued (Red/Pink)
const getFatigueColor = (fatigueLevel) => {
  const t = Math.min(Math.max(fatigueLevel / 10, 0), 1);
  const color = new THREE.Color();
  
  // Base cyan: #06b6d4, Fatigued pink/red: #f43f5e
  const rested = new THREE.Color('#06b6d4');
  const fatigued = new THREE.Color('#f43f5e');
  
  color.lerpColors(rested, fatigued, t);
  return color;
};

// Reusable glowing material
const GlowingMaterial = ({ fatigueLevel = 0 }) => {
  const color = getFatigueColor(fatigueLevel);
  return (
    <meshStandardMaterial 
      color={color}
      emissive={color}
      emissiveIntensity={0.5 + (fatigueLevel / 10) * 1.5}
      roughness={0.2}
      metalness={0.8}
      transparent
      opacity={0.9}
    />
  );
};

// Reusable joint material
const JointMaterial = () => (
  <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.3} />
);

const HumanoidModel = ({ recoveryData = [] }) => {
  const groupRef = useRef();

  // Subtle breathing/floating animation
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.05;
    }
  });

  // Convert recovery array (pct 0-100 where 100 is rested) to fatigue (0-10 where 10 is fatigued)
  const getFatigueFor = (groupName) => {
    const item = recoveryData.find(r => r.group === groupName);
    if (!item) return 0;
    return 10 - (item.pct / 10);
  };

  const f = {
    pecs: getFatigueFor('Pecs'),
    dos: getFatigueFor('Dos'),
    epaules: getFatigueFor('Épaules'),
    bras: getFatigueFor('Bras'),
    jambes: getFatigueFor('Jambes'),
    abdos: getFatigueFor('Abdos'),
  };

  return (
    <group ref={groupRef} position={[0, -1.5, 0]}>
      {/* HEAD */}
      <mesh position={[0, 3.2, 0]}>
        <boxGeometry args={[0.6, 0.7, 0.6]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.8} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 2.7, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.4]} />
        <JointMaterial />
      </mesh>

      {/* TORSO */}
      {/* Chest (Pecs) */}
      <mesh position={[0, 2.1, 0.1]}>
        <boxGeometry args={[1.3, 0.8, 0.5]} />
        <GlowingMaterial fatigueLevel={f.pecs} />
      </mesh>
      {/* Back (Dos) */}
      <mesh position={[0, 2.1, -0.1]}>
        <boxGeometry args={[1.3, 0.8, 0.4]} />
        <GlowingMaterial fatigueLevel={f.dos} />
      </mesh>
      
      {/* Abdomen */}
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[1.1, 0.8, 0.6]} />
        <GlowingMaterial fatigueLevel={f.abdos} />
      </mesh>

      {/* SHOULDERS & ARMS */}
      {/* Left Shoulder */}
      <mesh position={[-0.9, 2.3, 0]}>
        <sphereGeometry args={[0.3]} />
        <GlowingMaterial fatigueLevel={f.epaules} />
      </mesh>
      {/* Right Shoulder */}
      <mesh position={[0.9, 2.3, 0]}>
        <sphereGeometry args={[0.3]} />
        <GlowingMaterial fatigueLevel={f.epaules} />
      </mesh>

      {/* Left Upper Arm */}
      <mesh position={[-1.1, 1.6, 0]} rotation={[0, 0, -0.15]}>
        <capsuleGeometry args={[0.18, 0.6]} />
        <GlowingMaterial fatigueLevel={f.bras} />
      </mesh>
      {/* Left Elbow */}
      <mesh position={[-1.2, 1.1, 0]}>
        <sphereGeometry args={[0.16]} />
        <JointMaterial />
      </mesh>
      {/* Left Forearm */}
      <mesh position={[-1.3, 0.5, 0.1]} rotation={[0.2, 0, -0.1]}>
        <capsuleGeometry args={[0.15, 0.6]} />
        <GlowingMaterial fatigueLevel={f.bras} />
      </mesh>

      {/* Right Upper Arm */}
      <mesh position={[1.1, 1.6, 0]} rotation={[0, 0, 0.15]}>
        <capsuleGeometry args={[0.18, 0.6]} />
        <GlowingMaterial fatigueLevel={f.bras} />
      </mesh>
      {/* Right Elbow */}
      <mesh position={[1.2, 1.1, 0]}>
        <sphereGeometry args={[0.16]} />
        <JointMaterial />
      </mesh>
      {/* Right Forearm */}
      <mesh position={[1.3, 0.5, 0.1]} rotation={[0.2, 0, 0.1]}>
        <capsuleGeometry args={[0.15, 0.6]} />
        <GlowingMaterial fatigueLevel={f.bras} />
      </mesh>

      {/* PELVIS */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.2, 0.4, 0.6]} />
        <JointMaterial />
      </mesh>

      {/* LEGS */}
      {/* Left Thigh */}
      <mesh position={[-0.4, 0.1, 0]} rotation={[0, 0, -0.05]}>
        <capsuleGeometry args={[0.25, 0.8]} />
        <GlowingMaterial fatigueLevel={f.jambes} />
      </mesh>
      {/* Left Knee */}
      <mesh position={[-0.4, -0.5, 0]}>
        <sphereGeometry args={[0.22]} />
        <JointMaterial />
      </mesh>
      {/* Left Calf */}
      <mesh position={[-0.4, -1.2, 0]}>
        <capsuleGeometry args={[0.2, 0.8]} />
        <GlowingMaterial fatigueLevel={f.jambes} />
      </mesh>
      {/* Left Foot */}
      <mesh position={[-0.4, -1.8, 0.15]}>
        <boxGeometry args={[0.3, 0.2, 0.6]} />
        <JointMaterial />
      </mesh>

      {/* Right Thigh */}
      <mesh position={[0.4, 0.1, 0]} rotation={[0, 0, 0.05]}>
        <capsuleGeometry args={[0.25, 0.8]} />
        <GlowingMaterial fatigueLevel={f.jambes} />
      </mesh>
      {/* Right Knee */}
      <mesh position={[0.4, -0.5, 0]}>
        <sphereGeometry args={[0.22]} />
        <JointMaterial />
      </mesh>
      {/* Right Calf */}
      <mesh position={[0.4, -1.2, 0]}>
        <capsuleGeometry args={[0.2, 0.8]} />
        <GlowingMaterial fatigueLevel={f.jambes} />
      </mesh>
      {/* Right Foot */}
      <mesh position={[0.4, -1.8, 0.15]}>
        <boxGeometry args={[0.3, 0.2, 0.6]} />
        <JointMaterial />
      </mesh>

    </group>
  );
};

// Scene Container
export const MuscleMap3D = ({ recoveryData = [] }) => {
  return (
    <div className="w-full h-full relative" style={{ minHeight: '300px' }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <React.Suspense fallback={null}>
          <color attach="background" args={['transparent']} />
          
          <ambientLight intensity={0.4} />
          <spotLight position={[5, 10, 5]} angle={0.3} penumbra={1} intensity={2} color="#0ea5e9" />
          <spotLight position={[-5, -10, -5]} angle={0.3} penumbra={1} intensity={2} color="#f43f5e" />
          
          <Environment preset="city" />
          
          <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            <HumanoidModel recoveryData={recoveryData} />
          </Float>
          
          <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
          
          <OrbitControls 
            enablePan={false}
            enableZoom={true}
            minDistance={3}
            maxDistance={8}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
            autoRotate
            autoRotateSpeed={1}
          />
        </React.Suspense>
      </Canvas>
      <div className="absolute top-2 left-2 pointer-events-none">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-black/40 px-2 py-1 rounded-lg backdrop-blur-md border border-white/5">
          Modèle d'effort 3D
        </p>
      </div>
      <div className="absolute bottom-2 right-2 pointer-events-none flex items-center gap-2">
        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-md border border-white/5">
          <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></span>
          <span className="text-[9px] text-slate-300">Frais</span>
        </div>
        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-md border border-white/5">
          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"></span>
          <span className="text-[9px] text-slate-300">Fatigué</span>
        </div>
      </div>
    </div>
  );
};

export default MuscleMap3D;
