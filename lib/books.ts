import type { Book } from "@/types";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE LIBRARY
 * ─────────────────────────────────────────────────────────────────────────
 *  This array is the single source of truth for what appears on the desktop.
 *  To add a book later, append an object below — the grid, dock, and lightbox
 *  all read from here. No other file needs to change.
 *
 *  To publish your first real book:
 *    1. Drop the cover image into  public/books/   (e.g. my-cover.jpg)
 *    2. Drop the readable file too  public/books/   (e.g. my-book.pdf)
 *    3. Update `cover`, `file`, `title`, `author`, `description` below.
 *    4. Leave `status: "available"`.
 *
 *  A slot with `status: "coming-soon"` renders the site-tinted placeholder
 *  icon and the words "Coming Soon" — no cover or file needed.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const books: Book[] = [
  {
    id: "book-one",
    // ↓↓↓ EDIT THESE FOUR LINES once your book is in /public/books ↓↓↓
    title: "Your First Book",
    author: "Lulu Books",
    description:
      "This is your featured title. Replace the cover, file, and text in lib/books.ts once you upload your book to public/books — everything else updates automatically.",
    cover: "/books/featured-cover.jpg",
    file: "/books/featured.pdf",
    // ↑↑↑ ----------------------------------------------------------- ↑↑↑
    status: "available",
    tint: "#2DA8E0"
  },
  {
    id: "book-two",
    title: "Coming Soon",
    author: "Lulu Books",
    description: "A new title is on the way.",
    cover: "",
    status: "coming-soon"
  },
  {
    id: "book-three",
    title: "Coming Soon",
    author: "Lulu Books",
    description: "A new title is on the way.",
    cover: "",
    status: "coming-soon"
  }
];

export function getBook(id: string): Book | undefined {
  return books.find((b) => b.id === id);
}

export const featuredBook = books.find((b) => b.status === "available");
