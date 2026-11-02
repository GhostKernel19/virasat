"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  ArrowRight,
  Landmark,
  ShieldCheck,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { Navbar, Footer, Button, Badge } from "@/components";
import { useLanguage } from "@/i18n";
import { fetchPlacesFromSupabase } from "@/lib/places";
import { Place } from "@/types/place";

const INSTITUTIONAL_SOURCES = [
  {
    name: "Archaeological Survey of India (ASI)",
    marathiName: "भारतीय पुरातत्व सर्वेक्षण",
    role: "Primary Monument Gazetteers & Epigraphy",
    description:
      "Imperial and post-independence architectural surveys, epigraphical records, structural conservation documentation, and protected monument classifications.",
    license: "Government Open Data / Public Domain",
    url: "https://asi.nic.in",
  },
  {
    name: "Epigraphia Indica & Corpus Inscriptionum",
    marathiName: "एपिग्राफिया इंडिका व शिलालेखांची मालिका",
    role: "Lithic & Inscriptional Transcripts",
    description:
      "Scholarly decipherments and published Sanskrit, Prakrit, and regional epigraphs documenting royal charters, foundational stepwell steles, and temple inscriptions.",
    license: "Scholarly Historical Repositories / Public Domain",
    url: "https://ignca.gov.in",
  },
  {
    name: "Wikimedia Commons",
    marathiName: "विकिमीडिया कॉमन्स",
    role: "Photographic & Visual Documentation",
    description:
      "Freely licensed architectural imagery contributed by heritage conservationists, independent documentary photographers, and cultural organizations.",
    license: "Creative Commons (CC BY-SA 4.0 / CC BY 3.0 / CC0)",
    url: "https://commons.wikimedia.org",
  },
  {
    name: "OpenStreetMap & CartoDB",
    marathiName: "ओपनस्ट्रीटमॅप आणि नकाशा बेस",
    role: "Geospatial Vector Cartography",
    description:
      "Open geographical coordinate data, terrain context, and spatial tile foundations powering the interactive heritage atlas.",
    license: "Open Database License (ODbL)",
    url: "https://www.openstreetmap.org",
  },
];

