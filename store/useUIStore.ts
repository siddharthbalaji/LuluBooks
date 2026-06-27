import { create } from "zustand";

/** Viewport-space point a lightbox should grow out of / collapse back into. */
export interface Origin {
  x: number;
  y: number;
}

interface UIState {
  /** Currently opened book id, or null when the lightbox is closed. */
  openBookId: string | null;
  /** Where the open was triggered from (clicked cover center), for the zoom. */
  openOrigin: Origin | null;
  /** Pulse the book grid (e.g. when "Library" is tapped in the dock). */
  booksFocused: boolean;
  /** Book id currently open in the in-site PDF reader, or null when closed. */
  readerBookId: string | null;
  /** Whether the Spotlight-style search palette is open. */
  searchOpen: boolean;

  openBook: (id: string, origin?: Origin) => void;
  closeBook: () => void;
  focusBooks: () => void;
  openReader: (id: string) => void;
  closeReader: () => void;
  openSearch: () => void;
  closeSearch: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  openBookId: null,
  openOrigin: null,
  booksFocused: false,
  readerBookId: null,
  searchOpen: false,

  openBook: (id, origin) => set({ openBookId: id, openOrigin: origin ?? null }),
  closeBook: () => set({ openBookId: null }),
  focusBooks: () => {
    set({ booksFocused: true });
    // auto-release the highlight so it can be re-triggered
    setTimeout(() => set({ booksFocused: false }), 1400);
  },
  // Opening the reader closes the lightbox underneath so we don't stack modals.
  openReader: (id) => set({ readerBookId: id, openBookId: null }),
  closeReader: () => set({ readerBookId: null }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false })
}));
