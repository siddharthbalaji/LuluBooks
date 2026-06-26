"use client";

import { useEffect, useState } from "react";

/** Live menu-bar clock, formatted the way macOS shows it. */
export function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  if (!now) return { day: "", date: "", time: "" };

  const day = now.toLocaleDateString(undefined, { weekday: "short" });
  const date = now.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const time = now
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    .replace(/\s/g, " ");
  return { day, date, time };
}
