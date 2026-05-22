// Streak tracker utility
import { parseDate } from "./date";

export const getWorkoutStreak = (history) => {
  const sessionDates = new Set();
  Object.keys(history).forEach((exoId) => {
    (history[exoId] || []).forEach((entry) => {
      if (entry.date) sessionDates.add(entry.date);
    });
  });

  const sorted = [...sessionDates]
    .map((d) => parseDate(d))
    .sort((a, b) => b - a);

  if (sorted.length === 0) return 0;

  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  // Allow today or yesterday to start streak
  const msPerDay = 24 * 60 * 60 * 1000;
  const dayDiff = Math.round((current - sorted[0]) / msPerDay);
  if (dayDiff > 1) return 0;

  streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((sorted[i - 1] - sorted[i]) / msPerDay);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
};

export const getTotalSessionCount = (history) => {
  const sessionDates = new Set();
  Object.keys(history).forEach((exoId) => {
    (history[exoId] || []).forEach((entry) => {
      if (entry.date) sessionDates.add(entry.date);
    });
  });
  return sessionDates.size;
};

export const getPersonalRecords = (history, allExercises) => {
  const records = {};
  allExercises.forEach((exo) => {
    let best = { weight: 0, reps: 0, date: null };
    normalizeHistoryLocal(history[exo.id] || []).forEach((h) => {
      (h.setsData || []).forEach((s) => {
        const w = parseFloat(s.weight);
        const r = parseFloat(s.reps);
        if (w > best.weight && s.done && !s.isExtra) {
          best = { weight: w, reps: r, date: h.date };
        }
      });
    });
    if (best.weight > 0) records[exo.id] = best;
  });
  return records;
};

const normalizeHistoryLocal = (histArray) => {
  if (!histArray) return [];
  return histArray.map((entry) => {
    if (entry.setsData) return entry;
    const numSets = parseInt(entry.sets) || 1;
    const setsData = Array.from({ length: numSets }).map(() => ({
      weight: entry.weight || "", reps: entry.reps || "", rpe: entry.rpe || "",
      done: true, tag: null, isExtra: false,
    }));
    return { ...entry, setsData };
  });
};
