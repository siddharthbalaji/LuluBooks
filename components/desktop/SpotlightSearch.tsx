"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import { books } from "@/lib/books";
import { useUIStore } from "@/store/useUIStore";
import { EASE_OUT } from "@/lib/motion";

export default function SpotlightSearch() {
  const searchOpen = useUIStore((s) => s.searchOpen);
  const openSearch = useUIStore((s) => s.openSearch);
  const closeSearch = useUIStore((s) => s.closeSearch);
  const openBook = useUIStore((s) => s.openBook);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter the library by title or author (available titles first).
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? books.filter(
          (b) =>
            b.status === "available" &&
            (b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
        )
      : books.filter((b) => b.status === "available");
    return pool;
  }, [query]);

  // Reset + focus whenever the palette opens.
  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  useEffect(() => setActive(0), [query]);

  // Global shortcut: ⌘K / Ctrl-K opens Spotlight from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch]);

  const choose = (index: number) => {
    const book = results[index];
    if (!book) return;
    closeSearch();
    // Open in the center of the screen with a tiny delay so the palette's exit
    // and the lightbox's entrance don't fight for the same frame.
    setTimeout(
      () =>
        openBook(book.id, {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        }),
      120
    );
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeSearch();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(active);
    }
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          className="fixed inset-0 z-[58] flex items-start justify-center px-4 pt-[16vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
        >
          <button
            type="button"
            aria-label="Close search"
            onClick={closeSearch}
            className="absolute inset-0 bg-black/45 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8, transition: { duration: 0.16, ease: EASE_OUT } }}
            transition={{ duration: 0.24, ease: EASE_OUT }}
            style={{ willChange: "transform, opacity" }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/15
                       bg-accent-ink/85 shadow-2xl backdrop-blur-2xl"
          >
            {/* search field */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-white/55">
                <path
                  d="M11 5.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM15.4 15.4l4 4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search the library…"
                className="w-full bg-transparent text-[16px] text-white placeholder:text-white/40 focus:outline-none"
                aria-label="Search the library"
              />
              <kbd className="hidden rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/45 sm:block">
                esc
              </kbd>
            </div>

            {/* results */}
            <div className="max-h-[44vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-white/50">
                  No titles match “{query}”.
                </p>
              ) : (
                results.map((book, i) => (
                  <button
                    key={book.id}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(i)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      i === active ? "bg-white/15" : "hover:bg-white/8"
                    }`}
                  >
                    <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md border border-white/15 bg-white/10">
                      {book.cover && (
                        <Image src={book.cover} alt="" fill sizes="36px" className="object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{book.title}</span>
                      <span className="block truncate text-xs text-white/55">{book.author}</span>
                    </span>
                    <span className="text-[11px] font-medium text-white/40">Open</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
