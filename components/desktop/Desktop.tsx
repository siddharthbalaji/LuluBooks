"use client";

import Wallpaper from "./Wallpaper";
import MenuBar from "./MenuBar";
import Dock from "./Dock";
import BootSequence from "./BootSequence";
import SpotlightSearch from "./SpotlightSearch";
import BookGrid from "@/components/books/BookGrid";
import Lightbox from "@/components/lightbox/Lightbox";
import PdfReader from "@/components/reader/PdfReader";

export default function Desktop() {
  return (
    <main className="relative h-[100dvh] w-full overflow-hidden">
      <Wallpaper />

      <MenuBar />

      {/* The desktop "home screen": books centered, no scrolling. The vertical
          padding keeps the shelf clear of the menu bar and dock on short
          screens; horizontal padding tightens on phones so cards never clip. */}
      <div className="absolute inset-0 z-20 grid place-items-center px-4 pb-24 pt-10 sm:px-6">
        <BookGrid />
      </div>

      <Dock />
      <Lightbox />
      <PdfReader />
      <SpotlightSearch />
      <BootSequence />
    </main>
  );
}
