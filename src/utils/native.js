import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Trigger a light vibration for minor actions
 */
export const hapticLight = async () => {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (e) {
    // Ignore if not supported or fails
  }
};

/**
 * Trigger a medium vibration for important actions (e.g. finishing a set)
 */
export const hapticMedium = async () => {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (e) {
    // Ignore
  }
};

/**
 * Trigger a success vibration
 */
export const hapticSuccess = async () => {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (e) {
    // Ignore
  }
};

/**
 * Schedule a notification for the end of a rest timer
 */
export const scheduleRestNotification = async (seconds) => {
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Temps de repos terminé ! ⏱",
          body: "Il est temps de retourner à l'entraînement. Let's go ! 💪",
          id: 101,
          schedule: { at: new Date(Date.now() + seconds * 1000) },
          sound: null,
          attachments: null,
          actionTypeId: "",
          extra: null,
        },
      ],
    });
  } catch (e) {
    console.error("Erreur notification locale:", e);
  }
};

/**
 * Cancel pending rest notifications
 */
export const cancelRestNotification = async () => {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: 101 }]
    });
  } catch (e) {
    // Ignore
  }
};
