"use client";

import React from "react";
import Link from "next/link";
import { Navbar, Footer, Badge, Button, PlaceCard } from "@/components";
import { useLanguage } from "@/i18n";
import { ArrowLeft, Landmark } from "lucide-react";

interface PlaceDetailPageProps {
  params: {
    id: string;
  };
}

export default function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { t } = useLanguage();
  const placeId = params.id;

  const formattedName = placeId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="min-h-screen flex flex-col bg-sand text-ink">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link href="/explore">
            <Button
              variant="link"
              size="sm"
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              {t.routes.place.back}
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto p-8 rounded-lg border border-line bg-white/70 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-gold/15 text-gold-dark flex items-center justify-center mx-auto mb-4">
            <Landmark className="w-6 h-6" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <Badge variant="gold" size="sm">
              {t.routes.place.badge}
            </Badge>
            <Badge variant="illustrative" size="sm">
              {t.common.illustrative}
            </Badge>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-2">
            {formattedName}
          </h1>

          <p className="text-xs font-mono text-terracotta mb-4">
            slug / ID: {placeId}
          </p>

          <p className="text-sm text-ink/70 mb-8 max-w-lg mx-auto leading-relaxed">
            {t.routes.place.subtitle}
          </p>

          {/* PlaceCard preview for this place */}
          <div className="max-w-md mx-auto text-left mb-8">
            <PlaceCard
              id={placeId}
              title={formattedName}
              location="Western India Heritage Corridor"
              category="Heritage Monument"
              imageUrl="https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=400&auto=format&fit=crop&q=80"
              hasOcr={true}
              recordsCount={12}
              isSelected={true}
            />
          </div>

          <Link href="/explore">
            <Button variant="primary" size="md">
              {t.routes.place.back}
            </Button>
          </Link>
        </div>
      </main>

      <Footer pageCode={t.footer.pageCodes.place} />
    </div>
  );
}
