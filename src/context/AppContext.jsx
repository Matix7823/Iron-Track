import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "./AuthContext";
import { sessions, schedules } from "../data/sessions";
import { parseDate, formatDateFR } from "../utils/date";
import { normalizeHistory, getPerformanceMetrics, calculateCNSScore } from "../utils/metrics";
import { sanitizeData } from "../utils/security";
import { calculateSessionXP, calculateXPDecay, getProgressionDetails } from "../utils/progression";
import { scheduleRestNotification, cancelRestNotification } from "../utils/native";

const AppContext = createContext(null);

const STORAGE_KEY = "iron_track_v40_reset";
const CURRENT_APP_VERSION = 2;

export const AppProvider = ({ children }) => {
  const [history, setHistory] = useState({});
  const [bodyWeightHistory, setBodyWeightHistory] = useState([]);
  const [bodyMeasurements, setBodyMeasurements] = useState([]);
  const [userSessions, setUserSessions] = useState(sessions);
  const [dailyNutrition, setDailyNutrition] = useState({});
  const [userProgression, setUserProgression] = useState({ xp: 0, lastDate: formatDateFR() });
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
      } catch(e) {}
    }
    return Array.from({length:7}).map(() => ({ session: '-', label: '', status: null }));
  });

  // --- PERSISTENCE ---
  const persistData = useCallback(async (dataToSave) => {
    const safeData = sanitizeData({ ...dataToSave, version: CURRENT_APP_VERSION });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeData));

    if (!user) return;
    if (!navigator.onLine) return;

    try {
      const { error } = await supabase.from("app_state").upsert({ user_id: user.id, data: safeData });
      if (error) console.error("Erreur sauvegarde Supabase", error);
    } catch (err) {
      console.error("Erreur sauvegarde Supabase", err);
    }
  }, [user]);

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
      persistData({ history, bodyWeight: bodyWeightHistory, bodyMeasurements, userSessions, customSchedule: newSchedule, userProgression });
    }
  }, [user, history, bodyWeightHistory, bodyMeasurements, userSessions, persistData]);

  const updateDayStatus = useCallback((index, status) => {
    setCustomSchedule(prev => {
      const newSchedule = [...prev];
      if (newSchedule[index]) newSchedule[index] = { ...newSchedule[index], status };
      localStorage.setItem('iron_track_custom_schedule', JSON.stringify(newSchedule));
      if (user) persistData({ history, bodyWeight: bodyWeightHistory, bodyMeasurements, userSessions, customSchedule: newSchedule, userProgression });
      return newSchedule;
    });
  }, [user, history, bodyWeightHistory, bodyMeasurements, userSessions, persistData]);

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

  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      try {
        const defaultSchedule = Array.from({length:7}).map(() => ({ session: '-', label: '', status: null }));
        
        let currentData = {
          history: {},
          bodyWeight: [],
          bodyMeasurements: [],
          userSessions: sessions,
          dailyNutrition: {},
          customSchedule: defaultSchedule,
          userProgression: { xp: 0, lastDate: formatDateFR() },
          version: CURRENT_APP_VERSION
        };

        try {
          const localSaved = localStorage.getItem(STORAGE_KEY);
          if (localSaved) {
            const parsed = JSON.parse(localSaved);
            if (parsed && typeof parsed === 'object' && parsed.version === CURRENT_APP_VERSION) {
              currentData = { ...currentData, ...parsed };
            }
          }
        } catch (e) {}

        let oldData = null;
        try {
          const oldLocal = localStorage.getItem("muscu_ultimate_v39_final_fixed");
          if (oldLocal) {
            const parsedOld = JSON.parse(oldLocal);
            if (parsedOld && typeof parsedOld === 'object') oldData = parsedOld;
          }
        } catch (e) {}

        if (user) {
          try {
            const { data, error } = await supabase.from("app_state").select("data").eq("user_id", user.id).single();
            if (data?.data && typeof data.data === 'object') {
              if (data.data.version === CURRENT_APP_VERSION) {
                currentData = { ...currentData, ...data.data };
                oldData = null; // already migrated
              } else {
                oldData = { ...oldData, ...data.data }; // prioritize supabase old data
              }
            }
          } catch (err) {}
        }

        // --- MIGRATION DES ANCIENNES DONNÉES ---
        if (oldData) {
          // On restaure tout sauf la version qu'on force à 2
          currentData = { ...currentData, ...oldData, version: CURRENT_APP_VERSION };
        }

        // Force-synchronize default sessions A to L with codebase definitions
        if (currentData.userSessions && typeof currentData.userSessions === 'object') {
          Object.keys(sessions).forEach(key => {
            if (['A','B','C','D','E','F','G','H','I','J','K','L'].includes(key)) {
              currentData.userSessions[key] = sessions[key];
            } else if (!currentData.userSessions[key] || currentData.userSessions[key].exercises?.length === 0) {
              currentData.userSessions[key] = sessions[key];
            }
          });
        }

        // Dynamically scrub legacy V-suffixes from loaded user state
        const cleanName = (name) => {
          if (typeof name !== 'string') return name;
          return name.replace(/\s*\(V\d+\)/gi, "").trim();
        };

        if (currentData.userSessions && typeof currentData.userSessions === 'object') {
          Object.keys(currentData.userSessions).forEach(key => {
            const session = currentData.userSessions[key];
            if (session && Array.isArray(session.exercises)) {
              session.exercises = session.exercises.map(ex => {
                if (ex && ex.name) {
                  return { ...ex, name: cleanName(ex.name) };
                }
                return ex;
              });
            }
          });
        }

        // 3. Validation et Correction des données critiques
        const validatedHistory = {};
        if (currentData.history && typeof currentData.history === 'object') {
          Object.keys(currentData.history).forEach(key => {
            if (Array.isArray(currentData.history[key])) {
              validatedHistory[key] = currentData.history[key];
            }
          });
        }

        // 4. Appliquer le Weekly Reset
        const lastReset = localStorage.getItem('iron_last_weekly_reset');
        const now = new Date();
        const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        const currentWeekKey = `${d.getUTCFullYear()}-W${weekNo}`;

        if (lastReset !== currentWeekKey) {
          if (Array.isArray(currentData.customSchedule)) {
            currentData.customSchedule = currentData.customSchedule.map(day => ({ ...day, status: null }));
          }
          localStorage.setItem('iron_last_weekly_reset', currentWeekKey);
        }

        // 5. Mise à jour des états avec garanties de type
        setHistory(validatedHistory);
        setBodyWeightHistory(Array.isArray(currentData.bodyWeight) ? currentData.bodyWeight : []);
        setBodyMeasurements(Array.isArray(currentData.bodyMeasurements) ? currentData.bodyMeasurements : []);
        setUserSessions(currentData.userSessions && typeof currentData.userSessions === 'object' ? currentData.userSessions : sessions);
        setDailyNutrition(currentData.dailyNutrition && typeof currentData.dailyNutrition === 'object' ? currentData.dailyNutrition : {});
        setCustomSchedule(Array.isArray(currentData.customSchedule) ? currentData.customSchedule : defaultSchedule);

        // --- XP DECAY & PROGRESSION ---
        if (currentData.userProgression) {
          const decayedXP = calculateXPDecay(currentData.userProgression.xp, currentData.userProgression.lastDate);
          const updatedProgression = { ...currentData.userProgression, xp: decayedXP };
          setUserProgression(updatedProgression);
          currentData.userProgression = updatedProgression;
        } else {
          const initProg = { xp: 0, lastDate: formatDateFR() };
          setUserProgression(initProg);
          currentData.userProgression = initProg;
        }

        // 6. Sauvegarde de l'état "propre"
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
        if (Array.isArray(currentData.customSchedule)) {
          localStorage.setItem('iron_track_custom_schedule', JSON.stringify(currentData.customSchedule));
        }

      } catch (err) {
        console.error("CRASH CRITIQUE APP_CONTEXT:", err);
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
    const parsed = parseInt(seconds) || 0;
    if (parsed <= 0) return;
    const endTime = Date.now() + parsed * 1000;
    localStorage.setItem('iron_track_timer_end_time', endTime.toString());
    setTimerSeconds(parsed);
    setIsTimerRunning(true);
    scheduleRestNotification(parsed);
  }, []);

  const stopTimer = useCallback(() => {
    localStorage.removeItem('iron_track_timer_end_time');
    setTimerSeconds(0);
    setIsTimerRunning(false);
    cancelRestNotification();
  }, []);

  // Restore timer on mount/load
  useEffect(() => {
    const endTimeStr = localStorage.getItem('iron_track_timer_end_time');
    if (endTimeStr) {
      const endTime = parseInt(endTimeStr);
      if (!isNaN(endTime)) {
        const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
        if (remaining > 0) {
          setTimerSeconds(remaining);
          setIsTimerRunning(true);
        } else {
          localStorage.removeItem('iron_track_timer_end_time');
        }
      }
    }
  }, []);

  // Accurate interval checking with timestamp comparison
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        const endTimeStr = localStorage.getItem('iron_track_timer_end_time');
        if (endTimeStr) {
          const endTime = parseInt(endTimeStr);
          if (!isNaN(endTime)) {
            const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
            setTimerSeconds(remaining);
            if (remaining <= 0) {
              setIsTimerRunning(false);
              localStorage.removeItem('iron_track_timer_end_time');
            }
          } else {
            setIsTimerRunning(false);
          }
        } else {
          setIsTimerRunning(false);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

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

    // --- XP GAIN ---
    const gainedXP = calculateSessionXP(totalTonnage, energyLevel);
    setUserProgression(prev => {
      const newXP = prev.xp + gainedXP;
      const newProg = { xp: newXP, lastDate: date };
      persistData({ ...dataToSave, userProgression: newProg });
      return newProg;
    });

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
    userProgression,
    progression: getProgressionDetails(userProgression.xp)
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;

};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
