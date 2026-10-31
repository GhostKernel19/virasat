"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { isHoverCapable, isReducedMotion } from "./motionUtils";

export interface UseCardHoverOptions {
  scale?: number;
  duration?: number;
  glowColorVar?: string;
}

/**
 * Reusable hook for interactive card hover effects with GSAP.
 * Scales the card to ~1.03 and adds a soft accent glow.
 * Automatically skips on touch devices and respects prefers-reduced-motion.
 */
export function useCardHover<T extends HTMLElement = HTMLDivElement>(
  options: UseCardHoverOptions = {}
) {
  const {
    scale = 1.03,
    duration = 0.28,
    glowColorVar = "--accent-glow",
  } = options;

  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Skip on touch-only devices or if user prefers reduced motion
    if (!isHoverCapable() || isReducedMotion()) {
      return;
    }

    const ctx = gsap.context(() => {
      const handleMouseEnter = () => {
        gsap.to(el, {
          scale,
          boxShadow: `0 12px 28px -4px var(${glowColorVar}, rgba(198, 93, 59, 0.28)), 0 0 16px 2px var(${glowColorVar}, rgba(198, 93, 59, 0.2))`,
          duration,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const handleMouseLeave = () => {
        gsap.to(el, {
          scale: 1,
          boxShadow: "0 0 0 0 rgba(0, 0, 0, 0)",
          duration,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, el);

    return () => {
      ctx.revert();
    };
  }, [scale, duration, glowColorVar]);

  return elementRef;
}

