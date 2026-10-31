/**
 * Utility functions for GSAP animations and accessibility checks.
 */

export function isReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isHoverCapable(): boolean {
  if (typeof window === "undefined") return false;
  // Exclude touch devices where hover states get stuck or feel unnatural
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

