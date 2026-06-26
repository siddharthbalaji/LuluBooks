/**
 * Cloudinary delivers transformed assets on the fly by injecting a
 * transformation segment into the URL. We use this to serve the wallpaper as a
 * right-sized, auto-format, auto-quality image so the desktop paints instantly
 * and stays perfectly smooth (no video decode, no stutter).
 */

const CLOUD_NAME = "dxqucwyyo";
const IMAGE_BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

/** Wallpaper public id (no version segment needed). */
const WALLPAPER_ID = "Wallpaper_bi802o";

/**
 * Optimized wallpaper image at a given width.
 * - f_auto: best format the browser supports (AVIF/WebP/JPEG)
 * - q_auto: perceptual quality target (a fraction of the original file size)
 * - w_*: never deliver more pixels than the screen can show
 */
export function wallpaperImage(width: number): string {
  return `${IMAGE_BASE}/f_auto,q_auto,w_${width}/${WALLPAPER_ID}.jpg`;
}

/**
 * A tiny, heavily blurred version used as an instant low-quality placeholder
 * (LQIP). It paints in the first frame so the desktop is never blank while the
 * full image streams in.
 */
export function wallpaperLqip(): string {
  return `${IMAGE_BASE}/f_auto,q_auto:low,w_64,e_blur:800/${WALLPAPER_ID}.jpg`;
}

/**
 * Responsive srcSet: the browser picks the smallest width that still covers the
 * viewport at the device's pixel density. This is the main optimization — a
 * phone never downloads a desktop-sized image.
 */
export function wallpaperSrcSet(): string {
  return [1280, 1920, 2560, 3840]
    .map((w) => `${wallpaperImage(w)} ${w}w`)
    .join(", ");
}

/** The "Coming Soon" placeholder icon, color-coded site-side via CSS mask. */
export const COMING_SOON_ICON =
  "https://res.cloudinary.com/dxqucwyyo/image/upload/f_auto,q_auto/v1782458940/coming-soon-icon_bqxftf.png";
