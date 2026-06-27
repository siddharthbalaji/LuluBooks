"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { EASE_OUT } from "@/lib/motion";

// Self-hosted worker (copied into /public). Pinned to the installed pdfjs
// version via package.json, so it always matches the library — no CDN needed.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const MAX_PAGE_WIDTH = 860; // never blow the page up past a comfortable column
const MIN_SCALE = 0.6;
const MAX_SCALE = 2.4;

interface PdfViewerProps {
  file: string;
  title: string;
  author?: string;
  onClose: () => void;
}

export default function PdfViewer({ file, title, author, onClose }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [direction, setDirection] = useState(0); // -1 back, +1 forward
  const [containerWidth, setContainerWidth] = useState(720);
  const [error, setError] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);

  // Keep the rendered page sized to the available stage width (responsive).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setContainerWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Loading the worker font data locally; cMaps (rare for Latin text) via CDN.
  const options = useMemo(
    () => ({
      standardFontDataUrl: "/standard_fonts/",
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/cmaps/`,
      cMapPacked: true
    }),
    []
  );

  const pageWidth = useMemo(() => {
    const base = Math.min(containerWidth - 8, MAX_PAGE_WIDTH);
    return Math.max(240, base * scale);
  }, [containerWidth, scale]);

  const goTo = useCallback(
    (next: number, dir: number) => {
      setPageNumber((cur) => {
        const target = Math.min(Math.max(1, next), numPages || 1);
        if (target === cur) return cur;
        setDirection(dir);
        // Snap the scroll back to the top of the new page.
        stageRef.current?.scrollTo({ top: 0 });
        return target;
      });
    },
    [numPages]
  );

  const prev = useCallback(() => goTo(pageNumber - 1, -1), [goTo, pageNumber]);
  const next = useCallback(() => goTo(pageNumber + 1, 1), [goTo, pageNumber]);

  const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, +(s - 0.2).toFixed(2)));
  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, +(s + 0.2).toFixed(2)));
  const resetZoom = () => setScale(1);

  // Keyboard: arrows page, +/- zoom. (Esc is owned by the reader shell.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
      else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "+" || e.key === "=") zoomIn();
      else if (e.key === "-") zoomOut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  const progress = numPages ? (pageNumber / numPages) * 100 : 0;

  return (
    <div className="flex h-full w-full flex-col">
      {/* ── Top control bar ───────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-3 py-2.5
                   backdrop-blur-md sm:px-5"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white sm:text-[15px]">{title}</p>
          {author && <p className="truncate text-[11px] text-white/55">{author}</p>}
        </div>

        {/* zoom cluster */}
        <div className="hidden items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1 sm:flex">
          <CtrlButton label="Zoom out" onClick={zoomOut} disabled={scale <= MIN_SCALE}>
            <path d="M5 10h10" />
          </CtrlButton>
          <button
            type="button"
            onClick={resetZoom}
            className="min-w-[3.2rem] rounded-full px-2 text-xs font-medium tabular-nums
                       text-white/80 transition-colors hover:bg-white/10"
          >
            {Math.round(scale * 100)}%
          </button>
          <CtrlButton label="Zoom in" onClick={zoomIn} disabled={scale >= MAX_SCALE}>
            <path d="M10 5v10M5 10h10" />
          </CtrlButton>
        </div>

        <a
          href={file}
          download
          className="hidden items-center gap-1.5 rounded-full border border-white/20 bg-white/10
                     px-3.5 py-1.5 text-xs font-semibold text-white transition-colors
                     hover:bg-white/20 sm:inline-flex"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M10 3v9m0 0l-3.2-3.2M10 12l3.2-3.2M4 15.5h12"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Download
        </a>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close reader"
          className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white
                     transition-colors hover:bg-white/30"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Page stage ────────────────────────────────────────────────── */}
      <div
        ref={stageRef}
        className="relative flex-1 overflow-auto overscroll-contain px-3 py-5 sm:px-6 sm:py-7"
      >
        {error ? (
          <div className="grid h-full place-items-center px-6 text-center">
            <div className="max-w-sm">
              <p className="text-sm text-white/80">This book couldn’t be opened in the reader.</p>
              <a
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
              >
                Open the PDF instead
              </a>
            </div>
          </div>
        ) : (
          <Document
            file={file}
            options={options}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              setError(false);
            }}
            onLoadError={() => setError(true)}
            loading={<StageSpinner label="Opening book…" />}
            error={<StageSpinner label="" />}
            className="flex min-h-full items-start justify-center"
          >
            <div className="relative" style={{ width: pageWidth }}>
              <AnimatePresence custom={direction} mode="popLayout" initial={false}>
                <motion.div
                  key={pageNumber}
                  custom={direction}
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.34, ease: EASE_OUT }}
                  className="overflow-hidden rounded-xl bg-white shadow-[0_30px_80px_-24px_rgba(0,0,0,0.7)]"
                >
                  <Page
                    pageNumber={pageNumber}
                    width={pageWidth}
                    loading={<PageSkeleton width={pageWidth} />}
                    renderAnnotationLayer
                    renderTextLayer
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </Document>
        )}

        {/* Edge nav arrows (desktop) */}
        {!error && numPages > 0 && (
          <>
            <EdgeArrow side="left" onClick={prev} disabled={pageNumber <= 1} />
            <EdgeArrow side="right" onClick={next} disabled={pageNumber >= numPages} />
          </>
        )}
      </div>

      {/* ── Bottom bar: progress + pager (always visible, touch-friendly) ─ */}
      <div className="border-t border-white/10 bg-white/5 backdrop-blur-md">
        <div className="h-0.5 w-full bg-white/10">
          <motion.div
            className="h-full bg-accent"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.34, ease: EASE_OUT }}
          />
        </div>
        <div className="flex items-center justify-center gap-4 px-4 py-2.5">
          <PagerButton label="Previous page" onClick={prev} disabled={pageNumber <= 1}>
            <path d="M12 4l-6 6 6 6" />
          </PagerButton>
          <span className="min-w-[5.5rem] text-center text-xs font-medium tabular-nums text-white/75">
            {numPages ? `${pageNumber} / ${numPages}` : "—"}
          </span>
          <PagerButton label="Next page" onClick={next} disabled={!numPages || pageNumber >= numPages}>
            <path d="M8 4l6 6-6 6" />
          </PagerButton>

          {/* mobile download */}
          <a
            href={file}
            download
            className="ml-1 inline-flex items-center rounded-full border border-white/20 bg-white/10
                       p-2 text-white transition-colors hover:bg-white/20 sm:hidden"
            aria-label="Download"
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M10 3v9m0 0l-3.2-3.2M10 12l3.2-3.2M4 15.5h12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Page slide animation ─────────────────────────────────────────────── */
const pageVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 70 : -70 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -70 : 70 })
};

/* ── Small UI helpers ─────────────────────────────────────────────────── */
function CtrlButton({
  children,
  label,
  onClick,
  disabled
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-7 w-7 place-items-center rounded-full text-white/85 transition-colors
                 hover:bg-white/15 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        {children}
      </svg>
    </button>
  );
}

function PagerButton({
  children,
  label,
  onClick,
  disabled
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10
                 text-white transition-all hover:bg-white/20 active:scale-90
                 disabled:cursor-default disabled:opacity-25 disabled:hover:bg-white/10"
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

function EdgeArrow({
  side,
  onClick,
  disabled
}: {
  side: "left" | "right";
  onClick: () => void;
  disabled?: boolean;
}) {
  if (disabled) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous page" : "Next page"}
      className={`absolute top-1/2 hidden -translate-y-1/2 place-items-center rounded-full
                  border border-white/15 bg-black/35 p-2.5 text-white backdrop-blur-md
                  transition-all hover:scale-105 hover:bg-black/55 md:grid ${
                    side === "left" ? "left-3" : "right-3"
                  }`}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {side === "left" ? <path d="M12 4l-6 6 6 6" /> : <path d="M8 4l6 6-6 6" />}
      </svg>
    </button>
  );
}

function StageSpinner({ label }: { label: string }) {
  return (
    <div className="grid h-full min-h-[40vh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-accent" />
        {label && <p className="text-sm text-white/70">{label}</p>}
      </div>
    </div>
  );
}

function PageSkeleton({ width }: { width: number }) {
  return (
    <div
      className="animate-pulse rounded-xl bg-white/10"
      style={{ width, height: width * 1.3 }}
      aria-hidden
    />
  );
}
