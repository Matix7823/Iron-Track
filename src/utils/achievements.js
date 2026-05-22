import { parseDate } from './date';

export const BADGES_DATA = [
  { id: 'first_workout', title: 'Premier Sang', desc: 'Compléter ta première séance', icon: '🩸', condition: (h, stats) => stats.totalSessions >= 1, color: 'text-red-400' },
  { id: 'club_100', title: 'Club des 100kg', desc: 'Soulever 100kg ou plus sur n\'importe quel exercice', icon: '💯', condition: (h, stats) => stats.maxWeightEver >= 100, color: 'text-amber-400' },
  { id: 'streak_7', title: 'Régularité de Fer', desc: '7 jours de suite d\'entraînement', icon: '🔥', condition: (h, stats) => stats.maxStreak >= 7, color: 'text-orange-500' },
  { id: 'night_owl', title: 'Oiseau de Nuit', desc: 'S\'entraîner après minuit', icon: '🦉', condition: (h, stats) => stats.hasNightWorkout, color: 'text-indigo-400' },
  { id: 'volume_god', title: 'Dieu du Volume', desc: 'Plus de 10 000kg de tonnage sur une séance', icon: '🦍', condition: (h, stats) => stats.maxSessionVolume >= 10000, color: 'text-emerald-400' },
  { id: 'dedication', title: 'Dédication', desc: '50 séances complétées', icon: '🛡️', condition: (h, stats) => stats.totalSessions >= 50, color: 'text-blue-400' },
];

export const checkAchievements = (history) => {
  if (!history) return [];

  const stats = {
    totalSessions: 0,
    maxWeightEver: 0,
    maxStreak: 0,
    hasNightWorkout: false,
    maxSessionVolume: 0,
  };

  const datesSet = new Set();
  const volumeByDate = {};

  Object.keys(history).forEach(exoId => {
    const records = history[exoId];
    if (Array.isArray(records)) {
      records.forEach(entry => {
        if (!entry.date) return;
        
        // Count sessions
        datesSet.add(entry.date);
        
        // Check Night workout (assuming timestamp is stored, but we might only have date string)
        // If we only have date string, we can't reliably check night owl unless we store exact times.
        // For now, we'll fake it if we don't have timestamp.
        if (entry.timestamp) {
          const hour = new Date(entry.timestamp).getHours();
          if (hour >= 0 && hour < 4) stats.hasNightWorkout = true;
        }

        let sessionVolume = 0;
        if (entry.setsData) {
          entry.setsData.forEach(set => {
            const w = parseFloat(set.weight);
            const r = parseFloat(set.reps);
            if (w > 0 && r > 0 && set.done !== false) {
              if (w > stats.maxWeightEver) stats.maxWeightEver = w;
              sessionVolume += w * r;
            }
          });
        }
        
        if (!volumeByDate[entry.date]) volumeByDate[entry.date] = 0;
        volumeByDate[entry.date] += sessionVolume;
      });
    }
  });

  stats.totalSessions = datesSet.size;
  stats.maxSessionVolume = Math.max(0, ...Object.values(volumeByDate));

  // Calculate Streak
  const sortedDates = [...datesSet].map(d => parseDate(d)).filter(d => d.getTime() > 0).sort((a, b) => b - a);
  let currentMax = 0;
  let currentStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const diff = Math.floor((sortedDates[i-1] - sortedDates[i]) / 86400000);
    if (diff === 1) {
      currentStreak++;
    } else {
      if (currentStreak > currentMax) currentMax = currentStreak;
      currentStreak = 1;
    }
  }
  if (currentStreak > currentMax) currentMax = currentStreak;
  stats.maxStreak = currentMax;

  // Evaluate
  const unlocked = [];
  BADGES_DATA.forEach(badge => {
    if (badge.condition(history, stats)) {
      unlocked.push(badge.id);
    }
  });

  return unlocked;
};
