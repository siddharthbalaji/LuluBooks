"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * A brief "wake" animation on first paint, driven by GSAP. ScrollTrigger is
 * registered here too: the site has no scrolling content yet, but wiring it up
 * now means future scroll-revealed sections just need a trigger — no plumbing.
 */
export default function BootSequence() {
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => setDone(true)
      });
      tl.fromTo(
        ".boot-word",
        { opacity: 0, y: 14, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.08
        }
      )
        .to(".boot-word", { opacity: 1, duration: 0.5 })
        .to(ref.current, { opacity: 0, duration: 0.6, ease: "power2.inOut" }, "+=0.1");
    }, ref);

    return () => ctx.revert();
  }, []);

  if (done) return null;

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-[60] grid place-items-center bg-accent-ink/70 backdrop-blur-xl"
    >
      <h1 className="flex gap-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        <span className="boot-word">Welcome</span>
        <span className="boot-word">to</span>
        <span className="boot-word text-accent-soft">LuluBooks</span>
      </h1>
    </div>
  );
}
