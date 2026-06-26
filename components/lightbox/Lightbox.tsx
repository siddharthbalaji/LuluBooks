"use client";

import { useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import { getBook } from "@/lib/books";
import { useUIStore } from "@/store/useUIStore";
import { EASE_OUT, PANEL_SPRING } from "@/lib/motion";

export default function Lightbox() {
  const openBookId = useUIStore((s) => s.openBookId);
  const closeBook = useUIStore((s) => s.closeBook);
  const book = openBookId ? getBook(openBookId) : undefined;

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
          className="fixed inset-0 z-50 grid place-items-center p-4"
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
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          {/* panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={book.title}
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.2, ease: EASE_OUT } }}
            transition={PANEL_SPRING}
            className="relative grid w-full max-w-2xl grid-cols-1 gap-6 overflow-hidden
                       rounded-3xl border border-white/25 bg-white/15 p-6 shadow-glass
                       backdrop-blur-glass backdrop-saturate-150 sm:grid-cols-[200px_1fr] sm:p-7"
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
                    <a
                      href={book.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white
                                 shadow-lg shadow-accent/30 transition-transform hover:scale-[1.03]"
                    >
                      Read now
                    </a>
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