export default function SourcesPage() {
  const { language, t } = useLanguage();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadPlaces() {
      try {
        setLoading(true);
        const data = await fetchPlacesFromSupabase();
        if (isMounted) {
          setPlaces(data);
        }
      } catch (err) {
        console.error("Failed to load places for sources page:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadPlaces();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col text-text bg-bg-0 relative">
      {/* Background with library-map.webp darkened with rgba(21,9,4,0.88) and blurred 6px */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/library-map.webp"
          alt=""
          className="w-full h-full object-cover filter blur-[6px] scale-105 opacity-70"
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(21, 9, 4, 0.88)" }}
        />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-5 sm:px-8 lg:px-10 py-10 sm:py-14">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium text-text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.routes.sources.backToExplore}</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-12 sm:mb-16">
          <span className="inline-block text-[11px] font-mono tracking-widest text-accent uppercase bg-accent/10 border border-accent/25 px-3 py-1 rounded-pill mb-3">
            {t.routes.sources.badge}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-text tracking-tight mb-3">
            {t.routes.sources.title}
          </h1>
          <p className="text-sm sm:text-base text-text-muted max-w-2xl leading-relaxed">
            {t.routes.sources.subtitle}
          </p>
        </div>

        {/* Section 1: Monument Photographic Credits */}
        <section className="mb-16">
          <div className="flex items-baseline justify-between gap-4 mb-6 border-b border-border/40 pb-4">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-text">
                {t.routes.sources.photoCreditsTitle}
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-1">
                {t.routes.sources.photoCreditsSubtitle}
              </p>
            </div>
            <span className="text-xs font-mono text-text-muted shrink-0 hidden sm:inline">
              {places.length} {t.common.records}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="glass p-5 rounded-card flex items-start gap-4 animate-pulse"
                >
                  <div className="w-24 h-24 rounded-control bg-surface-solid shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-border/40 rounded w-2/3" />
                    <div className="h-3 bg-border/20 rounded w-1/2" />
                    <div className="h-3 bg-border/20 rounded w-4/5 pt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {places.map((place) => {
                const photoUrl = place.image_url || place.imageUrl;
                const credit =
                  place.image_credit ||
                  place.imageCredit ||
                  t.routes.sources.noCredit;
                const displayTitle =
                  language === "mr" && place.marathiName
                    ? place.marathiName
                    : place.name;

                return (
                  <article
                    key={place.id}
                    className="glass rounded-card p-5 flex flex-col justify-between transition-all duration-300 hover:border-text/30 hover:shadow-lift"
                  >
                    <div className="flex items-start gap-4">
                      {/* Thumbnail: photo with object-cover, rounded, subtle dark gradient at bottom */}
                      <div className="relative w-24 h-24 shrink-0 rounded-control overflow-hidden border border-border bg-surface-solid shadow-soft">
                        {photoUrl ? (
                          <>
                            <Image
                              src={photoUrl}
                              alt={displayTitle}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                            {/* Subtle dark gradient overlay at bottom */}
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-surface-solid text-text-muted p-2">
                            <Landmark className="w-7 h-7 text-accent/50 mb-1" />
                            <span className="text-[9px] font-mono uppercase tracking-wider text-center text-text-muted/60">
                              No image
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono tracking-widest text-accent uppercase">
                            {place.category}
                          </span>
                          {place.isIllustrative && (
                            <Badge variant="illustrative" size="sm">
                              Illustrative
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-serif text-lg font-medium text-text truncate">
                          {displayTitle}
                        </h3>

                        <p className="text-xs text-text-muted truncate mt-0.5">
                          {place.region ? `${place.region}, ` : ""}
                          {place.state} {place.period ? `• ${place.period}` : ""}
                        </p>

                        {/* Photo Credit */}
                        <div className="mt-3 flex items-start gap-1.5 text-xs text-text/80 bg-surface-solid/70 border border-border/40 rounded-control px-2.5 py-1.5">
                          <Camera className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                          <span className="font-mono text-[11px] leading-tight break-words">
                            {credit}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action link */}
                    <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-text-muted/70">
                        ID: {place.slug || place.id.slice(0, 8)}
                      </span>
                      <Link
                        href={`/place/${place.slug || place.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-strong transition-colors"
                      >
                        <span>{t.routes.sources.viewDossier}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Institutional & Archival Sources */}
        <section className="mb-16">
          <div className="mb-6 border-b border-border/40 pb-4">
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-text">
              {t.routes.sources.archivesTitle}
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-1">
              {t.routes.sources.archivesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {INSTITUTIONAL_SOURCES.map((source, idx) => (
              <div
                key={idx}
                className="glass rounded-card p-6 flex flex-col justify-between transition-all duration-300 hover:border-text/30 hover:shadow-lift"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono tracking-widest text-accent uppercase">
                      {source.role}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted/70 bg-surface-solid px-2 py-0.5 rounded-pill border border-border/30">
                      {source.license}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-medium text-text mb-1">
                    {language === "mr" ? source.marathiName : source.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-text-muted leading-relaxed mt-2">
                    {source.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border/30 flex justify-end">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
                  >
                    <span>Visit Repository</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Transparency Notice Box */}
        <section className="glass rounded-card p-6 mb-12 border-accent/20 bg-accent/5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm text-text mb-1">
                Open Heritage & Attribution Commitment
              </h4>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                {t.routes.sources.attributionNotice} The Virasat Heritage Atlas
                indexes and presents these records purely for cultural
                preservation, spatial education, and epigraphic research. If you
                are a copyright holder and wish to update or amend an
                attribution notice, please reach out via our community pipeline.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/explore">
            <Button
              variant="primary"
              size="md"
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              {t.routes.sources.backToExplore}
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary" size="md">
              Back to Home
            </Button>
          </Link>
        </div>
      </main>

      <Footer pageCode={t.footer.pageCodes.sources} />
    </div>
  );
}

