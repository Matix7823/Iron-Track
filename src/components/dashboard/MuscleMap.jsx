import React from 'react';
import { motion } from 'framer-motion';

const MuscleMap = ({ recoveryData }) => {
  // Mapping between recovery groups and their colors
  const getColor = (groupName) => {
    const data = recoveryData?.find(r => r.group === groupName);
    return data ? data.color : '#34d399'; // default to fresh green
  };

  return (
    <div className="relative w-full max-w-[200px] mx-auto py-4">
      {/* Glow effect behind the body */}
      <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full" />
      
      <svg viewBox="0 0 100 200" className="w-full h-auto drop-shadow-2xl relative z-10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5">
        
        {/* Head & Neck */}
        <circle cx="50" cy="20" r="12" fill="rgba(255,255,255,0.05)" />
        <path d="M45,30 L55,30 L53,38 L47,38 Z" fill="rgba(255,255,255,0.05)" />

        {/* Shoulders (Épaules) */}
        <motion.path
          initial={{ fill: 'rgba(255,255,255,0.05)' }}
          animate={{ fill: getColor('Épaules') }}
          transition={{ duration: 1 }}
          d="M32,38 Q40,32 50,38 Q60,32 68,38 L75,50 L25,50 Z"
          style={{ filter: `drop-shadow(0 0 4px ${getColor('Épaules')}80)` }}
        />

        {/* Pecs */}
        <motion.path
          initial={{ fill: 'rgba(255,255,255,0.05)' }}
          animate={{ fill: getColor('Pecs') }}
          transition={{ duration: 1 }}
          d="M35,50 L65,50 L62,65 Q50,70 38,65 Z"
          style={{ filter: `drop-shadow(0 0 4px ${getColor('Pecs')}80)` }}
        />

        {/* Abs (Abdos) */}
        <motion.path
          initial={{ fill: 'rgba(255,255,255,0.05)' }}
          animate={{ fill: getColor('Abdos') }}
          transition={{ duration: 1 }}
          d="M38,65 Q50,70 62,65 L60,95 L40,95 Z"
          style={{ filter: `drop-shadow(0 0 4px ${getColor('Abdos')}80)` }}
        />

        {/* Arms (Bras) - Left & Right */}
        <motion.path
          initial={{ fill: 'rgba(255,255,255,0.05)' }}
          animate={{ fill: getColor('Bras') }}
          transition={{ duration: 1 }}
          d="M25,50 L15,85 L22,87 L32,50 Z M75,50 L85,85 L78,87 L68,50 Z"
          style={{ filter: `drop-shadow(0 0 4px ${getColor('Bras')}80)` }}
        />

        {/* Back (Dos) - represented as lats sticking out */}
        <motion.path
          initial={{ fill: 'rgba(255,255,255,0.05)' }}
          animate={{ fill: getColor('Dos') }}
          transition={{ duration: 1 }}
          d="M32,50 C25,60 28,75 38,65 Z M68,50 C75,60 72,75 62,65 Z"
          style={{ filter: `drop-shadow(0 0 4px ${getColor('Dos')}80)` }}
        />

        {/* Legs (Jambes) - Quads & Calves */}
        <motion.path
          initial={{ fill: 'rgba(255,255,255,0.05)' }}
          animate={{ fill: getColor('Jambes') }}
          transition={{ duration: 1 }}
          d="M40,95 L60,95 L65,140 L52,140 L50,110 L48,140 L35,140 Z M38,145 L48,145 L45,180 L35,180 Z M52,145 L62,145 L65,180 L55,180 Z"
          style={{ filter: `drop-shadow(0 0 4px ${getColor('Jambes')}80)` }}
        />
        
      </svg>
    </div>
  );
};

export default MuscleMap;
