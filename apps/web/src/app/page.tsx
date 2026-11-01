"use client";

import React from "react";
import Link from "next/link";
import { Navbar, Footer, Badge, Button, PlaceCard, HeroVideo } from "@/components";
import { useLanguage } from "@/i18n";
import { ArrowRight, Compass, Search, PlusCircle } from "lucide-react";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-sand text-ink">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden isolate w-full bg-[var(--hero-brown-2)] py-20 sm:py-28 lg:py-36 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
        <HeroVideo />

        {/* Hero Text and CTAs */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <p className="text-xs sm:text-sm font-bold tracking-widest text-terracotta uppercase mb-3 hero-text-shadow">
            {t.routes.home.badge}
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-tight text-sand hero-text-shadow">
            {t.routes.home.title}
          </h1>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-sand/90 max-w-2xl mx-auto leading-relaxed hero-text-shadow">
            {t.routes.home.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/explore">
              <Button
                variant="primary"
                size="lg"
                iconRight={<Compass className="w-4 h-4" />}
              >
                {t.routes.home.ctaExplore}
              </Button>
            </Link>
            <Link href="/contribute">
              <Button
                variant="secondary"
                size="lg"
                iconRight={<ArrowRight className="w-4 h-4" />}
                className="bg-sand/15 hover:bg-sand/25 text-sand border border-sand/30 backdrop-blur-xs shadow-sm"
              >
                {t.routes.home.ctaContribute}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Quick Metrics & Collection Overview */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-6 mb-8">
          <div>
            <h2 className="font-serif text-2xl font-normal text-ink">
              {t.common.placesInCollection}
            </h2>
            <p className="text-xs sm:text-sm text-ink/65 mt-1">
              {t.brand.sublabel}
            </p>
          </div>

          <div className="flex items-center gap-8 self-start sm:self-auto">
            <div>
              <span className="font-serif text-3xl sm:text-4xl text-terracotta font-normal block leading-none">
                04
              </span>
              <span className="text-[11px] text-ink/60 uppercase tracking-wider mt-1 block">
                {t.common.placesMapped}
              </span>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <span className="font-serif text-3xl sm:text-4xl text-terracotta font-normal block leading-none">
                60
              </span>
              <span className="text-[11px] text-ink/60 uppercase tracking-wider mt-1 block">
                {t.common.linkedRecords}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Badges Preview */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Badge variant="filterActive">{t.common.all}</Badge>
          <Badge variant="filter">{t.common.hasOcr}</Badge>
          <Badge variant="filter">{t.common.stepwells}</Badge>
          <Badge variant="filter">{t.common.forts}</Badge>
        </div>

        {/* Sample PlaceCards & Quick Route Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <PlaceCard
            id="rani-ki-vav"
            title="Rani ki Vav"
            marathiTitle="राणी की वाव"
            location="Patan, Gujarat"
            century="11th century"
            category="Stepwell"
            imageUrl="https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=400&auto=format&fit=crop&q=80"
            hasOcr={true}
            recordsCount={12}
            isSelected={true}
            href="/place/rani-ki-vav"
          />

          <PlaceCard
            id="adalaj-stepwell"
            title="Adalaj Stepwell"
            marathiTitle="अडालज पायविहीर"
            location="Adalaj, Gujarat"
            century="1499 CE"
            category="Stepwell"
            imageUrl="https://images.unsplash.com/photo-1609137144826-6a599ca2f074?w=400&auto=format&fit=crop&q=80"
            hasOcr={true}
            recordsCount={8}
            href="/place/adalaj-stepwell"
          />

          <PlaceCard
            id="amer-fort"
            title="Amer Fort"
            marathiTitle="आमेर किल्ला"
            location="Jaipur, Rajasthan"
            century="16th century"
            category="Fort"
            imageUrl="https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&auto=format&fit=crop&q=80"
            hasOcr={true}
            recordsCount={16}
            href="/place/amer-fort"
          />
        </div>

        {/* Action Callout Banner matching bottom of screenshot */}
        <div className="p-4 rounded-lg border border-line bg-sand-50/60 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-terracotta text-lg">✦</span>
            <p className="text-xs sm:text-sm text-ink/75 font-serif italic">
              &quot;{t.common.quoteBanner}&quot;
            </p>
          </div>
          <Link href="/contribute">
            <Button
              variant="link"
              size="sm"
              iconRight={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {t.common.addToAtlas}
            </Button>
          </Link>
        </div>

        {/* Route Index Hub */}
        <div className="border border-line rounded-lg p-6 bg-white/60">
          <h2 className="font-serif text-lg font-semibold text-ink mb-2">
            Scaffolded Route Placeholders
          </h2>
          <p className="text-xs text-ink/65 mb-4">
            Navbar, Footer, i18n English/Marathi switchers, and design tokens are active across all routes:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/explore"
              className="p-3 rounded-lg border border-line hover:border-terracotta bg-sand-50 hover:bg-white transition-all text-xs flex items-center justify-between group"
            >
              <span className="font-medium flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-terracotta" />
                /explore
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-ink/40 group-hover:text-terracotta group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/search"
              className="p-3 rounded-lg border border-line hover:border-terracotta bg-sand-50 hover:bg-white transition-all text-xs flex items-center justify-between group"
            >
              <span className="font-medium flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-indigo" />
                /search
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-ink/40 group-hover:text-terracotta group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/contribute"
              className="p-3 rounded-lg border border-line hover:border-terracotta bg-sand-50 hover:bg-white transition-all text-xs flex items-center justify-between group"
            >
              <span className="font-medium flex items-center gap-2">
                <PlusCircle className="w-3.5 h-3.5 text-green" />
                /contribute
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-ink/40 group-hover:text-terracotta group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/place/rani-ki-vav"
              className="p-3 rounded-lg border border-line hover:border-terracotta bg-sand-50 hover:bg-white transition-all text-xs flex items-center justify-between group"
            >
              <span className="font-medium flex items-center gap-2">
                <span className="text-gold">🏛</span>
                /place/[id]
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-ink/40 group-hover:text-terracotta group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
