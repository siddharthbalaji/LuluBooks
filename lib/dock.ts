import type { DockApp } from "@/types";

/**
 * The dock. Each entry is a self-contained, original rounded-square icon
 * (gradient + a white glyph drawn from SVG path data) so we never ship
 * copyrighted Apple artwork. Add, remove, or reorder freely.
 *
 * Glyph paths are drawn inside a 0 0 24 24 viewBox.
 */
export const dockApps: DockApp[] = [
  {
    id: "finder",
    label: "Finder",
    gradient: ["#3AA0FF", "#1366D6"],
    glyph: "M12 3a9 9 0 100 18 9 9 0 000-18zM8.5 9.5v3m7-3v3M8 16c1.2 1 2.6 1.5 4 1.5s2.8-.5 4-1.5",
    action: { type: "none" }
  },
  {
    id: "library",
    label: "Library",
    gradient: ["#5FC3EC", "#2DA8E0"],
    glyph: "M5 4h4v16H5zM10 4h3v16h-3zM14.5 4.3l3.8 1 3.2 14.4-3.8-1z",
    action: { type: "focus-books" }
  },
  {
    id: "featured",
    label: "Featured Book",
    gradient: ["#0A84FF", "#0A1628"],
    glyph: "M6 4h9a3 3 0 013 3v13H9a3 3 0 01-3-3zM6 4v13M9 8h6M9 11h6",
    action: { type: "lightbox", bookId: "book-one" }
  },
  {
    id: "safari",
    label: "About",
    gradient: ["#34C8E8", "#1366D6"],
    glyph: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 3v18M3 12h18m-3.5-5.5l-11 11m0-11l11 11",
    action: { type: "link", href: "#about" },
    dividerAfter: true
  },
  {
    id: "instagram",
    label: "Instagram",
    gradient: ["#C13584", "#F77737"],
    glyph:
      "M8 3.5h8a4.5 4.5 0 014.5 4.5v8a4.5 4.5 0 01-4.5 4.5H8A4.5 4.5 0 013.5 16V8A4.5 4.5 0 018 3.5z M12 8.2a3.8 3.8 0 100 7.6 3.8 3.8 0 000-7.6z M16.7 7.1h.01",
    action: { type: "link", href: "https://www.instagram.com/lulusidd" }
  },
  {
    id: "github",
    label: "GitHub",
    gradient: ["#3A3F4B", "#1B1F27"],
    glyph: "M12 3a9 9 0 00-2.8 17.5c.4 0 .6-.2.6-.5v-2c-2.5.5-3-1.2-3-1.2-.4-1-1-1.3-1-1.3-.8-.6 0-.6 0-.6.9 0 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-2-.2-4.1-1-4.1-4.4 0-1 .3-1.8.9-2.4-.1-.3-.4-1.2.1-2.4 0 0 .8-.3 2.5 1a8.5 8.5 0 014.4 0c1.7-1.3 2.5-1 2.5-1 .5 1.2.2 2.1.1 2.4.6.6.9 1.4.9 2.4 0 3.4-2.1 4.2-4.1 4.4.3.3.6.9.6 1.8v2.6c0 .3.2.5.6.5A9 9 0 0012 3z",
    action: { type: "link", href: "https://github.com/siddharthbalaji/LuluBooks" }
  },
  {
    id: "mail",
    label: "Contact",
    gradient: ["#5FC3EC", "#0A84FF"],
    glyph: "M3 6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v11A1.5 1.5 0 0119.5 19h-15A1.5 1.5 0 013 17.5zM3.5 7l8.5 6 8.5-6",
    action: { type: "link", href: "mailto:sidofficial7801@gmail.com" },
    dividerAfter: true
  },
  {
    id: "trash",
    label: "Trash",
    gradient: ["#8A93A3", "#5A6373"],
    glyph: "M5 7h14M10 7V5h4v2M6 7l1 13h10l1-13M10 10v7M14 10v7",
    action: { type: "none" }
  }
];
