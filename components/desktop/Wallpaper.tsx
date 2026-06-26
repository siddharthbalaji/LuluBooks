"use client";

import { useEffect, useRef, useState } from "react";

import { wallpaperVideo, wallpaperPoster } from "@/lib/cloudinary";

/**
 * The desktop wallpaper.
 *
 * Performance plan for the 4K source:
 *  - A still poster paints in the first frame, so the desktop is never blank.
 *  - We pick a Cloudinary-resized stream sized to the screen (never the full
 *    4K), with f_auto/q_auto so the browser gets the smallest codec it can play.
 *  - The video is muted + inline + looped so it autoplays everywhere, and is
 *    decode-hinted but kept out of the layout/paint path (fixed, behind UI).
 *  - We pause it when the tab is hidden to save battery and GPU.
 */
export default function Wallpaper() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Choose a resolution tier from the actual device width (DPR-aware).
    const w = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
    const tier = w >= 2200 ? 2560 : w >= 1500 ? 1920 : 1280;
    setSrc(wallpaperVideo(tier));
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onVisibility = () => {
      if (document.hidden) video.pause();
      else video.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [src]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-accent-ink">
      {/* Instant poster underneath, fades out once the video is playing. */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{
          backgroundImage: `url(${wallpaperPoster(1280)})`,
          opacity: ready ? 0 : 1
        }}
      />
      {src && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          poster={wallpaperPoster(1280)}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setReady(true)}
        />
      )}
      {/* Subtle depth so light UI text always stays legible over the video. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/25" />
    </div>
  );
}
