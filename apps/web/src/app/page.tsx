"use client";

import React from "react";
import Link from "next/link";
import { Navbar, Footer, Badge, Button, PlaceCard, HeroVideo } from "@/components";
import { useLanguage } from "@/i18n";
import { ArrowRight, Compass, Search, PlusCircle } from "lucide-react";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col text-text">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden isolate w-full py-24 sm:py-32 lg:py-40 px-5 sm:px-8 lg:px-10 flex flex-col items-center justify-center text-center">
        <HeroVideo />

        {/* Hero Text and CTAs */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <p className="text-xs sm:text-sm font-bold tracking-widest text-accent uppercase mb-3 hero-text-shadow">
            {t.routes.home.badge}
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-tight text-text hero-text-shadow">
            {t.routes.home.title}
          </h1>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-text/90 max-w-2xl mx-auto leading-relaxed hero-text-shadow">
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
                className="bg-surface hover:bg-surface-solid text-text border border-border backdrop-blur-md shadow-soft"
              >
                {t.routes.home.ctaContribute}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-5 sm:px-8 lg:px-10 py-12">
        {/* Quick Metrics & Collection Overview */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6 mb-8">
          <div>
            <h2 className="font-serif text-2xl font-normal text-text">
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
        <div className="p-5 glass shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-accent text-lg">✦</span>
            <p className="text-xs sm:text-sm text-text-muted font-serif italic">
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
        <div className="glass p-8 shadow-soft">
          <h2 className="font-serif text-lg font-semibold text-text mb-2">
            Scaffolded Route Placeholders
          </h2>
          <p className="text-xs text-text-muted mb-4">
            Navbar, Footer, i18n English/Marathi switchers, and design tokens are active across all routes:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/explore"
              className="p-4 rounded-control border border-border hover:border-accent bg-surface hover:bg-surface-solid shadow-soft hover:-translate-y-1 transition-all duration-300 ease-soft text-xs flex items-center justify-between group"
            >
              <span className="font-medium flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-accent" />
                /explore
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/search"
              className="p-4 rounded-control border border-border hover:border-accent bg-surface hover:bg-surface-solid shadow-soft hover:-translate-y-1 transition-all duration-300 ease-soft text-xs flex items-center justify-between group"
            >
              <span className="font-medium flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-accent" />
                /search
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/contribute"
              className="p-4 rounded-control border border-border hover:border-accent bg-surface hover:bg-surface-solid shadow-soft hover:-translate-y-1 transition-all duration-300 ease-soft text-xs flex items-center justify-between group"
            >
              <span className="font-medium flex items-center gap-2">
                <PlusCircle className="w-3.5 h-3.5 text-success" />
                /contribute
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/place/rani-ki-vav"
              className="p-4 rounded-control border border-border hover:border-accent bg-surface hover:bg-surface-solid shadow-soft hover:-translate-y-1 transition-all duration-300 ease-soft text-xs flex items-center justify-between group"
            >
              <span className="font-medium flex items-center gap-2">
                <span className="text-accent-2">🏛</span>
                /place/[id]
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
