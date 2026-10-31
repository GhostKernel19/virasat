"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { isReducedMotion } from "./motionUtils";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Wraps page content with a GSAP fade & slide-in entrance transition (~400ms).
 * Animates only transform and opacity.
 * Respects prefers-reduced-motion.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (isReducedMotion()) {
      // Instant reveal without motion
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    let tween: gsap.core.Tween | null = null;

    const ctx = gsap.context(() => {
      // Initial state: slightly translated along Y and transparent
      gsap.set(el, {
        opacity: 0,
        y: 16,
      });

      // Animate ONLY transform (y) and opacity (~400ms)
      tween = gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
        clearProps: "transform,opacity",
      });
    }, el);

    const handleVisibilityChange = () => {
      if (!tween) return;
      if (document.hidden) {
        tween.pause();
      } else {
        tween.resume();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (tween) tween.kill();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full flex-1 flex flex-col will-change-[transform,opacity]">
      {children}
    </div>
  );
}

