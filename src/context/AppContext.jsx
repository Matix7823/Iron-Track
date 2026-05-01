import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "./AuthContext";
import { sessions, schedules } from "../data/sessions";
import { parseDate, formatDateFR } from "../utils/date";
import { normalizeHistory, getPerformanceMetrics, calculateCNSScore } from "../utils/metrics";
import { sanitizeData } from "../utils/security";

const AppContext = createContext(null);

const STORAGE_KEY = "muscu_ultimate_v39_final_fixed";

export const AppProvider = ({ children }) => {
  const [history, setHistory] = useState({});
  const [bodyWeightHistory, setBodyWeightHistory] = useState([]);
  const [bodyMeasurements, setBodyMeasurements] = useState([]);
  const [userSessions, setUserSessions] = useState(sessions);
  const [dailyNutrition, setDailyNutrition] = useState({});
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { user } = useAuth();

  // Session state
  const [currentSession, setCurrentSession] = useState("A");
  const [currentInput, setCurrentInput] = useState(() => {
    const saved = localStorage.getItem('iron_track_current_input');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing current input", e);
        return {};
      }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('iron_track_current_input', JSON.stringify(currentInput));
  }, [currentInput]);

  const [customSchedule, setCustomSchedule] = useState(() => {
    const saved = localStorage.getItem('iron_track_custom_schedule');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(d => typeof d === 'string' ? { session: d, label: '', status: null } : d);
        }
      } catch(e) { console.error("Error parsing schedule", e); }
    }
    return Array.from({length:7}).map(() => ({ session: '-', label: '', status: null }));
  });

  // --- PERSISTENCE ---
  const persistData = useCallback(async (dataToSave) => {
    // Toujours sauvegarder en local d'abord
    const safeData = sanitizeData(dataToSave);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeData));

    if (!user) return;
    
    // Si offline, on stocke dans la file d'attente de synchro (optionnel ici car on push tout le state)
    if (!navigator.onLine) {
      console.log("Mode offline: données sauvegardées localement");
      return;
    }

    try {
      const { error } = await supabase.from("app_state").upsert({ user_id: user.id, data: safeData });
      if (error) console.error("Erreur sauvegarde Supabase", error);
    } catch (err) {
      console.error("Erreur sauvegarde Supabase", err);
    }
  }, [user]);

  // Synchronisation automatique quand on retrouve internet
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && user) {
        try {
          const data = JSON.parse(saved);
          persistData(data);
        } catch (e) {}
      }
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, persistData]);

  const updateCustomSchedule = useCallback((newSchedule) => {
    setCustomSchedule(newSchedule);
    localStorage.setItem('iron_track_custom_schedule', JSON.stringify(newSchedule));
    if (user) {
      persistData({ 
        history, 
        bodyWeight: bodyWeightHistory, 
        bodyMeasurements, 
        userSessions, 
        customSchedule: newSchedule 
      });
    }
  }, [user, history, bodyWeightHistory, bodyMeasurements, userSessions, persistData]);

  const updateDayStatus = useCallback((index, status) => {
    setCustomSchedule(prev => {
      const newSchedule = [...prev];
      if (newSchedule[index]) newSchedule[index] = { ...newSchedule[index], status };
      localStorage.setItem('iron_track_custom_schedule', JSON.stringify(newSchedule));
      // Side effect here is risky but kept for simplicity if it was working before.
      // Ideally, this should be in a separate useEffect.
      if (user) {
        persistData({ history, bodyWeight: bodyWeightHistory, bodyMeasurements, userSessions, customSchedule: newSchedule });
      }
      return newSchedule;
    });
  }, [user, history, bodyWeightHistory, bodyMeasurements, userSessions, persistData]);

  // CNS, Timer, UI states
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

  // --- CHARGEMENT DATA & WEEKLY RESET ---
  useEffect(() => {
    const loadData = async () => {
      // 1. Charger d'abord le LocalStorage (disponibilité immédiate)
      const localSaved = localStorage.getItem(STORAGE_KEY);
      let localData = null;
      if (localSaved) {
        try {
          localData = JSON.parse(localSaved);
          // Pré-remplir le state avec les données locales
          if (localData.history) setHistory(localData.history);
          if (localData.bodyWeight) setBodyWeightHistory(localData.bodyWeight);
          if (localData.bodyMeasurements) setBodyMeasurements(localData.bodyMeasurements);
          if (localData.userSessions) setUserSessions(localData.userSessions);
          if (localData.dailyNutrition) setDailyNutrition(localData.dailyNutrition);
          if (localData.customSchedule) setCustomSchedule(localData.customSchedule);
        } catch (e) {}
      }

      if (!user) {
        setIsDataLoading(false);
        return;
      }

      setIsDataLoading(true);
      try {
        // 2. Tenter de récupérer les données distantes
        const { data, error } = await supabase.from("app_state").select("data").eq("user_id", user.id).single();
        
        if (data?.data) {
          const remoteData = data.data;
          
          // Logique de fusion simple : si on a des données locales, on pourrait comparer des timestamps,
          // mais ici on va privilégier la donnée distante si elle existe, sauf si on est en conflit.
          // Pour faire simple, on fusionne ou on remplace.
          setHistory(remoteData.history || localData?.history || {});
          setBodyWeightHistory(remoteData.bodyWeight || localData?.bodyWeight || []);
          setBodyMeasurements(remoteData.bodyMeasurements || localData?.bodyMeasurements || []);
          setUserSessions(remoteData.userSessions || localData?.userSessions || sessions);
          setDailyNutrition(remoteData.dailyNutrition || localData?.dailyNutrition || {});
          
          let schedule = remoteData.customSchedule || localData?.customSchedule || customSchedule;
          
          // Apply Weekly Reset
          const lastReset = localStorage.getItem('iron_last_weekly_reset');
          const now = new Date();
          const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
          const dayNum = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
          const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
          const currentWeekKey = `${d.getUTCFullYear()}-W${weekNo}`;

          if (lastReset !== currentWeekKey) {
            schedule = schedule.map(day => ({ ...day, status: null }));
            localStorage.setItem('iron_last_weekly_reset', currentWeekKey);
            localStorage.setItem('iron_track_custom_schedule', JSON.stringify(schedule));
            persistData({ ...remoteData, customSchedule: schedule });
          }
          
          setCustomSchedule(schedule);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData));
        }
      } catch (err) {
        console.error("Erreur de synchro distante (normal si offline)", err);
      } finally {
        setIsDataLoading(false);
      }
    };
    loadData();
  }, [user]);



  // --- ALL EXERCISES (memoized based on userSessions) ---
  const allExercises = useMemo(() => {
    let list = [];
    if (!userSessions) return list;
    Object.values(userSessions).forEach((s) => {
      if (s && Array.isArray(s.exercises)) {
        list.push(...s.exercises);
      }
    });
    return list.filter((v, i, a) => v && v.id && a.findIndex((t) => t && t.id === v.id) === i);
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

  const createCustomSession = useCallback((name, color = "from-indigo-600 to-indigo-800") => {
    setUserSessions((prev) => {
      const usedKeys = Object.keys(prev);
      // Generate next key after Z use AA, AB... or use user-provided key
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let nextKey = null;
      for (let i = 0; i < alphabet.length; i++) {
        if (!usedKeys.includes(alphabet[i])) { nextKey = alphabet[i]; break; }
      }
      if (!nextKey) {
        for (let i = 0; i < alphabet.length; i++) {
          for (let j = 0; j < alphabet.length; j++) {
            const key = alphabet[i] + alphabet[j];
            if (!usedKeys.includes(key)) { nextKey = key; break; }
          }
          if (nextKey) break;
        }
      }
      if (!nextKey) return prev;

      const newSessions = {
        ...prev,
        [nextKey]: {
          category: name || `Séance ${nextKey}`,
          title: `Séance ${nextKey} : ${name || 'Personnalisée'}`,
          focus: 'Ta séance sur mesure',
          color,
          exercises: []
        }
      };
      const dataToSave = { history, bodyWeight: bodyWeightHistory, bodyMeasurements, userSessions: newSessions };
      persistData(dataToSave);
      return newSessions;
    });
  }, [history, bodyWeightHistory, bodyMeasurements, persistData]);

  const deleteCustomSession = useCallback((sessionId) => {
    const defaultKeys = Object.keys(sessions);
    if (defaultKeys.includes(sessionId)) return; // don't delete built-in sessions
    setUserSessions((prev) => {
      const newSessions = { ...prev };
      delete newSessions[sessionId];
      
      // Also update customSchedule to remove references to this session
      setCustomSchedule(prevSchedule => {
        const newSchedule = prevSchedule.map(d => d.session === sessionId ? { ...d, session: '-' } : d);
        localStorage.setItem('iron_track_custom_schedule', JSON.stringify(newSchedule));
        return newSchedule;
      });

      const dataToSave = { history, bodyWeight: bodyWeightHistory, bodyMeasurements, userSessions: newSessions };
      persistData(dataToSave);
      return newSessions;
    });
  }, [history, bodyWeightHistory, bodyMeasurements, persistData]);

  const renameCustomSession = useCallback((sessionId, newName) => {
    setUserSessions((prev) => {
      if (!prev[sessionId]) return prev;
      const newSessions = { ...prev };
      newSessions[sessionId] = { 
        ...newSessions[sessionId], 
        category: newName,
        title: `Séance ${sessionId} : ${newName}`
      };
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
    localStorage.removeItem('iron_track_current_input');
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
    const dataToSave = { history, bodyWeight: updatedBW, bodyMeasurements: updatedMeas, userSessions, dailyNutrition };
    persistData(dataToSave);
  }, [bodyWeightHistory, bodyMeasurements, history, userSessions, dailyNutrition, persistData]);

  // --- NUTRITION LOGGING ---
  const logNutrition = useCallback((protein, carbs, fats) => {
    const date = formatDateFR();
    setDailyNutrition(prev => {
      const updated = { 
        ...prev, 
        [date]: { 
          ...(prev[date] || { water: 0 }), 
          p: parseFloat(protein) || 0, 
          c: parseFloat(carbs) || 0, 
          f: parseFloat(fats) || 0 
        } 
      };
      persistData({ history, bodyWeight: bodyWeightHistory, bodyMeasurements, userSessions, dailyNutrition: updated });
      return updated;
    });
  }, [history, bodyWeightHistory, bodyMeasurements, userSessions, persistData]);

  const logWater = useCallback((amount) => {
    const date = formatDateFR();
    setDailyNutrition(prev => {
      const current = prev[date] || { p:0, c:0, f:0, water: 0 };
      const updated = { 
        ...prev, 
        [date]: { ...current, water: (current.water || 0) + amount } 
      };
      persistData({ history, bodyWeight: bodyWeightHistory, bodyMeasurements, userSessions, dailyNutrition: updated });
      return updated;
    });
  }, [history, bodyWeightHistory, bodyMeasurements, userSessions, persistData]);

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
    currentInput, customSchedule, updateCustomSchedule, updateDayStatus,
    getSetsForExo, handleSetChange, toggleSetDone, cycleSetTag,
    addExerciseToSession, removeExerciseFromSession,
    createCustomSession, deleteCustomSession, renameCustomSession,
    sleepHours, setSleepHours, stressLevel, setStressLevel, sorenessLevel, setSorenessLevel,
    cnsScore, energyLevel, calculateCNS, resetCNS,
    timerSeconds, isTimerRunning, startTimer, stopTimer,
    showSummary, setShowSummary, showConfirmModal, setShowConfirmModal, showErrorModal, setShowErrorModal,
    sessionTonnage, sessionRank, handlePreSave, saveWorkout,
    saveBodyData, exportToCSV,
    dailyNutrition, logNutrition, logWater, isOffline,
    schedules,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;

};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
