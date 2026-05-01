import { Capacitor } from '@capacitor/core';
import { HealthKit } from 'capacitor-healthkit';

export const syncWorkoutToAppleHealth = async (sessionData) => {
  if (Capacitor.isNativePlatform()) {
    try {
      // 1. Demander la permission si nécessaire
      await HealthKit.requestAuthorization({
        all: ['workout'],
        read: [],
        write: ['workout']
      });

      // 2. Enregistrer l'entraînement
      // Note: On utilise des valeurs par défaut pour la durée et les calories
      // car elles ne sont pas encore suivies précisément dans l'app.
      await HealthKit.saveWorkout({
        type: 'traditionalStrengthTraining',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        duration: 60, // 60 minutes par défaut
        energyBurned: sessionData.tonnage / 10, // Estimation très brute
        energyBurnedUnit: 'kilocalories'
      });
      
      return { success: true, method: 'native' };
    } catch (err) {
      console.error("Erreur HealthKit native:", err);
      // Fallback sur le raccourci si le natif échoue
      return triggerShortcut(sessionData);
    }
  } else {
    // Solution Web via Raccourcis
    return triggerShortcut(sessionData);
  }
};

const triggerShortcut = (sessionData) => {
  const input = encodeURIComponent(JSON.stringify(sessionData));
  const url = `shortcuts://run-shortcut?name=LogIronTrack&input=text&text=${input}`;
  window.location.href = url;
  return { success: true, method: 'shortcut' };
};
