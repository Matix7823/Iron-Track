// Anatomical muscles that the SVG BodyMap can highlight (head-to-toe)
export const MUSCLES = [
  'trapezius', 'deltoids', 'chest', 'upper-back', 'serratus',
  'biceps', 'triceps', 'forearm',
  'abs', 'obliques', 'lower-back',
  'gluteal', 'quadriceps', 'hamstring', 'adductors', 'hip-flexors',
  'calves', 'tibialis',
];

// Inert body parts (drawn in neutral silhouette, never heat-shaded)
export const INERT = ['head', 'hair', 'neck', 'hands', 'feet', 'knees', 'ankles'];

// Display names in French
export const MUSCLE_NAME_FR = {
  trapezius: 'Trapèzes',
  deltoids: 'Épaules (Deltoïdes)',
  chest: 'Pectoraux',
  'upper-back': 'Haut du Dos / Lats',
  serratus: 'Grand Dentelé',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearm: 'Avant-bras',
  abs: 'Abdominaux (Sangle abdominale)',
  obliques: 'Obliques',
  'lower-back': 'Bas du Dos (Lombaires)',
  gluteal: 'Fessiers',
  quadriceps: 'Quadriceps',
  hamstring: 'Ischio-jambiers',
  adductors: 'Adducteurs',
  'hip-flexors': 'Fléchisseurs de Hanche',
  calves: 'Mollets',
  tibialis: 'Tibiaux',
};

// Aliases mapping French & English muscle/submuscle names to BodyMap slugs
const ALIAS = {
  // Pectoraux / Chest
  pectoraux: 'chest', chest: 'chest', pectorals: 'chest', 'upper chest': 'chest',
  'faisceau claviculaire (haut)': 'chest', 'faisceau sterno-costal (milieu)': 'chest', 'faisceau abdominal (bas)': 'chest',
  
  // Épaules / Deltoids / Traps
  épaules: 'deltoids', epaules: 'deltoids', deltoides: 'deltoids', deltoïdes: 'deltoids', delts: 'deltoids',
  deltoids: 'deltoids', shoulders: 'deltoids', 'rear deltoids': 'deltoids', 'faisceau antérieur': 'deltoids',
  'faisceau latéral': 'deltoids', 'faisceau postérieur': 'deltoids', 'rotator cuff': 'deltoids',
  trapèzes: 'trapezius', trapezes: 'trapezius', traps: 'trapezius', trapezius: 'trapezius', 'levator scapulae': 'trapezius',
  
  // Bras / Arms
  biceps: 'biceps', brachialis: 'biceps', 'biceps brachial': 'biceps', 'longue portion': 'biceps', 'courte portion': 'biceps',
  triceps: 'triceps', 'triceps brachial': 'triceps', 'vastes': 'triceps',
  'avant-bras': 'forearm', avantbras: 'forearm', forearms: 'forearm', forearm: 'forearm', wrists: 'forearm',
  'wrist flexors': 'forearm', 'wrist extensors': 'forearm', 'grip muscles': 'forearm',

  // Dos / Back
  dos: 'upper-back', back: 'upper-back', 'haut du dos': 'upper-back', 'upper back': 'upper-back', 'upper-back': 'upper-back',
  lats: 'upper-back', 'latissimus dorsi': 'upper-back', 'grand dorsal': 'upper-back', rhomboides: 'upper-back', rhomboids: 'upper-back',
  'bas du dos': 'lower-back', 'lower back': 'lower-back', 'lower-back': 'lower-back', lombaires: 'lower-back', spine: 'lower-back',
  serratus: 'serratus', 'serratus anterior': 'serratus', 'dentelé': 'serratus',

  // Abdominaux / Core
  abdominaux: 'abs', abs: 'abs', core: 'abs', abdominals: 'abs', 'lower abs': 'abs', 'grand droit': 'abs',
  obliques: 'obliques', waist: 'abs',

  // Jambes / Legs
  quadriceps: 'quadriceps', quads: 'quadriceps', cuisses: 'quadriceps', 'droit fémoral': 'quadriceps', 'vastes externe/interne': 'quadriceps',
  ischios: 'hamstring', 'ischio-jambiers': 'hamstring', ischiojambiers: 'hamstring', hamstring: 'hamstring', hamstrings: 'hamstring',
  fessiers: 'gluteal', glutes: 'gluteal', gluteal: 'gluteal', abductors: 'gluteal', 'grand fessier': 'gluteal',
  adducteurs: 'adductors', adductors: 'adductors', groin: 'adductors', 'inner thighs': 'adductors',
  'fléchisseurs de hanche': 'hip-flexors', 'hip flexors': 'hip-flexors', 'hip-flexors': 'hip-flexors', psoas: 'hip-flexors',
  mollets: 'calves', calves: 'calves', soleus: 'calves', gastrocnemius: 'calves',
  tibiaux: 'tibialis', tibialis: 'tibialis', shins: 'tibialis',

  // Systemic / Drop
  cardio: null, 'cardiovascular system': null, ankles: null, feet: null, hands: null,
};

