"use client";

import { useState } from "react";

import {
  wallpaperImage,
  wallpaperSrcSet,
  wallpaperMobileSrcSet
} from "@/lib/cloudinary";

/**
 * The wallpaper — a single optimized still image from Cloudinary, chosen by
 * device:
 *  - phones (≤640px) get the portrait mobile asset;
 *  - iPads/tablets and desktops get the landscape PC asset (object-cover keeps
 *    it filling the screen on tablet portrait too).
 *
 * Resilience plan (so the desktop is never a blurry smudge):
 *  - A real gradient is always painted underneath, so even if the image fails
 *    the background still looks intentional.
 *  - Each device downloads only the resolution it can show via responsive
 *    srcSets (f_auto / q_auto:good / c_limit — never upscaled). No video decode
 *    means no lag.
 *
 *  To swap a wallpaper, change the asset id in lib/cloudinary.ts.
 */
export default function Wallpaper() {
  const [, setLoaded] = useState(false);

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

      {/* Device-appropriate optimized image. The <source> wins on phones; iPads
          and desktops fall through to the landscape PC asset on the <img>. */}
      <picture>
        <source
          media="(max-width: 640px)"
          srcSet={wallpaperMobileSrcSet()}
          sizes="100vw"
        />
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
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>

      {/* Subtle depth so light UI text always stays legible over the image. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/25" />
    </div>
  );
}
