"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { isReducedMotion } from "./motionUtils";

interface LeafConfig {
  id: number;
  type: "bodhi" | "mango" | "neem";
  colorVar: string;
  size: number;
  initialLeft: number; // percentage
  baseOpacity: number;
  fallDuration: number;
  swayDuration: number;
  swayDistance: number;
  delay: number;
}

const LEAVES_CONFIG: LeafConfig[] = [
  { id: 1, type: "bodhi", colorVar: "var(--terracotta)", size: 18, initialLeft: 8, baseOpacity: 0.22, fallDuration: 13, swayDuration: 3.2, swayDistance: 45, delay: 0 },
  { id: 2, type: "mango", colorVar: "var(--green)", size: 20, initialLeft: 18, baseOpacity: 0.18, fallDuration: 16, swayDuration: 4.1, swayDistance: 50, delay: 2.5 },
  { id: 3, type: "neem", colorVar: "var(--gold)", size: 15, initialLeft: 27, baseOpacity: 0.25, fallDuration: 11, swayDuration: 2.8, swayDistance: 35, delay: 5.0 },
  { id: 4, type: "bodhi", colorVar: "var(--green)", size: 17, initialLeft: 38, baseOpacity: 0.20, fallDuration: 14, swayDuration: 3.6, swayDistance: 40, delay: 1.2 },
  { id: 5, type: "mango", colorVar: "var(--terracotta)", size: 22, initialLeft: 49, baseOpacity: 0.16, fallDuration: 17, swayDuration: 4.5, swayDistance: 55, delay: 7.0 },
  { id: 6, type: "neem", colorVar: "var(--gold)", size: 14, initialLeft: 58, baseOpacity: 0.24, fallDuration: 12, swayDuration: 3.0, swayDistance: 30, delay: 3.8 },
  { id: 7, type: "bodhi", colorVar: "var(--terracotta)", size: 19, initialLeft: 67, baseOpacity: 0.22, fallDuration: 15, swayDuration: 3.8, swayDistance: 48, delay: 6.2 },
  { id: 8, type: "mango", colorVar: "var(--green)", size: 21, initialLeft: 76, baseOpacity: 0.19, fallDuration: 18, swayDuration: 4.2, swayDistance: 52, delay: 0.8 },
  { id: 9, type: "neem", colorVar: "var(--gold)", size: 16, initialLeft: 84, baseOpacity: 0.23, fallDuration: 13, swayDuration: 3.4, swayDistance: 38, delay: 4.4 },
  { id: 10, type: "bodhi", colorVar: "var(--gold)", size: 18, initialLeft: 92, baseOpacity: 0.20, fallDuration: 15, swayDuration: 3.9, swayDistance: 42, delay: 2.1 },
  { id: 11, type: "mango", colorVar: "var(--terracotta)", size: 17, initialLeft: 96, baseOpacity: 0.17, fallDuration: 16, swayDuration: 3.5, swayDistance: 46, delay: 8.0 },
];

function LeafSVG({ type, colorVar }: { type: LeafConfig["type"]; colorVar: string }) {
  if (type === "bodhi") {
    // Sacred Bodhi / Peepal leaf with characteristic slender tip
    return (
      <svg viewBox="0 0 24 24" fill={colorVar} className="w-full h-full drop-shadow-sm">
        <path d="M12 2C12 2 13.2 6.1 15.5 8.2C18.2 10.7 19.5 13.8 19 17.5C18.4 21.2 15.3 23.8 12 23.8C8.7 23.8 5.6 21.2 5 17.5C4.5 13.8 5.8 10.7 8.5 8.2C10.8 6.1 12 2 12 2Z" />
        <path d="M12 5V22" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.3" fill="none" />
      </svg>
    );
  }

  if (type === "mango") {
    // Graceful elongated mango / ashoka leaf
    return (
      <svg viewBox="0 0 24 24" fill={colorVar} className="w-full h-full drop-shadow-sm">
        <path d="M12 2C15.8 7.5 17.8 13.2 16.8 18.5C15.5 22 12.8 23.5 12 23.5C11.2 23.5 8.5 22 7.2 18.5C6.2 13.2 8.2 7.5 12 2Z" />
        <path d="M12 4V22" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.3" fill="none" />
      </svg>
    );
  }

  // Neem / Bilva leaflet
  return (
    <svg viewBox="0 0 24 24" fill={colorVar} className="w-full h-full drop-shadow-sm">
      <path d="M12 2.5C15.2 6.5 16.8 11.2 16 16.8C14.8 20.8 12.6 22.8 12 22.8C11.4 22.8 9.2 20.8 8 16.8C7.2 11.2 8.8 6.5 12 2.5Z" />
      <path d="M12 4.5V21" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.3" fill="none" />
    </svg>
  );
}

export function FallingLeaves() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    // Respect prefers-reduced-motion
    if (isReducedMotion()) return;

    const container = containerRef.current;
    const leafNodes = container.querySelectorAll<HTMLElement>("[data-leaf-id]");
    const activeTweens: gsap.core.Tween[] = [];

    const ctx = gsap.context(() => {
      leafNodes.forEach((leaf, idx) => {
        const config = LEAVES_CONFIG[idx];
        if (!config) return;

        // Animate ONLY transform and opacity (GPU accelerated)
        gsap.set(leaf, {
          y: -60,
          x: 0,
          rotation: Math.random() * 60 - 30,
          opacity: 0,
        });

        // 1. Vertical falling tween
        const fallTween = gsap.to(leaf, {
          y: () => window.innerHeight + 80,
          duration: config.fallDuration,
          delay: config.delay,
          repeat: -1,
          ease: "none",
          onRepeat: () => {
            gsap.set(leaf, {
              y: -60,
              x: Math.random() * 20 - 10,
            });
          },
        });
        activeTweens.push(fallTween);

        // 2. Horizontal sway tween
        const swayTween = gsap.to(leaf, {
          x: `+=${config.swayDistance}`,
          rotation: "+=45",
          rotationY: "+=180",
          duration: config.swayDuration,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
        activeTweens.push(swayTween);

        // 3. Opacity envelope (soft fade in and fade out)
        const opacityTween = gsap.to(leaf, {
          opacity: config.baseOpacity,
          duration: 2.0,
          delay: config.delay,
          ease: "power1.inOut",
          yoyo: true,
          repeat: -1,
          repeatDelay: config.fallDuration - 4.0,
        });
        activeTweens.push(opacityTween);
      });
    }, container);

    // Pause when tab is hidden, resume when visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        activeTweens.forEach((t) => t.pause());
      } else {
        activeTweens.forEach((t) => t.resume());
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      activeTweens.forEach((t) => t.kill());
      ctx.revert();
    };
  }, [mounted]);

  // Return null on server and initial client render to guarantee 100% hydration match
  if (!mounted || isReducedMotion()) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {LEAVES_CONFIG.map((config) => (
        <div
          key={config.id}
          data-leaf-id={config.id}
          className="absolute top-0 pointer-events-none will-change-transform"
          style={{
            left: `${config.initialLeft}%`,
            width: `${config.size}px`,
            height: `${config.size}px`,
          }}
        >
          <LeafSVG type={config.type} colorVar={config.colorVar} />
        </div>
      ))}
    </div>
  );
}

