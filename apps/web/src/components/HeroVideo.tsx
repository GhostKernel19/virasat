"use client";

import React, { useEffect, useRef, useState } from "react";

export interface HeroVideoProps {
  poster?: string;
}

export function HeroVideo({ poster }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [canLoadVideo, setCanLoadVideo] = useState(true);

  useEffect(() => {
    // 1. Accessibility and performance checks
    const checkCanLoad = () => {
      const isNarrow = window.innerWidth < 640;
      const nav = navigator as unknown as { connection?: { saveData?: boolean } };
      const isSaveData = Boolean(nav.connection?.saveData);
      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const prefersReducedMotion = motionQuery.matches;

      return !isNarrow && !isSaveData && !prefersReducedMotion;
    };

    const allowed = checkCanLoad();
    if (!allowed) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setCanLoadVideo(false);
      return;
    }

    setCanLoadVideo(true);

    const video = videoRef.current;
    if (!video) return;

    // 2. Silent autoplay handling
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy prevented playback - handle silently
      });
    }

    // 3. Viewport intersection handling (pause when out of view)
    let isIntersecting = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        if (!videoRef.current) return;
        if (entry.isIntersecting && !document.hidden) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      },
      { threshold: 0 }
    );

    observer.observe(video);

    // 4. Tab visibility handling (pause when tab hidden)
    const handleVisibilityChange = () => {
      if (!videoRef.current) return;
      if (document.hidden) {
        videoRef.current.pause();
      } else if (isIntersecting) {
        videoRef.current.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 5. Dynamic resize / preference change handling
    const handleResize = () => {
      const isNowAllowed = checkCanLoad();
      if (!isNowAllowed) {
        if (videoRef.current) {
          videoRef.current.pause();
        }
        setCanLoadVideo(false);
      } else {
        setCanLoadVideo(true);
      }
    };

    window.addEventListener("resize", handleResize);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        if (videoRef.current) {
          videoRef.current.pause();
        }
        setCanLoadVideo(false);
      } else if (checkCanLoad()) {
        setCanLoadVideo(true);
      }
    };

    motionQuery.addEventListener?.("change", handleMotionChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleResize);
      motionQuery.removeEventListener?.("change", handleMotionChange);
    };
  }, []);

  return (
    <>
      {canLoadVideo ? (
        <video
          ref={videoRef}
          src="/bg-hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          poster={poster}
          className="absolute inset-0 z-0 h-full w-full object-cover pointer-events-none hero-video-filter"
        />
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 z-0 h-full w-full object-cover pointer-events-none hero-video-filter"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 pointer-events-none bg-[var(--hero-brown-2)]"
        />
      )}

      {/* Sibling absolutely positioned overlays with pointer-events-none */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] pointer-events-none hero-radial-overlay"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] pointer-events-none hero-tint-overlay"
      />
    </>
  );
}
