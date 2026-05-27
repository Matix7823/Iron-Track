// Fonctions de calcul et de métriques

export const normalizeHistory = (histArray) => {
  if (!histArray) return [];
  return histArray.map((entry) => {
    if (entry.setsData) return entry;
    const numSets = parseInt(entry.sets) || 1;
    const setsData = Array.from({ length: numSets }).map(() => ({
      weight: entry.weight || "",
      reps: entry.reps || "",
      rpe: entry.rpe || "",
      done: true,
      tag: null,
      isExtra: false,
    }));
    return { ...entry, setsData };
  });
};

export const getPerformanceMetrics = (setsData) => {
  if (!setsData || setsData.length === 0) return null;
  const validSets = setsData.filter(
    (s) =>
      (s.weight!=="" && !isNaN(s.weight) && parseFloat(s.weight)>=0) &&
      parseFloat(s.reps) > 0 &&
      s.done !== false &&
      !s.isExtra
  );
  if (validSets.length === 0) return null;

  const maxWeight = Math.max(...validSets.map((s) => parseFloat(s.weight)));
  const topSets = validSets.filter((s) => parseFloat(s.weight) === maxWeight);
  const totalRepsAtMax = topSets.reduce((sum, s) => sum + parseFloat(s.reps), 0);
  const avgRepsAtMax = totalRepsAtMax / topSets.length;
  const maxRPEAtMax = Math.max(...topSets.map((s) => parseInt(s.rpe) || 0));

  const allValid = setsData.filter(
    (s) => (s.weight!=="" && !isNaN(s.weight) && parseFloat(s.weight)>=0) && parseFloat(s.reps) > 0 && s.done !== false
  );
  const totalVolume = allValid.reduce(
    (sum, s) => sum + parseFloat(s.weight) * parseFloat(s.reps),
    0
  );

  return { maxWeight, topSetsCount: topSets.length, avgRepsAtMax, maxRPE: maxRPEAtMax, totalVolume };
};

export const calculate1RM = (weight, reps) => {
  if (!weight || !reps || reps === 0) return 0;
  return Math.round(weight * (1 + reps / 30));
};

export const predictLoad = (oneRM, targetReps) => {
  if (!oneRM || !targetReps) return 0;
  return Math.round(oneRM / (1 + targetReps / 30));
};

export const getStrengthStandard = (exerciseType, rm, bw, gender = "homme") => {
  if (rm === 0 || bw === 0) return { rank: "-", color: "text-slate-500" };
  const ratio = rm / bw;
  const ultimateRank = gender === "femme" ? "Déesse Grecque" : "Dieu Grec";
  if (exerciseType === "bench") {
    if (ratio < 1.0) return { rank: "Novice", color: "text-slate-400" };
    if (ratio < 1.3) return { rank: "Intermédiaire", color: "text-blue-400" };
    if (ratio < 1.6) return { rank: "Avancé", color: "text-purple-400" };
    return { rank: ultimateRank, color: "text-yellow-400" };
  }
  if (exerciseType === "squat") {
    if (ratio < 1.2) return { rank: "Novice", color: "text-slate-400" };
    if (ratio < 1.5) return { rank: "Intermédiaire", color: "text-blue-400" };
    if (ratio < 2.0) return { rank: "Avancé", color: "text-purple-400" };
    return { rank: ultimateRank, color: "text-yellow-400" };
  }
  if (exerciseType === "pullup") {
    const ratioPull = (bw + rm) / bw;
    if (ratioPull < 1.1) return { rank: "Novice", color: "text-slate-400" };
    if (ratioPull < 1.3) return { rank: "Intermédiaire", color: "text-blue-400" };
    if (ratioPull < 1.5) return { rank: "Avancé", color: "text-purple-400" };
    return { rank: ultimateRank, color: "text-yellow-400" };
  }
  return { rank: "-", color: "text-slate-500" };
};

export const calculateCNSScore = (sleepHours, stressLevel, sorenessLevel) => {
  let sleepPts = 0;
  if (sleepHours >= 8) sleepPts = 40;
  else if (sleepHours >= 7) sleepPts = 35;
  else if (sleepHours >= 6) sleepPts = 25;
  else if (sleepHours >= 5) sleepPts = 10;
  else sleepPts = 0;

  const stressPts = (10 - stressLevel) * 3.33;
  const sorePts = (10 - sorenessLevel) * 3.33;
  const totalScore = Math.round(sleepPts + stressPts + sorePts);

  let energyLevel = 3;
  if (totalScore >= 85) energyLevel = 5;
  else if (totalScore >= 70) energyLevel = 4;
  else if (totalScore >= 45) energyLevel = 3;
  else if (totalScore >= 30) energyLevel = 2;
  else energyLevel = 1;

  return { score: totalScore, energyLevel };
};
