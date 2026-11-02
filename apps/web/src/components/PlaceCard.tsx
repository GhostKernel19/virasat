"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Landmark } from "lucide-react";
import { Badge } from "./Badge";
import { useLanguage } from "@/i18n";
import { useCardHover } from "@/components/motion";

export interface PlaceCardProps {
  id: string;
  title: string;
  marathiTitle?: string;
  location: string;
  century?: string;
  category: string;
  imageUrl: string;
  hasOcr?: boolean;
  recordsCount?: number;
  isIllustrative?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  href?: string;
  className?: string;
}

export function PlaceCard({
  id,
  title,
  marathiTitle,
  location,
  century,
  category,
  imageUrl,
  hasOcr = true,
  recordsCount = 0,
  isIllustrative = true,
  isSelected = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  href,
  className = "",
}: PlaceCardProps) {
  const { language, t } = useLanguage();
  const [imageError, setImageError] = useState(false);
  const cardRef = useCardHover<HTMLDivElement>({
    scale: 1.02,
    glowColorVar: "--accent-glow",
  });

  const displayTitle = language === "mr" && marathiTitle ? marathiTitle : title;
  const targetHref = href ?? (id ? `/place/${id}` : undefined);

  const cardContent = (
    <div
      ref={cardRef}
      data-place-id={id}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group relative flex items-start gap-4 p-4.5 rounded-card border transition-all duration-300 ease-soft text-left ${
        isSelected
          ? "bg-[#F2E3D0] text-[#1F2937] border-accent/70 shadow-lift -translate-y-1 ring-1 ring-accent/40"
          : "glass hover:border-text/40 hover:-translate-y-1 hover:shadow-lift hover:shadow-[0_0_24px_rgba(232,131,74,0.3)] shadow-soft"
      } ${onClick || targetHref ? "cursor-pointer" : ""} ${className}`}
    >
      {/* Thumbnail */}
      <div
        className={`relative w-20 h-20 shrink-0 overflow-hidden rounded-control border ${
          isSelected
            ? "border-[#D1C7BA] bg-[#E7D7C3]"
            : "border-border bg-surface-solid"
        }`}
      >
        {!imageError && imageUrl ? (
          <Image
            src={imageUrl}
            alt={displayTitle}
            fill
            sizes="80px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className={`w-full h-full flex flex-col items-center justify-center p-2 ${
              isSelected
                ? "bg-[#E7D7C3] text-[#1F2937]"
                : "bg-surface-solid text-text-muted"
            }`}
          >
            <Landmark
              className={`w-6 h-6 mb-1 ${
                isSelected ? "text-accent-strong" : "text-accent/60"
              }`}
            />
            <span
              className={`text-[9px] uppercase tracking-wider text-center font-mono ${
                isSelected ? "text-[#4B5563]" : "text-text-muted"
              }`}
            >
              Virasat
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <h3
            className={`font-serif text-[17px] leading-tight truncate transition-colors ${
              isSelected
                ? "font-bold text-[#1F2937]"
                : "font-semibold text-text group-hover:text-accent"
            }`}
          >
            {displayTitle}
          </h3>
          <span
            className={`shrink-0 transition-all ${
              isSelected
                ? "text-[#1F2937] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                : "text-accent opacity-85 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>

        <p
          className={`text-xs mt-1 font-sans truncate ${
            isSelected ? "text-[#4B5563]" : "text-text-muted"
          }`}
        >
          {location}
        </p>

        <p
          className={`text-[11px] mt-0.5 font-sans truncate ${
            isSelected ? "text-[#6B7280]" : "text-text-muted/80"
          }`}
        >
          {century ? `${century} · ` : ""}
          {category}
        </p>

        {/* Badges & Record count */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {hasOcr && (
            <Badge
              variant="ocr"
              size="sm"
              className={
                isSelected
                  ? "bg-[#3F6B5B]/15 border-[#3F6B5B]/40 text-[#2B5244]"
                  : ""
              }
              icon={<Check className="w-2.5 h-2.5 stroke-[2.5]" />}
            >
              {t.common.hasOcr}
            </Badge>
          )}

          {recordsCount > 0 && (
            <span
              className={`text-[11px] font-sans ${
                isSelected ? "text-[#4B5563] font-medium" : "text-text-muted"
              }`}
            >
              {recordsCount}{" "}
              {recordsCount === 1 ? t.common.recordSingular : t.common.records}
            </span>
          )}

          {isIllustrative && (
            <Badge
              variant="illustrative"
              size="sm"
              className={
                isSelected
                  ? "bg-[#D9A441]/20 border-[#D9A441]/50 text-[#8C6418]"
                  : ""
              }
            >
              {t.common.illustrative}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  if (targetHref && !onClick) {
    return (
      <Link href={targetHref} className="block no-underline">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
