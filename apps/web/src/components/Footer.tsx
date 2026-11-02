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
      className={`w-full border-t border-border bg-bg-0/80 backdrop-blur-md py-6 px-5 sm:px-8 lg:px-10 mt-auto text-xs text-text-muted ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Brand prefix and heritage atlas tagline */}
        <div className="flex items-center gap-2 text-text/80">
          <span className="font-semibold text-text font-serif">
            {t.footer.brandPrefix}
          </span>
          <span className="text-border select-none">/</span>
          <span>{t.footer.tagline}</span>
        </div>

        {/* Right: Sources & Attribution and Page Indicator */}
        <div className="flex items-center gap-6 text-text-muted">
          <button
            type="button"
            onClick={() => {
              alert("Virasat Heritage Atlas — Sources include Archaeological Survey of India (ASI) public archives, Gazetteers, and community contributions.");
            }}
            className="hover:text-text transition-colors underline-offset-2 hover:underline cursor-pointer"
          >
            {t.footer.sourcesAndAttribution}
          </button>

          <span className="text-border select-none hidden sm:inline">|</span>

          <span className="font-mono text-[11px] tracking-wider text-text font-medium uppercase">
            {currentPageCode}
          </span>
        </div>
      </div>
    </footer>
  );
}
