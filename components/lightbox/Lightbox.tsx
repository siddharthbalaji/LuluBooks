"use client";

import { useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import { getBook } from "@/lib/books";
import { useUIStore } from "@/store/useUIStore";
import { EASE_OUT, LIGHTBOX_SPRING } from "@/lib/motion";

export default function Lightbox() {
  const openBookId = useUIStore((s) => s.openBookId);
  const openOrigin = useUIStore((s) => s.openOrigin);
  const closeBook = useUIStore((s) => s.closeBook);
  const openReader = useUIStore((s) => s.openReader);
  const book = openBookId ? getBook(openBookId) : undefined;

  // Offset from screen center to the clicked cover, so the panel appears to
  // zoom out of (and collapse back into) the book — macOS Quick Look style.
  const dx =
    openOrigin && typeof window !== "undefined" ? openOrigin.x - window.innerWidth / 2 : 0;
  const dy =
    openOrigin && typeof window !== "undefined" ? openOrigin.y - window.innerHeight / 2 : 0;

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBook();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeBook]);

  return (
    <AnimatePresence>
      {book && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          {/* backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={closeBook}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* centering wrapper — scrolls when the panel is taller than the
              viewport (e.g. small phones), so the close button up top stays
              reachable instead of being clipped off-screen. */}
          <div className="relative flex min-h-full items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          {/* panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={book.title}
            initial={{ opacity: 0, scale: 0.4, x: dx, y: dy }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.4,
              x: dx,
              y: dy,
              transition: { duration: 0.24, ease: EASE_OUT }
            }}
            transition={LIGHTBOX_SPRING}
            style={{ willChange: "transform, opacity" }}
            className="relative grid w-full max-w-2xl grid-cols-1 gap-6 overflow-hidden
                       rounded-3xl border border-white/15 bg-accent-ink/95 p-6 shadow-2xl
                       backdrop-blur-xl sm:grid-cols-[200px_1fr] sm:p-7"
          >
            {/* close chip */}
            <button
              type="button"
              onClick={closeBook}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full
                         bg-white/20 text-white transition-colors hover:bg-white/35"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            {/* cover */}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/20 shadow-book">
              {book.cover ? (
                <Image
                  src={book.cover}
                  alt={`${book.title} cover`}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-accent/30" />
              )}
            </div>

            {/* details */}
            <div className="flex flex-col text-white">
              <h2 className="text-2xl font-semibold leading-tight">{book.title}</h2>
              <p className="mt-1 text-sm text-white/70">{book.author}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-white/85">
                {book.description}
              </p>

              <div className="mt-auto flex flex-wrap gap-3 pt-6">
                {book.file ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openReader(book.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white
                                 shadow-lg shadow-accent/30 transition-transform hover:scale-[1.03]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                          d="M6 4h9a3 3 0 013 3v13H9a3 3 0 01-3-3zM6 4v13M9 8h6M9 11h6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Read now
                    </button>
                    <a
                      href={book.file}
                      download
                      className="rounded-full border border-white/30 bg-white/10 px-5 py-2.5
                                 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                    >
                      Download
                    </a>
                  </>
                ) : (
                  <span className="rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm text-white/80">
                    File coming soon
                  </span>
                )}
              </div>
            </div>
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
