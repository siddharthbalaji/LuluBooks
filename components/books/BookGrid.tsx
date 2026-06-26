"use client";

import { motion } from "framer-motion";

import BookCard from "./BookCard";
import { books } from "@/lib/books";
import { useUIStore } from "@/store/useUIStore";
import { EASE_IN_OUT } from "@/lib/motion";

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.5 }
  }
};

export default function BookGrid() {
  const booksFocused = useUIStore((s) => s.booksFocused);

  return (
    // Outer layer: the on-demand "Library" focus pulse.
    <motion.div
      animate={booksFocused ? { scale: [1, 1.035, 1] } : { scale: 1 }}
      transition={{ duration: 0.8, ease: EASE_IN_OUT }}
    >
      {/* Inner layer: orchestrated entrance stagger. */}
      <motion.section
        id="books"
        variants={container}
        initial="hidden"
        animate="visible"
        className="flex items-start justify-center gap-[clamp(20px,5vw,72px)]"
        aria-label="Library"
      >
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </motion.section>
    </motion.div>
  );
}
