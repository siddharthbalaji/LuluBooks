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

const MIN_SCALE = 1; // 1 === full-page fit; we never shrink below fit
const MAX_SCALE = 5;
const FIT_MARGIN = 26; // breathing room so the page isn't edge-to-edge
const SWIPE_THRESHOLD = 50; // px a horizontal flick must travel to turn a page
const WHEEL_COMMIT_MS = 140; // idle after a wheel zoom before re-rasterizing

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
  const sizerRef = useRef<HTMLDivElement>(null);
  const pageWrapRef = useRef<HTMLDivElement>(null);

  // Live-readable mirrors used inside imperative wheel/touch handlers so they
  // don't need to be re-bound on every render.
  const scaleRef = useRef(scale);
  const fitWidthRef = useRef(720);
  const ratioRef = useRef(0);
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

  useEffect(() => {
    fitWidthRef.current = fitWidth;
  }, [fitWidth]);
  useEffect(() => {
    ratioRef.current = pageRatio;
  }, [pageRatio]);

  // The page is rasterized at the committed scale; the sizer reserves exactly
  // that footprint so native scrolling can reach every part of a zoomed page.
  const renderW = Math.max(200, Math.round(fitWidth * scale));
  const renderH = pageRatio ? Math.round(renderW * pageRatio) : undefined;

  const contentW = fitWidth * scale;
  const contentH = fitWidth * scale * (pageRatio || 1.3);
  const pannable = contentW > stage.w + 1 || contentH > stage.h + 1;

  // Cap raster resolution. react-pdf renders at devicePixelRatio, so a 3×
  // phone rasterizes ~9× the pixels of a 1× screen — the main cause of slow
  // page changes on mobile. 2× stays crisp at a fraction of the cost.
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
        stageRef.current?.scrollTo({ top: 0, left: 0 });
        return target;
      });
    },
    [numPages]
  );

  const prev = useCallback(() => goTo(pageNumber - 1, -1), [goTo, pageNumber]);
  const next = useCallback(() => goTo(pageNumber + 1, 1), [goTo, pageNumber]);

  useEffect(() => setPageInput(String(pageNumber)), [pageNumber]);

  const commitPageInput = useCallback(() => {
    const n = parseInt(pageInput, 10);
    if (Number.isFinite(n)) goTo(n, n >= pageNumber ? 1 : -1);
    else setPageInput(String(pageNumber));
  }, [pageInput, pageNumber, goTo]);

  // ── Seamless zoom core ───────────────────────────────────────────────────
  // A gesture mutates the DOM directly (sizer size + a top-left CSS scale on
  // the page wrapper) and adjusts scroll so the focal point stays put — no
  // React re-render, no snap. The sharp re-raster is committed once, on
  // release, when the geometry is already identical so nothing jumps.
  const gesture = useRef({ active: false, visual: 1 });

  const beginGesture = useCallback(() => {
    const g = gesture.current;
    if (g.active) return;
    g.active = true;
    g.visual = scaleRef.current;
    if (pageWrapRef.current) pageWrapRef.current.style.willChange = "transform";
  }, []);

  // Set visual zoom to `target`, keeping the content point under (focalX,focalY)
  // fixed. All values in client (viewport) coordinates.
  const applyVisual = useCallback((target: number, focalX: number, focalY: number) => {
    const el = stageRef.current;
    const sizer = sizerRef.current;
    const wrap = pageWrapRef.current;
    if (!el || !sizer || !wrap) return;

    const g = gesture.current;
    const oldV = g.visual;
    const newV = clampScale(target);
    if (Math.abs(newV - oldV) < 0.0001) return;

    const W = fitWidthRef.current;
    const ratio = ratioRef.current || 1.3;
    const rect = el.getBoundingClientRect();

    const oldCW = W * oldV;
    const oldCH = W * oldV * ratio;
    const newCW = W * newV;
    const newCH = W * newV * ratio;

    // Centering offset (content is centered while it fits, pinned to the edge
    // once it overflows — matching `justify/align: safe center`).
    const oldOffX = Math.max(0, (el.clientWidth - oldCW) / 2);
    const oldOffY = Math.max(0, (el.clientHeight - oldCH) / 2);
    const newOffX = Math.max(0, (el.clientWidth - newCW) / 2);
    const newOffY = Math.max(0, (el.clientHeight - newCH) / 2);

    // Where the focal point lands within the content right now…
    const cx = el.scrollLeft + (focalX - rect.left) - oldOffX;
    const cy = el.scrollTop + (focalY - rect.top) - oldOffY;
    const fracX = oldCW > 0 ? cx / oldCW : 0;
    const fracY = oldCH > 0 ? cy / oldCH : 0;

    // Resize the scroll footprint + scale the rendered page visually.
    sizer.style.width = `${newCW}px`;
    sizer.style.height = `${newCH}px`;
    wrap.style.transform = `scale(${newV / scaleRef.current})`;

    // …and re-place scroll so that same content point stays under the focal.
    const targetLeft = fracX * newCW + newOffX - (focalX - rect.left);
    const targetTop = fracY * newCH + newOffY - (focalY - rect.top);
    el.scrollLeft = Math.max(0, Math.min(targetLeft, newCW - el.clientWidth));
    el.scrollTop = Math.max(0, Math.min(targetTop, newCH - el.clientHeight));

    g.visual = newV;
  }, []);

  const endGesture = useCallback(() => {
    const g = gesture.current;
    if (!g.active) return;
    g.active = false;
    setScale(g.visual); // single crisp re-raster at the final scale
  }, []);

  // After commit, the rendered width now matches the gesture's visual size, so
  // dropping the transient transform is invisible. Runs before paint → no flash.
  useLayoutEffect(() => {
    gesture.current.visual = scale;
    const wrap = pageWrapRef.current;
    if (wrap && !gesture.current.active) {
      wrap.style.transform = "";
      wrap.style.willChange = "auto";
    }
  }, [scale, renderW]);

  // Button zoom — gentle, centered steps (preserves the original feel).
  const zoomCenter = (target: number) => {
    const el = stageRef.current;
    const cx = el ? el.getBoundingClientRect().left + el.clientWidth / 2 : 0;
    const cy = el ? el.getBoundingClientRect().top + el.clientHeight / 2 : 0;
    beginGesture();
    applyVisual(target, cx, cy);
    endGesture();
  };
  const zoomOut = () => zoomCenter(clampScale(+(scaleRef.current - 0.25).toFixed(2)));
  const zoomIn = () => zoomCenter(clampScale(+(scaleRef.current + 0.25).toFixed(2)));
  const resetZoom = () => zoomCenter(1);

  // ── Desktop: Ctrl/⌘ + wheel = continuous zoom (only) ─────────────────────
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let commit: number | null = null;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return; // plain scroll pans a zoomed page
      e.preventDefault();
      beginGesture();
      const factor = Math.exp(-e.deltaY * 0.0015);
      applyVisual(gesture.current.visual * factor, e.clientX, e.clientY);
      if (commit) window.clearTimeout(commit);
      commit = window.setTimeout(endGesture, WHEEL_COMMIT_MS);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (commit) window.clearTimeout(commit);
    };
  }, [beginGesture, applyVisual, endGesture]);

  // ── Touch: pinch-zoom + swipe-to-page ────────────────────────────────────
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let pinchDist = 0;
    let pinchBase = 1;
    let pinching = false;
    let swipe: { x: number; y: number; can: boolean } | null = null;

    const dist = (a: Touch, b: Touch) =>
      Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinching = true;
        swipe = null;
        pinchDist = dist(e.touches[0], e.touches[1]);
        beginGesture();
        pinchBase = gesture.current.visual;
      } else if (e.touches.length === 1 && !pinching) {
        swipe = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          can: scaleRef.current <= 1.02 // only page-flip when the page fits
        };
      }
    };

    const onMove = (e: TouchEvent) => {
      if (pinching && e.touches.length === 2) {
        e.preventDefault();
        const ratio = dist(e.touches[0], e.touches[1]) / pinchDist;
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        applyVisual(pinchBase * ratio, midX, midY);
      } else if (swipe && swipe.can && e.touches.length === 1) {
        const dx = e.touches[0].clientX - swipe.x;
        const dy = e.touches[0].clientY - swipe.y;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) e.preventDefault();
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (pinching && e.touches.length < 2) {
        pinching = false;
        endGesture();
      }
      if (swipe && e.touches.length === 0) {
        const t = e.changedTouches[0];
        const dx = t.clientX - swipe.x;
        const dy = t.clientY - swipe.y;
        if (
          swipe.can &&
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
  }, [beginGesture, applyVisual, endGesture, next, prev]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        style={{ touchAction: pannable ? "pan-x pan-y" : "none" }}
        className="relative flex-1 overflow-auto overscroll-contain"
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
            className="contents"
          >
            {/* Centering layer: centers the page while it fits, and pins it to
                the edge (so every part stays scroll-reachable) once zoomed. */}
            <div
              className="p-2 sm:p-3"
              style={{
                display: "flex",
                minWidth: "100%",
                minHeight: "100%",
                justifyContent: "safe center",
                alignItems: "safe center"
              }}
            >
              {/* Sizer reserves the true scaled footprint for scrolling. */}
              <div
                ref={sizerRef}
                style={{ width: renderW, height: renderH, flex: "none", position: "relative" }}
              >
                <div ref={pageWrapRef} style={{ transformOrigin: "0 0", width: renderW }}>
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
                      style={{ width: renderW }}
                    >
                      <MemoPage pageNumber={pageNumber} width={renderW} ratio={pageRatio} dpr={renderDpr} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
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

/* Memoized page: only re-renders when the page, width or DPR change, so
   unrelated state updates (typing, paging UI) don't re-rasterize. */
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
