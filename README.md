# LuluBooks

A macOS-desktop-style home for the LuluBooks library. The desktop shows an
optimized image wallpaper, a magnifying dock, and a centered shelf of books —
no scrolling, just a clean home screen.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS v3**
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
  books/                 # BookGrid, BookCard, ComingSoon
  lightbox/              # Book detail modal
hooks/                   # clock
lib/
  books.ts               # ← the library (single source of truth)
  dock.ts                # ← dock apps
  cloudinary.ts          # optimized wallpaper/icon URLs
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

- The wallpaper is a single optimized image delivered through Cloudinary at a
  screen-appropriate resolution (`f_auto,q_auto`, responsive `srcSet`), behind
  an instant blurred placeholder. No video decode, no WebGL — it stays smooth.

## Deploy to Vercel

Push to GitHub (see below), then import the repo at vercel.com — no env vars or
config needed. Vercel auto-detects Next.js.
