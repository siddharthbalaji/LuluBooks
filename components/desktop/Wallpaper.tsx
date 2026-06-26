"use client";

import { useState } from "react";

import { wallpaperImage, wallpaperSrcSet } from "@/lib/cloudinary";

/**
 * The desktop wallpaper — a single optimized still image from Cloudinary.
 *
 * Resilience plan (so the desktop is never a blurry smudge):
 *  - A real gradient is always painted underneath, so even if the image fails
 *    the background still looks intentional.
 *  - The full image is served via a responsive srcSet (f_auto / q_auto:good),
 *    so each device downloads only the resolution it can show — sharp on big
 *    displays, light on phones. No video decode means no lag.
 *  - The image only fades in once it has actually decoded; if it can't load,
 *    the gradient simply stays. No "blur-only" broken state.
 *
 *  To swap the wallpaper, change the asset in lib/cloudinary.ts.
 */
export default function Wallpaper() {
  const [loaded, setLoaded] = useState(false);

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

      {/* Full optimized image, faded in only after it actually decodes. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={wallpaperImage(2560)}
        srcSet={wallpaperSrcSet()}
        sizes="100vw"
        alt=""
        aria-hidden
        decoding="async"
        fetchPriority="high"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Subtle depth so light UI text always stays legible over the image. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/25" />
    </div>
  );
}
