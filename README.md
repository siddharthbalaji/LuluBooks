# LuluBooks

An interactive, macOS-desktop-style home for the LuluBooks library. The desktop
shows a live video wallpaper, an interactive Three.js water surface, a
magnifying dock, and a centered shelf of books — no scrolling, just a clean
home screen.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS v3**
- **Three.js + React Three Fiber + Drei** — the hero water surface
- **Framer Motion** (UI transitions) + **GSAP / ScrollTrigger** (intro + future reveals)
- **Zustand** — lightbox / UI state
- **Vercel** — hosting target

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Project structure

```
app/                     # App Router entry (layout, page, globals)
components/
  desktop/               # Wallpaper, MenuBar, Dock, BootSequence, Desktop shell
  water/                 # R3F canvas + water shader mesh
  books/                 # BookGrid, BookCard, ComingSoon
  lightbox/              # Book detail modal
hooks/                   # pointer, clock, reduced-motion
lib/
  books.ts               # ← the library (single source of truth)
  dock.ts                # ← dock apps
  cloudinary.ts          # optimized wallpaper/icon URLs
  shaders/water.ts       # GLSL for the water surface
store/useUIStore.ts      # Zustand
types/                   # shared types
public/books/            # ← drop your cover + PDF here
```

## Adding / editing books

Everything reads from `lib/books.ts`. Edit the first entry to publish your
book (drop the cover + PDF into `public/books/`), and append new objects to the
array for future titles. Slots marked `status: "coming-soon"` render the
site-tinted placeholder automatically.

## Performance notes

- The 4K wallpaper is delivered through Cloudinary at a screen-appropriate
  resolution with `f_auto,q_auto`, behind an instant poster, and pauses when the
  tab is hidden.
- The water surface caps its pixel ratio, is screen-blended so only highlights
  show, and is skipped entirely on touch devices and under reduced-motion.

## Deploy to Vercel

Push to GitHub (see below), then import the repo at vercel.com — no env vars or
config needed. Vercel auto-detects Next.js.
