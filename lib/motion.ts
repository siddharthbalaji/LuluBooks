/**
 * Shared motion language. Centralizing easing + spring presets keeps every
 * transition on the site consistent and makes future tuning a one-file change.
 */

// Primary easing — a refined expo-out: quick to start, long gentle settle.
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
// Symmetric smooth in-out for things that move both ways (pulses, toggles).
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];
// Soft, low-overshoot ease for hovers.
export const EASE_SOFT: [number, number, number, number] = [0.33, 1, 0.68, 1];

// Dock magnification: enough damping to stay glassy-smooth, no jitter.
export const DOCK_SPRING = { mass: 0.16, stiffness: 185, damping: 17 };

// Quick, lightly-sprung hover/tap feedback.
export const HOVER_SPRING = { type: "spring" as const, stiffness: 320, damping: 24 };

// Heavier spring for panels/modals so they feel physical, not snappy.
export const PANEL_SPRING = { type: "spring" as const, stiffness: 240, damping: 26, mass: 0.9 };

// macOS "Quick Look" open: grows out of the clicked item with a soft, lightly
// overshooting settle. Quick to start, gentle to land.
export const LIGHTBOX_SPRING = { type: "spring" as const, stiffness: 210, damping: 23, mass: 0.8 };
