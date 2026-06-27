"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

import AppIcon from "./AppIcon";
import { HOVER_SPRING } from "@/lib/motion";
import type { DockApp } from "@/types";

interface SocialFolderProps {
  socials: DockApp[];
  onActivate: (app: DockApp) => void;
}

/**
 * A macOS-style folder for the socials, shown only on small screens so the
 * dock never overflows. Tapping it springs open a small glass tray of the
 * social icons just above the dock; tapping one launches it and closes the
 * tray. The tray is portaled to <body> so it floats above the dock's clipped,
 * transformed container. Desktop keeps every social inline (not rendered here).
 */
export default function SocialFolder({ socials, onActivate }: SocialFolderProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState({ cx: 0, bottom: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    setAnchor({ cx: r.left + r.width / 2, bottom: window.innerHeight - r.top + 14 });
  }, []);

  const toggle = () => {
    if (!open) place();
    setOpen((v) => !v);
  };

  // Close on Escape or viewport resize.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onResize = () => setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const launch = (app: DockApp) => {
    onActivate(app);
    setOpen(false);
  };

  return (
    <div className="group relative flex flex-col items-center justify-end">
      {/* the folder tile — a frosted square holding mini app thumbnails */}
      <motion.button
        ref={btnRef}
        type="button"
        onClick={toggle}
        whileTap={{ scale: 0.85 }}
        transition={HOVER_SPRING}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Socials"
        className={`relative grid h-12 w-12 place-items-center rounded-[22%] border border-white/25
                    bg-white/20 p-1.5 shadow-dock backdrop-blur-md outline-none ring-accent
                    transition-colors focus-visible:ring-2 ${open ? "bg-white/30" : ""}`}
      >
        <span className="grid grid-cols-2 grid-rows-2 gap-1">
          {socials.slice(0, 4).map((app) => (
            <span
              key={app.id}
              className="h-3.5 w-3.5 rounded-[28%]"
              style={{
                backgroundImage: `linear-gradient(160deg, ${app.gradient[0]}, ${app.gradient[1]})`
              }}
              aria-hidden
            />
          ))}
        </span>
      </motion.button>

      {/* tray (portaled so it's never clipped by the dock's overflow) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.button
                  type="button"
                  aria-label="Close socials"
                  onClick={() => setOpen(false)}
                  className="fixed inset-0 z-[44] cursor-default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />

                <motion.div
                  role="menu"
                  aria-label="Socials"
                  initial={{ opacity: 0, scale: 0.78, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.82, y: 8, transition: { duration: 0.16 } }}
                  transition={{ ...HOVER_SPRING, stiffness: 360, damping: 26 }}
                  style={{
                    left: anchor.cx,
                    bottom: anchor.bottom,
                    x: "-50%",
                    originY: 1,
                    willChange: "transform, opacity"
                  }}
                  className="fixed z-[45] -translate-x-1/2 rounded-2xl border border-white/20
                             bg-white/15 p-2.5 shadow-dock backdrop-blur-glass backdrop-saturate-150"
                >
                  <p className="px-1 pb-2 pt-0.5 text-center text-[11px] font-medium text-white/70">
                    Socials
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {socials.map((app, i) => (
                      <motion.button
                        key={app.id}
                        type="button"
                        onClick={() => launch(app)}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.03 * i, ...HOVER_SPRING }}
                        whileTap={{ scale: 0.88 }}
                        aria-label={app.label}
                        className="flex flex-col items-center gap-1"
                      >
                        <span className="relative grid h-12 w-12 place-items-center rounded-[22%] shadow-dock">
                          <AppIcon app={app} />
                        </span>
                        <span className="text-[10px] font-medium text-white/75">{app.label}</span>
                      </motion.button>
                    ))}
                  </div>
                  {/* pointer toward the folder */}
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1.5
                               rotate-45 border-b border-r border-white/20 bg-white/15 backdrop-blur-glass"
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
