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
    scale: 1.03,
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
      className={`group relative flex items-start gap-3.5 p-3.5 rounded-lg border transition-all text-left bg-sand-50/90 ${
        isSelected
          ? "border-terracotta bg-white shadow-md ring-1 ring-terracotta/20"
          : "border-line hover:border-terracotta/60 hover:bg-white hover:shadow-sm"
      } ${onClick || targetHref ? "cursor-pointer" : ""} ${className}`}
    >
      {/* Thumbnail */}
      <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded-md border border-line/60 bg-sand-200/50">
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
          <div className="w-full h-full flex flex-col items-center justify-center text-ink/40 bg-sand-200/60 p-2">
            <Landmark className="w-6 h-6 text-terracotta/60 mb-1" />
            <span className="text-[9px] uppercase tracking-wider text-ink/50 text-center font-mono">
              Virasat
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-serif text-[17px] font-semibold text-ink leading-tight truncate group-hover:text-terracotta transition-colors">
            {displayTitle}
          </h3>
          <span className="shrink-0 text-terracotta opacity-85 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>

        <p className="text-xs text-ink/70 mt-1 font-sans truncate">
          {location}
        </p>

        <p className="text-[11px] text-ink/50 mt-0.5 font-sans truncate">
          {century ? `${century} · ` : ""}
          {category}
        </p>

        {/* Badges & Record count */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {hasOcr && (
            <Badge
              variant="ocr"
              size="sm"
              icon={<Check className="w-2.5 h-2.5 stroke-[2.5]" />}
            >
              {t.common.hasOcr}
            </Badge>
          )}

          {recordsCount > 0 && (
            <span className="text-[11px] text-ink/60 font-sans">
              {recordsCount} {recordsCount === 1 ? t.common.recordSingular : t.common.records}
            </span>
          )}

          {isIllustrative && (
            <Badge variant="illustrative" size="sm">
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
