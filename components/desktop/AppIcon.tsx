"use client";

import type { DockApp } from "@/types";

/**
 * The visual of a dock icon — a rounded gradient tile with either a white
 * glyph (stroked or filled) or a logo image on top. Purely presentational and
 * fills its parent, so callers control the size (the dock magnifies it, the
 * socials folder renders it at a fixed size).
 */
export default function AppIcon({ app }: { app: DockApp }) {
  const [g0, g1] = app.gradient;

  return (
    <>
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
    </>
  );
}
