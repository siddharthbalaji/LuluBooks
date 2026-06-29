"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import ComingSoonIcon from "./ComingSoon";
import { useUIStore } from "@/store/useUIStore";
import { EASE_OUT, HOVER_SPRING } from "@/lib/motion";
import type { Book } from "@/types";

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.93 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease: EASE_OUT }
  }
};

export default function BookCard({ book, priority = false }: { book: Book; priority?: boolean }) {
  const openBook = useUIStore((s) => s.openBook);
  const isAvailable = book.status === "available";

  return (
    <motion.button
      type="button"
      variants={cardVariants}
      disabled={!isAvailable}
      onClick={(e) => {
        if (!isAvailable) return;
        const r = e.currentTarget.getBoundingClientRect();
        openBook(book.id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      whileHover={isAvailable ? { y: -12, transition: HOVER_SPRING } : { y: -5, transition: HOVER_SPRING }}
      whileTap={isAvailable ? { scale: 0.97, transition: HOVER_SPRING } : undefined}
      className="group flex w-[clamp(108px,26vw,200px)] flex-col items-center gap-4
                 outline-none disabled:cursor-default"
      style={{ willChange: "transform" }}
      aria-label={isAvailable ? `Open ${book.title}` : "Coming soon"}
    >
      {/* cover / placeholder tile */}
      <div
        className="relative grid aspect-[3/4] w-full place-items-center overflow-hidden
                   rounded-2xl border border-white/25 bg-white/10 shadow-book
                   backdrop-blur-md transition-shadow duration-500 ease-out
                   group-hover:shadow-[0_36px_84px_-20px_rgba(0,0,0,0.72)]"
      >
        {isAvailable ? (
          <Image
            src={book.cover}
            alt={`${book.title} cover`}
            fill
            sizes="(max-width: 768px) 40vw, 200px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            priority={priority}
            loading={priority ? undefined : "lazy"}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 transition-transform duration-500 ease-out group-hover:scale-[1.05]">
            <ComingSoonIcon size={84} />
          </div>
        )}

        {/* glossy hover sheen */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
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
