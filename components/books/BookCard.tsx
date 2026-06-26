"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import ComingSoonIcon from "./ComingSoon";
import { useUIStore } from "@/store/useUIStore";
import type { Book } from "@/types";

interface BookCardProps {
  book: Book;
  index: number;
}

export default function BookCard({ book, index }: BookCardProps) {
  const openBook = useUIStore((s) => s.openBook);
  const isAvailable = book.status === "available";

  return (
    <motion.button
      type="button"
      disabled={!isAvailable}
      onClick={() => isAvailable && openBook(book.id)}
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 0.45 + index * 0.12,
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={isAvailable ? { y: -10 } : { y: -4 }}
      className="group flex w-[clamp(140px,22vw,200px)] flex-col items-center gap-4
                 outline-none disabled:cursor-default"
      aria-label={isAvailable ? `Open ${book.title}` : "Coming soon"}
    >
      {/* cover / placeholder tile */}
      <div
        className="relative grid aspect-[3/4] w-full place-items-center overflow-hidden
                   rounded-2xl border border-white/25 bg-white/10 shadow-book
                   backdrop-blur-md transition-shadow duration-300
                   group-hover:shadow-[0_34px_80px_-20px_rgba(0,0,0,0.7)]"
      >
        {isAvailable ? (
          <Image
            src={book.cover}
            alt={`${book.title} cover`}
            fill
            sizes="(max-width: 768px) 40vw, 200px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <ComingSoonIcon size={84} />
          </div>
        )}

        {/* glossy hover sheen */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {/* label */}
      <div className="text-center">
        <p className="text-[15px] font-semibold leading-tight text-white drop-shadow">
          {isAvailable ? book.title : "Coming Soon"}
        </p>
        <p className="mt-0.5 text-[12px] text-white/70 drop-shadow">
          {isAvailable ? book.author : "New title on the way"}
        </p>
      </div>
    </motion.button>
  );
}
