"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark } from "lucide-react";
import { useLanguage } from "@/i18n";
import { LanguageToggle } from "./LanguageToggle";

export interface NavbarProps {
  savedCount?: number;
}

export function Navbar({ savedCount = 3 }: NavbarProps) {
  const rawPathname = usePathname();
  const pathname = rawPathname || "";
  const isHome = pathname === "/";
  const { language, t } = useLanguage();

  const navLinks = [
    { href: "/explore", label: t.nav.explore, match: (p: string) => Boolean(p && (p.startsWith("/explore") || p === "/")) },
    { href: "/search", label: t.nav.search, match: (p: string) => Boolean(p && p.startsWith("/search")) },
    { href: "/contribute", label: t.nav.contribute, match: (p: string) => Boolean(p && p.startsWith("/contribute")) },
  ];

  const formattedSavedCount =
    language === "mr"
      ? `०${savedCount}`
      : savedCount < 10
      ? `0${savedCount}`
      : `${savedCount}`;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-surface/85 backdrop-blur-[14px] border-b border-border/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 h-16 flex items-center justify-between gap-3 sm:gap-6">
          {/* Brand / Logo (shrink-0 to prevent overlap) */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 group no-underline select-none shrink-0"
          >
            {/* Heritage Pin Icon with Inner Arch */}
            <div className="shrink-0 text-accent transition-transform group-hover:scale-105">
              <svg
                width="28"
                height="28"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-sm"
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

            <span className="font-devanagari-heading text-xl sm:text-2xl font-bold tracking-tight text-accent leading-none">
              विरासत
            </span>
          </Link>

          {/* Center Navigation Links (shrink-0 to maintain spacing) */}
          <nav className="flex items-center gap-3.5 sm:gap-7 md:gap-9 shrink-0">
            {navLinks.map((link) => {
              const isActive = link.match(pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-medium transition-colors ${
                    isActive
                      ? "text-accent"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-pill bg-accent shadow-glow" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Language Toggle & Saved Count */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            {/* The EN | मराठी toggle is a pill with the active language highlighted */}
            <LanguageToggle />

            {/* Saved link at the right */}
            <Link
              href="/explore"
              className="flex items-center gap-1.5 text-[11px] sm:text-xs uppercase tracking-wider font-medium text-text-muted hover:text-accent transition-colors group cursor-pointer no-underline"
              title={`${formattedSavedCount} items saved`}
            >
              <Bookmark className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors" />
              <span className="hidden sm:inline">
                {t.nav.saved} ({formattedSavedCount})
              </span>
              <span className="sm:hidden font-mono">
                ({formattedSavedCount})
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content jump on non-home pages */}
      {!isHome && <div className="h-16 shrink-0" aria-hidden="true" />}
    </>
  );
}
