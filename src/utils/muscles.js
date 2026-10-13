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
  'pecs (haut)': 'chest', 'pecs (masse)': 'chest', 'pecs (bas)': 'chest', 'pecs (iso)': 'chest',
  pecs: 'chest', 'finition': 'chest',
  'faisceau claviculaire (haut)': 'chest', 'faisceau sterno-costal (milieu)': 'chest', 'faisceau abdominal (bas)': 'chest',
  
  // Épaules / Deltoids / Traps
  épaules: 'deltoids', epaules: 'deltoids', deltoides: 'deltoids', deltoïdes: 'deltoids', delts: 'deltoids',
  'épaules (masse)': 'deltoids', 'épaules (latéral)': 'deltoids', 'arr. épaules': 'deltoids', 'arriere epaules': 'deltoids',
  deltoids: 'deltoids', shoulders: 'deltoids', 'rear deltoids': 'deltoids', 'faisceau antérieur': 'deltoids',
  'faisceau latéral': 'deltoids', 'faisceau postérieur': 'deltoids', 'rotator cuff': 'deltoids',
  trapèzes: 'trapezius', trapezes: 'trapezius', traps: 'trapezius', trapezius: 'trapezius', 'levator scapulae': 'trapezius',
  
  // Bras / Arms
  biceps: 'biceps', 'biceps (long chef)': 'biceps', 'biceps (court chef)': 'biceps',
  'biceps (long)': 'biceps', 'biceps (court)': 'biceps',
  brachial: 'biceps', brachialis: 'biceps', 'biceps brachial': 'biceps', 'longue portion': 'biceps', 'courte portion': 'biceps',
  triceps: 'triceps', 'triceps (longue portion)': 'triceps', 'triceps (masse)': 'triceps',
  'triceps (vaste externe)': 'triceps', 'triceps (long)': 'triceps', 'triceps (vaste)': 'triceps',
  'triceps brachial': 'triceps', 'vastes': 'triceps',
  'avant-bras': 'forearm', avantbras: 'forearm', forearms: 'forearm', forearm: 'forearm', wrists: 'forearm',
  'wrist flexors': 'forearm', 'wrist extensors': 'forearm', 'grip muscles': 'forearm',
  bras: 'biceps', 'upper arms': 'biceps', 'lower arms': 'forearm',

  // Dos / Back
  dos: 'upper-back', back: 'upper-back', 'haut du dos': 'upper-back', 'upper back': 'upper-back', 'upper-back': 'upper-back',
  'dos (largeur)': 'upper-back', 'dos (épaisseur)': 'upper-back', 'dos (bas)': 'lower-back', 'dos (isolation)': 'upper-back',
  lats: 'upper-back', 'latissimus dorsi': 'upper-back', 'grand dorsal': 'upper-back', rhomboides: 'upper-back', rhomboids: 'upper-back',
  'bas du dos': 'lower-back', 'lower back': 'lower-back', 'lower-back': 'lower-back', lombaires: 'lower-back', lombes: 'lower-back', spine: 'lower-back',
  serratus: 'serratus', 'serratus anterior': 'serratus', 'dentelé': 'serratus',

  // Abdominaux / Core
  abdominaux: 'abs', abs: 'abs', core: 'abs', abdominals: 'abs', 'lower abs': 'abs', 'grand droit': 'abs',
  'abdos (bas)': 'abs', gainage: 'abs', transverse: 'abs', 'abdos': 'abs',
  obliques: 'obliques', taille: 'obliques', waist: 'abs',

  // Jambes / Legs
  quadriceps: 'quadriceps', quads: 'quadriceps', cuisses: 'quadriceps', jambes: 'quadriceps',
  'droit fémoral': 'quadriceps', 'vastes externe/interne': 'quadriceps',
  ischios: 'hamstring', 'ischio-jambiers': 'hamstring', ischiojambiers: 'hamstring', hamstring: 'hamstring', hamstrings: 'hamstring',
  fessiers: 'gluteal', glutes: 'gluteal', gluteal: 'gluteal', abductors: 'gluteal', abducteurs: 'gluteal', 'grand fessier': 'gluteal',
  adducteurs: 'adductors', adductors: 'adductors', groin: 'adductors', 'inner thighs': 'adductors',
  'fléchisseurs de hanche': 'hip-flexors', 'hip flexors': 'hip-flexors', 'hip-flexors': 'hip-flexors', psoas: 'hip-flexors',
  mollets: 'calves', calves: 'calves', soleus: 'calves', gastrocnemius: 'calves',
  tibiaux: 'tibialis', tibialis: 'tibialis', shins: 'tibialis', tibias: 'tibialis',

  // Systemic / Drop
  cardio: null, 'cardio (sèche)': null, 'cardiovascular system': null, ankles: null, feet: null, hands: null,
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
  Bras: { biceps: 0.5, triceps: 0.5 },
  'Avant-bras': { forearm: 1 },
  Abdominaux: { abs: 0.7, obliques: 0.3 },
  Abdos: { abs: 0.7, obliques: 0.3 },
  waist: { abs: 0.7, obliques: 0.3 },
  Quadriceps: { quadriceps: 1 },
  'Ischio-Jambiers': { hamstring: 1 },
  Ischios: { hamstring: 1 },
  Fessiers: { gluteal: 1 },
  Mollets: { calves: 0.8, tibialis: 0.2 },
  Lombaires: { 'lower-back': 1 },
  Adducteurs: { adductors: 1 },
  Abducteurs: { gluteal: 0.6, 'hip-flexors': 0.4 },
  Tibias: { tibialis: 1 },
  Cou: { trapezius: 1 },
  Cardio: {},
  'upper legs': { quadriceps: 0.4, hamstring: 0.35, gluteal: 0.25 },
  'lower legs': { calves: 0.8, tibialis: 0.2 },
  'upper arms': { biceps: 0.5, triceps: 0.5 },
  'lower arms': { forearm: 1 },
  neck: { trapezius: 1 },
  cardio: {},
};

