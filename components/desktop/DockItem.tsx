"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationControls,
  useSpring,
  useTransform,
  type MotionValue
} from "framer-motion";

import AppIcon from "./AppIcon";
import type { DockApp } from "@/types";
import { DOCK_SPRING, EASE_OUT, HOVER_SPRING } from "@/lib/motion";

interface DockItemProps {
  app: DockApp;
  mouseX: MotionValue<number>;
  onActivate: (app: DockApp) => void;
  /**
   * When true (real pointer devices) the icon magnifies toward the cursor and
   * shows a hover tooltip. On touch devices this is false: magnification is
   * disabled entirely (it can otherwise "stick" open, since touch has no
   * reliable mouseleave) and a tap plays a smooth pop instead.
   */
  magnify: boolean;
}

const BASE = 48; // resting icon size (px)
const PEAK = 78; // size directly under the cursor
const RANGE = 140; // how far the magnification reaches

export default function DockItem({ app, mouseX, onActivate, magnify }: DockItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const pop = useAnimationControls();

  // Distance from cursor to this icon's center, along x.
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return RANGE * 2;
    return val - (bounds.x + bounds.width / 2);
  });

  // A cosine-shaped falloff reads smoother than a linear ramp at the edges.
  const sizeTarget = useTransform(distance, [-RANGE, 0, RANGE], [BASE, PEAK, BASE], {
    clamp: true
  });
  const size = useSpring(sizeTarget, DOCK_SPRING);

  const handleClick = () => {
    // On touch, give a small macOS-style pop in place of magnification:
    // a quick press-down then an eased rise back to rest.
    if (!magnify) {
      pop.start({
        scale: [0.92, 1.16, 1],
        transition: { duration: 0.45, ease: EASE_OUT, times: [0, 0.45, 1] }
      });
    }
    onActivate(app);
  };

  return (
    <div className="group relative flex flex-col items-center justify-end">
      {/* tooltip — only on hover-capable devices, never on touch */}
      {magnify && (
        <span
          className="pointer-events-none absolute -top-9 z-50 whitespace-nowrap rounded-md
                     bg-black/60 px-2 py-1 text-xs font-medium text-white opacity-0
                     shadow-dock backdrop-blur-md transition-all duration-200 ease-out
                     group-hover:-translate-y-0.5 group-hover:opacity-100"
        >
          {app.label}
        </span>
      )}

      <motion.button
        ref={ref}
        type="button"
        onClick={handleClick}
        animate={magnify ? undefined : pop}
        whileTap={magnify ? { scale: 0.85 } : undefined}
        transition={HOVER_SPRING}
        style={
          magnify
            ? { width: size, height: size, willChange: "width, height" }
            : { width: BASE, height: BASE }
        }
        className="relative grid place-items-center rounded-[22%] shadow-dock
                   outline-none ring-accent focus-visible:ring-2"
        aria-label={app.label}
      >
        <AppIcon app={app} />
      </motion.button>
    </div>
  );
}
