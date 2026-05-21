/**
 * Système de progression et de rangs pour Iron Track
 */

export const RANKS = [
  { name: "Fer", color: "from-slate-400 to-slate-600", textColor: "text-slate-300", icon: "⛓️" },
  { name: "Bronze", color: "from-orange-400 to-orange-700", textColor: "text-orange-300", icon: "🥉" },
  { name: "Argent", color: "from-zinc-300 to-zinc-500", textColor: "text-zinc-200", icon: "🥈" },
  { name: "Or", color: "from-amber-300 to-amber-600", textColor: "text-amber-200", icon: "🥇" },
  { name: "Platine", color: "from-cyan-300 to-cyan-600", textColor: "text-cyan-200", icon: "💎" },
  { name: "Diamant", color: "from-blue-400 to-indigo-600", textColor: "text-blue-200", icon: "💠" },
  { name: "Maître", color: "from-purple-500 to-purple-900", textColor: "text-purple-200", icon: "👑" },
  { name: "Grand Maître", color: "from-red-500 to-red-900", textColor: "text-red-200", icon: "🏮" },
  { name: "Dieu Grec", color: "from-yellow-300 via-amber-500 to-yellow-600", textColor: "text-yellow-100", icon: "⚡", isGod: true }
];

export const MAX_LEVEL = 27;

/**
 * Calcule l'XP nécessaire pour atteindre un niveau donné
 * Courbe exponentielle pour rendre la progression difficile
 */
export const getXPForLevel = (level) => {
  if (level <= 1) return 0;
  // Courbe plus progressive pour le début, tout en restant un défi ultime
  return Math.floor(Math.pow(level - 1, 2.2) * 600);
};

/**
 * Retourne les détails du rang actuel en fonction de l'XP
 */
export const getProgressionDetails = (xp) => {
  let level = 1;
  while (level < MAX_LEVEL && xp >= getXPForLevel(level + 1)) {
    level++;
  }

  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = level < MAX_LEVEL ? getXPForLevel(level + 1) : currentLevelXP;
  const xpInCurrentLevel = xp - currentLevelXP;
  const xpRequiredForNext = nextLevelXP - currentLevelXP;
  const progress = level < MAX_LEVEL ? (xpInCurrentLevel / xpRequiredForNext) * 100 : 100;

  const rankIdx = Math.floor((level - 1) / 3);
  const step = ((level - 1) % 3) + 1;
  const rank = RANKS[rankIdx] || RANKS[0];

  return {
    level,
    rankName: rank.name,
    step,
    rankColor: rank.color,
    rankTextColor: rank.textColor,
    rankIcon: rank.icon,
    progress,
    xp,
    xpToNext: level < MAX_LEVEL ? nextLevelXP - xp : 0,
    isMax: level === MAX_LEVEL,
    isGod: rank.isGod
  };
};

/**
 * Calcule l'XP gagnée lors d'une séance
 */
export const calculateSessionXP = (tonnage, energyLevel) => {
  const baseXP = 200;
  const tonnageBonus = Math.floor(tonnage / 10); // 1 XP pour 10kg
  const energyMultiplier = energyLevel ? energyLevel / 3 : 1; // 3/5 = 1x, 5/5 = 1.66x
  
  let totalXP = Math.floor((baseXP + tonnageBonus) * energyMultiplier);
  
  // Cap à 3000 XP par session pour éviter les abus ou bugs
  return Math.min(totalXP, 3000);
};

/**
 * Calcule le decay d'XP après inactivité
 */
export const calculateXPDecay = (xp, lastDate) => {
  if (!lastDate || !xp) return xp;
  
  const last = new Date(lastDate);
  const now = new Date();
  const diffTime = Math.abs(now - last);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 3) return xp;
  
  // Perd 1% par jour après le 3ème jour
  const daysOfDecay = diffDays - 3;
  const decayFactor = Math.pow(0.99, daysOfDecay);
  
  return Math.max(0, Math.floor(xp * decayFactor));
};
