"use client";

import { useRef } from "react";
import {
  motion,
  useSpring,
  useTransform,
  type MotionValue
} from "framer-motion";

import AppIcon from "./AppIcon";
import type { DockApp } from "@/types";
import { DOCK_SPRING, HOVER_SPRING } from "@/lib/motion";

interface DockItemProps {
  app: DockApp;
  mouseX: MotionValue<number>;
  onActivate: (app: DockApp) => void;
}

const BASE = 48; // resting icon size (px)
const PEAK = 78; // size directly under the cursor
const RANGE = 140; // how far the magnification reaches

export default function DockItem({ app, mouseX, onActivate }: DockItemProps) {
  const ref = useRef<HTMLButtonElement>(null);

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

  return (
    <div className="group relative flex flex-col items-center justify-end">
      {/* tooltip */}
      <motion.span
        initial={false}
        className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md
                   bg-black/55 px-2 py-1 text-xs font-medium text-white opacity-0
                   backdrop-blur-md transition-all duration-200 ease-out
                   group-hover:-translate-y-0.5 group-hover:opacity-100"
      >
        {app.label}
      </motion.span>

      <motion.button
        ref={ref}
        type="button"
        onClick={() => onActivate(app)}
        whileTap={{ scale: 0.85 }}
        transition={HOVER_SPRING}
        style={{ width: size, height: size, willChange: "width, height" }}
        className="relative grid place-items-center rounded-[22%] shadow-dock
                   outline-none ring-accent focus-visible:ring-2"
        aria-label={app.label}
      >
        <AppIcon app={app} />
      </motion.button>
    </div>
  );
}
