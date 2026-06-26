"use client";

import { COMING_SOON_ICON } from "@/lib/cloudinary";

/**
 * Renders the Cloudinary "coming soon" glyph recolored to the site accent.
 * Using the PNG as a CSS mask paints it entirely in our aqua, so the
 * placeholder reads as part of the system rather than a stock asset.
 */
export default function ComingSoonIcon({ size = 84 }: { size?: number }) {
  const mask = `url("${COMING_SOON_ICON}") center / contain no-repeat`;
  return (
    <span
      role="img"
      aria-label="Coming soon"
      style={{
        width: size,
        height: size,
        WebkitMask: mask,
        mask,
        backgroundImage:
          "linear-gradient(160deg, #5FC3EC 0%, #2DA8E0 55%, #0A84FF 100%)"
      }}
      className="block drop-shadow-[0_8px_24px_rgba(45,168,224,0.35)]"
    />
  );
}
