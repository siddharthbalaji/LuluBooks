"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue
} from "framer-motion";

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

  const [g0, g1] = app.gradient;

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
        <svg viewBox="0 0 24 24" className="h-full w-full">
          <defs>
            <linearGradient id={`grad-${app.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={g0} />
              <stop offset="100%" stopColor={g1} />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="24" height="24" rx="5.4" fill={`url(#grad-${app.id})`} />
          <rect x="0" y="0" width="24" height="11" rx="5.4" fill="white" fillOpacity="0.12" />
          {app.glyph &&
            (app.filled ? (
              <path d={app.glyph} fill="white" />
            ) : (
              <path
                d={app.glyph}
                fill="none"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
        </svg>

        {/* Logo-image icons (e.g. Portfolio) sit on top of the gradient tile. */}
        {app.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={app.image}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 m-auto h-[58%] w-[58%] object-contain
                       drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
          />
        )}
      </motion.button>
    </div>
  );
}
