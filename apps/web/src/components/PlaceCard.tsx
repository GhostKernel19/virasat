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
  imageUrl?: string | null;
  image_url?: string | null;
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
  image_url,
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

  const photoUrl = imageUrl || image_url;
  const displayTitle = language === "mr" && marathiTitle ? marathiTitle : title;
  const targetHref = href ?? (id ? `/place/${id}` : undefined);

  const cardContent = (
    <div
      ref={cardRef}
      data-place-id={id}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group relative grid grid-cols-[96px_1fr] items-center gap-x-4 p-[16px_20px] min-h-[120px] rounded-card border transition-all duration-300 ease-soft text-left ${
        isSelected
          ? "bg-[#F2E3D0] text-[#1F2937] border-accent/70 shadow-lift ring-1 ring-accent/40"
          : "glass hover:border-text/40 hover:shadow-lift hover:shadow-[0_0_24px_rgba(232,131,74,0.3)] shadow-soft"
      } ${onClick || targetHref ? "cursor-pointer" : ""} ${className}`}
    >
      {/* Thumbnail: 96px square, border-radius 12px, object-cover, subtle dark gradient at bottom */}
      <div
        className={`relative w-[96px] h-[96px] shrink-0 overflow-hidden rounded-[12px] border ${
          isSelected
            ? "border-[#D1C7BA] bg-[#E7D7C3]"
            : "border-border bg-surface-solid"
        }`}
      >
        {!imageError && photoUrl ? (
          <>
            <Image
              src={photoUrl}
              alt={displayTitle}
              fill
              sizes="96px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
            {/* Subtle dark gradient at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </>
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

      {/* Details / Text Column */}
      <div className="min-w-0 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-1.5">
          <h3
            className={`font-serif text-[17px] leading-[1.3] m-0 transition-colors ${
              isSelected
                ? "font-bold text-[#1F2937]"
                : "font-semibold text-text group-hover:text-accent"
            }`}
          >
            {displayTitle}
          </h3>
          <span
            className={`shrink-0 transition-all mt-0.5 ${
              isSelected
                ? "text-[#1F2937] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                : "text-accent opacity-85 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>

        {/* Meta Lines: 4px spacing */}
        <div className="flex flex-col gap-1 mt-1">
          <p
            className={`text-xs m-0 font-sans truncate ${
              isSelected ? "text-[#4B5563]" : "text-text-muted"
            }`}
          >
            {location}
          </p>

          <p
            className={`text-[11px] m-0 font-sans truncate ${
              isSelected ? "text-[#6B7280]" : "text-text-muted/80"
            }`}
          >
            {century ? `${century} · ` : ""}
            {category}
          </p>
        </div>

        {/* Badges & Record count: 10px margin-top */}
        <div className="flex flex-wrap items-center gap-2 mt-[10px]">
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
