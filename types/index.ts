export type BookStatus = "available" | "coming-soon";

export interface Book {
  /** Stable unique id (used for routing/state keys). */
  id: string;
  /** Display title. */
  title: string;
  /** Author or imprint shown under the title. */
  author: string;
  /** Short blurb shown in the lightbox. */
  description: string;
  /** Cover image path (in /public) or remote URL. */
  cover: string;
  /** Path to the readable/downloadable file in /public, when available. */
  file?: string;
  /** Whether the book can be opened or is a placeholder slot. */
  status: BookStatus;
  /** Accent used for the cover glow; falls back to the site accent. */
  tint?: string;
}

export type DockActionType = "lightbox" | "link" | "focus-books" | "none";

export interface DockAppAction {
  type: DockActionType;
  /** Book id when type === "lightbox". */
  bookId?: string;
  /** URL when type === "link". */
  href?: string;
}

export interface DockApp {
  id: string;
  label: string;
  /** Gradient endpoints for the rounded-square icon. */
  gradient: [string, string];
  /** Inline SVG path data drawn in white on top of the gradient. */
  glyph: string;
  action: DockAppAction;
  /** Optional small separator after this item (macOS divides recents/trash). */
  dividerAfter?: boolean;
}
