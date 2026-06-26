"use client";

import dynamic from "next/dynamic";

import Wallpaper from "./Wallpaper";
import MenuBar from "./MenuBar";
import Dock from "./Dock";
import BootSequence from "./BootSequence";
import BookGrid from "@/components/books/BookGrid";
import Lightbox from "@/components/lightbox/Lightbox";

// WebGL must stay client-only — never server-render the canvas.
const WaterScene = dynamic(() => import("@/components/water/WaterScene"), {
  ssr: false
});

export default function Desktop() {
  return (
    <main className="relative h-[100dvh] w-full overflow-hidden">
      <Wallpaper />
      <WaterScene />

      <MenuBar />

      {/* The desktop "home screen": books centered, no scrolling. */}
      <div className="absolute inset-0 z-20 grid place-items-center px-6">
        <BookGrid />
      </div>

      <Dock />
      <Lightbox />
      <BootSequence />
    </main>
  );
}
