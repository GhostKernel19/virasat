"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { isReducedMotion } from "./motionUtils";

interface BirdConfig {
  id: number;
  topPercent: number;
  duration: number;
  delay: number;
  size: number;
  baseOpacity: number;
}

const BIRDS_CONFIG: BirdConfig[] = [
  { id: 1, topPercent: 18, duration: 34, delay: 0, size: 20, baseOpacity: 0.28 },
  { id: 2, topPercent: 22, duration: 38, delay: 5, size: 16, baseOpacity: 0.22 },
  { id: 3, topPercent: 15, duration: 32, delay: 11, size: 18, baseOpacity: 0.25 },
  { id: 4, topPercent: 27, duration: 36, delay: 17, size: 22, baseOpacity: 0.30 },
  { id: 5, topPercent: 20, duration: 40, delay: 23, size: 15, baseOpacity: 0.20 },
  { id: 6, topPercent: 24, duration: 35, delay: 29, size: 17, baseOpacity: 0.26 },
];

function BirdSVG() {
  return (
    <svg
      viewBox="0 0 32 16"
      fill="currentColor"
      className="w-full h-full text-accent drop-shadow-sm select-none"
    >
      <path d="M0 8 C6 2, 12 2, 16 7 C20 2, 26 2, 32 8 C27 5, 20 6, 16 11 C12 6, 5 5, 0 8 Z" />
    </svg>
  );
}

export function BirdFlock() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    if (isReducedMotion()) return;

    const container = containerRef.current;
    const birdElements = container.querySelectorAll<HTMLElement>("[data-bird-id]");
    const activeTweens: gsap.core.Tween[] = [];

    const ctx = gsap.context(() => {
      birdElements.forEach((bird, idx) => {
        const config = BIRDS_CONFIG[idx];
        if (!config) return;

        // Start offscreen to the left
        gsap.set(bird, {
          x: -100,
          y: 0,
          opacity: 0,
        });

        // 1. Horizontal drift across screen (transform only)
        const driftTween = gsap.to(bird, {
          x: () => window.innerWidth + 120,
          duration: config.duration,
          delay: config.delay,
          repeat: -1,
          ease: "none",
          onRepeat: () => {
            gsap.set(bird, { x: -100, y: Math.random() * 20 - 10 });
          },
        });
        activeTweens.push(driftTween);

        // 2. Subtle wing glide / gentle bobbing
        const glideTween = gsap.to(bird, {
          y: "+=16",
          scaleY: 0.88,
          duration: 2.4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
        activeTweens.push(glideTween);

        // 3. Smooth opacity fade-in / fade-out at edges
        const opacityTween = gsap.to(bird, {
          opacity: config.baseOpacity,
          duration: 3,
          delay: config.delay,
          ease: "power1.inOut",
          yoyo: true,
          repeat: -1,
          repeatDelay: config.duration - 6,
        });
        activeTweens.push(opacityTween);
      });
    }, container);

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

  if (!mounted || isReducedMotion()) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-[3] overflow-hidden select-none"
    >
      {BIRDS_CONFIG.map((config) => (
        <div
          key={config.id}
          data-bird-id={config.id}
          className="absolute pointer-events-none will-change-transform"
          style={{
            top: `${config.topPercent}%`,
            left: 0,
            width: `${config.size}px`,
            height: `${Math.round(config.size / 2)}px`,
            opacity: 0,
          }}
        >
          <BirdSVG />
        </div>
      ))}
    </div>
  );
}

