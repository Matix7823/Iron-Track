const CDN_BASE_IMG = "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/images/";
const CDN_BASE_GIF = "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/";

const LOCAL_IMG_BASE = import.meta.env.VITE_IMG_BASE || "/media/img/";
const LOCAL_GIF_BASE = import.meta.env.VITE_GIF_BASE || "/media/gif/";

export function imgSrc(ex) {
  if (!ex) return null;
  const fileName = ex.img || ex.image;
  if (!fileName) return null;
  if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
    return fileName;
  }
  return (import.meta.env.VITE_USE_LOCAL_MEDIA === "true" ? LOCAL_IMG_BASE : CDN_BASE_IMG) + fileName;
}

export function gifSrc(ex) {
  if (!ex) return null;
  const fileName = ex.gif || ex.mediaGif;
  if (!fileName) return null;
  if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
    return fileName;
  }
  return (import.meta.env.VITE_USE_LOCAL_MEDIA === "true" ? LOCAL_GIF_BASE : CDN_BASE_GIF) + fileName;
}
