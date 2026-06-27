"use client";

import { motion, useMotionValue } from "framer-motion";

import DockItem from "./DockItem";
import { dockApps } from "@/lib/dock";
import { useUIStore } from "@/store/useUIStore";
import { EASE_OUT } from "@/lib/motion";
import type { DockApp } from "@/types";

export default function Dock() {
  const mouseX = useMotionValue(Number.POSITIVE_INFINITY);
  const openBook = useUIStore((s) => s.openBook);
  const focusBooks = useUIStore((s) => s.focusBooks);
  const openSearch = useUIStore((s) => s.openSearch);

  const handleActivate = (app: DockApp) => {
    switch (app.action.type) {
      case "lightbox":
        if (app.action.bookId) openBook(app.action.bookId);
        break;
      case "focus-books":
        focusBooks();
        break;
      case "search":
        openSearch();
        break;
      case "link":
        if (app.action.href) {
          if (app.action.href.startsWith("#")) {
            // local anchors → just nudge the book grid for now (no scroll page)
            focusBooks();
          } else {
            window.open(app.action.href, "_blank", "noopener,noreferrer");
          }
        }
        break;
      default:
        break;
    }
  };

  return (
    <motion.div
      initial={{ y: 96, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.7, ease: EASE_OUT }}
      className="fixed inset-x-0 bottom-3 z-30 flex justify-center px-3"
    >
      {/*
        On phones the full row can be wider than the screen, so the bar itself
        scrolls horizontally (capped to the viewport) instead of pushing icons
        off-screen. The magnification math is mouse-driven, so touch devices
        simply get an evenly-sized, scrollable dock.
      */}
      <div
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
        className="dock-scroll flex max-w-full items-end gap-2 overflow-x-auto rounded-3xl
                   border border-white/25 bg-white/15 px-2.5 py-2 shadow-dock
                   backdrop-blur-glass backdrop-saturate-150
                   sm:gap-3 sm:px-3 sm:py-2.5"
      >
        {dockApps.map((app) => (
          <div key={app.id} className="flex shrink-0 items-end gap-2 sm:gap-3">
            <DockItem app={app} mouseX={mouseX} onActivate={handleActivate} />
            {app.dividerAfter && (
              <span className="mb-1 h-12 w-px self-center bg-white/25" aria-hidden />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
