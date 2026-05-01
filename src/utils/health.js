import { Capacitor } from '@capacitor/core';
import { Health } from '@capgo/capacitor-health';

export const syncWorkoutToAppleHealth = async (sessionData) => {
  if (Capacitor.isNativePlatform()) {
    try {
      const { available } = await Health.isAvailable();
      if (!available) {
        return triggerShortcut(sessionData);
      }

      // 1. Demander la permission si nécessaire
      await Health.requestAuthorization({
        read: [],
        write: ['workouts']
      });

      // 2. Enregistrer l'entraînement
      // Note: On utilise des valeurs par défaut pour la durée et les calories
      // car elles ne sont pas encore suivies précisément dans l'app.
      await Health.saveWorkout({
        activityType: 'traditionalStrengthTraining',
        startDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Il y a 1h
        endDate: new Date().toISOString(),
        energy: Math.round(sessionData.tonnage / 10), // Estimation très brute
        energyUnit: 'kilocalorie'
      });
      
      return { success: true, method: 'native' };
    } catch (err) {
      console.error("Erreur Health native:", err);
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
