"use client";

import { useEffect, useRef } from "react";

/**
 * Tracks the pointer without re-rendering on every move. The latest value
 * lives in a ref so animation loops (the water shader, the dock) can read it
 * at their own cadence. Normalized coords are 0..1 across the viewport.
 */
export interface PointerState {
  x: number; // pixels
  y: number; // pixels
  nx: number; // normalized 0..1
  ny: number; // normalized 0..1
  active: boolean;
}

export function useMousePosition() {
  const pointer = useRef<PointerState>({
    x: 0,
    y: 0,
    nx: 0.5,
    ny: 0.5,
    active: false
  });

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
      pointer.current.nx = e.clientX / window.innerWidth;
      pointer.current.ny = e.clientY / window.innerHeight;
      pointer.current.active = true;
    };
    const handleLeave = () => {
      pointer.current.active = false;
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerleave", handleLeave);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return pointer;
}
