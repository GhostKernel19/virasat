"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/i18n";

export interface FooterProps {
  pageCode?: string;
  className?: string;
}

export function Footer({ pageCode, className = "" }: FooterProps) {
  const rawPathname = usePathname();
  const pathname = rawPathname || "";
  const { t } = useLanguage();

  let currentPageCode = pageCode;
  if (!currentPageCode) {
    if (pathname.startsWith("/explore")) {
      currentPageCode = t.footer.pageCodes.explore;
    } else if (pathname.startsWith("/search")) {
      currentPageCode = t.footer.pageCodes.search;
    } else if (pathname.startsWith("/contribute")) {
      currentPageCode = t.footer.pageCodes.contribute;
    } else if (pathname.startsWith("/place")) {
      currentPageCode = t.footer.pageCodes.place;
    } else {
      currentPageCode = t.footer.pageCodes.home;
    }
  }

  return (
    <footer
      className={`w-full border-t border-border/20 bg-surface/30 backdrop-blur-md py-4 px-5 sm:px-8 lg:px-10 mt-auto text-[11px] uppercase tracking-wider text-text-muted ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: VIRASAT in accent + tagline */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-accent font-serif tracking-widest text-xs">
            VIRASAT
          </span>
          <span className="text-border/60 select-none">/</span>
          <span className="tracking-wider">{t.footer.tagline}</span>
        </div>

        {/* Right: Sources & Attribution and Page Indicator */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => {
              alert(
                "Virasat Heritage Atlas — Sources include Archaeological Survey of India (ASI) public archives, Gazetteers, and community contributions."
              );
            }}
            className="hover:text-text transition-colors underline-offset-2 hover:underline cursor-pointer uppercase tracking-wider"
          >
            {t.footer.sourcesAndAttribution}
          </button>

          <span className="text-border/60 select-none hidden sm:inline">|</span>

          <span className="font-mono text-[11px] tracking-widest text-text-muted font-medium uppercase">
            {currentPageCode}
          </span>
        </div>
      </div>
    </footer>
  );
}
