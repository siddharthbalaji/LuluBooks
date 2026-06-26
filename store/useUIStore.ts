import { create } from "zustand";

interface UIState {
  /** Currently opened book id, or null when the lightbox is closed. */
  openBookId: string | null;
  /** Pulse the book grid (e.g. when "Library" is tapped in the dock). */
  booksFocused: boolean;

  openBook: (id: string) => void;
  closeBook: () => void;
  focusBooks: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  openBookId: null,
  booksFocused: false,

  openBook: (id) => set({ openBookId: id }),
  closeBook: () => set({ openBookId: null }),
  focusBooks: () => {
    set({ booksFocused: true });
    // auto-release the highlight so it can be re-triggered
    setTimeout(() => set({ booksFocused: false }), 1400);
  }
}));
