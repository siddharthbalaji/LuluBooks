"use client";

import { useState } from "react";

import { wallpaperImage, wallpaperSrcSet } from "@/lib/cloudinary";

/**
 * The desktop wallpaper.
 *
 * Resilience plan (so the desktop is never just a blurry smudge):
 *  - A real gradient is always painted underneath, so even if every image
 *    fails the background still looks intentional.
 *  - The wallpaper is loaded from a LOCAL file first (`/wallpaper.jpg` in
 *    /public) — no external dependency, no quota, no surprise outages.
 *  - If the local file is missing, it falls back to the optimized Cloudinary
 *    image automatically.
 *  - The image only fades in once it has actually decoded; if it can't load,
 *    the gradient simply stays. No "blur-only" broken state.
 *
 *  ┌──────────────────────────────────────────────────────────────────┐
 *  │  Drop your wallpaper at  public/wallpaper.jpg  to use it locally. │
 *  └──────────────────────────────────────────────────────────────────┘
 */

const LOCAL_WALLPAPER = "/wallpaper.jpg";

export default function Wallpaper() {
  const [loaded, setLoaded] = useState(false);
  // Start with the local file; on error, swap to the Cloudinary fallback once.
  const [src, setSrc] = useState(LOCAL_WALLPAPER);
  const [triedFallback, setTriedFallback] = useState(false);

  const isLocal = src === LOCAL_WALLPAPER;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-accent-ink">
      {/* Always-on gradient base — the desktop is never blank or smudgy. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, #16314f 0%, #0d2036 45%, #0A1628 100%)"
        }}
      />

      {/* The wallpaper image, faded in only after it actually decodes. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        // Cloudinary fallback also benefits from a responsive srcSet.
        srcSet={isLocal ? undefined : wallpaperSrcSet()}
        sizes="100vw"
        alt=""
        aria-hidden
        decoding="async"
        fetchPriority="high"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!triedFallback) {
            setTriedFallback(true);
            setLoaded(false);
            setSrc(wallpaperImage(2560));
          }
        }}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Subtle depth so light UI text always stays legible over the image. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/25" />
    </div>
  );
}
