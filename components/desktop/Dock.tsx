"use client";

import { Fragment } from "react";
import { motion, useMotionValue } from "framer-motion";

import DockItem from "./DockItem";
import SocialFolder from "./SocialFolder";
import { dockApps } from "@/lib/dock";
import { useUIStore } from "@/store/useUIStore";
import { EASE_OUT } from "@/lib/motion";
import type { DockApp } from "@/types";

// The social/contact cluster. On phones these collapse into one folder so the
// dock can't overflow; on desktop they stay inline exactly as before.
const SOCIAL_IDS = ["instagram", "linkedin", "discord", "mail"];

const Divider = () => (
  <span className="mb-1 h-12 w-px self-center bg-white/25" aria-hidden />
);

export default function Dock() {
  const mouseX = useMotionValue(Number.POSITIVE_INFINITY);
  const openBook = useUIStore((s) => s.openBook);
  const focusBooks = useUIStore((s) => s.focusBooks);
  const openSearch = useUIStore((s) => s.openSearch);

  const socials = dockApps.filter((a) => SOCIAL_IDS.includes(a.id));
  const firstSocialId = socials[0]?.id;

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
      <div
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
        className="dock-scroll flex max-w-full items-end gap-2 overflow-x-auto rounded-3xl
                   border border-white/25 bg-white/15 px-2.5 py-2 shadow-dock
                   backdrop-blur-glass backdrop-saturate-150
                   sm:gap-3 sm:px-3 sm:py-2.5"
      >
        {dockApps.map((app) => {
          const isSocial = SOCIAL_IDS.includes(app.id);
          return (
            <Fragment key={app.id}>
              {/* Inject the mobile-only socials folder where the cluster begins. */}
              {app.id === firstSocialId && (
                <div className="flex shrink-0 items-end gap-2 sm:hidden">
                  <SocialFolder socials={socials} onActivate={handleActivate} />
                  <Divider />
                </div>
              )}

              {/* Social icons render inline on desktop, hidden on mobile. */}
              <div
                className={`shrink-0 items-end gap-2 sm:flex sm:gap-3 ${
                  isSocial ? "hidden" : "flex"
                }`}
              >
                <DockItem app={app} mouseX={mouseX} onActivate={handleActivate} />
                {app.dividerAfter && <Divider />}
              </div>
            </Fragment>
          );
        })}
      </div>
    </motion.div>
  );
}
