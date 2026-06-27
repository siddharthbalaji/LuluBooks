"use client";

import { useEffect, useState } from "react";

/**
 * True only on devices with a precise, hovering pointer (mouse / trackpad).
 *
 * Used to gate dock magnification and tooltips: on touch screens there is no
 * reliable `mouseleave`, so a cursor-driven magnification can "stick" open
 * after a tap. We start `false` (mobile-first, also the safe SSR default so
 * the server and first client render agree) and flip to `true` after mount on
 * real pointer devices.
 */
export function useHoverCapable() {
  const [hoverCapable, setHoverCapable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setHoverCapable(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return hoverCapable;
}
