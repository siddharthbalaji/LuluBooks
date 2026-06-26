/**
 * Cloudinary delivers transformed assets on the fly by injecting a
 * transformation segment into the URL. We use this to turn the raw 4K
 * wallpaper into a right-sized, auto-quality, auto-codec stream so the
 * desktop paints instantly and never stutters.
 */

const CLOUD_NAME = "dxqucwyyo";
const VIDEO_BASE = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload`;

/** Raw asset identifiers (version + public id). */
const WALLPAPER_ID = "v1782467528/Wallpaper_gshnke";

/**
 * Optimized wallpaper video.
 * - f_auto: best codec the browser supports (webm/h265/h264)
 * - q_auto: perceptual quality target (much smaller than the 4K source)
 * - w_*: cap the resolution so we never decode more pixels than the screen shows
 */
export function wallpaperVideo(width: number): string {
  return `${VIDEO_BASE}/f_auto,q_auto,w_${width}/${WALLPAPER_ID}.mp4`;
}

/** A single still frame used as an instant poster while the video buffers. */
export function wallpaperPoster(width = 1280): string {
  return `${VIDEO_BASE}/f_auto,q_auto,w_${width},so_0/${WALLPAPER_ID}.jpg`;
}

/** Ready-made source set: the browser/media stack picks what it can play. */
export const WALLPAPER_SOURCES = {
  desktop: wallpaperVideo(2560),
  laptop: wallpaperVideo(1920),
  mobile: wallpaperVideo(1280)
};

/** The "Coming Soon" placeholder icon, color-coded site-side via CSS mask. */
export const COMING_SOON_ICON =
  "https://res.cloudinary.com/dxqucwyyo/image/upload/f_auto,q_auto/v1782458940/coming-soon-icon_bqxftf.png";
