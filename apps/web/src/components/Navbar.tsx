"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark } from "lucide-react";
import { useLanguage } from "@/i18n";

export interface NavbarProps {
  savedCount?: number;
}

export function Navbar({ savedCount = 3 }: NavbarProps) {
  const rawPathname = usePathname();
  const pathname = rawPathname || "";
  const { language, setLanguage, t } = useLanguage();

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
    <header className="sticky top-0 z-50 w-full bg-sand/95 backdrop-blur-sm border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group no-underline select-none"
        >
          {/* Heritage Pin Icon with Inner Arch */}
          <div className="shrink-0 text-terracotta transition-transform group-hover:scale-105">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-2xs"
            >
              <path
                d="M16 3C10.477 3 6 7.477 6 13C6 20.5 16 29 16 29C16 29 26 20.5 26 13C26 7.477 21.523 3 16 3Z"
                stroke="#C65D3B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 16.5V13.5C12 11.29 13.79 9.5 16 9.5C18.21 9.5 20 11.29 20 13.5V16.5"
                stroke="#C65D3B"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="16.5"
                x2="20"
                y2="16.5"
                stroke="#C65D3B"
                strokeWidth="1.8"
              />
            </svg>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-devanagari font-bold text-2xl tracking-tight text-terracotta leading-none">
              विरासत
            </span>
            <div className="hidden sm:flex flex-col border-l border-terracotta/30 pl-2 leading-none">
              <span className="text-[9px] font-semibold tracking-wider text-terracotta/90 uppercase">
                {t.brand.labelTop}
              </span>
              <span className="text-[9px] font-semibold tracking-wider text-terracotta/90 uppercase mt-0.5">
                {t.brand.labelBottom}
              </span>
            </div>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = link.match(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm font-medium transition-colors ${
                  isActive
                    ? "text-terracotta"
                    : "text-ink/70 hover:text-ink"
                }`}
              >
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-terracotta" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Language Toggle & Saved Count */}
        <div className="flex items-center gap-4 text-xs font-medium text-ink">
          {/* Language Switcher */}
          <div className="flex items-center gap-1.5 select-none bg-sand-50/60 px-2 py-1 rounded border border-line/60">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`transition-colors cursor-pointer ${
                language === "en"
                  ? "text-ink font-semibold"
                  : "text-ink/45 hover:text-ink/80"
              }`}
            >
              EN
            </button>
            <span className="text-line-dark select-none font-normal">|</span>
            <button
              type="button"
              onClick={() => setLanguage("mr")}
              className={`transition-colors cursor-pointer font-devanagari ${
                language === "mr"
                  ? "text-ink font-semibold"
                  : "text-ink/45 hover:text-ink/80"
              }`}
            >
              मराठी
            </button>
          </div>

          <div className="h-4 w-px bg-line" />

          {/* Saved Count */}
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-ink/80 hover:text-terracotta transition-colors group cursor-pointer no-underline"
            title={`${formattedSavedCount} items saved`}
          >
            <Bookmark className="w-4 h-4 text-ink group-hover:text-terracotta transition-colors" />
            <span className="text-xs font-medium">
              {t.nav.saved} {formattedSavedCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
