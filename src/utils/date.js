// Utilitaires de dates
export const parseDate = (dateStr) => {
  if (!dateStr) return new Date(0);
  const parts = dateStr.split("/");
  if (parts.length !== 3) return new Date(0);
  return new Date(parts[2], parts[1] - 1, parts[0]);
};

export const formatDateFR = () => {
  return new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatTimerDisplay = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};
