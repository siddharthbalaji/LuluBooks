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
    title: "Think Like an Agency",
    author: "Lulu Books",
    description:
      "The debut title from Lulu Books. Open it to start reading, or download a copy to keep.",
    cover: "/books/featured-cover.jpg",
    file: "/books/Think-like-an-Agency.pdf",
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
