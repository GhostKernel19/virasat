"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Navbar, Footer, Button, Chip, PlaceCard } from "@/components";
import { BirdFlock, isReducedMotion } from "@/components/motion";
import { useLanguage } from "@/i18n";
import { ArrowDown, ArrowRight } from "lucide-react";
import { fetchPlacesFromSupabase, FALLBACK_PLACES } from "@/lib/places";
import { Place } from "@/types/place";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomePage() {
  const { language, t } = useLanguage();
  const [places, setPlaces] = useState<Place[]>(FALLBACK_PLACES);

  // Animation references
  const heroBgRef = useRef<HTMLImageElement | null>(null);
  const haze1Ref = useRef<HTMLDivElement | null>(null);
  const haze2Ref = useRef<HTMLDivElement | null>(null);
  const primaryBtnRef = useRef<HTMLButtonElement | null>(null);
  const coverContentRef = useRef<HTMLDivElement | null>(null);
  const section2Ref = useRef<HTMLElement | null>(null);
  const cardsRowRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch real places and counts from Supabase
  useEffect(() => {
    let isSubscribed = true;
    async function loadPlaces() {
      try {
        const data = await fetchPlacesFromSupabase();
        if (isSubscribed && data && data.length > 0) {
          setPlaces(data);
        }
      } catch (err) {
        console.warn("Failed to load places for landing page:", err);
      }
    }
    loadPlaces();
    return () => {
      isSubscribed = false;
    };
  }, []);

  // 2. Smooth-scroll helper to Section 2
  const scrollToSection2 = () => {
    const el = document.getElementById("intro-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 3. GSAP animations and lifecycle handling
  useEffect(() => {
    const reduced = isReducedMotion();
    const activeTweens: (gsap.core.Tween | gsap.core.Timeline)[] = [];

    const ctx = gsap.context(() => {
      // Ken Burns slow zoom (scale 1 to 1.08 over 30s, yoyo)
      if (!reduced && heroBgRef.current) {
        const bgTween = gsap.to(heroBgRef.current, {
          scale: 1.08,
          duration: 30,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
        activeTweens.push(bgTween);
      }

      // Slow warm haze: two blurred radial gradients drifting over 20s
      if (!reduced) {
        if (haze1Ref.current) {
          const t1 = gsap.to(haze1Ref.current, {
            x: 70,
            y: 45,
            duration: 20,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
          activeTweens.push(t1);
        }
        if (haze2Ref.current) {
          const t2 = gsap.to(haze2Ref.current, {
            x: -60,
            y: -35,
            duration: 22,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
          activeTweens.push(t2);
        }
      }

      // Soft glow pulse on primary button every 4s
      if (!reduced && primaryBtnRef.current) {
        const pulseTween = gsap.to(primaryBtnRef.current, {
          boxShadow: "0 0 36px rgba(232, 131, 74, 0.7)",
          duration: 2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          repeatDelay: 2,
        });
        activeTweens.push(pulseTween);
      }

      // Cover items entrance: fade up with 120ms stagger
      if (coverContentRef.current) {
        const coverItems = coverContentRef.current.querySelectorAll(".cover-animate-item");
        if (coverItems.length > 0) {
          if (reduced) {
            gsap.fromTo(
              coverItems,
              { opacity: 0 },
              { opacity: 1, duration: 0.6, stagger: 0.08, ease: "power2.out" }
            );
          } else {
            gsap.fromTo(
              coverItems,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power2.out" }
            );
          }
        }
      }

      // Section 2 cards entrance: fade up on scroll with 80ms stagger
      if (cardsRowRef.current) {
        const cards = cardsRowRef.current.querySelectorAll(".glass-card-item");
        if (cards.length > 0) {
          if (reduced) {
            gsap.fromTo(
              cards,
              { opacity: 0 },
              {
                opacity: 1,
                duration: 0.5,
                stagger: 0.08,
                scrollTrigger: {
                  trigger: cardsRowRef.current,
                  start: "top 85%",
                },
              }
            );
          } else {
            gsap.fromTo(
              cards,
              { opacity: 0, y: 24 },
              {
                opacity: 1,
                y: 0,
                duration: 0.7,
                stagger: 0.08,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: cardsRowRef.current,
                  start: "top 85%",
                },
              }
            );
          }
        }
      }
    });

    // Pause all animations when tab is hidden, resume when tab is visible
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
  }, []);

  // Calculate real counts with fallbacks
  const placesCount = places.length || 4;
  const recordsCount = places.reduce((acc, p) => acc + (p.recordsCount || 0), 0) || 60;

  const formatNumber = (num: number) => {
    if (language === "mr") {
      const devanagariDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
      const str = num < 10 ? `0${num}` : `${num}`;
      return str.split("").map((d) => devanagariDigits[parseInt(d, 10)] ?? d).join("");
    }
    return num < 10 ? `0${num}` : `${num}`;
  };

  const formattedPlacesCount = formatNumber(placesCount);
  const formattedRecordsCount = formatNumber(recordsCount);

  return (
    <div className="min-h-screen flex flex-col text-text bg-bg-0">
      <Navbar />

      {/* SECTION 1: COVER (100vh) */}
      <section className="relative min-h-screen w-full overflow-hidden isolate flex flex-col justify-between items-center text-center px-4 sm:px-8 select-none">
        {/* Background image with Ken Burns slow zoom (GSAP): hero.webp only */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={heroBgRef}
            src="/images/hero.webp"
            alt=""
            className="w-full h-full object-cover will-change-transform"
          />
        </div>

        {/* Overlay: linear-gradient(to bottom, rgba(21,9,4,0.55), rgba(21,9,4,0.35) 40%, rgba(21,9,4,0.8)) plus radial darkening behind text */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at center, rgba(21, 9, 4, 0.75) 0%, rgba(21, 9, 4, 0.4) 50%, transparent 80%),
              linear-gradient(to bottom, rgba(21, 9, 4, 0.55), rgba(21, 9, 4, 0.35) 40%, rgba(21, 9, 4, 0.8))
            `,
          }}
        />

        {/* Slow warm haze: two blurred radial gradients drifting over 20s at opacity 0.15 */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-[2] overflow-hidden"
        >
          <div
            ref={haze1Ref}
            className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[100px] opacity-[0.15] will-change-transform"
            style={{
              background: "radial-gradient(circle, #E8834A 0%, #D9A441 50%, transparent 70%)",
            }}
          />
          <div
            ref={haze2Ref}
            className="absolute -bottom-32 -right-32 w-[650px] h-[650px] rounded-full blur-[110px] opacity-[0.15] will-change-transform"
            style={{
              background: "radial-gradient(circle, #D9A441 0%, #C65D3B 50%, transparent 70%)",
            }}
          />
        </div>

        {/* BirdFlock drifting slowly across upper cover */}
        <BirdFlock />

        {/* Centred Cover Content: Flex column with fixed gaps and no absolute positioning inside */}
        <div
          ref={coverContentRef}
          className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center my-auto pt-24 pb-8"
        >
          {/* 1. Pin icon 56px */}
          <div className="cover-animate-item text-accent filter drop-shadow-[0_0_24px_rgba(232,131,74,0.6)] shrink-0 w-14 h-14 flex items-center justify-center">
            <svg
              width="56"
              height="56"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-14 h-14"
            >
              <path
                d="M16 3C10.477 3 6 7.477 6 13C6 20.5 16 29 16 29C16 29 26 20.5 26 13C26 7.477 21.523 3 16 3Z"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 16.5V13.5C12 11.29 13.79 9.5 16 9.5C18.21 9.5 20 11.29 20 13.5V16.5"
                stroke="var(--accent)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="16.5"
                x2="20"
                y2="16.5"
                stroke="var(--accent)"
                strokeWidth="1.8"
              />
            </svg>
          </div>

          {/* 16px gap -> then Marathi wordmark विरासत (clamp 56 to 88px, line-height 1.2 with enough top padding so headline stroke is not clipped) */}
          <div
            className="cover-animate-item pt-2 sm:pt-3"
            style={{ marginTop: 16 }}
          >
            <span
              className="font-devanagari-heading font-bold bg-gradient-to-r from-[#F7C9A3] via-[#E8834A] to-[#C65D3B] bg-clip-text text-transparent block select-none"
              style={{
                fontSize: "clamp(56px, 6vw, 88px)",
                lineHeight: 1.2,
              }}
            >
              विरासत
            </span>
          </div>

          {/* 8px gap -> then VIRASAT serif (clamp 72 to 140px, line-height 1, letter-spacing 0.02em) */}
          <div
            className="cover-animate-item"
            style={{ marginTop: 8 }}
          >
            <span
              className="font-serif font-black uppercase bg-gradient-to-r from-[#F7C9A3] via-[#E8834A] to-[#C65D3B] bg-clip-text text-transparent block select-none drop-shadow-[0_4px_30px_rgba(232,131,74,0.3)]"
              style={{
                fontSize: "clamp(72px, 9vw, 140px)",
                lineHeight: 1,
                letterSpacing: "0.02em",
              }}
            >
              VIRASAT
            </span>
          </div>

          {/* 20px gap -> then letter-spaced "A LIVING HERITAGE ATLAS" */}
          <p
            className="cover-animate-item text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-text/85"
            style={{ marginTop: 20 }}
          >
            {t.routes.home.livingAtlas}
          </p>

          {/* 40px gap -> then orange tagline */}
          <p
            className="cover-animate-item text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase text-accent"
            style={{ marginTop: 40 }}
          >
            {t.routes.home.tagline}
          </p>

          {/* 12px gap -> then serif headline (max-width 900px, text-wrap balance) */}
          <h1
            className="cover-animate-item font-serif text-2xl sm:text-4xl lg:text-5xl font-normal text-text leading-tight w-full max-w-[900px] mx-auto px-4"
            style={{
              marginTop: 12,
              textWrap: "balance",
            }}
          >
            {t.routes.home.headline}
          </h1>

          {/* 16px gap -> then paragraph (max-width 640px) */}
          <p
            className="cover-animate-item text-sm sm:text-base text-text-muted max-w-[640px] mx-auto leading-relaxed px-4"
            style={{ marginTop: 16 }}
          >
            {t.routes.home.description}
          </p>

          {/* 36px gap -> then buttons row */}
          <div
            className="cover-animate-item flex flex-wrap items-center justify-center gap-4 px-4"
            style={{ marginTop: 36 }}
          >
            <Link href="/explore">
              <Button
                variant="secondary"
                size="lg"
                className="bg-[rgba(21,9,4,0.45)] backdrop-blur-[10px] border border-[rgba(245,230,211,0.28)] text-text text-[15px] sm:text-base font-medium hover:bg-[rgba(21,9,4,0.65)] hover:border-text/60 shadow-soft hover:-translate-y-0.5"
              >
                {t.routes.home.ctaExploreMap}
              </Button>
            </Link>

            <Button
              ref={primaryBtnRef}
              variant="primary"
              size="lg"
              className="text-[15px] sm:text-base font-medium shadow-glow"
              iconRight={<ArrowDown className="w-4 h-4" />}
              onClick={scrollToSection2}
            >
              {t.routes.home.ctaEnterAtlas}
            </Button>

            <Link href="/contribute">
              <Button
                variant="secondary"
                size="lg"
                className="bg-[rgba(21,9,4,0.45)] backdrop-blur-[10px] border border-[rgba(245,230,211,0.28)] text-text text-[15px] sm:text-base font-medium hover:bg-[rgba(21,9,4,0.65)] hover:border-text/60 shadow-soft hover:-translate-y-0.5"
              >
                {t.routes.home.ctaContributeRecord}
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom bar on a dark gradient strip so it is readable */}
        <div className="relative z-20 w-full bg-gradient-to-t from-bg-0 via-bg-0/90 to-transparent pt-10 pb-6 mt-auto">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 flex items-center justify-between text-xs tracking-widest uppercase text-text/75 font-medium">
            <div className="hidden sm:block">
              {t.routes.home.bottomBarLeft}
            </div>

            <button
              type="button"
              onClick={scrollToSection2}
              className="mx-auto sm:mx-0 flex items-center gap-2 text-text/75 hover:text-accent transition-colors cursor-pointer group"
              aria-label={t.routes.home.scrollToDiscover}
            >
              <span>{t.routes.home.scrollToDiscover}</span>
              <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-1 transition-transform animate-bounce" />
            </button>

            <div className="hidden sm:block w-36" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* SECTION 2: INTRO */}
      <section
        id="intro-section"
        ref={section2Ref}
        className="relative z-10 max-w-7xl w-full mx-auto px-5 sm:px-8 lg:px-10 py-24 flex flex-col gap-12"
      >
        {/* Intro Header & Stats */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-4 border-b border-border/40">
          {/* Left Column */}
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.25em] text-accent uppercase mb-3">
              {t.routes.home.introLabel}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-text leading-tight mb-4">
              {t.routes.home.introTitle}
            </h2>
            <p className="text-sm sm:text-base text-text-muted leading-relaxed mb-6">
              {t.routes.home.introParagraph}
            </p>

            {/* Pill Filter Chips linking to /explore */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link href="/explore">
                <Chip active>{t.common.all}</Chip>
              </Link>
              <Link href="/explore?filter=ocr">
                <Chip>{t.common.hasOcr}</Chip>
              </Link>
              <Link href="/explore?type=Stepwell">
                <Chip>{t.common.stepwells}</Chip>
              </Link>
              <Link href="/explore?type=Fort">
                <Chip>{t.common.forts}</Chip>
              </Link>
            </div>
          </div>

          {/* Right Column: Stats Block */}
          <div className="flex items-center gap-8 self-start lg:self-end shrink-0 pt-2 lg:pt-0">
            <div>
              <span className="font-serif text-4xl sm:text-5xl text-accent font-normal block leading-none">
                {formattedPlacesCount}
              </span>
              <span className="text-[11px] font-mono tracking-widest text-text-muted uppercase mt-2 block">
                {t.common.placesMapped}
              </span>
            </div>
            <div className="h-12 w-px bg-border/40" />
            <div>
              <span className="font-serif text-4xl sm:text-5xl text-accent font-normal block leading-none">
                {formattedRecordsCount}
              </span>
              <span className="text-[11px] font-mono tracking-widest text-text-muted uppercase mt-2 block">
                {t.common.linkedRecords}
              </span>
            </div>
          </div>
        </div>

        {/* Row of 3 Glass Cards for the first three places */}
        <div
          ref={cardsRowRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {places.slice(0, 3).map((place, idx) => (
            <PlaceCard
              key={place.id}
              id={place.slug || place.id}
              title={place.name}
              marathiTitle={place.marathiName}
              location={`${place.region ? place.region + ", " : ""}${place.state}`}
              century={place.period}
              category={place.category}
              imageUrl={place.imageUrl || ""}
              hasOcr={place.hasOcr}
              recordsCount={place.recordsCount || 0}
              isIllustrative={place.isIllustrative !== false}
              isSelected={idx === 0}
              href={`/place/${place.slug || place.id}`}
              className="glass-card-item"
            />
          ))}
        </div>

        {/* Glass Strip with quote and contribution callout */}
        <div className="p-5 sm:p-6 glass shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-accent text-lg shrink-0">✦</span>
            <p className="text-xs sm:text-sm text-text-muted font-serif italic">
              &quot;{t.common.quoteBanner}&quot;
            </p>
          </div>
          <Link href="/contribute" className="shrink-0">
            <Button
              variant="link"
              size="sm"
              iconRight={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {t.routes.home.addToAtlasAction}
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
