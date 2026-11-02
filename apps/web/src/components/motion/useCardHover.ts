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
          y: -4,
          boxShadow: "var(--shadow-lift)",
          duration: 0.3,
          ease: "cubic-bezier(0.22, 1, 0.36, 1)",
          overwrite: "auto",
        });
      };

      const handleMouseLeave = () => {
        gsap.to(el, {
          y: 0,
          boxShadow: "var(--shadow-soft)",
          duration: 0.3,
          ease: "cubic-bezier(0.22, 1, 0.36, 1)",
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

