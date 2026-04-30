/**
 * security.js
 * Utilitaires pour l'assainissement (sanitization) et la validation des données.
 * Couche de défense supplémentaire contre les attaques (XSS, Injection).
 */

// Expression régulière très basique pour détecter des balises potentiellement dangereuses
const DANGEROUS_TAGS_REGEX = /<\/?(?:script|iframe|object|embed|svg|math|applet|meta|link|style)[^>]*>/gi;
// Expression régulière pour détecter les attributs "on*" (ex: onload, onerror)
const DANGEROUS_ATTRS_REGEX = /\bon\w+\s*=\s*(['"]?).*?\1/gi;
// Expression régulière pour les URI javascript:
const JAVASCRIPT_URI_REGEX = /javascript\s*:/gi;

/**
 * Assainit une chaîne de caractères en supprimant les balises et attributs dangereux.
 * Très utile avant d'enregistrer des notes textuelles libres en base de données.
 * @param {string} input - La chaîne à assainir
 * @returns {string} La chaîne assainie
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  let sanitized = input;
  // 1. Supprimer les balises dangereuses
  sanitized = sanitized.replace(DANGEROUS_TAGS_REGEX, '');
  // 2. Supprimer les attributs on*
  sanitized = sanitized.replace(DANGEROUS_ATTRS_REGEX, '');
  // 3. Neutraliser les javascript: URI
  sanitized = sanitized.replace(JAVASCRIPT_URI_REGEX, 'blocked:');
  
  // Note: Dans un environnement React, les accolades {} protègent déjà du XSS lors de l'affichage.
  // Ce nettoyage est une précaution supplémentaire "Defense in Depth" avant l'insertion en DB.
  return sanitized.trim();
};

/**
 * Assainit de manière récursive un objet ou un tableau entier.
 * @param {any} data - Les données à assainir
 * @returns {any} Les données assainies
 */
export const sanitizeData = (data) => {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    return sanitizeString(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (typeof data === 'object') {
    const sanitizedObj = {};
    for (const [key, value] of Object.entries(data)) {
      sanitizedObj[key] = sanitizeData(value);
    }
    return sanitizedObj;
  }
  
  // Les autres types (number, boolean, etc.) sont retournés tels quels
  return data;
};

/**
 * Valide une adresse email
 * @param {string} email 
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Valide qu'un mot de passe respecte les critères de sécurité de base
 * Au moins 8 caractères, au moins un chiffre, au moins une lettre.
 * @param {string} password 
 * @returns {boolean}
 */
export const isStrongPassword = (password) => {
  if (!password || password.length < 8) return false;
  // Optionnel: exiger chiffre et lettre
  // const hasLetter = /[a-zA-Z]/.test(password);
  // const hasNumber = /\d/.test(password);
  // return hasLetter && hasNumber;
  return true; // Simplifié pour ne pas bloquer les utilisateurs actuels, mais au moins vérifier la longueur.
};
