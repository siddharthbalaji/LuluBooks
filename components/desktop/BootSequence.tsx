"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { BRAND } from "@/lib/brand";

/**
 * A brief, smooth "wake" on first paint, driven by GSAP. ScrollTrigger is
 * registered here too: there's no scrolling content yet, but wiring it up now
 * means future scroll-revealed sections only need a trigger — no plumbing.
 */
export default function BootSequence() {
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: () => setDone(true) });

      tl.fromTo(
        ".boot-logo",
        { opacity: 0, scale: 0.9, filter: "blur(6px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.7, ease: "expo.out" }
      )
        .fromTo(
          ".boot-word",
          { opacity: 0, y: 12, filter: "blur(8px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.6,
            ease: "expo.out",
            stagger: 0.07
          },
          "-=0.35"
        )
        .to({}, { duration: 0.45 })
        .to(ref.current, { opacity: 0, duration: 0.7, ease: "power2.inOut" });
    }, ref);

    return () => ctx.revert();
  }, []);

  if (done) return null;

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-[60] grid place-items-center bg-accent-ink/75 backdrop-blur-xl"
    >
      <div className="flex flex-col items-center gap-5">
        {logoOk && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={BRAND.logo}
            alt={BRAND.name}
            onError={() => setLogoOk(false)}
            className="boot-logo h-16 w-auto object-contain"
          />
        )}
        <h1 className="flex gap-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          <span className="boot-word">Welcome</span>
          <span className="boot-word">to</span>
          <span className="boot-word text-accent-soft">{BRAND.name}</span>
        </h1>
      </div>
    </div>
  );
}
