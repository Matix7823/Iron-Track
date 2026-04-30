import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { sessions } from "../data/sessions";
import { parseDate, formatDateFR } from "../utils/date";
import { normalizeHistory, getPerformanceMetrics, calculateCNSScore } from "../utils/metrics";

const AppContext = createContext(null);

const STORAGE_KEY = "muscu_ultimate_v39_final_fixed";

export const AppProvider = ({ children }) => {
  const [history, setHistory] = useState({});
  const [bodyWeightHistory, setBodyWeightHistory] = useState([]);
  const [bodyMeasurements, setBodyMeasurements] = useState([]);
  const [userSessions, setUserSessions] = useState(sessions);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Session state
  const [currentSession, setCurrentSession] = useState("A");
  const [currentInput, setCurrentInput] = useState({});

  // ... (CNS, Timer, UI states restants identiques) ...
  const [sleepHours, setSleepHours] = useState(7);
  const [stressLevel, setStressLevel] = useState(5);
  const [sorenessLevel, setSorenessLevel] = useState(5);
  const [cnsScore, setCnsScore] = useState(null);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [sessionTonnage, setSessionTonnage] = useState(0);
  const [sessionRank, setSessionRank] = useState("medium");

  // --- CHARGEMENT DATA ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from("app_state")
          .select("data")
          .eq("id", 1)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Erreur de chargement Supabase", error);
        }

        if (data && data.data) {
          const parsed = data.data;
          setHistory(parsed.history || {});
          setBodyWeightHistory(parsed.bodyWeight || []);
          setBodyMeasurements(parsed.bodyMeasurements || []);
          if (parsed.userSessions) setUserSessions(parsed.userSessions);
        } else {
          const savedData = localStorage.getItem(STORAGE_KEY);
          if (savedData) {
            const parsed = JSON.parse(savedData);
            setHistory(parsed.history || {});
            setBodyWeightHistory(parsed.bodyWeight || []);
            setBodyMeasurements(parsed.bodyMeasurements || []);
            if (parsed.userSessions) setUserSessions(parsed.userSessions);
          }
        }
      } catch (err) {
        console.error("Erreur lors du chargement des données", err);
      } finally {
        setIsDataLoading(false);
      }
    };
    loadData();
  }, []);

  // --- PERSISTENCE ---
  const persistData = useCallback(async (dataToSave) => {
    try {
      const { error } = await supabase.from("app_state").upsert({ id: 1, data: dataToSave });
      if (error) console.error("Erreur sauvegarde Supabase", error);
    } catch (err) {
      console.error("Erreur sauvegarde Supabase", err);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, []);

  // --- ALL EXERCISES (memoized based on userSessions) ---
  const allExercises = useMemo(() => {
    let list = [];
    Object.values(userSessions).forEach((s) => list.push(...s.exercises));
    return list.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
  }, [userSessions]);

  // --- SESSION CUSTOMIZATION ---
  const addExerciseToSession = useCallback((sessionId, exercise) => {
    setUserSessions((prev) => {
      const newSessions = { ...prev };
      const session = { ...newSessions[sessionId] };
      // Check if already exists to avoid duplicates
      if (session.exercises.some(e => e.id === exercise.id)) return prev;
      
      session.exercises = [...session.exercises, { ...exercise, id: `${exercise.id}_${Date.now()}` }];
      newSessions[sessionId] = session;
      
      const dataToSave = { history, bodyWeight: bodyWeightHistory, bodyMeasurements, userSessions: newSessions };
      persistData(dataToSave);
      return newSessions;
    });
  }, [history, bodyWeightHistory, bodyMeasurements, persistData]);

  const removeExerciseFromSession = useCallback((sessionId, exerciseId) => {
    setUserSessions((prev) => {
      const newSessions = { ...prev };
      const session = { ...newSessions[sessionId] };
      session.exercises = session.exercises.filter(e => e.id !== exerciseId);
      newSessions[sessionId] = session;
      
      const dataToSave = { history, bodyWeight: bodyWeightHistory, bodyMeasurements, userSessions: newSessions };
      persistData(dataToSave);
      return newSessions;
    });
  }, [history, bodyWeightHistory, bodyMeasurements, persistData]);

  // --- REST OF LOGIC (TIMER, CNS, SETS...) ---
  // (Copied from original for completeness within the Provider)
  
  const startTimer = useCallback((seconds) => {
    setTimerSeconds(seconds);
    setIsTimerRunning(true);
  }, []);

  const stopTimer = useCallback(() => setIsTimerRunning(false), []);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const currentBodyWeight = useMemo(() => {
    if (bodyWeightHistory.length > 0)
      return parseFloat(bodyWeightHistory[bodyWeightHistory.length - 1].value);
    return 75;
  }, [bodyWeightHistory]);

  const calculateCNS = useCallback(() => {
    const { score, energyLevel: lvl } = calculateCNSScore(sleepHours, stressLevel, sorenessLevel);
    setCnsScore(score);
    setEnergyLevel(lvl);
  }, [sleepHours, stressLevel, sorenessLevel]);

  const resetCNS = useCallback(() => setCnsScore(null), []);

  const getSetsForExo = useCallback((exoId) => {
    if (currentInput[exoId]) return currentInput[exoId];
    const exoDef = allExercises.find((e) => e.id === exoId);
    const defaultSetCount = exoDef ? parseInt(exoDef.sets) || 3 : 3;
    const hist = normalizeHistory(history[exoId] || []);
    if (hist.length > 0) {
      const prev = hist[hist.length - 1];
      if (prev && prev.setsData && prev.setsData.length > 0) {
        return Array.from({ length: defaultSetCount }).map((_, i) => {
          const prevSet = prev.setsData[i];
          return { weight: prevSet?.weight || "", reps: "", rpe: "", done: false, tag: null, isExtra: false };
        });
      }
    }
    return Array.from({ length: defaultSetCount }).map(() => ({
      weight: "", reps: "", rpe: "", done: false, tag: null, isExtra: false,
    }));
  }, [currentInput, allExercises, history]);

  const handleSetChange = useCallback((exoId, index, field, value) => {
    setCurrentInput((prev) => {
      const exoSets = prev[exoId] ? [...prev[exoId]] : getSetsForExo(exoId);
      exoSets[index] = { ...exoSets[index], [field]: value };
      return { ...prev, [exoId]: exoSets };
    });
  }, [getSetsForExo]);

  const toggleSetDone = useCallback((exoId, index, restTime) => {
    setCurrentInput((prev) => {
      const exoSets = prev[exoId] ? [...prev[exoId]] : getSetsForExo(exoId);
      const isCurrentlyDone = exoSets[index].done;
      exoSets[index] = { ...exoSets[index], done: !isCurrentlyDone };
      if (!isCurrentlyDone && restTime > 0) {
        let calcRest = parseInt(restTime) || 60;
        const setRPE = parseInt(exoSets[index].rpe);
        if (!isNaN(setRPE) && setRPE >= 9) calcRest += 30;
        if (exoSets[index].tag === "⚡") calcRest = 15;
        startTimer(calcRest);
      }
      return { ...prev, [exoId]: exoSets };
    });
  }, [getSetsForExo, startTimer]);

  const cycleSetTag = useCallback((exoId, index) => {
    setCurrentInput((prev) => {
      const exoSets = prev[exoId] ? [...prev[exoId]] : getSetsForExo(exoId);
      const currentTag = exoSets[index].tag;
      const isExtra = exoSets[index].isExtra;
      if (!currentTag || currentTag === "drop_child" || currentTag === "pause_child") {
        exoSets[index] = { ...exoSets[index], tag: "🔥" };
      } else if (currentTag === "🔥") {
        exoSets[index] = { ...exoSets[index], tag: "💧" };
        exoSets.splice(index + 1, 0, { weight: "", reps: "", rpe: "", done: false, tag: "drop_child", isExtra: true });
      } else if (currentTag === "💧") {
        exoSets[index] = { ...exoSets[index], tag: "⚡" };
        if (exoSets[index + 1] && exoSets[index + 1].isExtra) {
          exoSets[index + 1].tag = "pause_child";
        }
      } else if (currentTag === "⚡") {
        exoSets[index] = { ...exoSets[index], tag: isExtra ? "drop_child" : null };
        if (exoSets[index + 1] && exoSets[index + 1].isExtra) {
          exoSets.splice(index + 1, 1);
        }
      }
      return { ...prev, [exoId]: exoSets };
    });
  }, [getSetsForExo]);

  const handlePreSave = useCallback(() => {
    let hasData = false;
    Object.keys(currentInput).forEach((exoId) => {
      const input = currentInput[exoId];
      if (Array.isArray(input) && input.some((s) => parseFloat(s.weight) > 0 && s.done)) {
        hasData = true;
      }
    });
    if (!hasData) { setShowErrorModal(true); return; }
    setShowConfirmModal(true);
  }, [currentInput]);

  const saveWorkout = useCallback(() => {
    const newHistory = { ...history };
    const date = formatDateFR();
    let totalTonnage = 0;

    Object.keys(currentInput).forEach((exoId) => {
      const setsArray = currentInput[exoId];
      if (Array.isArray(setsArray)) {
        const validSets = setsArray.filter((s) => parseFloat(s.weight) > 0 && parseFloat(s.reps) > 0 && s.done);
        if (validSets.length > 0) {
          newHistory[exoId] = [...normalizeHistory(newHistory[exoId] || []), { date, setsData: validSets }];
          const exoDef = allExercises.find((e) => e.id === exoId);
          if (exoDef && !exoDef.muscle.includes("Cardio")) {
            validSets.forEach((s) => { totalTonnage += parseFloat(s.weight) * parseFloat(s.reps); });
          }
        }
      }
    });

    const dataToSave = { history: newHistory, bodyWeight: bodyWeightHistory, bodyMeasurements, userSessions };
    setHistory(newHistory);
    persistData(dataToSave);
    setCurrentInput({});
    setCnsScore(null);
    setShowConfirmModal(false);

    const datesMap = {};
    Object.keys(newHistory).forEach((exoId) => {
      (newHistory[exoId] || []).forEach((entry) => {
        if (!entry.date) return;
        if (!datesMap[entry.date]) datesMap[entry.date] = { tonnage: 0 };
        (entry.setsData || []).forEach((s) => {
          if (parseFloat(s.weight) > 0 && parseFloat(s.reps) > 0 && s.done !== false) {
            datesMap[entry.date].tonnage += parseFloat(s.weight) * parseFloat(s.reps);
          }
        });
      });
    });
    const tonnages = Object.values(datesMap).map((d) => d.tonnage).sort((a, b) => a - b);
    const p75 = tonnages[Math.floor(tonnages.length * 0.75)] || 0;
    const p25 = tonnages[Math.floor(tonnages.length * 0.25)] || 0;
    let rank = "medium";
    if (totalTonnage >= p75 && totalTonnage > 0) rank = "super";
    else if (totalTonnage <= p25) rank = "bad";

    setSessionTonnage(totalTonnage);
    setSessionRank(rank);
    setShowSummary(true);
    setTimeout(() => setShowSummary(false), 5000);
  }, [history, currentInput, bodyWeightHistory, bodyMeasurements, allExercises, userSessions, persistData]);

  const saveBodyData = useCallback(async (newBodyWeight, newShoulders, newWaist) => {
    const date = formatDateFR();
    let updatedBW = [...bodyWeightHistory];
    let updatedMeas = [...bodyMeasurements];
    if (newBodyWeight) { updatedBW.push({ date, value: newBodyWeight }); setBodyWeightHistory(updatedBW); }
    if (newShoulders && newWaist) {
      const ratio = (parseFloat(newShoulders) / parseFloat(newWaist)).toFixed(2);
      updatedMeas.push({ date, shoulders: newShoulders, waist: newWaist, ratio }); setBodyMeasurements(updatedMeas);
    }
    const dataToSave = { history, bodyWeight: updatedBW, bodyMeasurements: updatedMeas, userSessions };
    persistData(dataToSave);
  }, [bodyWeightHistory, bodyMeasurements, history, userSessions, persistData]);

  const exportToCSV = useCallback(() => {
    let csv = "Date,Exercice,Série,Poids,Reps,RPE,Tag\n";
    allExercises.forEach((exo) => {
      const hist = normalizeHistory(history[exo.id] || []);
      hist.forEach((h) => {
        if (h.setsData) {
          h.setsData.forEach((s, idx) => {
            csv += `${h.date},"${exo.name}",${idx + 1},${s.weight},${s.reps},${s.rpe || "-"},${s.tag || "-"}\n`;
          });
        }
      });
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "iron_tracker_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [allExercises, history]);

  const value = {
    history, bodyWeightHistory, bodyMeasurements, userSessions, isDataLoading,
    allExercises, currentBodyWeight,
    currentSession, setCurrentSession,
    currentInput,
    getSetsForExo, handleSetChange, toggleSetDone, cycleSetTag,
    addExerciseToSession, removeExerciseFromSession,
    sleepHours, setSleepHours, stressLevel, setStressLevel, sorenessLevel, setSorenessLevel,
    cnsScore, energyLevel, calculateCNS, resetCNS,
    timerSeconds, isTimerRunning, startTimer, stopTimer,
    showSummary, setShowSummary, showConfirmModal, setShowConfirmModal, showErrorModal, setShowErrorModal,
    sessionTonnage, sessionRank, handlePreSave, saveWorkout,
    saveBodyData, exportToCSV,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;

};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
