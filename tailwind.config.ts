import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Site accent — the aqua that ties the water surface to the book chrome.
        accent: {
          DEFAULT: "#2DA8E0",
          soft: "#5FC3EC",
          deep: "#0A84FF",
          ink: "#0A1628"
        }
      },
      fontFamily: {
        // Authentic macOS system stack (SF Pro on Apple devices).
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Inter",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ]
      },
      backdropBlur: {
        xs: "2px",
        glass: "20px"
      },
      boxShadow: {
        dock: "0 12px 40px -12px rgba(0,0,0,0.55)",
        glass: "0 8px 32px -8px rgba(0,0,0,0.35), inset 0 1px 0 0 rgba(255,255,255,0.25)",
        book: "0 24px 60px -20px rgba(0,0,0,0.6)",
        menu: "0 16px 48px -12px rgba(0,0,0,0.45)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.6s ease forwards",
        "scale-in": "scale-in 0.3s cubic-bezier(0.22,1,0.36,1) forwards"
      }
    }
  },
  plugins: []
};

export default config;
