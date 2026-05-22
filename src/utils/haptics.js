export const triggerHaptic = (pattern = 15) => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      // Trigger native browser haptic feedback
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn("Haptic feedback is not supported or was blocked by active gesture requirements:", e);
    }
  }
};
