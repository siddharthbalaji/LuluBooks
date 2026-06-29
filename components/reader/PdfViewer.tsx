"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { EASE_OUT } from "@/lib/motion";

// Self-hosted worker (copied into /public). Pinned to the installed pdfjs
// version via package.json, so it always matches the library — no CDN needed.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const MIN_SCALE = 0.6;
const MAX_SCALE = 4;
const FIT_MARGIN = 26; // breathing room so the page isn't edge-to-edge
const SWIPE_THRESHOLD = 50; // px a horizontal flick must travel to turn a page
const WHEEL_COMMIT_MS = 160; // idle time after a wheel zoom before re-rasterizing

const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

interface PdfViewerProps {
  file: string;
  title: string;
  author?: string;
  onClose: () => void;
}

export default function PdfViewer({ file, title, author, onClose }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  // scale === 1 means "fit the whole page in the viewport" (100%).
  const [scale, setScale] = useState(1);
  const [direction, setDirection] = useState(0); // -1 back, +1 forward
  const [stage, setStage] = useState({ w: 720, h: 900 });
  const [pageRatio, setPageRatio] = useState(0); // page height / width
  const [error, setError] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const pageWrapRef = useRef<HTMLDivElement>(null);

  // Live-readable mirrors of state for use inside imperative event listeners
  // (wheel / touch) without re-subscribing them on every render.
  const scaleRef = useRef(scale);
  const overflowRef = useRef(false);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // ── Stage measurement (rAF-coalesced so rapid resizes don't thrash) ──────
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        setStage({ w: el.clientWidth, h: el.clientHeight })
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const options = useMemo(
    () => ({
      standardFontDataUrl: "/standard_fonts/",
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/cmaps/`,
      cMapPacked: true
    }),
    []
  );

  // Width at which the entire page fits inside the stage (both dimensions).
  const fitWidth = useMemo(() => {
    const availW = Math.max(220, stage.w - FIT_MARGIN);
    const availH = Math.max(220, stage.h - FIT_MARGIN);
    if (!pageRatio) return Math.min(availW, 900);
    return Math.min(availW, availH / pageRatio);
  }, [stage, pageRatio]);

  const pageWidth = Math.max(200, Math.round(fitWidth * scale));
  const overflowsHeight = pageRatio > 0 && pageWidth * pageRatio > stage.h - 4;
  useEffect(() => {
    overflowRef.current = overflowsHeight;
  }, [overflowsHeight]);

  // Cap the raster resolution. react-pdf renders at devicePixelRatio by
  // default, so a 3× phone rasterizes 9× the pixels of a 1× screen — the main
  // source of slow page changes on mobile. 2× stays crisp at a fraction of the
  // cost.
  const renderDpr = useMemo(() => {
    if (typeof window === "undefined") return 1;
    return Math.min(window.devicePixelRatio || 1, 2);
  }, []);

  // ── Paging ───────────────────────────────────────────────────────────────
  const goTo = useCallback(
    (next: number, dir: number) => {
      setPageNumber((cur) => {
        const target = Math.min(Math.max(1, next), numPages || 1);
        if (target === cur) return cur;
        setDirection(dir);
        stageRef.current?.scrollTo({ top: 0 });
        return target;
      });
    },
    [numPages]
  );

  const prev = useCallback(() => goTo(pageNumber - 1, -1), [goTo, pageNumber]);
  const next = useCallback(() => goTo(pageNumber + 1, 1), [goTo, pageNumber]);

  // Keep the page-number input in sync when paging happens by other means.
  useEffect(() => setPageInput(String(pageNumber)), [pageNumber]);

  const commitPageInput = useCallback(() => {
    const n = parseInt(pageInput, 10);
    if (Number.isFinite(n)) goTo(n, n >= pageNumber ? 1 : -1);
    else setPageInput(String(pageNumber));
  }, [pageInput, pageNumber, goTo]);

  // ── Continuous zoom (shared by buttons, wheel and pinch) ─────────────────
  // A live gesture is shown with a cheap CSS transform; the page is only
  // re-rasterized once, on commit. That keeps wheel + pinch zoom buttery
  // instead of re-rendering the PDF on every delta.
  const gesture = useRef({ active: false, startScale: 1, liveScale: 1 });
  const wheelTimer = useRef<number | null>(null);

  const setOrigin = useCallback((clientX: number, clientY: number) => {
    const wrap = pageWrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const ox = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
    const oy = Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100));
    wrap.style.transformOrigin = `${ox}% ${oy}%`;
  }, []);

  const beginGesture = useCallback(() => {
    const g = gesture.current;
    if (g.active) return;
    g.active = true;
    g.startScale = scaleRef.current;
    g.liveScale = scaleRef.current;
    if (pageWrapRef.current) pageWrapRef.current.style.willChange = "transform";
  }, []);

  const applyLive = useCallback((s: number) => {
    const g = gesture.current;
    g.liveScale = clampScale(s);
    const wrap = pageWrapRef.current;
    if (wrap) wrap.style.transform = `scale(${g.liveScale / g.startScale})`;
  }, []);

  const endGesture = useCallback(() => {
    const g = gesture.current;
    if (!g.active) return;
    g.active = false;
    setScale(g.liveScale); // single re-raster at the final scale
  }, []);

  // After a committed zoom re-renders at the new width, drop the transient
  // transform on the next frame so there's no visible snap.
  useLayoutEffect(() => {
    const wrap = pageWrapRef.current;
    if (!wrap || gesture.current.active) return;
    const raf = requestAnimationFrame(() => {
      wrap.style.transform = "";
      wrap.style.transformOrigin = "center top";
      wrap.style.willChange = "auto";
    });
    return () => cancelAnimationFrame(raf);
  }, [scale, pageWidth]);

  // Button zoom — kept as gentle steps to preserve the original feel.
  const zoomOut = () => setScale((s) => clampScale(+(s - 0.2).toFixed(2)));
  const zoomIn = () => setScale((s) => clampScale(+(s + 0.2).toFixed(2)));
  const resetZoom = () => setScale(1); // back to full-page fit

  // ── Desktop: wheel / trackpad continuous zoom ────────────────────────────
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // Zoom on ctrl/⌘ + wheel (also how trackpad pinch arrives) or when the
      // page already fits and a plain scroll has nothing to scroll.
      const zoomIntent = e.ctrlKey || e.metaKey || !overflowRef.current;
      if (!zoomIntent) return; // let it scroll a zoomed-in page normally
      e.preventDefault();
      beginGesture();
      setOrigin(e.clientX, e.clientY);
      const factor = Math.exp(-e.deltaY * 0.0015); // smooth, continuous
      applyLive(gesture.current.liveScale * factor);
      if (wheelTimer.current) window.clearTimeout(wheelTimer.current);
      wheelTimer.current = window.setTimeout(endGesture, WHEEL_COMMIT_MS);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [beginGesture, applyLive, endGesture, setOrigin]);

  // ── Touch: pinch-zoom + swipe-to-page ────────────────────────────────────
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const pinch = { active: false, startDist: 0 };
    let swipe: { x: number; y: number } | null = null;

    const dist = (a: Touch, b: Touch) =>
      Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinch.active = true;
        pinch.startDist = dist(e.touches[0], e.touches[1]);
        swipe = null;
        beginGesture();
        setOrigin(
          (e.touches[0].clientX + e.touches[1].clientX) / 2,
          (e.touches[0].clientY + e.touches[1].clientY) / 2
        );
      } else if (e.touches.length === 1 && !gesture.current.active) {
        swipe = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onMove = (e: TouchEvent) => {
      if (pinch.active && e.touches.length === 2) {
        e.preventDefault();
        const ratio = dist(e.touches[0], e.touches[1]) / pinch.startDist;
        applyLive(gesture.current.startScale * ratio);
      } else if (swipe && e.touches.length === 1) {
        const dx = e.touches[0].clientX - swipe.x;
        const dy = e.touches[0].clientY - swipe.y;
        // Only claim horizontal flicks while the page fits (not zoomed in, so
        // there's nothing to pan) — otherwise let the page scroll/pan natively.
        if (scaleRef.current <= 1.02 && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
          e.preventDefault();
        }
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (pinch.active && e.touches.length < 2) {
        pinch.active = false;
        endGesture();
      }
      if (swipe && e.touches.length === 0) {
        const t = e.changedTouches[0];
        const dx = t.clientX - swipe.x;
        const dy = t.clientY - swipe.y;
        if (
          scaleRef.current <= 1.02 &&
          Math.abs(dx) > SWIPE_THRESHOLD &&
          Math.abs(dx) > Math.abs(dy) * 1.3
        ) {
          if (dx < 0) next();
          else prev();
        }
        swipe = null;
      }
    };

    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [beginGesture, applyLive, endGesture, setOrigin, next, prev]);

  // ── Keyboard: arrows page, +/- zoom (ignored while typing) ───────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable))
        return;
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
      <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-md sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white sm:text-[15px]">{title}</p>
          {author && <p className="truncate text-[11px] text-white/55">{author}</p>}
        </div>

        <div className="hidden items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1 sm:flex">
          <CtrlButton label="Zoom out" onClick={zoomOut} disabled={scale <= MIN_SCALE}>
            <path d="M5 10h10" />
          </CtrlButton>
          <button
            type="button"
            onClick={resetZoom}
            title="Fit page"
            className="min-w-[3.2rem] rounded-full px-2 text-xs font-medium tabular-nums text-white/80 transition-colors hover:bg-white/10"
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
          className="hidden items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20 sm:inline-flex"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M10 3v9m0 0l-3.2-3.2M10 12l3.2-3.2M4 15.5h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Download
        </a>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close reader"
          className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Page stage ────────────────────────────────────────────────── */}
      <div
        ref={stageRef}
        style={{ touchAction: overflowsHeight ? "pan-x pan-y" : "none" }}
        className={`relative flex-1 overflow-auto overscroll-contain p-2 sm:p-3 ${
          overflowsHeight ? "" : "grid place-items-center"
        }`}
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
            onLoadSuccess={async (pdf) => {
              setNumPages(pdf.numPages);
              setError(false);
              try {
                const page = await pdf.getPage(1);
                const vp = page.getViewport({ scale: 1 });
                setPageRatio(vp.height / vp.width);
              } catch {
                /* keep width-only fallback */
              }
            }}
            onLoadError={() => setError(true)}
            loading={<StageSpinner label="Opening book…" />}
            error={<StageSpinner label="" />}
            className={`flex min-h-full w-full justify-center ${
              overflowsHeight ? "items-start" : "items-center"
            }`}
          >
            <div ref={pageWrapRef} className="relative" style={{ width: pageWidth, transformOrigin: "center top" }}>
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
                  <MemoPage pageNumber={pageNumber} width={pageWidth} ratio={pageRatio} dpr={renderDpr} />
                </motion.div>
              </AnimatePresence>
            </div>
          </Document>
        )}

        {!error && numPages > 0 && (
          <>
            <EdgeArrow side="left" onClick={prev} disabled={pageNumber <= 1} />
            <EdgeArrow side="right" onClick={next} disabled={pageNumber >= numPages} />
          </>
        )}
      </div>

      {/* ── Bottom bar: progress + pager ──────────────────────────────── */}
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

          {/* Type a page number to jump straight there. */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              commitPageInput();
              (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.blur();
            }}
            className="flex items-center gap-1.5 text-xs font-medium tabular-nums text-white/75"
          >
            <input
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value.replace(/[^\d]/g, ""))}
              onFocus={(e) => e.currentTarget.select()}
              onBlur={commitPageInput}
              inputMode="numeric"
              aria-label="Go to page"
              disabled={!numPages}
              className="w-11 rounded-md border border-white/15 bg-white/10 px-1.5 py-1 text-center text-white outline-none transition-colors focus:border-accent disabled:opacity-50"
            />
            <span className="whitespace-nowrap">/ {numPages || "—"}</span>
          </form>

          <PagerButton label="Next page" onClick={next} disabled={!numPages || pageNumber >= numPages}>
            <path d="M8 4l6 6-6 6" />
          </PagerButton>

          <a
            href={file}
            download
            className="ml-1 inline-flex items-center rounded-full border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:hidden"
            aria-label="Download"
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M10 3v9m0 0l-3.2-3.2M10 12l3.2-3.2M4 15.5h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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

/* Memoized page: only re-renders when the page, width or DPR actually change,
   so unrelated state updates (zoom gesture, input typing) don't re-rasterize. */
const MemoPage = memo(
  function MemoPage({
    pageNumber,
    width,
    ratio,
    dpr
  }: {
    pageNumber: number;
    width: number;
    ratio: number;
    dpr: number;
  }) {
    return (
      <Page
        pageNumber={pageNumber}
        width={width}
        devicePixelRatio={dpr}
        loading={<PageSkeleton width={width} ratio={ratio} />}
        renderAnnotationLayer
        renderTextLayer
      />
    );
  },
  (a, b) => a.pageNumber === b.pageNumber && a.width === b.width && a.dpr === b.dpr
);

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
      className="grid h-7 w-7 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/15 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
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
      className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition-all hover:bg-white/20 active:scale-90 disabled:cursor-default disabled:opacity-25 disabled:hover:bg-white/10"
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
      className={`absolute top-1/2 hidden -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/35 p-2.5 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-black/55 md:grid ${
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
    <div className="grid h-full min-h-[40vh] w-full place-items-center">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-accent" />
        {label && <p className="text-sm text-white/70">{label}</p>}
      </div>
    </div>
  );
}

function PageSkeleton({ width, ratio }: { width: number; ratio: number }) {
  return (
    <div
      className="animate-pulse rounded-xl bg-white/10"
      style={{ width, height: width * (ratio || 1.3) }}
      aria-hidden
    />
  );
}
