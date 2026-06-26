"use client";

import { useState } from "react";

import { wallpaperImage, wallpaperLqip, wallpaperSrcSet } from "@/lib/cloudinary";

/**
 * The desktop wallpaper — a single optimized still image.
 *
 * Performance plan:
 *  - A tiny blurred LQIP paints in the first frame, so the desktop is never
 *    blank while the full image streams in.
 *  - The full image is served via a responsive srcSet (f_auto/q_auto), so each
 *    device downloads only the resolution it can actually show — a phone never
 *    pulls a desktop-sized file. No video decode means no lag.
 *  - It's fixed and out of the layout/paint path, behind all UI.
 */
export default function Wallpaper() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-accent-ink">
      {/* Instant blurred placeholder underneath. */}
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center blur-xl transition-opacity duration-700"
        style={{
          backgroundImage: `url(${wallpaperLqip()})`,
          opacity: loaded ? 0 : 1
        }}
      />

      {/* Full optimized image. */}
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
