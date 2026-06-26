"use client";

import { motion } from "framer-motion";

import BookCard from "./BookCard";
import { books } from "@/lib/books";
import { useUIStore } from "@/store/useUIStore";

export default function BookGrid() {
  const booksFocused = useUIStore((s) => s.booksFocused);

  return (
    <motion.section
      id="books"
      animate={booksFocused ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
      className="pointer-events-auto flex items-start justify-center gap-[clamp(20px,5vw,72px)]"
      aria-label="Library"
    >
      {books.map((book, i) => (
        <BookCard key={book.id} book={book} index={i} />
      ))}
    </motion.section>
  );
}
