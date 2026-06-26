"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";

import WaterSurface from "./WaterSurface";
import { useMousePosition } from "@/hooks/useMousePosition";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Full-viewport WebGL overlay for the water glints. It sits above the video
 * wallpaper and below the desktop UI, with pointer-events disabled so the dock
 * and books stay fully interactive. We skip it entirely when the user prefers
 * reduced motion or is on a touch-only device (the wallpaper alone carries the
 * scene there), and we cap the pixel ratio so it never overdraws.
 */
export default function WaterScene() {
  const pointer = useMousePosition();
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Only run the simulation on devices with a fine pointer (mouse/trackpad).
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    setEnabled(fine && !reduced);
  }, [reduced]);

  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-10 mix-blend-screen"
      aria-hidden
    >
      <Canvas
        frameloop="always"
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "high-performance"
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <WaterSurface pointer={pointer} />
      </Canvas>
    </div>
  );
}
