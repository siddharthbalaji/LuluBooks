"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";

import { getBook } from "@/lib/books";
import { useUIStore } from "@/store/useUIStore";
import { EASE_OUT, READER_SPRING } from "@/lib/motion";

// react-pdf relies on the DOM + a web worker, so it must never render on the
// server. Loading it lazily here also keeps pdf.js out of the initial bundle —
// it's only fetched the first time someone actually opens a book to read.
const PdfViewer = dynamic(() => import("./PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-accent" />
    </div>
  )
});

export default function PdfReader() {
  const readerBookId = useUIStore((s) => s.readerBookId);
  const closeReader = useUIStore((s) => s.closeReader);
  const book = readerBookId ? getBook(readerBookId) : undefined;

  // Esc closes the reader; lock background scroll while it's open.
  useEffect(() => {
    if (!book) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeReader();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [book, closeReader]);

  return (
    <AnimatePresence>
      {book?.file && (
        <motion.div
          className="fixed inset-0 z-[55]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EASE_OUT }}
        >
          {/* dim + blur backdrop */}
          <button
            type="button"
            aria-label="Close reader"
            onClick={closeReader}
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
          />

          {/* reader surface — full-view on every screen size */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Reading ${book.title}`}
            initial={{ opacity: 0, scale: 0.98, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: 12, transition: { duration: 0.2, ease: EASE_OUT } }}
            transition={READER_SPRING}
            style={{ willChange: "transform, opacity" }}
            className="absolute inset-0 flex h-[100dvh] w-full flex-col overflow-hidden bg-accent-ink/95"
          >
            <PdfViewer
              file={book.file}
              title={book.title}
              author={book.author}
              onClose={closeReader}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