/** Intelligent fuzzy resolver mapping any muscle name/submuscle/exercise label to a BodyMap slug */
function resolveSlug(name) {
  if (!name) return null;
  const raw = String(name).toLowerCase().trim();
  if (ALIAS[raw] !== undefined) return ALIAS[raw];

  // Strip parentheses and retry
  const cleaned = raw.replace(/\(.*?\)/g, '').trim();
  if (ALIAS[cleaned] !== undefined) return ALIAS[cleaned];

  // Keyword heuristic
  if (raw.includes('bicep') || raw.includes('brachial')) return 'biceps';
  if (raw.includes('tricep')) return 'triceps';
  if (raw.includes('avant-bras') || raw.includes('avantbras') || raw.includes('forearm')) return 'forearm';
  if (raw.includes('bras') || raw.includes('arm')) return 'biceps';
  if (raw.includes('pec') || raw.includes('chest')) return 'chest';
  if (raw.includes('lomb') || raw.includes('lower-back') || raw.includes('lower back')) return 'lower-back';
  if (raw.includes('dos') || raw.includes('lats') || raw.includes('back') || raw.includes('dorsal')) return 'upper-back';
  if (raw.includes('épaule') || raw.includes('epaule') || raw.includes('delt') || raw.includes('shoulder')) return 'deltoids';
  if (raw.includes('trap')) return 'trapezius';
  if (raw.includes('quad') || raw.includes('cuisse')) return 'quadriceps';
  if (raw.includes('ischio') || raw.includes('hamstring')) return 'hamstring';
  if (raw.includes('fessier') || raw.includes('glute')) return 'gluteal';
  if (raw.includes('adduct')) return 'adductors';
  if (raw.includes('abduct')) return 'gluteal';
  if (raw.includes('mollet') || raw.includes('calf') || raw.includes('calves')) return 'calves';
  if (raw.includes('tibia') || raw.includes('shin')) return 'tibialis';
  if (raw.includes('oblique')) return 'obliques';
  if (raw.includes('abdo') || raw.includes('abs') || raw.includes('core') || raw.includes('gainage') || raw.includes('transverse')) return 'abs';

  return null;
}

const SECONDARY_WEIGHT = 0.4;

/** Given an exercise item (Iron Track or openGym structure), return target muscles map { slug: weight } */
export function musclesOf(ex) {
  if (!ex) return {};
  const out = {};
  const add = (name, w) => {
    if (!name) return;
    const slug = resolveSlug(name);
    if (slug) out[slug] = Math.max(out[slug] || 0, w);
  };

  // Primary muscle / target
  add(ex.muscle, 1);
  add(ex.tg, 1);
  add(ex.subMuscle, 0.6);

  // If exercise is generic "Bras", add both biceps and triceps
  if (String(ex.muscle).toLowerCase() === 'bras') {
    out.biceps = Math.max(out.biceps || 0, 0.7);
    out.triceps = Math.max(out.triceps || 0, 0.7);
  }
  
  // Secondary muscles
  if (Array.isArray(ex.sm)) {
    ex.sm.forEach(m => add(m, SECONDARY_WEIGHT));
  } else if (typeof ex.sm === 'string') {
    add(ex.sm, SECONDARY_WEIGHT);
  }

  // Fallback to body part or exercise name heuristics if no specific mapped muscle
  if (!Object.keys(out).length) {
    const bpMap = BY_BODYPART[ex.muscle] || BY_BODYPART[ex.bp] || {};
    Object.assign(out, bpMap);

    // If still empty, check exercise name
    if (!Object.keys(out).length && ex.name) {
      add(ex.name, 1);
    }
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
