import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { User, Activity, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

const OnboardingModal = () => {
  const { gender, changeGender, age, changeAge, bodyWeightHistory, saveBodyData, currentBodyWeight } = useApp();
  
  // Si tout est défini (genre, âge, poids), ne pas afficher
  const hasWeight = currentBodyWeight && currentBodyWeight > 0;
  const isComplete = gender && age && hasWeight;

  const [isOpen, setIsOpen] = useState(!isComplete);
  const [step, setStep] = useState(1);
  const [localGender, setLocalGender] = useState(gender || '');
  const [localAge, setLocalAge] = useState(age || '');
  const [localWeight, setLocalWeight] = useState(hasWeight ? currentBodyWeight : '');
  const [saving, setSaving] = useState(false);

  // S'assurer de ne pas s'afficher si déjà complété
  if (isComplete || !isOpen) return null;

  const handleNext = () => {
    if (step === 1 && localGender) {
      triggerHaptic(15);
      setStep(2);
    } else if (step === 2 && localAge) {
      triggerHaptic(15);
      setStep(3);
    }
  };

  const handleFinish = async () => {
    if (!localWeight || !localAge || !localGender) return;
    setSaving(true);
    
    // Sauvegarder dans le context
    changeGender(localGender);
    changeAge(localAge);
    if (!hasWeight || parseFloat(localWeight) !== parseFloat(currentBodyWeight)) {
      await saveBodyData(localWeight);
    }
    
    setSaving(false);
    triggerHaptic([30, 40, 50]);
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card relative z-10 w-full max-w-sm p-6 overflow-hidden border-blue-500/30 glow-blue"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
          <User size={100} className="text-blue-400" />
        </div>

        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="text-center mb-6 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-3">
            <Activity size={24} className="text-blue-400" />
          </div>
          <h2 className="text-xl font-black text-white">Personnalisons ton IA</h2>
          <p className="text-xs text-slate-400 mt-1">
            Ces infos permettent d'adapter les charges, le volume et le choix des exercices à ton profil.
          </p>
        </div>

        {/* Etape 1 : Genre */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-sm font-bold text-white mb-3 text-center">Quel est ton sexe biologique ?</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                  onClick={() => setLocalGender('homme')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    localGender === 'homme' ? 'bg-blue-500/20 border-blue-400 text-blue-300' : 'bg-slate-900/50 border-white/5 text-slate-400'
                  }`}
                >
                  <span className="text-2xl">👨</span>
                  <span className="text-xs font-bold uppercase">Homme</span>
                </button>
                <button 
                  onClick={() => setLocalGender('femme')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    localGender === 'femme' ? 'bg-pink-500/20 border-pink-400 text-pink-300' : 'bg-slate-900/50 border-white/5 text-slate-400'
                  }`}
                >
                  <span className="text-2xl">👩</span>
                  <span className="text-xs font-bold uppercase">Femme</span>
                </button>
              </div>
              <button 
                onClick={handleNext}
                disabled={!localGender}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {/* Etape 2 : Age */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-sm font-bold text-white mb-3 text-center">Quel est ton âge ?</p>
              <div className="mb-6">
                <input 
                  type="number" 
                  min="12" max="100"
                  value={localAge}
                  onChange={(e) => setLocalAge(e.target.value)}
                  placeholder="ex: 25"
                  className="input-premium text-center text-2xl font-black py-4"
                />
              </div>
              <button 
                onClick={handleNext}
                disabled={!localAge || localAge < 12}
                className="btn-primary w-full disabled:opacity-50"
              >
                Suivant <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {/* Etape 3 : Poids */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <p className="text-sm font-bold text-white mb-3 text-center">Quel est ton poids actuel ? (kg)</p>
              <div className="mb-6 relative">
                <input 
                  type="number" 
                  step="0.1"
                  min="30" max="250"
                  value={localWeight}
                  onChange={(e) => setLocalWeight(e.target.value)}
                  placeholder="ex: 75.5"
                  className="input-premium text-center text-2xl font-black py-4 pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">kg</span>
              </div>
              <button 
                onClick={handleFinish}
                disabled={!localWeight || saving}
                className="btn-primary w-full disabled:opacity-50 !bg-emerald-600 !border-emerald-400"
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Terminer <CheckCircle2 size={16} /></>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3].map(i => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${step === i ? 'bg-blue-400 scale-125' : step > i ? 'bg-blue-400/50' : 'bg-white/10'}`} />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
