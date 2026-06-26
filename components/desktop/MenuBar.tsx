"use client";

import { motion } from "framer-motion";

import { useClock } from "@/hooks/useClock";

const menuItems = ["File", "Edit", "View", "Library", "Window", "Help"];

export default function MenuBar() {
  const { day, date, time } = useClock();

  return (
    <motion.header
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-40 flex h-7 items-center justify-between
                 bg-white/15 px-3 text-[13px] font-medium text-white/90
                 backdrop-blur-glass backdrop-saturate-150"
    >
      {/* Left: brand + app menus */}
      <nav className="flex items-center gap-4">
        <span className="text-white drop-shadow-sm" aria-hidden>
          {/* original mark, not Apple's logo */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c2 3 2 5 0 7s-2 4 0 6 2 4 0 7c-3-2-5-2-7 0-1-3-1-5 1-7s2-4 0-6-2-4 1-7c2 2 4 2 5 1z" />
          </svg>
        </span>
        <span className="font-semibold tracking-tight">LuluBooks</span>
        <ul className="hidden items-center gap-4 sm:flex">
          {menuItems.map((item) => (
            <li
              key={item}
              className="cursor-default rounded px-1 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              {item}
            </li>
          ))}
        </ul>
      </nav>

      {/* Right: status cluster + clock */}
      <div className="flex items-center gap-3 text-white/90">
        <StatusGlyphs />
        <span className="hidden tabular-nums sm:inline">
          {day} {date}
        </span>
        <span className="tabular-nums">{time}</span>
      </div>
    </motion.header>
  );
}

function StatusGlyphs() {
  return (
    <div className="flex items-center gap-2.5">
      {/* battery */}
      <svg width="22" height="14" viewBox="0 0 26 14" fill="none" aria-hidden>
        <rect x="1" y="2" width="20" height="10" rx="3" stroke="currentColor" strokeOpacity="0.7" />
        <rect x="3" y="4" width="13" height="6" rx="1.5" fill="currentColor" />
        <rect x="22.5" y="5" width="2" height="4" rx="1" fill="currentColor" fillOpacity="0.7" />
      </svg>
      {/* wifi */}
      <svg width="16" height="14" viewBox="0 0 18 14" fill="currentColor" aria-hidden>
        <path d="M9 11.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM4.4 7.9a6.5 6.5 0 019.2 0l-1.4 1.4a4.5 4.5 0 00-6.4 0L4.4 7.9zM1.6 5.1a10.5 10.5 0 0114.8 0L15 6.5a8.5 8.5 0 00-12 0L1.6 5.1z" />
      </svg>
      {/* control center */}
      <svg width="16" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
        <rect x="1" y="2.5" width="16" height="3.2" rx="1.6" stroke="currentColor" strokeOpacity="0.7" />
        <rect x="1" y="8.3" width="16" height="3.2" rx="1.6" stroke="currentColor" strokeOpacity="0.7" />
        <circle cx="6" cy="4.1" r="1.1" fill="currentColor" />
        <circle cx="12" cy="9.9" r="1.1" fill="currentColor" />
      </svg>
    </div>
  );
}
