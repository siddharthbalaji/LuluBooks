import type { DockApp } from "@/types";

/**
 * The dock. Each entry is a self-contained, original rounded-square icon —
 * either a gradient + a white glyph drawn from SVG path data, or a gradient
 * tile with a logo image on top (Portfolio). We never ship copyrighted Apple
 * artwork. Add, remove, or reorder freely.
 *
 * Glyph paths are drawn inside a 0 0 24 24 viewBox. Set `filled: true` for
 * solid brand marks (Discord, LinkedIn); leave it off for stroked line icons.
 *
 * Order: [ Portfolio · Library · Featured · Search ] | [ Instagram · LinkedIn
 * · Discord · Mail ] | [ Trash ]
 */
export const dockApps: DockApp[] = [
  {
    // Portfolio takes the slot Finder used to occupy, using the Lulu logo mark.
    id: "portfolio",
    label: "Portfolio",
    gradient: ["#5FC3EC", "#0A84FF"],
    image: "/logo-white.svg",
    action: { type: "link", href: "https://lulu-portfolio-three.vercel.app/" }
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
    // Search takes the slot About used to occupy, as a Spotlight-style finder.
    id: "search",
    label: "Search",
    gradient: ["#9AA3B2", "#5A6373"],
    glyph: "M11 5.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM15.4 15.4l4 4",
    action: { type: "search" },
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
    id: "linkedin",
    label: "LinkedIn",
    gradient: ["#2D9CDB", "#0A66C2"],
    filled: true,
    glyph:
      "M6.94 6.5a1.94 1.94 0 11-3.88 0 1.94 1.94 0 013.88 0zM3.4 8.9h3.1V20H3.4zM9.1 8.9h2.97v1.52h.04c.41-.78 1.42-1.6 2.93-1.6 3.13 0 3.71 2.06 3.71 4.74V20h-3.09v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.54V20H9.1z",
    action: { type: "link", href: "https://www.linkedin.com/in/siddharthbalaji/" }
  },
  {
    // Discord replaces the old GitHub entry.
    id: "discord",
    label: "Discord",
    gradient: ["#5865F2", "#4250E0"],
    filled: true,
    glyph:
      "M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 00-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 00-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.03.02.06.03.09.02 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z",
    action: { type: "link", href: "https://discord.com/users/715468464013443154" }
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