const BY_BODYPART = {
  Pectoraux: { chest: 1 },
  chest: { chest: 1 },
  Dos: { 'upper-back': 0.75, 'lower-back': 0.25 },
  back: { 'upper-back': 0.75, 'lower-back': 0.25 },
  Épaules: { deltoids: 1 },
  epaules: { deltoids: 1 },
  shoulders: { deltoids: 1 },
  Biceps: { biceps: 1 },
  Triceps: { triceps: 1 },
  'Avant-bras': { forearm: 1 },
  Abdominaux: { abs: 0.7, obliques: 0.3 },
  waist: { abs: 0.7, obliques: 0.3 },
  Quadriceps: { quadriceps: 1 },
  'Ischio-Jambiers': { hamstring: 1 },
  Fessiers: { gluteal: 1 },
  Mollets: { calves: 0.8, tibialis: 0.2 },
  'upper legs': { quadriceps: 0.4, hamstring: 0.35, gluteal: 0.25 },
  'lower legs': { calves: 0.8, tibialis: 0.2 },
  'upper arms': { biceps: 0.5, triceps: 0.5 },
  'lower arms': { forearm: 1 },
  neck: { trapezius: 1 },
  cardio: {},
};

const SECONDARY_WEIGHT = 0.4;

/** Given an exercise item (Iron Track or openGym structure), return target muscles map { slug: weight } */
export function musclesOf(ex) {
  if (!ex) return {};
  const out = {};
  const add = (name, w) => {
    if (!name) return;
    const slug = ALIAS[String(name).toLowerCase().trim()];
    if (slug) out[slug] = Math.max(out[slug] || 0, w);
  };

  // Primary muscle / target
  add(ex.muscle, 1);
  add(ex.tg, 1);
  add(ex.subMuscle, 0.6);
  
  // Secondary muscles
  if (Array.isArray(ex.sm)) {
    ex.sm.forEach(m => add(m, SECONDARY_WEIGHT));
  } else if (typeof ex.sm === 'string') {
    add(ex.sm, SECONDARY_WEIGHT);
  }

  // Fallback to body part if no specific mapped muscle
  if (!Object.keys(out).length) {
    const bpMap = BY_BODYPART[ex.muscle] || BY_BODYPART[ex.bp] || {};
    Object.assign(out, bpMap);
  }

  return out;
}

/** Compute total effective set volume load per muscle slug from a list of completed items [{ exercise, sets }] */
export function loadOfItems(items) {
  const load = {};
  (items || []).forEach(item => {
    if (!item) return;
    const exObj = item.exercise || item;
    let count = 0;
    if (typeof item.sets === 'number') {
      count = item.sets;
    } else if (Array.isArray(item.sets)) {
      count = item.sets.filter(s => s.completed || s.done || s.reps).length;
    } else {
      count = 1;
    }

    if (!count) return;
    const m = musclesOf(exObj);
    for (const slug in m) {
      load[slug] = (load[slug] || 0) + m[slug] * count;
    }
  });
  return load;
}

/** Calculate shade levels 0-4 relative to the max load among all muscles */
export function levelsOf(load) {
  const max = Math.max(0, ...MUSCLES.map(m => load[m] || 0));
  const lv = {};
  MUSCLES.forEach(m => {
    const v = load[m] || 0;
    lv[m] = !v ? 0 : max <= 0 ? 0 : Math.max(1, Math.min(4, Math.ceil((v / max) * 4)));
  });
  return lv;
}

/** Return ranked lists of worked muscles (descending load) and missed/untrained muscles */
export function rankOf(load) {
  const worked = MUSCLES.filter(m => (load[m] || 0) > 0).sort((a, b) => (load[b] || 0) - (load[a] || 0));
  const missed = MUSCLES.filter(m => !(load[m] > 0));
  return { worked, missed };
}
