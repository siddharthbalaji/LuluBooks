/**
 * Cloudinary delivers transformed assets on the fly by injecting a
 * transformation segment into the URL. We use this to serve the wallpapers as
 * right-sized, auto-format, high-quality images so the desktop paints fast and
 * stays sharp (no video decode, no stutter).
 *
 * Two source assets:
 *  - desktop/tablet wallpaper (landscape) — used on PCs *and* iPads/tablets.
 *  - mobile wallpaper (portrait)          — used on phones only.
 * The <picture> element in Wallpaper.tsx picks between them by viewport width.
 *
 * URLs carry no Cloudinary version segment — the public id alone always
 * resolves to the latest upload.
 */

const CLOUD_NAME = "dxqucwyyo";
const IMAGE_BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

/** Public ids (no version). Both assets are JPEGs. */
const WALLPAPER_DESKTOP_ID = "wallpaper_stio33";
const WALLPAPER_MOBILE_ID = "wallpaper-mobile_elqray";

/**
 * Build an optimized delivery URL for a wallpaper asset at a target width.
 * - f_auto: best format the browser supports (AVIF/WebP/JPEG)
 * - q_auto:good: high perceptual quality (crisp, not over-compressed)
 * - c_limit + w_*: cap to the requested width but never upscale past the
 *   source, so we never deliver a soft, blown-up image.
 */
function deliver(id: string, width: number, quality = "q_auto:good"): string {
  return `${IMAGE_BASE}/f_auto,${quality},c_limit,w_${width}/${id}.jpg`;
}

/* ---- Desktop / tablet (PC + iPad) ------------------------------------- */

/** Optimized desktop/tablet wallpaper at a given width. */
export function wallpaperImage(width: number): string {
  return deliver(WALLPAPER_DESKTOP_ID, width);
}

/**
 * Responsive srcSet for the desktop/tablet wallpaper. The browser picks the
 * smallest width that still covers the viewport at the device's pixel density,
 * so an iPad gets a sharp-but-light image and a 4K display gets a crisp one.
 */
export function wallpaperSrcSet(): string {
  return [1280, 1920, 2560, 3840]
    .map((w) => `${wallpaperImage(w)} ${w}w`)
    .join(", ");
}

/** Tiny blurred LQIP for the desktop/tablet wallpaper. */
export function wallpaperLqip(): string {
  return `${IMAGE_BASE}/f_auto,q_auto:low,c_limit,w_64,e_blur:800/${WALLPAPER_DESKTOP_ID}.jpg`;
}

/* ---- Mobile (phones only) -------------------------------------------- */

/** Optimized portrait wallpaper for phones at a given width. */
export function wallpaperMobileImage(width: number): string {
  return deliver(WALLPAPER_MOBILE_ID, width);
}

/**
 * Responsive srcSet for the phone wallpaper. Widths cover common phone
 * viewports across pixel densities (≈360–430 CSS px × up to 3× DPR).
 */
export function wallpaperMobileSrcSet(): string {
  return [480, 640, 828, 1080, 1290]
    .map((w) => `${wallpaperMobileImage(w)} ${w}w`)
    .join(", ");
}

/* ---- Misc ------------------------------------------------------------- */

/** The "Coming Soon" placeholder icon, color-coded site-side via CSS mask. */
export const COMING_SOON_ICON =
  "https://res.cloudinary.com/dxqucwyyo/image/upload/f_auto,q_auto/coming-soon-icon_bqxftf.png";
