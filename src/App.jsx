import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";
import {
  Download,
  Save,
  BarChart2,
  Calendar,
  PlayCircle,
  LayoutList,
  ArrowUpCircle,
  RefreshCw,
  Trophy,
  AlertTriangle,
  Minus,
  Info,
  Activity,
  Layers,
  Flame,
  Star,
  Clock,
  Link,
  Scale,
  Timer,
  Dumbbell,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Circle,
  Award,
  Share2,
  ShieldCheck,
  BatteryCharging,
  Zap,
  Target,
  ArrowRightLeft,
  Percent,
  Brain,
  Moon,
  Frown,
} from "lucide-react";

// --- FONCTION POUR PARSER LES DATES ---
const parseDate = (dateStr) => {
  if (!dateStr) return new Date(0);
  const parts = dateStr.split("/");
  if (parts.length !== 3) return new Date(0);
  return new Date(parts[2], parts[1] - 1, parts[0]);
};

// --- NORMALISATION D'HISTORIQUE ---
const normalizeHistory = (histArray) => {
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

// --- CALCUL DES MÉTRIQUES ---
const getPerformanceMetrics = (setsData) => {
  if (!setsData || setsData.length === 0) return null;
  const validSets = setsData.filter(
    (s) =>
      parseFloat(s.weight) > 0 &&
      parseFloat(s.reps) > 0 &&
      s.done !== false &&
      !s.isExtra
  );
  if (validSets.length === 0) return null;

  const maxWeight = Math.max(...validSets.map((s) => parseFloat(s.weight)));
  const topSets = validSets.filter((s) => parseFloat(s.weight) === maxWeight);
  const totalRepsAtMax = topSets.reduce(
    (sum, s) => sum + parseFloat(s.reps),
    0
  );
  const avgRepsAtMax = totalRepsAtMax / topSets.length;
  const maxRPEAtMax = Math.max(...topSets.map((s) => parseInt(s.rpe) || 0));

  const allValid = setsData.filter(
    (s) =>
      parseFloat(s.weight) > 0 && parseFloat(s.reps) > 0 && s.done !== false
  );
  const totalVolume = allValid.reduce(
    (sum, s) => sum + parseFloat(s.weight) * parseFloat(s.reps),
    0
  );

  return {
    maxWeight,
    topSetsCount: topSets.length,
    avgRepsAtMax,
    maxRPE: maxRPEAtMax,
    totalVolume,
  };
};

const calculate1RM = (weight, reps) => {
  if (!weight || !reps || reps === 0) return 0;
  return Math.round(weight * (1 + reps / 30));
};

// --- COMPOSANT GRAPHIQUE ---
const SimpleLineChart = ({ data, metric = "weight", color = "#3b82f6" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-[#0d1b2a] rounded-2xl border border-dashed border-slate-800 text-slate-500 text-sm p-6 mx-1">
        <BarChart2 className="mb-3 opacity-30" size={40} />
        <p className="font-medium">Aucune donnée disponible</p>
        <p className="text-xs mt-1 opacity-70">
          Enregistre une séance pour voir ta courbe
        </p>
      </div>
    );
  }

  const height = 280;
  const paddingTop = 40;
  const paddingBottom = 60;
  const paddingX = 20;

  const values = data.map((d) => {
    if (metric === "bodyweight") return parseFloat(d.value || 0);
    const metrics = getPerformanceMetrics(d.setsData);
    if (!metrics) return 0;
    if (metric === "weight") return metrics.maxWeight;
    if (metric === "reps") return metrics.avgRepsAtMax;
    if (metric === "sets") return metrics.topSetsCount;
    return 0;
  });

  const minVal = Math.min(...values) * 0.95;
  const maxVal = Math.max(...values) * 1.05;
  const range = maxVal - minVal || 1;

  const getY = (val) =>
    height -
    paddingBottom -
    ((val - minVal) / range) * (height - paddingBottom - paddingTop);
  const getX = (index) => {
    if (data.length === 1) return 150;
    return paddingX + (index / (data.length - 1)) * (300 - paddingX * 2);
  };

  const points = data.map((d, i) => `${getX(i)},${getY(values[i])}`).join(" ");
  let legendLabel =
    metric === "weight"
      ? "Charge Max (kg)"
      : metric === "reps"
      ? "Reps au Max"
      : metric === "bodyweight"
      ? "Poids Corps (kg)"
      : "Séries au Max";

  return (
    <div className="w-full bg-[#0d1b2a] rounded-2xl p-1 border border-slate-800 shadow-xl relative overflow-hidden">
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Évolution
        </span>
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full border border-slate-700 shadow-sm">
          <div
            className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
            style={{ backgroundColor: color, color: color }}
          ></div>
          <span className="text-xs font-bold text-slate-300">
            {legendLabel}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-hidden pt-4">
        <svg
          viewBox="0 0 300 280"
          className="w-full h-64 overflow-visible min-w-[300px]"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((pos, i) => (
            <line
              key={i}
              x1="0"
              y1={paddingTop + (height - paddingBottom - paddingTop) * pos}
              x2="300"
              y2={paddingTop + (height - paddingBottom - paddingTop) * pos}
              stroke="#334155"
              strokeWidth="0.5"
              strokeDasharray="4"
              opacity="0.3"
            />
          ))}
          {data.length > 1 && (
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
              className="drop-shadow-lg"
            />
          )}
          {data.map((d, i) => {
            const xPos = getX(i);
            const yPos = getY(values[i]);
            return (
              <g key={i}>
                <circle cx={xPos} cy={yPos} r="6" fill={color} opacity="0.2" />
                <circle
                  cx={xPos}
                  cy={yPos}
                  r="3"
                  fill="#fff"
                  stroke={color}
                  strokeWidth="1.5"
                />
                <text
                  x={xPos}
                  y={yPos - 12}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="9"
                  fontWeight="bold"
                  className="drop-shadow-md"
                >
                  {Math.round(values[i] * 10) / 10}
                </text>
                <text
                  x={xPos}
                  y={height - 20}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="7"
                  transform={`rotate(-45, ${xPos}, ${height - 20})`}
                  className="font-mono font-medium tracking-tight"
                >
                  {d.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// --- APP PRINCIPALE ---
const App = () => {
  const [activeTab, setActiveTab] = useState("session");
  const [currentSession, setCurrentSession] = useState("A");
  const [history, setHistory] = useState({});
  const [bodyWeightHistory, setBodyWeightHistory] = useState([]);
  const [bodyMeasurements, setBodyMeasurements] = useState([]);
  const [currentInput, setCurrentInput] = useState({});
  const [selectedStatExo, setSelectedStatExo] = useState("");
  const [newBodyWeight, setNewBodyWeight] = useState("");
  const [newShoulders, setNewShoulders] = useState("");
  const [newWaist, setNewWaist] = useState("");

  const [sessionTonnage, setSessionTonnage] = useState(0);
  const [sessionRank, setSessionRank] = useState("medium");
  const [showSummary, setShowSummary] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [statMetric, setStatMetric] = useState("weight");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // --- ALGORITHME CNS (DATA-DRIVEN READINESS) ---
  const [sleepHours, setSleepHours] = useState(7);
  const [stressLevel, setStressLevel] = useState(5);
  const [sorenessLevel, setSorenessLevel] = useState(5);
  const [cnsScore, setCnsScore] = useState(null);
  const [energyLevel, setEnergyLevel] = useState(3);

  const [isDataLoading, setIsDataLoading] = useState(true);

  // --- CHARGEMENT ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('app_state')
          .select('data')
          .eq('id', 1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Erreur de chargement Supabase", error);
        }

        if (data && data.data) {
          const parsed = data.data;
          setHistory(parsed.history || {});
          setBodyWeightHistory(parsed.bodyWeight || []);
          setBodyMeasurements(parsed.bodyMeasurements || []);
        } else {
          // Fallback au localStorage
          const currentVersion = "muscu_ultimate_v39_final_fixed";
          const savedData = localStorage.getItem(currentVersion);
          if (savedData) {
            const parsed = JSON.parse(savedData);
            setHistory(parsed.history || {});
            setBodyWeightHistory(parsed.bodyWeight || []);
            setBodyMeasurements(parsed.bodyMeasurements || []);
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

  const currentBodyWeight = useMemo(() => {
    if (bodyWeightHistory.length > 0)
      return parseFloat(bodyWeightHistory[bodyWeightHistory.length - 1].value);
    return 75;
  }, [bodyWeightHistory]);

  // --- TIMER ---
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

  const startTimer = (seconds) => {
    setTimerSeconds(seconds);
    setIsTimerRunning(true);
  };
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // --- FONCTION CALCUL CNS ---
  const calculateCNS = () => {
    let sleepPts = 0;
    if (sleepHours >= 8) sleepPts = 40;
    else if (sleepHours >= 7) sleepPts = 35;
    else if (sleepHours >= 6) sleepPts = 25;
    else if (sleepHours >= 5) sleepPts = 10;
    else sleepPts = 0;

    const stressPts = (10 - stressLevel) * 3.33;
    const sorePts = (10 - sorenessLevel) * 3.33;
    const totalScore = Math.round(sleepPts + stressPts + sorePts);

    setCnsScore(totalScore);
    if (totalScore >= 85) setEnergyLevel(5);
    else if (totalScore >= 70) setEnergyLevel(4);
    else if (totalScore >= 45) setEnergyLevel(3);
    else if (totalScore >= 30) setEnergyLevel(2);
    else setEnergyLevel(1);
  };

  // EXERCICE CARDIO
  const cardioExercise = {
    id: "cardio_incline",
    muscle: "Cardio (Sèche)",
    name: "Marche Inclinée (Tapis)",
    note: "15 à 30 min. Inclinaison 10-15%, Vit: 4-6 km/h. Brûle le gras du ventre sans toucher au muscle.",
    tempo: "Continu",
    sets: 1,
    reps: "15-30",
    unit: "minutes",
    rest: 0,
  };

  // --- TOUTES LES SÉANCES ---
  const sessions = {
    A: {
      category: "Pecs",
      title: "Séance A : Pectoraux (Masse)",
      focus: "Haut de Pecs / Masse Globale",
      exercises: [
        { id: "a1", muscle: "Pecs (Haut)", name: "Dev. Incliné Haltères", note: "Banc 30°. Priorité au haut de pec.", tempo: "3-0-1-0", sets: 4, reps: "8-10", rest: 120 },
        { id: "a2", muscle: "Pecs (Masse)", name: "Développé Couché", note: "Barre ou Haltères. Lourd.", tempo: "2-0-1-0", sets: 4, reps: "6-8", rest: 180 },
        { id: "a3", muscle: "Pecs (Bas)", name: "Dips Lestés", note: "Penche le buste en avant.", tempo: "3-1-1-0", sets: 3, reps: "8-12", rest: 90 },
        { id: "a4", muscle: "Pecs (Iso)", name: "Écarté Poulie Vis-à-vis", note: "Focus contraction fin de mouvement.", tempo: "2-0-1-1", sets: 3, reps: "12-15", rest: 60 },
        { id: "a5", muscle: "Finition", name: "Pompes Pieds Surélevés", note: "Jusqu'à l'échec.", tempo: "2-0-1-0", sets: 2, reps: "Max", rest: 60 },
        cardioExercise,
      ],
    },
    B: {
      category: "Dos",
      title: "Séance B : Dos (Lourd)",
      focus: "Largeur / Épaisseur",
      exercises: [
        { id: "b1", muscle: "Dos (Largeur)", name: "Tractions (ou Tirage Vertical)", note: "Mains larges. Vise la largeur.", tempo: "3-0-1-0", sets: 4, reps: "8-12", rest: 120 },
        { id: "b2", muscle: "Dos (Épaisseur)", name: "Rowing Barre (Yates)", note: "Buste 45°. Supination. Lourd.", tempo: "2-0-1-1", sets: 4, reps: "8-10", rest: 120 },
        { id: "b3", muscle: "Dos (Bas)", name: "Tirage Horizontal Neutre", note: "Tire vers le bas ventre.", tempo: "2-0-1-1", sets: 3, reps: "10-12", rest: 90 },
        { id: "b4", muscle: "Dos (Isolation)", name: "Pull Over Poulie", note: "Bras tendus. Isole le grand dorsal.", tempo: "3-0-1-0", sets: 3, reps: "15", rest: 60 },
        { id: "b5", muscle: "Arr. Épaules", name: "Oiseau Buste Penché", note: "Cible l'arrière de l'épaule.", tempo: "2-0-1-1", sets: 3, reps: "15-20", rest: 60 },
        { id: "b6", muscle: "Lombaires", name: "Extensions Banc", note: "Renforce le bas du dos.", tempo: "2-0-2-0", sets: 3, reps: "15", rest: 60 },
        cardioExercise,
      ],
    },
    C: {
      category: "Jambes",
      title: "Séance C : Jambes",
      focus: "Cuisses / Mollets",
      exercises: [
        { id: "c1", muscle: "Cuisses", name: "Squat", note: "Dos droit.", tempo: "3-0-1-0", sets: 3, reps: "6-10", rest: 180 },
        { id: "c2", muscle: "Ischios", name: "SDT Roumain", note: "Jambes tendues.", tempo: "3-1-1-0", sets: 3, reps: "8-12", rest: 120 },
        { id: "c3", muscle: "Cuisses", name: "Fentes", note: "Unilatéral.", tempo: "2-0-1-0", sets: 3, reps: "10-12", rest: 90 },
        { id: "c4", muscle: "Cuisses", name: "Leg Extension", note: "Isolation.", tempo: "2-0-1-1", sets: 3, reps: "15-20", rest: 60 },
        { id: "c5", muscle: "Ischios", name: "Leg Curl", note: "Isolation.", tempo: "2-0-1-1", sets: 3, reps: "12-15", rest: 60 },
        { id: "c6", muscle: "Mollets", name: "Extensions Mollets", note: "Debout ou à la presse. Pause en bas.", tempo: "2-1-1-1", sets: 4, reps: "15-20", rest: 60 },
        cardioExercise,
      ],
    },
    D: {
      category: "Épaules 3D",
      title: "Séance D : Épaules (Science)",
      focus: "Faisceaux Latéral et Postérieur",
      exercises: [
        { id: "d1", muscle: "Épaules (Masse)", name: "Développé Haltères Assis", note: "Banc à 75°. Rentre légèrement les coudes.", tempo: "3-0-1-0", sets: 4, reps: "8-10", rest: 120 },
        { id: "d2", muscle: "Épaules (Latéral)", name: "Élévations Latérales Poulie", note: "Tension continue. Passe le câble derrière le dos.", tempo: "2-0-1-0", sets: 4, reps: "12-15", rest: 90 },
        { id: "d3", muscle: "Épaules (Latéral)", name: "Élévations Latérales Haltères", note: "Buste légèrement penché en avant (Plan scapulaire).", tempo: "2-0-1-0", sets: 3, reps: "15-20", rest: 60 },
        { id: "d4", muscle: "Arr. Épaules", name: "Oiseau Poulie Vis-à-vis", note: "Croise les câbles. Isole l'arrière d'épaule.", tempo: "2-0-1-1", sets: 4, reps: "12-15", rest: 90 },
        { id: "d5", muscle: "Arr. Épaules", name: "Face Pull", note: "Tire vers les yeux. Rotation externe en fin de mouvement.", tempo: "2-0-1-1", sets: 3, reps: "15", rest: 60 },
        { id: "d6", muscle: "Trapèzes", name: "Shrugs Haltères", note: "Haussement avec pause de 1s en haut.", tempo: "1-0-1-1", sets: 3, reps: "10-12", rest: 60 },
        cardioExercise,
      ],
    },
    E: {
      category: "Bras",
      title: "Séance E : Bras (Volume Max)",
      focus: "Long Biceps / Court Biceps / Brachial / Triceps / Avant-Bras",
      exercises: [
        { id: "e1", muscle: "Biceps (Long)", name: "Curl Incliné Haltères", note: "Banc 45°. Étire bien en bas.", tempo: "3-0-1-0", sets: 4, reps: "10-12", rest: 90 },
        { id: "e2", muscle: "Biceps (Court)", name: "Curl Pupitre (Scott)", note: "Bras en avant. Pic de contraction.", tempo: "2-0-1-1", sets: 3, reps: "12-15", rest: 60 },
        { id: "e3", muscle: "Brachial", name: "Curl Marteau", note: "Prise neutre. Donne de l'épaisseur.", tempo: "2-0-1-0", sets: 4, reps: "10-12", rest: 90 },
        { id: "e4", muscle: "Triceps (Masse)", name: "Barre au Front", note: "Descends derrière la tête.", tempo: "3-0-1-0", sets: 4, reps: "10-12", rest: 90 },
        { id: "e5", muscle: "Triceps (Long)", name: "Extension Nuque", note: "Haltère ou Câble. Étirement max.", tempo: "3-0-1-0", sets: 3, reps: "12-15", rest: 60 },
        { id: "e6", muscle: "Triceps (Vaste)", name: "Pushdown Corde", note: "Ouvre la corde en bas.", tempo: "2-0-1-1", sets: 3, reps: "15-20", rest: 60 },
        { id: "e7", muscle: "Avant-Bras", name: "Curl Inversé", note: "Barre EZ ou Poulie. Prise en pronation.", tempo: "2-0-1-0", sets: 3, reps: "15", rest: 60 },
        cardioExercise,
      ],
    },
    F: {
      category: "Upper",
      title: "Séance F : Haut du Corps",
      focus: "Pecs / Dos / Épaules / Bras",
      exercises: [
        { id: "f1", muscle: "Pecs", name: "Dev. Couché", sets: 3, reps: "8-10", rest: 120 },
        { id: "f2", muscle: "Dos", name: "Rowing Barre", sets: 3, reps: "8-10", rest: 120 },
        { id: "f3", muscle: "Épaules", name: "Dev. Militaire", sets: 3, reps: "10-12", rest: 90 },
        { id: "f4", muscle: "Dos", name: "Tirage Vertical", sets: 3, reps: "10-12", rest: 90 },
        { id: "f5", muscle: "Pecs", name: "Écarté", sets: 2, reps: "15", superset: "s1", rest: 0 },
        { id: "f6", muscle: "Bras", name: "Superset Curl/Ext", sets: 3, reps: "12", superset: "s1", rest: 90 },
        cardioExercise,
      ],
    },
    G: {
      category: "Lower",
      title: "Séance G : Bas du Corps",
      focus: "Cuisses / Ischios / Abdos",
      exercises: [
        { id: "g1", muscle: "Jambes", name: "Squat", sets: 3, reps: "6-10", rest: 180 },
        { id: "g2", muscle: "Ischios", name: "SDT Roumain", sets: 3, reps: "8-12", rest: 120 },
        { id: "g3", muscle: "Jambes", name: "Presse à Cuisses", sets: 3, reps: "10-12", rest: 120 },
        { id: "g4", muscle: "Ischios", name: "Leg Curl", sets: 3, reps: "12-15", rest: 90 },
        { id: "g5", muscle: "Mollets", name: "Extensions", sets: 4, reps: "15-20", rest: 60 },
        { id: "g6", muscle: "Abdos", name: "Planche", sets: 3, reps: "1min", unit: "seconds", rest: 60 },
        cardioExercise,
      ],
    },
    H: {
      category: "Abdos Lourd",
      title: "Séance H : Épaisseur (Lourd)",
      focus: "Faire ressortir les tablettes",
      exercises: [
        { id: "h1", muscle: "Abdos", name: "Crunch Poulie Haute", note: "Lourd. Enroule le dos.", tempo: "2-0-1-1", sets: 4, reps: "10-12", rest: 90 },
        { id: "h2", muscle: "Abdos (Bas)", name: "Relevé Jambes Suspendu", note: "Lesté si possible.", tempo: "2-0-1-0", sets: 4, reps: "10-15", rest: 90 },
        { id: "h3", muscle: "Abdos", name: "Crunch Décliné Lesté", note: "Disque sur le torse.", tempo: "2-0-1-0", sets: 3, reps: "12-15", rest: 60 },
        cardioExercise,
      ],
    },
    I: {
      category: "Abdos Obliques",
      title: "Séance I : Obliques & Taille",
      focus: "Le V du bas ventre",
      exercises: [
        { id: "i1", muscle: "Obliques", name: "Woodchopper Poulie", note: "Rotation buste.", tempo: "2-0-1-0", sets: 3, reps: "12-15", rest: 60 },
        { id: "i2", muscle: "Taille", name: "Flexion Latérale", note: "Haltère/Poulie.", tempo: "2-0-1-0", sets: 3, reps: "15", rest: 60 },
        { id: "i3", muscle: "Transverse", name: "Pallof Press", note: "Anti-rotation.", tempo: "ISO", sets: 3, reps: "45s", unit: "seconds", rest: 45 },
        { id: "i4", muscle: "Transverse", name: "Stomach Vacuum", note: "Aspire nombril.", tempo: "ISO", sets: 4, reps: "30s", unit: "seconds", rest: 45 },
        cardioExercise,
      ],
    },
    J: {
      category: "Abdos Destruct",
      title: "Séance J : Destruction Totale",
      focus: "Gainage Extrême",
      exercises: [
        { id: "j1", muscle: "Abdos", name: "Ab Wheel (Roulette)", note: "Gainage max.", tempo: "3-0-1-0", sets: 3, reps: "8-12", rest: 90 },
        { id: "j2", muscle: "Abdos (Bas)", name: "Toes to Bar", note: "Touche la barre avec les pieds.", tempo: "2-0-1-0", sets: 3, reps: "Max", rest: 90 },
        { id: "j3", muscle: "Obliques", name: "Russian Twist Lesté", note: "Lourd.", tempo: "1-0-1-0", sets: 3, reps: "20", rest: 60 },
        { id: "j4", muscle: "Gainage", name: "Planche Lestée", note: "Disque sur le dos.", tempo: "ISO", sets: 3, reps: "1min", unit: "seconds", rest: 60 },
        cardioExercise,
      ],
    },
  };

  const allExercises = useMemo(() => {
    let list = [];
    Object.values(sessions).forEach((s) => list.push(...s.exercises));
    return list.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
  }, []);

  const getBest1RM = (exoId) => {
    const hist = normalizeHistory(history[exoId] || []);
    let best1RM = 0;
    hist.forEach((h) => {
      if (h.setsData) {
        h.setsData.forEach((s) => {
          const w = parseFloat(s.weight);
          const r = parseFloat(s.reps);
          if (w > 0 && r > 0 && s.done && !s.isExtra) {
            const current1RM = calculate1RM(w, r);
            if (current1RM > best1RM) best1RM = current1RM;
          }
        });
      }
    });
    return best1RM;
  };

  // --- OBTENTION RANG DE FORCE RELATIVE (PRO) ---
  const getStrengthStandard = (exerciseType, rm, bw) => {
    if (rm === 0 || bw === 0) return { rank: "-", color: "text-slate-500" };
    const ratio = rm / bw;
    if (exerciseType === "bench") {
      if (ratio < 1.0) return { rank: "Novice", color: "text-slate-400" };
      if (ratio < 1.3) return { rank: "Intermédiaire", color: "text-blue-400" };
      if (ratio < 1.6) return { rank: "Avancé", color: "text-purple-400" };
      return { rank: "Dieu Grec", color: "text-yellow-400" };
    }
    if (exerciseType === "squat") {
      if (ratio < 1.2) return { rank: "Novice", color: "text-slate-400" };
      if (ratio < 1.5) return { rank: "Intermédiaire", color: "text-blue-400" };
      if (ratio < 2.0) return { rank: "Avancé", color: "text-purple-400" };
      return { rank: "Dieu Grec", color: "text-yellow-400" };
    }
    if (exerciseType === "pullup") {
      const ratioPull = (bw + rm) / bw;
      if (ratioPull < 1.1) return { rank: "Novice", color: "text-slate-400" };
      if (ratioPull < 1.3)
        return { rank: "Intermédiaire", color: "text-blue-400" };
      if (ratioPull < 1.5) return { rank: "Avancé", color: "text-purple-400" };
      return { rank: "Dieu Grec", color: "text-yellow-400" };
    }
    return { rank: "-", color: "text-slate-500" };
  };

  const weeklyVolume = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const volume = { Pecs: 0, Dos: 0, Jambes: 0, Épaules: 0, Bras: 0 };
    const groups = {
      "Pecs (Haut)": "Pecs",
      "Pecs (Masse)": "Pecs",
      "Pecs (Bas)": "Pecs",
      "Pecs (Iso)": "Pecs",
      Pecs: "Pecs",
      "Dos (Largeur)": "Dos",
      "Dos (Épaisseur)": "Dos",
      "Dos (Bas)": "Dos",
      "Dos (Isolation)": "Dos",
      Dos: "Dos",
      Cuisses: "Jambes",
      Ischios: "Jambes",
      Mollets: "Jambes",
      Jambes: "Jambes",
      "Épaules (Masse)": "Épaules",
      "Épaules (Latéral)": "Épaules",
      "Arr. Épaules": "Épaules",
      Épaules: "Épaules",
      "Biceps (Long)": "Bras",
      "Biceps (Court)": "Bras",
      Brachial: "Bras",
      "Triceps (Masse)": "Bras",
      "Triceps (Long)": "Bras",
      "Triceps (Vaste)": "Bras",
      "Avant-Bras": "Bras",
      Bras: "Bras",
    };

    Object.keys(history).forEach((exoId) => {
      const exoDef = allExercises.find((e) => e.id === exoId);
      if (!exoDef) return;
      const mainGroup = groups[exoDef.muscle];
      if (!mainGroup) return;

      history[exoId].forEach((entry) => {
        const entryDate = parseDate(entry.date);
        if (entryDate >= sevenDaysAgo && entryDate <= now) {
          const validSets = (entry.setsData || []).filter(
            (s) => s.done && parseFloat(s.weight) > 0 && !s.isExtra
          ).length;
          volume[mainGroup] += validSets;
        }
      });
    });
    return volume;
  }, [history, allExercises]);

  // --- NOUVEAU: SURCHARGE PROGRESSIVE AVEC RATIO A:C (ACUTE TO CHRONIC) ---
  const tonnageProgress = useMemo(() => {
    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d28 = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    let acuteWorkload = 0; // Cette semaine
    let chronicWorkloadSum = 0; // 3 semaines précédentes

    Object.keys(history).forEach((exoId) => {
      history[exoId].forEach((entry) => {
        const entryDate = parseDate(entry.date);
        let entryTonnage = 0;
        (entry.setsData || []).forEach((s) => {
          if (s.done && parseFloat(s.weight) > 0) {
            entryTonnage += parseFloat(s.weight) * parseFloat(s.reps);
          }
        });

        if (entryDate >= d7 && entryDate <= now) acuteWorkload += entryTonnage;
        else if (entryDate >= d28 && entryDate < d7)
          chronicWorkloadSum += entryTonnage;
      });
    });

    const chronicWorkload = chronicWorkloadSum / 3; // Moyenne par semaine
    let acRatio = 0;
    let percentChange = 0;

    if (chronicWorkload > 0) {
      acRatio = acuteWorkload / chronicWorkload;
      percentChange =
        ((acuteWorkload - chronicWorkload) / chronicWorkload) * 100;
    }

    return { acuteWorkload, chronicWorkload, percentChange, acRatio };
  }, [history]);

  const aestheticScore = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let latDelts = 0,
      upperChest = 0,
      lats = 0;

    Object.keys(history).forEach((exoId) => {
      const exoDef = allExercises.find((e) => e.id === exoId);
      if (!exoDef) return;

      history[exoId].forEach((entry) => {
        const entryDate = parseDate(entry.date);
        if (entryDate >= sevenDaysAgo && entryDate <= now) {
          const validSets = (entry.setsData || []).filter(
            (s) => s.done && parseFloat(s.weight) > 0 && !s.isExtra
          ).length;
          if (exoDef.muscle === "Épaules (Latéral)") latDelts += validSets;
          if (exoDef.muscle === "Pecs (Haut)") upperChest += validSets;
          if (exoDef.muscle === "Dos (Largeur)") lats += validSets;
        }
      });
    });

    const scoreLatDelts = Math.min(100, (latDelts / 10) * 100);
    const scoreUpperChest = Math.min(100, (upperChest / 10) * 100);
    const scoreLats = Math.min(100, (lats / 10) * 100);
    const globalScore = Math.round(
      (scoreLatDelts + scoreUpperChest + scoreLats) / 3
    );

    return { latDelts, upperChest, lats, globalScore };
  }, [history, allExercises]);

  const muscleRecoveryState = useMemo(() => {
    const lastWorkoutDates = {};
    const now = new Date();
    const groups = {
      Pecs: [
        "Pecs (Haut)",
        "Pecs (Masse)",
        "Pecs (Bas)",
        "Pecs (Iso)",
        "Finition",
      ],
      Dos: ["Dos (Largeur)", "Dos (Épaisseur)", "Dos (Bas)", "Dos (Isolation)"],
      Jambes: ["Cuisses", "Ischios", "Mollets"],
      Épaules: ["Épaules (Masse)", "Épaules (Latéral)", "Arr. Épaules"],
      Bras: [
        "Biceps (Long)",
        "Biceps (Court)",
        "Brachial",
        "Triceps (Masse)",
        "Triceps (Long)",
        "Triceps (Vaste)",
      ],
      Abdos: ["Abdos", "Abdos Lourd", "Abdos (Bas)", "Obliques", "Transverse", "Gainage"],
    };

    Object.keys(history).forEach((exoId) => {
      const hist = history[exoId];
      if (!hist || hist.length === 0) return;
      const lastDate = parseDate(hist[hist.length - 1].date);
      const exoDef = allExercises.find((e) => e.id === exoId);
      if (!exoDef) return;

      Object.entries(groups).forEach(([mainGroup, subGroups]) => {
        if (subGroups.includes(exoDef.muscle)) {
          if (
            !lastWorkoutDates[mainGroup] ||
            lastDate > lastWorkoutDates[mainGroup]
          ) {
            lastWorkoutDates[mainGroup] = lastDate;
          }
        }
      });
    });

    const status = {};
    Object.keys(groups).forEach((group) => {
      const lastDate = lastWorkoutDates[group];
      if (!lastDate) {
        status[group] = {
          state: "Frais",
          color: "text-green-400",
          bg: "bg-green-500/20",
        };
        return;
      }
      const diffDays = Math.ceil(
        Math.abs(now - lastDate) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 1)
        status[group] = {
          state: "Épuisé",
          color: "text-red-400",
          bg: "bg-red-500/20",
        };
      else if (diffDays <= 2)
        status[group] = {
          state: "En récup",
          color: "text-yellow-400",
          bg: "bg-yellow-500/20",
        };
      else
        status[group] = {
          state: "Frais",
          color: "text-green-400",
          bg: "bg-green-500/20",
        };
    });
    return status;
  }, [history, allExercises]);

  const sessionHistory = useMemo(() => {
    const datesMap = {};
    Object.keys(history).forEach((exoId) => {
      const entries = history[exoId] || [];
      entries.forEach((entry) => {
        if (!entry.date) return;
        if (!datesMap[entry.date])
          datesMap[entry.date] = { date: entry.date, tonnage: 0, exos: 0 };

        let entryTonnage = 0;
        if (entry.setsData) {
          entry.setsData.forEach((s) => {
            if (
              parseFloat(s.weight) > 0 &&
              parseFloat(s.reps) > 0 &&
              s.done !== false
            ) {
              entryTonnage += parseFloat(s.weight) * parseFloat(s.reps);
            }
          });
        }
        datesMap[entry.date].tonnage += entryTonnage;
        if (entryTonnage > 0) datesMap[entry.date].exos += 1;
      });
    });

    const arr = Object.values(datesMap).filter((d) => d.tonnage > 0);
    arr.sort((a, b) => parseDate(b.date) - parseDate(a.date));

    const tonnages = arr.map((a) => a.tonnage).sort((a, b) => a - b);
    const p75 = tonnages[Math.floor(tonnages.length * 0.75)] || 0;
    const p25 = tonnages[Math.floor(tonnages.length * 0.25)] || 0;

    return arr.map((d) => {
      let rank = "medium";
      if (d.tonnage >= p75 && d.tonnage > 0) rank = "super";
      else if (d.tonnage <= p25) rank = "bad";
      return { ...d, rank };
    });
  }, [history]);

  // --- GESTION INPUTS MULTI-SÉRIES & DROP SETS & MYO-REPS ---
  const getSetsForExo = (exoId) => {
    if (currentInput[exoId]) return currentInput[exoId];
    const exoDef = allExercises.find((e) => e.id === exoId);
    const defaultSetCount = exoDef ? parseInt(exoDef.sets) || 3 : 3;

    const hist = normalizeHistory(history[exoId] || []);
    if (hist.length > 0) {
      const prev = hist[hist.length - 1];
      if (prev && prev.setsData && prev.setsData.length > 0) {
        return Array.from({ length: defaultSetCount }).map((_, i) => {
          const prevSet = prev.setsData[i];
          return {
            weight: prevSet?.weight || "",
            reps: "",
            rpe: "",
            done: false,
            tag: null,
            isExtra: false,
          };
        });
      }
    }
    return Array.from({ length: defaultSetCount }).map(() => ({
      weight: "",
      reps: "",
      rpe: "",
      done: false,
      tag: null,
      isExtra: false,
    }));
  };

  const handleSetChange = (exoId, index, field, value) => {
    setCurrentInput((prev) => {
      const exoSets = prev[exoId] ? [...prev[exoId]] : getSetsForExo(exoId);
      exoSets[index] = { ...exoSets[index], [field]: value };
      return { ...prev, [exoId]: exoSets };
    });
  };

  const toggleSetDone = (exoId, index, restTime) => {
    setCurrentInput((prev) => {
      const exoSets = prev[exoId] ? [...prev[exoId]] : getSetsForExo(exoId);
      const isCurrentlyDone = exoSets[index].done;
      exoSets[index] = { ...exoSets[index], done: !isCurrentlyDone };

      if (!isCurrentlyDone && restTime > 0) {
        let calcRest = parseInt(restTime) || 60;
        const setRPE = parseInt(exoSets[index].rpe);
        if (!isNaN(setRPE) && setRPE >= 9) calcRest += 30;

        // SI TAG MYO-REPS (Rest-pause), forcer le repos à 15 secondes
        if (exoSets[index].tag === "⚡") {
          calcRest = 15;
        }

        startTimer(calcRest);
      }
      return { ...prev, [exoId]: exoSets };
    });
  };

  // LOGIQUE EXPERTE D'INTENSIFICATION (Normal -> Échec -> Drop Set -> Rest-Pause)
  const cycleSetTag = (exoId, index) => {
    setCurrentInput((prev) => {
      const exoSets = prev[exoId] ? [...prev[exoId]] : getSetsForExo(exoId);
      const currentTag = exoSets[index].tag;
      const isExtra = exoSets[index].isExtra;

      if (
        !currentTag ||
        currentTag === "drop_child" ||
        currentTag === "pause_child"
      ) {
        // 1 Clic : Échec
        exoSets[index] = { ...exoSets[index], tag: "🔥" };
      } else if (currentTag === "🔥") {
        // 2 Clics : Drop Set
        exoSets[index] = { ...exoSets[index], tag: "💧" };
        exoSets.splice(index + 1, 0, {
          weight: "",
          reps: "",
          rpe: "",
          done: false,
          tag: "drop_child",
          isExtra: true,
        });
      } else if (currentTag === "💧") {
        // 3 Clics : Rest-Pause (Myo-Reps)
        exoSets[index] = { ...exoSets[index], tag: "⚡" };
        if (exoSets[index + 1] && exoSets[index + 1].isExtra) {
          exoSets[index + 1].tag = "pause_child";
        }
      } else if (currentTag === "⚡") {
        // 4 Clics : Retour normal
        exoSets[index] = {
          ...exoSets[index],
          tag: isExtra ? "drop_child" : null,
        };
        if (exoSets[index + 1] && exoSets[index + 1].isExtra) {
          exoSets.splice(index + 1, 1);
        }
      }
      return { ...prev, [exoId]: exoSets };
    });
  };

  // --- COACH INTELLIGENT ---
  const getCoachAdvice = (exo, exoHistory, currentSets) => {
    const isTimeBased = exo.unit === "seconds" || exo.unit === "minutes";
    const metricName =
      exo.unit === "minutes"
        ? "minutes"
        : exo.unit === "seconds"
        ? "secondes"
        : "reps";
    const targetSets = parseInt(exo.sets);

    let maxReps = parseInt(exo.reps);
    if (exo.reps.includes("-")) {
      maxReps = parseInt(exo.reps.split("-")[1]);
    } else if (isNaN(maxReps)) {
      maxReps = parseInt(exo.reps.replace(/\D/g, "")) || 0;
    }

    const isCardio = exo.muscle.includes("Cardio");

    // 1. DÉTECTEUR DE JUNK VOLUME
    if (!isCardio) {
      let setsDoneTodayForMuscle = 0;
      Object.keys(currentInput).forEach((id) => {
        const otherExoDef = allExercises.find((e) => e.id === id);
        if (otherExoDef && otherExoDef.muscle === exo.muscle) {
          setsDoneTodayForMuscle += currentInput[id].filter(
            (s) => s.done && !s.isExtra
          ).length;
        }
      });

      if (setsDoneTodayForMuscle >= 8) {
        return {
          type: "elite",
          text: `🛑 JUNK VOLUME : Tu as déjà fait ${setsDoneTodayForMuscle} séries intenses de ${exo.muscle} aujourd'hui. T'acharner va juste détruire ta récupération. L'entraînement est terminé pour ce muscle !`,
          color: "red",
          icon: <AlertTriangle size={16} />,
        };
      }
    }

    const hasDropSet = currentSets && currentSets.some((s) => s.tag === "💧");
    const hasRestPause = currentSets && currentSets.some((s) => s.tag === "⚡");
    const hasFailure = currentSets && currentSets.some((s) => s.tag === "🔥");

    if (hasDropSet)
      return {
        type: "elite",
        text: `👑 MODE ÉLITE : DROP SET 💧 activé ! J'ai ajouté une série. Baisse la charge d'environ 30% et enchaîne directement !`,
        color: "purple",
        icon: <Zap size={16} />,
      };
    if (hasRestPause)
      return {
        type: "elite",
        text: `⚡ REST-PAUSE (Myo-Reps) activé ! Repose-toi EXACTEMENT 15s, garde le même poids, et fais quelques reps supplémentaires à l'échec !`,
        color: "yellow",
        icon: <Zap size={16} />,
      };
    if (hasFailure)
      return {
        type: "elite",
        text: `🔥 ÉCHEC TOTAL : Dernière série à la rupture ! C'est exactement comme ça qu'on force le muscle à grossir.`,
        color: "red",
        icon: <Flame size={16} />,
      };

    if (!exoHistory || exoHistory.length === 0)
      return {
        type: "new",
        text: isCardio
          ? `🎯 OBJECTIF SÈCHE : Tiens au moins ${maxReps} minutes.`
          : `🎯 CIBLE DU JOUR : Trouve une charge lourde pour tes ${targetSets} séries de travail.`,
        color: "blue",
        icon: <Target size={16} />,
      };

    const hist = normalizeHistory(exoHistory);
    const prev = hist[hist.length - 1];
    const prevMetrics = getPerformanceMetrics(prev.setsData);

    if (!prevMetrics)
      return {
        type: "new",
        text: "Enregistre tes séries pour obtenir un conseil.",
        color: "blue",
        icon: <Info size={16} />,
      };

    if (isCardio) {
      return {
        type: "sets",
        text: `🎯 SÈCHE : Ta dernière séance a duré ${prevMetrics.avgRepsAtMax} minutes. Essaie de faire autant ou plus aujourd'hui !`,
        color: "green",
        icon: <Flame size={16} />,
      };
    }

    if (hist.length >= 3) {
      const m1 = prevMetrics;
      const m2 = getPerformanceMetrics(hist[hist.length - 2]?.setsData);
      const m3 = getPerformanceMetrics(hist[hist.length - 3]?.setsData);
      if (
        m1 &&
        m2 &&
        m3 &&
        m1.maxWeight === m2.maxWeight &&
        m2.maxWeight === m3.maxWeight &&
        m1.avgRepsAtMax === m2.avgRepsAtMax &&
        m2.avgRepsAtMax === m3.avgRepsAtMax &&
        m1.avgRepsAtMax < maxReps
      ) {
        const deloadWeight = Math.max(0, Math.round(m1.maxWeight * 0.9));
        return {
          type: "deload",
          text: `📉 STAGNATION DÉTECTÉE : Baisse à ~${deloadWeight}kg aujourd'hui pour débloquer ton système nerveux. Pas d'échec.`,
          color: "purple",
          icon: <TrendingDown size={16} />,
        };
      }
    }

    if (prevMetrics.topSetsCount < targetSets)
      return {
        type: "sets",
        text: `🎯 CIBLE DU JOUR : Consolidation ! Garde ${prevMetrics.maxWeight}kg et termine tes ${targetSets} séries de travail complètes.`,
        color: "orange",
        icon: <Target size={16} />,
      };

    let baseText = "";
    let baseColor = "yellow";
    let baseType = "reps";
    let icon = <Target size={16} />;

    let modifierStr = "";
    let effectiveTargetWeight = prevMetrics.maxWeight;

    if (energyLevel === 5) {
      effectiveTargetWeight = Math.round(prevMetrics.maxWeight * 1.05);
      modifierStr = " (Mode Berserker ⚡)";
    } else if (energyLevel <= 2) {
      effectiveTargetWeight = Math.round(prevMetrics.maxWeight * 0.9);
      modifierStr = " (Mode Récupération 🛡️)";
    }

    if (prevMetrics.avgRepsAtMax >= maxReps) {
      if (prevMetrics.maxRPE === 10 && energyLevel > 2) {
        baseText = `🎯 CIBLE DU JOUR : Perfectionnement. Garde ${prevMetrics.maxWeight}kg, ta forme était limite (RPE 10). Rends ça propre.`;
        baseColor = "red";
        baseType = "rpe";
      } else {
        const nextWeight = isTimeBased
          ? effectiveTargetWeight + 2
          : effectiveTargetWeight + (energyLevel === 5 ? 0 : 2);
        baseText = isTimeBased
          ? `🎯 CIBLE DU JOUR : Surcharge ! Essaie de tenir avec ${nextWeight}kg ou ajoute 10s !`
          : `🎯 CIBLE DU JOUR : Surcharge${modifierStr} ! Vise ~${nextWeight}kg.`;
        baseColor = "green";
        baseType = "weight";
      }
    } else {
      baseText = `🎯 CIBLE DU JOUR : Gagne des reps${modifierStr} ! Vise ${effectiveTargetWeight}kg pour faire mieux qu'à la dernière séance.`;
    }

    return { type: baseType, text: baseText, color: baseColor, icon: icon };
  };

  const getComparisonStatus = (exoId) => {
    const currentSets = currentInput[exoId];
    if (
      !currentSets ||
      !currentSets.some((s) => parseFloat(s.weight) > 0 && s.done)
    )
      return null;

    const currentMetrics = getPerformanceMetrics(
      currentSets.filter((s) => s.done)
    );
    const hist = normalizeHistory(history[exoId] || []);
    const prev = hist[hist.length - 1];
    const prevMetrics = getPerformanceMetrics(prev?.setsData);

    if (!currentMetrics) return null;
    if (!prevMetrics) return "new";

    if (currentMetrics.maxWeight > prevMetrics.maxWeight) return "better";
    if (currentMetrics.maxWeight === prevMetrics.maxWeight) {
      if (currentMetrics.topSetsCount > prevMetrics.topSetsCount)
        return "better";
      if (
        currentMetrics.topSetsCount === prevMetrics.topSetsCount &&
        currentMetrics.avgRepsAtMax > prevMetrics.avgRepsAtMax
      )
        return "better";
      if (
        currentMetrics.topSetsCount < prevMetrics.topSetsCount ||
        currentMetrics.avgRepsAtMax < prevMetrics.avgRepsAtMax
      )
        return "worse";
    }
    if (currentMetrics.maxWeight < prevMetrics.maxWeight) return "worse";
    return "neutral";
  };

  const schedule = [
    {
      title: "Esthétique Dieu Grec (6J)",
      desc: "Focus V-Taper (Épaules, Dos, Haut Pecs)",
      days: [
        { name: "Lun", session: "D", label: "Épaules 3D" },
        { name: "Mar", session: "B", label: "Dos Largeur" },
        { name: "Mer", session: "A", label: "Pecs (Haut)" },
        { name: "Jeu", session: "I", label: "Abdos (Taille)" },
        { name: "Ven", session: "E", label: "Bras" },
        { name: "Sam", session: "C", label: "Jambes" },
        { name: "Dim", session: "-", label: "Repos" },
      ],
    },
    {
      title: "Split Complet (5J)",
      desc: "Classique : 1 muscle par jour",
      days: [
        { name: "Lun", session: "A", label: "Pecs" },
        { name: "Mar", session: "B", label: "Dos" },
        { name: "Mer", session: "C", label: "Jambes" },
        { name: "Jeu", session: "D", label: "Épaules" },
        { name: "Ven", session: "E", label: "Bras" },
        { name: "Sam", session: "-", label: "Repos" },
        { name: "Dim", session: "-", label: "Repos" },
      ],
    },
    {
      title: "Upper / Lower (4J)",
      desc: "Fréquence x2 pour Haut et Bas",
      days: [
        { name: "Lun", session: "F", label: "Haut" },
        { name: "Mar", session: "G", label: "Bas" },
        { name: "Mer", session: "-", label: "Repos" },
        { name: "Jeu", session: "F", label: "Haut" },
        { name: "Ven", session: "G", label: "Bas" },
        { name: "Sam", session: "-", label: "Repos" },
        { name: "Dim", session: "-", label: "Repos" },
      ],
    },
    {
      title: "Spécial Sangle Abdominale (3J)",
      desc: "Abdos 3D & Gainage",
      days: [
        { name: "Lun", session: "H", label: "Épaisseur" },
        { name: "Mar", session: "-", label: "Repos" },
        { name: "Mer", session: "I", label: "Obliques" },
        { name: "Jeu", session: "-", label: "Repos" },
        { name: "Ven", session: "J", label: "Destruction" },
        { name: "Sam", session: "-", label: "Repos" },
        { name: "Dim", session: "-", label: "Repos" },
      ],
    },
    {
      title: "Push / Pull / Legs (6J)",
      desc: "Volume Extrême Athlétique",
      days: [
        { name: "Lun", session: "A", label: "Push (Pecs)" },
        { name: "Mar", session: "B", label: "Pull (Dos)" },
        { name: "Mer", session: "C", label: "Legs" },
        { name: "Jeu", session: "D", label: "Push (Épaules)" },
        { name: "Ven", session: "E", label: "Pull (Bras)" },
        { name: "Sam", session: "C", label: "Legs" },
        { name: "Dim", session: "-", label: "Repos" },
      ],
    },
    {
      title: "Hybride Mixte (4J)",
      desc: "Force & Esthétique combinées",
      days: [
        { name: "Lun", session: "F", label: "Haut Lourd" },
        { name: "Mar", session: "G", label: "Bas Lourd" },
        { name: "Mer", session: "-", label: "Repos" },
        { name: "Jeu", session: "D", label: "Épaules 3D" },
        { name: "Ven", session: "E", label: "Bras Volume" },
        { name: "Sam", session: "H", label: "Abdos" },
        { name: "Dim", session: "-", label: "Repos" },
      ],
    },
  ];

  const handlePreSave = () => {
    let hasData = false;
    Object.keys(currentInput).forEach((exoId) => {
      const input = currentInput[exoId];
      if (Array.isArray(input)) {
        if (input.some((s) => parseFloat(s.weight) > 0 && s.done)) {
          hasData = true;
        }
      }
    });

    if (!hasData) {
      setShowErrorModal(true);
      return;
    }
    setShowConfirmModal(true);
  };

  const saveWorkout = () => {
    const newHistory = { ...history };
    const date = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    let totalTonnage = 0;

    Object.keys(currentInput).forEach((exoId) => {
      const setsArray = currentInput[exoId];
      if (Array.isArray(setsArray)) {
        const validSets = setsArray.filter(
          (s) => parseFloat(s.weight) > 0 && parseFloat(s.reps) > 0 && s.done
        );
        if (validSets.length > 0) {
          newHistory[exoId] = [
            ...normalizeHistory(newHistory[exoId] || []),
            { date, setsData: validSets },
          ];
          const exoDef = allExercises.find((e) => e.id === exoId);
          if (exoDef && !exoDef.muscle.includes("Cardio")) {
            validSets.forEach((s) => {
              totalTonnage += parseFloat(s.weight) * parseFloat(s.reps);
            });
          }
        }
      }
    });

    const dataToSave = {
      history: newHistory,
      bodyWeight: bodyWeightHistory,
      bodyMeasurements: bodyMeasurements,
    };
    setHistory(newHistory);
    const saveToSupabase = async () => {
      try {
        const { error } = await supabase.from('app_state').upsert({ id: 1, data: dataToSave });
        if (error) console.error("Erreur sauvegarde Supabase", error);
      } catch (err) {
        console.error("Erreur sauvegarde Supabase", err);
      }
    };
    saveToSupabase();

    localStorage.setItem(
      "muscu_ultimate_v39_final_fixed",
      JSON.stringify(dataToSave)
    );
    setCurrentInput({});
    setCnsScore(null);
    setShowConfirmModal(false);

    let rank = "medium";
    if (sessionHistory.length > 0) {
      const tonnages = sessionHistory
        .map((a) => a.tonnage)
        .sort((a, b) => a - b);
      const p75 = tonnages[Math.floor(tonnages.length * 0.75)] || 0;
      const p25 = tonnages[Math.floor(tonnages.length * 0.25)] || 0;
      if (totalTonnage >= p75 && totalTonnage > 0) rank = "super";
      else if (totalTonnage <= p25) rank = "bad";
    } else {
      rank = "super";
    }

    setSessionTonnage(totalTonnage);
    setSessionRank(rank);
    setShowSummary(true);
    setTimeout(() => setShowSummary(false), 3000);
  };

  const shareWorkout = () => {
    const rankEmoji =
      sessionRank === "super" ? "🏆" : sessionRank === "medium" ? "🔥" : "📈";
    const textToShare = `${rankEmoji} Séance Iron Tracker validée !\n\n🏋️♂️ Session : ${
      sessions[currentSession].title
    }\n🏗️ Tonnage soulevé : ${sessionTonnage.toLocaleString()} kg\n🧠 Score CNS : ${
      cnsScore || "-"
    }/100\n\n"Rome ne s'est pas construite en un jour." 🏛️⚡`;

    const textArea = document.createElement("textarea");
    textArea.value = textToShare;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      alert("Résumé copié ! Tu peux le coller sur Insta ou à tes potes 💪");
    } catch (err) {
      alert("Erreur lors de la copie.");
    }
    document.body.removeChild(textArea);
  };

  const saveBodyWeight = () => {
    if (!newBodyWeight && !newShoulders && !newWaist) return;
    const date = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    let updatedBW = [...bodyWeightHistory];
    if (newBodyWeight) {
      updatedBW.push({ date, value: newBodyWeight });
      setBodyWeightHistory(updatedBW);
      setNewBodyWeight("");
    }
    let updatedMeas = [...bodyMeasurements];
    if (newShoulders && newWaist) {
      const ratio = (parseFloat(newShoulders) / parseFloat(newWaist)).toFixed(
        2
      );
      updatedMeas.push({
        date,
        shoulders: newShoulders,
        waist: newWaist,
        ratio,
      });
      setBodyMeasurements(updatedMeas);
      setNewShoulders("");
      setNewWaist("");
    }
    const dataToSave = {
      history: history,
      bodyWeight: updatedBW,
      bodyMeasurements: updatedMeas,
    };

    const saveToSupabase = async () => {
      try {
        const { error } = await supabase.from('app_state').upsert({ id: 1, data: dataToSave });
        if (error) console.error("Erreur sauvegarde Supabase", error);
      } catch (err) {
        console.error("Erreur sauvegarde Supabase", err);
      }
    };
    saveToSupabase();

    localStorage.setItem(
      "muscu_ultimate_v39_final_fixed",
      JSON.stringify(dataToSave)
    );
  };

  const exportToCSV = () => {
    let csv = "Date,Exercice,Série,Poids,Reps,RPE,Tag\n";
    allExercises.forEach((exo) => {
      const hist = normalizeHistory(history[exo.id] || []);
      hist.forEach((h) => {
        if (h.setsData) {
          h.setsData.forEach((s, idx) => {
            csv += `${h.date},"${exo.name}",${idx + 1},${s.weight},${s.reps},${
              s.rpe || "-"
            },${s.tag || "-"}\n`;
          });
        }
      });
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "muscu_export_complet.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-[#020b14] flex flex-col items-center justify-center text-slate-200 font-sans">
        <RefreshCw size={48} className="text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold">Synchronisation Supabase...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020b14] text-slate-200 font-sans pb-24 relative selection:bg-blue-500 selection:text-white">
      
      {/* MODAL ERREUR */}
      {showErrorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#0d1b2a] border border-red-500/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-in zoom-in duration-300">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Rien à valider</h3>
            <p className="text-sm text-slate-400 mb-6">Tu dois entrer au moins un poids et valider une série pour terminer ta séance.</p>
            <button onClick={() => setShowErrorModal(false)} className="w-full py-3 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors">Compris</button>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#0d1b2a] border border-blue-500/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-[0_0_50px_rgba(37,99,235,0.3)] animate-in zoom-in duration-300">
            <CheckCircle2 size={48} className="text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Terminer la séance ?</h3>
            <p className="text-sm text-slate-400 mb-6">Es-tu sûr d'avoir terminé tous tes exercices ?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors">Non, continuer</button>
              <button onClick={saveWorkout} className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">Oui, valider</button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP RÉSUMÉ SÉANCE */}
      {showSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#0d1b2a] border border-blue-500/50 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(37,99,235,0.3)] animate-in zoom-in duration-300 relative">
            <button
              onClick={() => setShowSummary(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <Minus size={24} />
            </button>
            {sessionRank === "super" && (
              <Trophy size={64} className="text-yellow-400 mx-auto mb-4" />
            )}
            {sessionRank === "medium" && (
              <Flame size={64} className="text-blue-400 mx-auto mb-4" />
            )}
            {sessionRank === "bad" && (
              <TrendingDown size={64} className="text-slate-400 mx-auto mb-4" />
            )}
            <h2 className="text-2xl font-black text-white mb-2">
              Séance Enregistrée !
            </h2>
            <p
              className={`font-bold mb-6 ${
                sessionRank === "super"
                  ? "text-yellow-400"
                  : sessionRank === "medium"
                  ? "text-blue-400"
                  : "text-slate-400"
              }`}
            >
              {sessionRank === "super"
                ? "🏆 Performance Légendaire !"
                : sessionRank === "medium"
                ? "🔥 Séance Solide"
                : "📉 Récupération Active"}
            </p>
            <div className="bg-[#020b14] rounded-xl p-4 border border-slate-700 mb-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                Tonnage Total Soulevé
              </p>
              <p className="text-4xl font-black text-white">
                {sessionTonnage.toLocaleString()}{" "}
                <span className="text-lg text-slate-500 font-normal">kg</span>
              </p>
            </div>
            <button
              onClick={shareWorkout}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Share2 size={18} /> Partager (Flex)
            </button>
          </div>
        </div>
      )}

      {/* TIMER FLOTTANT */}
      {isTimerRunning && (
        <div className="fixed bottom-24 right-4 z-50 bg-slate-900/95 backdrop-blur-xl border border-blue-500/50 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col items-center animate-in slide-in-from-bottom-10 fade-in duration-300 ring-1 ring-blue-500/30 w-28 sm:w-32">
          <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-widest">
            {formatTime(timerSeconds)}
          </span>
          <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mt-1 flex items-center gap-1">
            <Clock size={10} /> Repos
          </span>
          <button
            onClick={() => setIsTimerRunning(false)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
          >
            <Minus size={14} />
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-[#002244] border-b border-blue-900/50 sticky top-0 z-30 backdrop-blur-md bg-opacity-95 shadow-2xl">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-black text-white italic tracking-wider flex items-center gap-2 drop-shadow-md">
            <Dumbbell className="text-blue-400 fill-current" size={24} /> IRON
            TRACKER
          </h1>
          <div className="flex bg-[#020b14] rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab("session")}
              className={`p-2 rounded-md transition-all ${
                activeTab === "session"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <LayoutList size={18} />
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`p-2 rounded-md transition-all ${
                activeTab === "stats"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Activity size={18} />
            </button>
            <button
              onClick={() => setActiveTab("weights")}
              className={`p-2 rounded-md transition-all ${
                activeTab === "weights"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Scale size={18} />
            </button>
            <button
              onClick={() => setActiveTab("planning")}
              className={`p-2 rounded-md transition-all ${
                activeTab === "planning"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Calendar size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        {/* VUE SÉANCE */}
        {activeTab === "session" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 mb-2 scrollbar-hide snap-x">
              {Object.keys(sessions)
                .sort()
                .map((key) => (
                  <button
                    key={key}
                    onClick={() => setCurrentSession(key)}
                    className={`snap-center flex-shrink-0 px-4 sm:px-5 py-2 sm:py-3 rounded-xl border transition-all duration-300 ${
                      currentSession === key
                        ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105"
                        : "bg-[#0d1b2a] border-slate-800 text-slate-500 hover:border-slate-600"
                    }`}
                  >
                    <span className="block text-lg sm:text-xl font-black">
                      {key}
                    </span>
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider opacity-80">
                      {sessions[key].category}
                    </span>
                  </button>
                ))}
            </div>

            <div className="mb-4 p-4 bg-gradient-to-r from-[#0d1b2a] to-transparent border-l-4 border-blue-500 rounded-r-xl shadow-lg">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 leading-tight">
                {sessions[currentSession].title}
              </h2>
              <p className="text-xs sm:text-sm text-blue-400 font-medium">
                {sessions[currentSession].focus}
              </p>
            </div>

            {/* LABORATOIRE CNS (DATA-DRIVEN) */}
            <div className="mb-6 bg-gradient-to-br from-blue-950/40 to-[#001529] p-4 sm:p-5 rounded-xl border border-blue-500/30 shadow-lg relative overflow-hidden">
              {cnsScore === null ? (
                <div className="animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="text-blue-400" size={20} />
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                      Laboratoire CNS (Readiness)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Remplis ces 3 métriques pour que l'algorithme calcule ton
                    état nerveux et calibre la séance.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
                          <Moon size={12} /> Sommeil (Heures)
                        </label>
                        <span className="text-xs font-bold text-white">
                          {sleepHours}h
                        </span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="10"
                        value={sleepHours}
                        onChange={(e) => setSleepHours(Number(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
                          <Activity size={12} /> Stress Mental (1-10)
                        </label>
                        <span className="text-xs font-bold text-white">
                          {stressLevel}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={stressLevel}
                        onChange={(e) => setStressLevel(Number(e.target.value))}
                        className="w-full accent-orange-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
                          <Frown size={12} /> Courbatures (1-10)
                        </label>
                        <span className="text-xs font-bold text-white">
                          {sorenessLevel}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={sorenessLevel}
                        onChange={(e) =>
                          setSorenessLevel(Number(e.target.value))
                        }
                        className="w-full accent-red-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={calculateCNS}
                    className="mt-5 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg flex justify-center items-center gap-2 transition-all"
                  >
                    <Zap size={16} /> Scanner mon Système Nerveux
                  </button>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in duration-300 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="transparent"
                          className="text-slate-800"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray="175"
                          strokeDashoffset={175 - (175 * cnsScore) / 100}
                          className={`${
                            cnsScore >= 85
                              ? "text-yellow-400"
                              : cnsScore >= 45
                              ? "text-green-400"
                              : "text-red-500"
                          } transition-all duration-1000`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-lg font-black text-white leading-none">
                          {cnsScore}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                        Score CNS
                      </p>
                      <p
                        className={`text-sm font-bold ${
                          energyLevel === 5
                            ? "text-yellow-400"
                            : energyLevel >= 3
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {energyLevel === 5
                          ? "⚡ Berserker (+5%)"
                          : energyLevel >= 3
                          ? "🟢 Optimal (Normal)"
                          : "🛡️ Fatigué (-10%)"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCnsScore(null)}
                    className="text-[10px] bg-[#020b14] border border-slate-700 text-slate-400 px-3 py-1.5 rounded-lg hover:text-white transition-colors"
                  >
                    Réévaluer
                  </button>
                </div>
              )}
            </div>

            {/* EXPLICATION TECHNIQUES D'INTENSITÉ */}
            <div className="mb-6 p-4 bg-[#0d1b2a]/80 rounded-xl border border-purple-900/30">
              <div className="flex gap-3">
                <Zap className="text-purple-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-[10px] font-bold text-purple-300 mb-1.5 uppercase tracking-wider">
                    Techniques d'Intensité (Élite)
                  </p>
                  <p className="text-[11px] text-slate-300 mb-2">
                    Clique sur le{" "}
                    <strong className="text-white">
                      numéro de ta dernière série
                    </strong>{" "}
                    pour activer :
                  </p>
                  <div className="flex flex-col gap-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="bg-red-950/50 text-red-400 px-2 py-0.5 rounded font-bold border border-red-500/30 min-w-[70px] text-center">
                        🔥 1 Clic
                      </span>{" "}
                      <span>Série à l'échec total.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-950/50 text-purple-400 px-2 py-0.5 rounded font-bold border border-purple-500/30 min-w-[70px] text-center">
                        💧 2 Clics
                      </span>{" "}
                      <span>Drop Set (-30% poids, sans repos).</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-yellow-950/50 text-yellow-400 px-2 py-0.5 rounded font-bold border border-yellow-500/30 min-w-[70px] text-center">
                        ⚡ 3 Clics
                      </span>{" "}
                      <span>Myo-Reps (Rest-Pause, Repos imposé de 15s).</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 sm:space-y-6">
              {sessions[currentSession].exercises.map((exo, index, arr) => {
                const currentSets = getSetsForExo(exo.id);
                const exoHistory = history[exo.id] || [];
                const advice = getCoachAdvice(exo, exoHistory, currentSets);
                const status = getComparisonStatus(exo.id);
                const isTime = exo.unit === "seconds" || exo.unit === "minutes";
                const isCardio = exo.muscle.includes("Cardio");

                const isSuperset =
                  !isCardio &&
                  exo.superset &&
                  (arr[index - 1]?.superset === exo.superset ||
                    arr[index + 1]?.superset === exo.superset);
                const isSupersetStart =
                  !isCardio &&
                  isSuperset &&
                  arr[index - 1]?.superset !== exo.superset;

                const metrics = getPerformanceMetrics(
                  currentSets.filter((s) => s.done)
                );
                const oneRM =
                  metrics &&
                  metrics.maxWeight &&
                  metrics.avgRepsAtMax &&
                  !isCardio
                    ? calculate1RM(metrics.maxWeight, metrics.avgRepsAtMax)
                    : 0;

                const prevHist = normalizeHistory(exoHistory);
                const prevMetrics =
                  prevHist.length > 0
                    ? getPerformanceMetrics(
                        prevHist[prevHist.length - 1].setsData
                      )
                    : null;
                const targetWeight = prevMetrics ? prevMetrics.maxWeight : 0;

                const needsWarmup = targetWeight >= 30 && !isTime && !isCardio;
                const warmupSets = needsWarmup
                  ? [
                      {
                        percent: 50,
                        reps: 8,
                        weight: Math.round(targetWeight * 0.5),
                      },
                      {
                        percent: 70,
                        reps: 4,
                        weight: Math.round(targetWeight * 0.7),
                      },
                      {
                        percent: 90,
                        reps: 1,
                        weight: Math.round(targetWeight * 0.9),
                      },
                    ]
                  : [];

                let adviceBg = "bg-[#0d1b2a] border-slate-700";
                let accentColor = "text-slate-400";

                if (advice.color === "green") {
                  adviceBg = "bg-green-950/30 border-green-500/30";
                  accentColor = "text-green-400";
                } else if (advice.color === "orange") {
                  adviceBg = "bg-orange-950/30 border-orange-500/30";
                  accentColor = "text-orange-400";
                } else if (advice.color === "yellow") {
                  adviceBg = "bg-yellow-950/30 border-yellow-500/30";
                  accentColor = "text-yellow-400";
                } else if (advice.color === "purple") {
                  adviceBg =
                    "bg-purple-950/30 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]";
                  accentColor = "text-purple-400";
                } else if (advice.color === "red") {
                  adviceBg =
                    "bg-red-950/30 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
                  accentColor = "text-red-400";
                } else if (advice.color === "blue") {
                  adviceBg =
                    "bg-blue-950/30 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]";
                  accentColor = "text-blue-400";
                }

                let inputBorder =
                  "border-slate-700 bg-[#020b14] focus-within:border-blue-500";
                if (status === "better") {
                  inputBorder =
                    "border-green-500 bg-green-950/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]";
                }
                if (status === "worse") {
                  inputBorder = "border-red-500 bg-red-950/20";
                }
                if (status === "neutral") {
                  inputBorder = "border-blue-500/50 bg-blue-950/20";
                }

                let repsPlaceholder = exo.reps.includes("-")
                  ? exo.reps.split("-")[1]
                  : exo.reps.replace(/\D/g, "");

                let targetTUT = 0;
                if (exo.tempo && exo.tempo !== "ISO" && !isTime && !isCardio) {
                  const secPerRep = exo.tempo
                    .split("-")
                    .reduce((a, b) => a + parseInt(b), 0);
                  targetTUT = secPerRep * parseInt(repsPlaceholder);
                }

                const isJunkVolume = advice.text.includes("JUNK VOLUME");
                const opacityClass = isJunkVolume ? "opacity-60 grayscale" : "";

                return (
                  <div
                    key={exo.id}
                    className={`relative ${
                      isSuperset ? "ml-5 sm:ml-6" : ""
                    } ${opacityClass}`}
                  >
                    {isSuperset && (
                      <div className="absolute -left-5 sm:-left-6 top-0 bottom-0 w-1.5 bg-purple-600 rounded-full opacity-50"></div>
                    )}
                    {isSupersetStart && (
                      <div className="absolute -left-7 sm:-left-8 top-6 -rotate-90 bg-purple-600 text-[8px] font-bold text-white px-2 py-0.5 rounded shadow-lg">
                        SUPERSET
                      </div>
                    )}

                    <div
                      className={`rounded-2xl border p-4 sm:p-5 bg-[#0d1b2a] shadow-lg ${
                        advice.color === "green"
                          ? "border-green-500/30"
                          : "border-slate-800"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span
                            className={`inline-flex items-center gap-2 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest mb-1 border ${
                              isCardio
                                ? "bg-orange-900/30 text-orange-400 border-orange-500/50"
                                : "bg-slate-800/50 text-slate-400 border-slate-700/50"
                            }`}
                          >
                            {isCardio ? <Flame size={10} /> : null} {exo.muscle}
                            {isSuperset && (
                              <Link size={10} className="text-purple-400" />
                            )}
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight pr-2">
                            {exo.name}
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 italic mt-1 leading-snug">
                            {exo.note}
                          </p>
                          {exo.tempo && !isCardio && (
                            <p className="text-[10px] text-blue-400 mt-1 font-mono">
                              ⏱️ Tempo: {exo.tempo}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1.5 sm:gap-2 shrink-0">
                          {exo.rest > 0 && (
                            <button
                              onClick={() => startTimer(exo.rest)}
                              className="bg-[#020b14] p-2 rounded-full text-blue-400 border border-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all shadow-md group active:scale-95"
                            >
                              <Timer
                                size={18}
                                className="group-active:scale-90 transition-transform sm:w-5 sm:h-5"
                              />
                            </button>
                          )}
                          <a
                            href={`https://www.youtube.com/results?search_query=exercice+musculation+${exo.name}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-600 hover:text-red-500 pt-1.5 transition-colors"
                          >
                            <PlayCircle size={22} className="sm:w-6 sm:h-6" />
                          </a>
                        </div>
                      </div>

                      {needsWarmup && !isJunkVolume && (
                        <div className="mb-4 px-3 py-2 bg-orange-950/20 rounded-lg border border-orange-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Flame
                              size={14}
                              className="text-orange-500 shrink-0"
                            />
                            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">
                              Échauffement Pyramidal
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            {warmupSets.map((w, idx) => (
                              <div
                                key={idx}
                                className="bg-[#020b14]/50 border border-orange-500/10 rounded p-1.5 text-center flex-1"
                              >
                                <p className="text-[9px] text-slate-500">
                                  {w.percent}%
                                </p>
                                <p className="text-xs font-mono font-bold text-white">
                                  {w.reps}{" "}
                                  <span className="text-[9px] text-slate-400">
                                    @
                                  </span>{" "}
                                  {w.weight}kg
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!needsWarmup &&
                        targetWeight > 0 &&
                        !isTime &&
                        !isJunkVolume && (
                          <div className="flex items-center gap-2 sm:gap-3 mb-4 px-3 py-2 bg-orange-950/20 rounded-lg border border-orange-500/20">
                            <Flame
                              size={14}
                              className="text-orange-500 shrink-0"
                            />
                            <span className="text-[11px] sm:text-xs text-orange-200">
                              Chauffe :{" "}
                              <strong className="text-white font-mono">
                                1 x 12 @ {Math.round(targetWeight * 0.5)}kg
                              </strong>
                            </span>
                          </div>
                        )}

                      <div
                        className={`mb-4 sm:mb-5 p-2.5 sm:p-3 rounded-lg border flex gap-2 sm:gap-3 items-start ${adviceBg}`}
                      >
                        <div className={`mt-0.5 shrink-0 ${accentColor}`}>
                          {advice.icon}
                        </div>
                        <div>
                          <p
                            className={`text-[9px] sm:text-[10px] font-black uppercase mb-0.5 tracking-wider ${accentColor}`}
                          >
                            {advice.type === "elite"
                              ? "Analyseur Élite"
                              : advice.type === "warning"
                              ? "Erreur Stratégique"
                              : advice.type === "deload"
                              ? "Surcharge Nerveuse"
                              : advice.type === "rpe"
                              ? "Attention Forme"
                              : advice.type === "weight"
                              ? "Objectif Surcharge"
                              : advice.type === "sets"
                              ? "Objectif Volume"
                              : "Objectif Intensité"}
                          </p>
                          <p className="text-[11px] sm:text-xs text-slate-300 leading-snug font-medium">
                            {advice.text}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`rounded-xl border p-2 sm:p-3 transition-all duration-300 ${inputBorder} relative`}
                      >
                        <div className="flex justify-between items-center mb-3 border-b border-slate-700/50 pb-2">
                          <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                            <Activity size={14} />
                            Objectif: {exo.sets} {isCardio ? "Session" : "Séries"}{" "}
                            de {exo.reps}{" "}
                            {isTime
                              ? exo.unit === "minutes"
                                ? "Min"
                                : "Sec"
                              : "Reps"}
                          </span>
                          <div className="flex items-center gap-2">
                            {targetTUT > 0 && (
                              <span className="text-[9px] sm:text-[10px] font-bold text-yellow-400 bg-yellow-900/30 px-2 py-1 rounded border border-yellow-500/30">
                                TUT Cible: ~{targetTUT}s
                              </span>
                            )}
                            {oneRM > 0 && !isTime && (
                              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                                1RM: <span className="text-white">{oneRM}kg</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase text-center px-1 mb-2">
                          <div
                            className="w-5 sm:w-6 text-left"
                            title="Cliquer pour changer le type de série (Normal -> Echec -> Drop Set -> Rest-Pause)"
                          >
                            Set
                          </div>
                          <div className="flex-1">
                            {isCardio
                              ? "Niv/Vit."
                              : isTime
                              ? "Lest(kg)"
                              : "Poids"}
                          </div>
                          <div className="flex-1">
                            {isTime
                              ? exo.unit === "minutes"
                                ? "Min"
                                : "Sec"
                              : "Reps"}
                          </div>
                          {!isCardio && <div className="flex-1">RPE</div>}
                          <div className="w-6 sm:w-8">✔️</div>
                        </div>

                        {currentSets.map((set, setIdx) => {
                          const isDone = set.done;
                          const isExtra = set.isExtra;

                          const canClick =
                            setIdx >= parseInt(exo.sets) - 1 &&
                            !isExtra &&
                            !isCardio;

                          let tagLabel = setIdx + 1;
                          if (isExtra && (!set.tag || set.tag === "drop_child"))
                            tagLabel = "⏬";
                          if (isExtra && set.tag === "pause_child")
                            tagLabel = "⏱️";
                          if (set.tag === "🔥") tagLabel = "🔥";
                          if (set.tag === "💧") tagLabel = "💧";
                          if (set.tag === "⚡") tagLabel = "⚡";

                          let tagStyle = isDone
                            ? "text-blue-400 bg-transparent"
                            : "text-slate-600 bg-slate-900";
                          if (set.tag === "🔥")
                            tagStyle =
                              "text-red-400 bg-red-950/50 border border-red-500/30";
                          else if (set.tag === "💧")
                            tagStyle =
                              "text-purple-400 bg-purple-950/50 border border-purple-500/30";
                          else if (set.tag === "⚡")
                            tagStyle =
                              "text-yellow-400 bg-yellow-950/50 border border-yellow-500/30";
                          else if (isExtra && set.tag === "drop_child")
                            tagStyle =
                              "text-blue-400 bg-blue-950/30 border border-blue-500/30";
                          else if (isExtra && set.tag === "pause_child")
                            tagStyle =
                              "text-yellow-400 bg-yellow-950/30 border border-yellow-500/30";

                          const cursorStyle = canClick
                            ? "cursor-pointer hover:bg-slate-800"
                            : "cursor-default";

                          return (
                            <div
                              key={setIdx}
                              className={`flex gap-1 sm:gap-2 items-center rounded-lg border p-1 sm:p-1.5 mb-1.5 transition-all ${
                                isDone
                                  ? "bg-blue-900/20 border-blue-500/30"
                                  : "bg-[#020b14] border-slate-700/50 focus-within:border-blue-500/50 hover:bg-slate-900/50"
                              }`}
                            >
                              <button
                                onClick={() =>
                                  canClick && cycleSetTag(exo.id, setIdx)
                                }
                                disabled={!canClick}
                                className={`w-5 sm:w-6 text-center text-[10px] sm:text-xs font-bold rounded-md py-1 transition-colors ${tagStyle} ${cursorStyle}`}
                              >
                                {tagLabel}
                              </button>

                              <input
                                type="number"
                                disabled={isDone || isJunkVolume}
                                className={`flex-1 w-0 bg-transparent text-center font-bold text-sm sm:text-base py-1 focus:outline-none placeholder-slate-700 ${
                                  isDone ? "text-slate-400" : "text-white"
                                }`}
                                value={set.weight}
                                onChange={(e) =>
                                  handleSetChange(
                                    exo.id,
                                    setIdx,
                                    "weight",
                                    e.target.value
                                  )
                                }
                                placeholder="-"
                              />
                              <input
                                type="number"
                                disabled={isDone || isJunkVolume}
                                className={`flex-1 w-0 bg-transparent text-center font-bold text-sm sm:text-base py-1 focus:outline-none border-l border-slate-800 placeholder-slate-700 ${
                                  isDone ? "text-slate-400" : "text-white"
                                }`}
                                value={set.reps}
                                onChange={(e) =>
                                  handleSetChange(
                                    exo.id,
                                    setIdx,
                                    "reps",
                                    e.target.value
                                  )
                                }
                                placeholder={repsPlaceholder}
                              />

                              {!isCardio && (
                                <div className="flex-1 w-0 border-l border-slate-800 relative">
                                  <select
                                    disabled={isDone || isJunkVolume}
                                    className={`w-full bg-transparent text-center font-bold text-sm sm:text-base py-1 appearance-none focus:outline-none cursor-pointer ${
                                      isDone
                                        ? "text-slate-500"
                                        : "text-blue-400"
                                    }`}
                                    value={set.rpe}
                                    onChange={(e) =>
                                      handleSetChange(
                                        exo.id,
                                        setIdx,
                                        "rpe",
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="" className="text-slate-500">
                                      -
                                    </option>
                                    {[6, 7, 8, 9, 10].map((n) => (
                                      <option
                                        key={n}
                                        value={n}
                                        className="bg-[#020b14]"
                                      >
                                        {n}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <button
                                onClick={() =>
                                  !isJunkVolume &&
                                  toggleSetDone(exo.id, setIdx, exo.rest)
                                }
                                className={`w-6 sm:w-8 flex justify-center items-center h-full active:scale-90 transition-transform ${
                                  isJunkVolume
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                              >
                                {isDone ? (
                                  <CheckCircle2
                                    size={20}
                                    className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                  />
                                ) : (
                                  <Circle
                                    size={20}
                                    className="text-slate-600 hover:text-blue-400"
                                  />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Status Badges */}
                      <div className="flex justify-center mt-4 h-4">
                        {status === "better" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-[10px] font-bold text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                            <Trophy size={10} fill="currentColor" /> PERFORMANCE
                            RECORD
                          </span>
                        )}
                        {status === "worse" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-[10px] font-bold text-red-400">
                            <AlertTriangle size={10} /> VOLUME EN BAISSE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="h-28"></div>
            {/* BOUTON SAUVEGARDER */}
            <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-[#020b14]/90 backdrop-blur-xl border-t border-slate-800 flex justify-center z-40">
              <button
                onClick={handlePreSave}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-10 rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 w-full max-w-md active:scale-95 transition-all border border-blue-400/20"
              >
                <Save size={20} /> VALIDER LA SÉANCE
              </button>
            </div>
          </div>
        )}

        {/* VUE STATS */}
        {activeTab === "stats" && (
          <div className="animate-in zoom-in-95 duration-300 pb-20">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="text-blue-500" /> Analyses Détaillées
            </h2>

            {/* ALERTE ÉQUILIBRE POSTURAL */}
            {(() => {
              const volPecs = weeklyVolume["Pecs"] || 0;
              const volDos = weeklyVolume["Dos"] || 0;

              if (volPecs > 5 && volPecs > volDos * 1.5) {
                return (
                  <div className="bg-gradient-to-r from-red-950/40 to-[#001529] p-4 rounded-xl border border-red-500/30 mb-8 shadow-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        className="text-red-400 shrink-0 mt-0.5"
                        size={20}
                      />
                      <div>
                        <h3 className="font-bold text-red-400 text-sm uppercase tracking-wider mb-1">
                          Alerte Posturale (Gorille)
                        </h3>
                        <p className="text-xs text-slate-300">
                          Tu as fait{" "}
                          <strong className="text-white">
                            {volPecs} séries de Pecs
                          </strong>{" "}
                          contre seulement{" "}
                          <strong className="text-white">
                            {volDos} séries de Dos
                          </strong>{" "}
                          cette semaine. Tes épaules vont rouler vers l'avant !
                          Fais plus de tirage.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              } else if (volDos > 5 && volDos >= volPecs) {
                return (
                  <div className="bg-gradient-to-r from-green-950/20 to-[#001529] p-4 rounded-xl border border-green-500/30 mb-8 shadow-sm">
                    <div className="flex items-center gap-3">
                      <ArrowRightLeft
                        className="text-green-400 shrink-0"
                        size={20}
                      />
                      <div>
                        <h3 className="font-bold text-green-400 text-sm uppercase tracking-wider">
                          Équilibre Postural Parfait
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          Ratio Poussée/Tirage maîtrisé.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* NOUVEAU : SCORE ESTHÉTIQUE PURE */}
            <div className="bg-gradient-to-br from-[#0d1b2a] to-[#001529] p-5 sm:p-6 rounded-xl border border-yellow-500/30 mb-8 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
              <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <Star className="text-yellow-400" size={18} /> Esthétique
                    (Dieu Grec)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Volumes des points clés du V-Taper (7j)
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`text-2xl font-black ${
                      aestheticScore.globalScore >= 80
                        ? "text-yellow-400"
                        : aestheticScore.globalScore >= 50
                        ? "text-green-400"
                        : "text-slate-400"
                    }`}
                  >
                    {aestheticScore.globalScore}/100
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#020b14] p-3 rounded-lg border border-slate-800 text-center">
                  <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">
                    Épaules 3D
                  </p>
                  <p
                    className={`text-lg font-black ${
                      aestheticScore.latDelts >= 8
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {aestheticScore.latDelts}{" "}
                    <span className="text-[10px] text-slate-400 font-normal">
                      séries
                    </span>
                  </p>
                </div>
                <div className="bg-[#020b14] p-3 rounded-lg border border-slate-800 text-center">
                  <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">
                    Haut Pecs
                  </p>
                  <p
                    className={`text-lg font-black ${
                      aestheticScore.upperChest >= 8
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {aestheticScore.upperChest}{" "}
                    <span className="text-[10px] text-slate-400 font-normal">
                      séries
                    </span>
                  </p>
                </div>
                <div className="bg-[#020b14] p-3 rounded-lg border border-slate-800 text-center">
                  <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">
                    V-Taper Dos
                  </p>
                  <p
                    className={`text-lg font-black ${
                      aestheticScore.lats >= 8
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {aestheticScore.lats}{" "}
                    <span className="text-[10px] text-slate-400 font-normal">
                      séries
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* RADAR DE VOLUME HEBDOMADAIRE */}
            <div className="bg-gradient-to-br from-[#0d1b2a] to-[#001529] p-5 sm:p-6 rounded-xl border border-blue-500/30 mb-8 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <Target className="text-blue-400" size={18} /> Volume
                    Hebdomadaire
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Séries faites les 7 derniers jours
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(weeklyVolume).map(([muscle, sets]) => {
                  const isOptimal = sets >= 10 && sets <= 20;
                  const isLow = sets > 0 && sets < 10;
                  const isHigh = sets > 20;
                  const widthPct = Math.min(100, (sets / 25) * 100);

                  let barColor = "bg-slate-600";
                  if (isOptimal)
                    barColor =
                      "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]";
                  if (isLow) barColor = "bg-yellow-500";
                  if (isHigh) barColor = "bg-red-500";

                  return (
                    <div
                      key={muscle}
                      className="bg-[#020b14] p-3 rounded-xl border border-slate-800"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          {muscle}
                        </span>
                        {isOptimal && (
                          <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                            ✔️ OPTIMAL
                          </span>
                        )}
                        {isLow && (
                          <span className="text-[9px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                            ⚠️ INSUFFISANT
                          </span>
                        )}
                        {isHigh && (
                          <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                            🔥 EXCESSIF
                          </span>
                        )}
                        {sets === 0 && (
                          <span className="text-[9px] font-bold text-slate-500">
                            REPOS
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 text-right text-lg font-black ${
                            isOptimal
                              ? "text-green-400"
                              : isLow
                              ? "text-yellow-400"
                              : isHigh
                              ? "text-red-400"
                              : "text-slate-500"
                          }`}
                        >
                          {sets}
                        </div>
                        <div className="flex-1">
                          <div className="h-3 bg-slate-800/80 rounded-full relative overflow-hidden">
                            <div
                              className={`h-full relative z-10 transition-all duration-1000 ${barColor}`}
                              style={{ width: `${widthPct}%` }}
                            ></div>
                            <div className="absolute top-0 bottom-0 left-[40%] border-l-2 border-[#020b14] z-20"></div>
                            <div className="absolute top-0 bottom-0 left-[80%] border-l-2 border-[#020b14] z-20"></div>
                          </div>
                          <div className="flex relative text-[8px] text-slate-500 font-bold uppercase mt-1">
                            <span className="absolute left-0">0</span>
                            <span className="absolute left-[40%] -translate-x-1/2 text-green-500/70">
                              10 (Min)
                            </span>
                            <span className="absolute left-[80%] -translate-x-1/2 text-red-500/70">
                              20 (Max)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FORCE BRUTE */}
            <div className="bg-gradient-to-br from-[#0d1b2a] to-[#001529] p-5 sm:p-6 rounded-xl border border-slate-800 mb-8 shadow-lg">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap className="text-yellow-500" size={18} /> Force Brute (1RM
                Absolu)
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: "bench",
                    label: "Couché",
                    val: getBest1RM("a2") || getBest1RM("f1") || 0,
                  },
                  {
                    id: "squat",
                    label: "Squat",
                    val: getBest1RM("c1") || getBest1RM("g1") || 0,
                  },
                  {
                    id: "pullup",
                    label: "Tractions",
                    val: getBest1RM("b1") || 0,
                  },
                ].map((lift) => {
                  const standard = getStrengthStandard(
                    lift.id,
                    lift.val,
                    currentBodyWeight
                  );
                  return (
                    <div
                      key={lift.id}
                      className="bg-[#020b14] p-3 rounded-lg border border-slate-800 text-center flex flex-col justify-between"
                    >
                      <p className="text-[9px] uppercase font-bold text-slate-500 mb-2">
                        {lift.label}
                      </p>
                      <div>
                        <p className="text-2xl font-black text-white leading-none">
                          {lift.val}{" "}
                          <span className="text-xs text-slate-400 font-normal">
                            kg
                          </span>
                        </p>
                        <div className="mt-2 inline-block">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${standard.color
                              .replace("text-", "border-")
                              .replace("400", "500/30")} ${
                              standard.color
                            } bg-[#0d1b2a]`}
                          >
                            {standard.rank}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-slate-500 mt-3 text-center italic">
                *Rangs basés sur ton poids de corps actuel ({currentBodyWeight}
                kg).
              </p>
            </div>

            <div className="bg-[#0d1b2a] p-4 rounded-xl border border-slate-800 mb-6 shadow-lg">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Sélectionner un exercice
              </label>
              <select
                className="w-full bg-[#020b14] text-white p-3 rounded-lg border border-slate-700 outline-none focus:border-blue-500 transition-colors"
                onChange={(e) => setSelectedStatExo(e.target.value)}
                value={selectedStatExo}
              >
                <option value="">-- Choisir dans la liste --</option>
                {allExercises.map((exo) => (
                  <option key={exo.id} value={exo.id}>
                    {exo.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedStatExo && (
              <div className="space-y-6">
                <div className="flex bg-[#0d1b2a] p-1.5 rounded-xl border border-slate-800 shadow-sm">
                  <button
                    onClick={() => setStatMetric("weight")}
                    className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
                      statMetric === "weight"
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    POIDS MAX
                  </button>
                  <button
                    onClick={() => setStatMetric("reps")}
                    className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
                      statMetric === "reps"
                        ? "bg-green-600 text-white shadow-md"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    REPS (au Max)
                  </button>
                  <button
                    onClick={() => setStatMetric("sets")}
                    className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
                      statMetric === "sets"
                        ? "bg-orange-600 text-white shadow-md"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    SÉRIES (au Max)
                  </button>
                </div>

                <SimpleLineChart
                  data={normalizeHistory(history[selectedStatExo] || [])}
                  metric={statMetric}
                  color={
                    statMetric === "weight"
                      ? "#3b82f6"
                      : statMetric === "reps"
                      ? "#16a34a"
                      : "#ea580c"
                  }
                />

                {(() => {
                  const hist = normalizeHistory(history[selectedStatExo] || []);
                  const last =
                    hist.length > 0
                      ? getPerformanceMetrics(hist[hist.length - 1].setsData)
                      : null;
                  const allWeights = hist.flatMap((h) =>
                    h.setsData.map((s) => parseFloat(s.weight) || 0)
                  );
                  const maxAllTime =
                    allWeights.length > 0 ? Math.max(...allWeights) : 0;

                  return (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-[#0d1b2a] p-4 rounded-xl border border-slate-800 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-500">
                          Record Poids Max
                        </p>
                        <p className="text-xl sm:text-2xl font-black text-white mt-1">
                          {maxAllTime}{" "}
                          <span className="text-sm font-normal text-slate-400">
                            kg
                          </span>
                        </p>
                      </div>
                      <div className="bg-[#0d1b2a] p-4 rounded-xl border border-slate-800 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-500">
                          Dernier Volume
                        </p>
                        <p className="text-xl sm:text-2xl font-black text-blue-400 mt-1">
                          {last ? last.totalVolume : 0}{" "}
                          <span className="text-sm font-normal text-slate-400">
                            kg soulevés
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="mt-12">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Award className="text-yellow-500" size={20} /> Panthéon des
                Séances
              </h3>
              <div className="space-y-3">
                {sessionHistory.length === 0 && (
                  <p className="text-slate-500 text-sm">
                    Aucune séance complète enregistrée.
                  </p>
                )}
                {sessionHistory.map((sess, i) => (
                  <div
                    key={i}
                    className="bg-[#0d1b2a] p-4 rounded-xl border border-slate-800 flex justify-between items-center shadow-lg"
                  >
                    <div>
                      <p className="text-white font-bold">{sess.date}</p>
                      <p className="text-[10px] text-slate-500 uppercase mt-0.5">
                        {sess.exos} exos validés
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-base sm:text-lg font-black text-blue-400">
                          {sess.tonnage.toLocaleString()}{" "}
                          <span className="text-[10px] sm:text-xs text-slate-500 font-normal">
                            kg
                          </span>
                        </p>
                      </div>
                      {sess.rank === "super" && (
                        <div
                          className="bg-yellow-500/10 p-2 rounded-full border border-yellow-500/30"
                          title="Performance Légendaire"
                        >
                          <Trophy size={18} className="text-yellow-400" />
                        </div>
                      )}
                      {sess.rank === "medium" && (
                        <div
                          className="bg-blue-500/10 p-2 rounded-full border border-blue-500/30"
                          title="Séance Solide"
                        >
                          <Flame size={18} className="text-blue-400" />
                        </div>
                      )}
                      {sess.rank === "bad" && (
                        <div
                          className="bg-slate-800 p-2 rounded-full border border-slate-700"
                          title="Récupération Active"
                        >
                          <TrendingDown size={18} className="text-slate-500" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={exportToCSV}
              className="mt-8 w-full py-4 bg-[#0d1b2a] text-slate-400 border border-slate-800 rounded-xl flex items-center justify-center gap-2 hover:text-white hover:bg-[#1a2c42] transition-colors"
            >
              <Download size={18} /> Exporter les données (CSV)
            </button>
          </div>
        )}

        {/* VUE POIDS ET MENSURATIONS */}
        {activeTab === "weights" && (
          <div className="animate-in zoom-in-95 duration-300 pb-20">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Scale className="text-blue-500" /> Suivi Corporel
            </h2>

            {/* NOUVEAU : CARB CYCLING (Nutrition dynamique selon le type de séance du jour) */}
            {(() => {
              if (bodyWeightHistory.length === 0) return null;
              const weight = parseFloat(
                bodyWeightHistory[bodyWeightHistory.length - 1].value
              );
              const maintenance = Math.round(weight * 33);
              const proteins = Math.round(weight * 2);

              const highCarbDays = ["A", "B", "C", "D", "E", "F", "G"];
              const lowCarbDays = ["H", "I", "J"];

              let carbMode = "Maintien";
              let calories = maintenance;
              let modeColor = "text-blue-400";
              let modeBorder = "border-blue-500/30";
              let modeIcon = <Activity size={18} className="text-blue-400" />;

              if (highCarbDays.includes(currentSession)) {
                carbMode = "High Carb (Jour Lourd)";
                calories = maintenance + 300;
                modeColor = "text-green-400";
                modeBorder = "border-green-500/30";
                modeIcon = <Flame size={18} className="text-green-400" />;
              } else if (lowCarbDays.includes(currentSession)) {
                carbMode = "Low Carb (Jour Sèche)";
                calories = maintenance - 300;
                modeColor = "text-orange-400";
                modeBorder = "border-orange-500/30";
                modeIcon = (
                  <TrendingDown size={18} className="text-orange-400" />
                );
              }

              return (
                <div
                  className={`bg-[#0d1b2a] p-5 sm:p-6 rounded-xl border ${modeBorder} mb-6 shadow-lg relative overflow-hidden transition-all duration-500`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    {modeIcon}
                  </div>
                  <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      {modeIcon} Carb Cycling (Aujourd'hui)
                    </h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest bg-slate-900 px-2 py-1 rounded ${modeColor}`}
                    >
                      {carbMode}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#020b14] p-3 rounded-lg border border-slate-800 text-center">
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Protéines Cibles
                      </p>
                      <p className="text-2xl font-black text-white">
                        {proteins}{" "}
                        <span className="text-sm font-normal text-slate-400">
                          g
                        </span>
                      </p>
                    </div>
                    <div className="bg-[#020b14] p-3 rounded-lg border border-slate-800 text-center">
                      <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Calories Cibles
                      </p>
                      <p className={`text-2xl font-black ${modeColor}`}>
                        {calories}{" "}
                        <span className="text-sm font-normal text-slate-400">
                          kcal
                        </span>
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 italic">
                    *La nutrition s'adapte à ta séance "{currentSession}".
                    Protéines fixes, glucides ajustés.
                  </p>
                </div>
              );
            })()}

            <div className="bg-gradient-to-br from-[#0d1b2a] to-[#001529] p-5 sm:p-6 rounded-xl border border-yellow-500/30 mb-6 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Trophy className="text-yellow-500" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    L'Index d'Adonis
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                    Le ratio parfait d'un Dieu Grec : 1.61
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">
                    Tour d'Épaules (cm)
                  </label>
                  <input
                    type="number"
                    placeholder="ex: 120"
                    className="w-full bg-[#020b14] text-white p-3 rounded-lg border border-slate-700 font-bold text-center outline-none focus:border-yellow-500 transition-colors"
                    value={newShoulders}
                    onChange={(e) => setNewShoulders(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">
                    Tour de Taille (cm)
                  </label>
                  <input
                    type="number"
                    placeholder="ex: 80"
                    className="w-full bg-[#020b14] text-white p-3 rounded-lg border border-slate-700 font-bold text-center outline-none focus:border-yellow-500 transition-colors"
                    value={newWaist}
                    onChange={(e) => setNewWaist(e.target.value)}
                  />
                </div>
              </div>

              {bodyMeasurements.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-700/50">
                  <p className="text-center text-sm text-slate-400 mb-2">
                    Ton ratio actuel :
                  </p>
                  <div className="flex justify-center items-center gap-3">
                    <span className="text-3xl font-black text-yellow-400">
                      {bodyMeasurements[bodyMeasurements.length - 1].ratio}
                    </span>
                    {parseFloat(
                      bodyMeasurements[bodyMeasurements.length - 1].ratio
                    ) >= 1.6 && (
                      <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/30">
                        STATUT DIEU GREC ATTEINT ! ⚡
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#0d1b2a] p-5 sm:p-6 rounded-xl border border-slate-800 mb-6 flex flex-col items-center gap-4 shadow-lg">
              <h3 className="font-bold text-white text-sm self-start w-full border-b border-slate-800 pb-2">
                Poids de Corps (kg)
              </h3>
              <div className="flex gap-2 w-full max-w-xs mt-2">
                <input
                  type="number"
                  placeholder="00.0"
                  className="flex-1 bg-[#020b14] text-white text-xl sm:text-2xl p-3 sm:p-4 rounded-l-xl border border-slate-700 font-bold text-center outline-none focus:border-blue-500 transition-colors"
                  value={newBodyWeight}
                  onChange={(e) => setNewBodyWeight(e.target.value)}
                />
                <button
                  onClick={saveBodyWeight}
                  className="bg-blue-600 text-white px-5 sm:px-6 rounded-r-xl font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30"
                >
                  OK
                </button>
              </div>
              <p className="text-xs text-slate-500 text-center">
                Valide le poids ou les mensurations ci-dessus
              </p>
            </div>

            <div className="mb-6">
              <SimpleLineChart
                data={bodyWeightHistory}
                metric="bodyweight"
                color="#8b5cf6"
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-400 text-xs uppercase ml-1 mb-2 mt-6">
                Historique Poids
              </h3>
              {bodyWeightHistory
                .slice()
                .reverse()
                .map((entry, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 sm:p-4 bg-[#0d1b2a] rounded-xl border border-slate-800"
                  >
                    <span className="text-slate-400 text-xs font-mono">
                      {entry.date}
                    </span>
                    <span className="text-white font-bold text-base sm:text-lg">
                      {entry.value} kg
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* VUE PLANNING */}
        {activeTab === "planning" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
            <div className="flex flex-col items-start gap-2 mb-6">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Calendar className="text-blue-500" size={28} /> Programmes d'Entraînement
              </h2>
              <p className="text-sm text-slate-400">Découvre les splits d'entraînement les plus efficaces, du classique au mode Dieu Grec.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {schedule.map((prog, idx) => (
                <div key={idx} className="bg-gradient-to-br from-[#0d1b2a] to-[#001529] border border-slate-800 hover:border-blue-500/40 rounded-3xl p-5 sm:p-6 shadow-xl transition-all duration-300 group relative overflow-hidden">
                  {/* Effet visuel d'arrière-plan */}
                  <div className="absolute -top-10 -right-10 text-blue-500/5 group-hover:text-blue-500/10 transition-colors duration-500 transform rotate-12">
                    <Calendar size={180} strokeWidth={1} />
                  </div>

                  <div className="relative z-10 mb-6">
                    <h3 className="font-black text-white text-lg sm:text-xl mb-1.5 tracking-tight group-hover:text-blue-400 transition-colors">
                      {prog.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-blue-400 font-medium pb-4 border-b border-slate-800/80">
                      {prog.desc}
                    </p>
                  </div>
                  
                  <div className="space-y-3 relative z-10">
                    {/* Ligne verticale de timeline */}
                    <div className="absolute left-[17px] top-4 bottom-4 w-0.5 bg-slate-800/80 rounded-full"></div>

                    {prog.days.map((d, i) => {
                      const isRest = d.session === '-';
                      return (
                        <div key={i} className={`flex items-center gap-3 sm:gap-4 relative ${isRest ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}`}>
                          {/* Badge du jour */}
                          <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black uppercase tracking-wider border relative z-10 ${
                            isRest 
                              ? 'bg-[#020b14] text-slate-500 border-slate-800' 
                              : 'bg-blue-900/30 text-blue-400 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                          }`}>
                            {d.name}
                          </div>
                          
                          {/* Carte de la session */}
                          <div className={`flex-1 flex items-center gap-3 bg-[#020b14]/60 rounded-2xl p-2.5 sm:p-3 border ${
                            isRest ? 'border-transparent' : 'border-slate-800/60 hover:border-slate-600 transition-colors shadow-sm'
                          }`}>
                            <span className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-black text-xs sm:text-sm border ${
                              isRest 
                                ? 'bg-slate-900/50 text-slate-600 border-slate-800/50' 
                                : 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/50'
                            }`}>
                              {d.session !== '-' ? d.session : '—'}
                            </span>
                            <div className="flex flex-col">
                              <span className={`text-xs sm:text-sm font-bold ${isRest ? 'text-slate-500' : 'text-slate-200'}`}>
                                {d.label}
                              </span>
                              {!isRest && (
                                <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                                  Séance d'entraînement
                                </span>
                              )}
                              {isRest && (
                                <span className="text-[9px] sm:text-[10px] text-slate-600 font-medium">
                                  Récupération
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
