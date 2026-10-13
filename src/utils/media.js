import { exerciseLibrary } from "../data/exerciseLibrary";

const CDN_BASE_IMG = "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/images/";
const CDN_BASE_GIF = "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/";

const LOCAL_IMG_BASE = import.meta.env.VITE_IMG_BASE || "/media/img/";
const LOCAL_GIF_BASE = import.meta.env.VITE_GIF_BASE || "/media/gif/";

// Pre-index library by lowercase name for fast matching
const libraryByName = new Map();
if (Array.isArray(exerciseLibrary)) {
  exerciseLibrary.forEach(item => {
    if (item?.name && (item.img || item.gif)) {
      const key = item.name.trim().toLowerCase();
      if (!libraryByName.has(key)) libraryByName.set(key, item);
    }
  });
}

export function findLibraryMatch(ex) {
  if (!ex) return null;
  if (ex.img || ex.image || ex.gif || ex.mediaGif) return ex;
  if (ex.id) {
    const byId = exerciseLibrary.find(e => e.id === ex.id && (e.img || e.gif));
    if (byId) return byId;
  }
  if (ex.name) {
    const raw = ex.name.trim().toLowerCase();
    const exact = libraryByName.get(raw);
    if (exact) return exact;

    // Try without parentheses
    const clean = raw.replace(/\(.*?\)/g, '').trim();
    if (clean.length >= 3) {
      for (const [k, item] of libraryByName.entries()) {
        const kClean = k.replace(/\(.*?\)/g, '').trim();
        if (kClean === clean || k.startsWith(clean) || clean.startsWith(kClean)) {
          return item;
        }
      }
    }
  }
  return null;
}

export function imgSrc(ex) {
  if (!ex) return null;
  const match = findLibraryMatch(ex) || ex;
  const fileName = match.img || match.image;
  if (!fileName) return null;
  if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
    return fileName;
  }
  return (import.meta.env.VITE_USE_LOCAL_MEDIA === "true" ? LOCAL_IMG_BASE : CDN_BASE_IMG) + fileName;
}

export function gifSrc(ex) {
  if (!ex) return null;
  const match = findLibraryMatch(ex) || ex;
  const fileName = match.gif || match.mediaGif;
  if (!fileName) return null;
  if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
    return fileName;
  }
  return (import.meta.env.VITE_USE_LOCAL_MEDIA === "true" ? LOCAL_GIF_BASE : CDN_BASE_GIF) + fileName;
}

