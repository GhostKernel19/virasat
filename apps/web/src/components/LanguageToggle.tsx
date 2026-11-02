"use client";

import React from "react";
import { useLanguage } from "@/i18n";

export interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className = "" }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center p-0.5 select-none bg-surface-solid/70 rounded-pill border border-border text-xs ${className}`}
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
        className={`px-3 py-1 rounded-pill transition-all duration-300 ease-soft cursor-pointer font-medium ${
          language === "en"
            ? "bg-accent text-bg-0 shadow-sm font-semibold"
            : "text-text-muted hover:text-text"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("mr")}
        aria-pressed={language === "mr"}
        className={`px-3 py-1 rounded-pill transition-all duration-300 ease-soft cursor-pointer font-medium font-devanagari ${
          language === "mr"
            ? "bg-accent text-bg-0 shadow-sm font-semibold"
            : "text-text-muted hover:text-text"
        }`}
      >
        मराठी
      </button>
    </div>
  );
}

