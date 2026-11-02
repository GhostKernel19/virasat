"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Navbar, Footer, Chip, PlaceCard } from "@/components";
import { useLanguage } from "@/i18n";
import { fetchPlacesFromSupabase } from "@/lib/places";
import { Place, FilterCategory } from "@/types/place";
import { Loader2 } from "lucide-react";

// Client-only dynamic import of MapExplorer to prevent SSR errors with WebGL/MapLibre
const MapExplorer = dynamic(
  () => import("@/components/MapExplorer").then((mod) => mod.MapExplorer),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full h-full min-h-[520px] rounded-[20px] border border-border glass flex flex-col items-center justify-center text-text-muted shadow-soft"
        style={{ borderRadius: "20px" }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-accent mb-2" />
        <span className="text-xs font-mono uppercase tracking-wider">
          Loading MapLibre GL...
        </span>
      </div>
    ),
  }
);

function formatNumber(num: number, language: "en" | "mr"): string {
  if (language !== "mr") {
    return num < 10 ? `0${num}` : `${num}`;
  }
  const devanagariDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  const str = num < 10 ? `0${num}` : `${num}`;
  return str
    .split("")
    .map((d) => devanagariDigits[parseInt(d, 10)] ?? d)
    .join("");
}

export default function ExplorePage() {
  const { language, t } = useLanguage();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);

  // Restore activeFilter and selectedPlaceId from sessionStorage on mount (only in useEffect)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("virasat_explore_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.activeFilter &&
          ["all", "ocr", "stepwells", "forts"].includes(parsed.activeFilter)
        ) {
          setActiveFilter(parsed.activeFilter as FilterCategory);
        }
        if (parsed.selectedPlaceId) {
          setSelectedPlaceId(parsed.selectedPlaceId);
        }
      }
    } catch {
      // Ignore sessionStorage read errors
    }
  }, []);

  // Save activeFilter to sessionStorage when it changes
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("virasat_explore_state");
      const state = saved ? JSON.parse(saved) : {};
      state.activeFilter = activeFilter;
      sessionStorage.setItem("virasat_explore_state", JSON.stringify(state));
    } catch {
      // Ignore sessionStorage write errors
    }
  }, [activeFilter]);

  // Save selectedPlaceId to sessionStorage when it changes
  useEffect(() => {
    if (!selectedPlaceId) return;
    try {
      const saved = sessionStorage.getItem("virasat_explore_state");
      const state = saved ? JSON.parse(saved) : {};
      state.selectedPlaceId = selectedPlaceId;
      sessionStorage.setItem("virasat_explore_state", JSON.stringify(state));
    } catch {
      // Ignore sessionStorage write errors
    }
  }, [selectedPlaceId]);

  // Load places from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchPlacesFromSupabase();
        if (isMounted) {
          setPlaces(data);
          if (data.length > 0) {
            setSelectedPlaceId((currentSelected) => {
              if (currentSelected && data.some((p) => p.id === currentSelected)) {
                return currentSelected;
              }
              return data[0].id;
            });
          }
        }
      } catch (err) {
        console.error("Failed to load places:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute category counts
  const filterCounts = useMemo(() => {
    const all = places.length;
    const ocr = places.filter((p) => p.hasOcr).length;
    const stepwells = places.filter((p) =>
      p.category.toLowerCase().includes("stepwell")
    ).length;
    const forts = places.filter((p) =>
      p.category.toLowerCase().includes("fort")
    ).length;

    return { all, ocr, stepwells, forts };
  }, [places]);

  // Filter places based on active chip
  const filteredPlaces = useMemo(() => {
    switch (activeFilter) {
      case "ocr":
        return places.filter((p) => p.hasOcr);
      case "stepwells":
        return places.filter((p) =>
          p.category.toLowerCase().includes("stepwell")
        );
      case "forts":
        return places.filter((p) =>
          p.category.toLowerCase().includes("fort")
        );
      case "all":
      default:
        return places;
    }
  }, [places, activeFilter]);

  // Total records across all places
  const totalRecordsCount = useMemo(() => {
    return places.reduce((sum, p) => sum + (p.recordsCount || 0), 0) || 60;
  }, [places]);

  // If filtered list changes and current selection is excluded, select first visible
  useEffect(() => {
    if (filteredPlaces.length > 0) {
      const isSelectedVisible = filteredPlaces.some((p) => p.id === selectedPlaceId);
      if (!isSelectedVisible) {
        setSelectedPlaceId(filteredPlaces[0].id);
      }
    } else {
      setSelectedPlaceId(null);
    }
  }, [filteredPlaces, selectedPlaceId]);

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

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-5 sm:px-8 lg:px-10 py-10 flex flex-col">
        {/* Header Section */}
        <div className="mb-8">
          {/* Small orange label */}
          <p className="text-[11px] sm:text-xs font-bold tracking-[0.25em] text-accent uppercase mb-2">
            PLACES REMEMBER. RECORDS CONNECT.
          </p>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight text-text">
                {t.routes.explore.title}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-text-muted max-w-2xl leading-relaxed">
                {t.routes.explore.subtitle}
              </p>
            </div>

            {/* Stats Block at the right (large serif accent numbers) */}
            <div className="flex items-center gap-7 self-start md:self-end shrink-0 pt-2 md:pt-0">
              <div>
                <span className="font-serif text-4xl sm:text-5xl text-accent font-normal block leading-none">
                  {formatNumber(filterCounts.all, language)}
                </span>
                <span className="text-[11px] font-mono tracking-widest text-text-muted uppercase mt-2 block">
                  {t.common.placesMapped}
                </span>
              </div>
              <div className="h-10 w-px bg-border/40" />
              <div>
                <span className="font-serif text-4xl sm:text-5xl text-accent font-normal block leading-none">
                  {formatNumber(totalRecordsCount, language)}
                </span>
                <span className="text-[11px] font-mono tracking-widest text-text-muted uppercase mt-2 block">
                  {t.common.linkedRecords}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Chips Bar with Dynamic Counts */}
        <div className="flex flex-wrap items-center gap-2.5 mb-7">
          <Chip
            active={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
          >
            <span>{t.common.all}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-pill font-mono ${
                activeFilter === "all"
                  ? "bg-bg-0 text-text font-semibold"
                  : "bg-surface-solid text-text-muted"
              }`}
            >
              {formatNumber(filterCounts.all, language)}
            </span>
          </Chip>

          <Chip
            active={activeFilter === "ocr"}
            onClick={() => setActiveFilter("ocr")}
          >
            <span>{t.common.hasOcr}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-pill font-mono ${
                activeFilter === "ocr"
                  ? "bg-bg-0 text-text font-semibold"
                  : "bg-surface-solid text-text-muted"
              }`}
            >
              {formatNumber(filterCounts.ocr, language)}
            </span>
          </Chip>

          <Chip
            active={activeFilter === "stepwells"}
            onClick={() => setActiveFilter("stepwells")}
          >
            <span>{t.common.stepwells}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-pill font-mono ${
                activeFilter === "stepwells"
                  ? "bg-bg-0 text-text font-semibold"
                  : "bg-surface-solid text-text-muted"
              }`}
            >
              {formatNumber(filterCounts.stepwells, language)}
            </span>
          </Chip>

          <Chip
            active={activeFilter === "forts"}
            onClick={() => setActiveFilter("forts")}
          >
            <span>{t.common.forts}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-pill font-mono ${
                activeFilter === "forts"
                  ? "bg-bg-0 text-text font-semibold"
                  : "bg-surface-solid text-text-muted"
              }`}
            >
              {formatNumber(filterCounts.forts, language)}
            </span>
          </Chip>
        </div>

        {/* Main Content Area: Split View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
          {/* Left Column: PlaceCard List */}
          <div className="lg:col-span-5 flex flex-col gap-3.5 order-2 lg:order-1">
            {loading ? (
              <div className="p-10 glass text-center flex flex-col items-center justify-center shadow-soft rounded-card">
                <Loader2 className="w-6 h-6 animate-spin text-accent mb-2" />
                <p className="text-xs text-text-muted font-sans">
                  {t.routes.explore.loadingPlaces}
                </p>
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="p-10 glass text-center shadow-soft rounded-card">
                <p className="text-sm text-text-muted">
                  {t.routes.explore.noPlacesFound}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-[14px] py-2 overflow-y-auto max-h-[740px] pr-1.5">
                {filteredPlaces.map((place) => {
                  const isSelected = place.id === selectedPlaceId;
                  return (
                    <PlaceCard
                      key={place.id}
                      id={place.slug || place.id}
                      title={place.name}
                      marathiTitle={place.marathiName}
                      location={`${place.region ? `${place.region}, ` : ""}${place.state}`}
                      century={place.period}
                      category={place.category}
                      imageUrl={place.imageUrl}
                      hasOcr={place.hasOcr}
                      recordsCount={place.recordsCount}
                      isIllustrative={place.isIllustrative}
                      isSelected={isSelected}
                      onClick={() => setSelectedPlaceId(place.id)}
                      onMouseEnter={() => setHoveredPlaceId(place.id)}
                      onMouseLeave={() => setHoveredPlaceId(null)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: MapLibre Map inside glass container with 20px rounded frame */}
          <div className="lg:col-span-7 h-[520px] lg:h-[740px] min-h-[520px] order-1 lg:order-2 sticky top-22">
            <MapExplorer
              places={filteredPlaces}
              selectedPlaceId={selectedPlaceId}
              hoveredPlaceId={hoveredPlaceId}
              onSelectPlace={setSelectedPlaceId}
              className="h-full min-h-[520px]"
            />
          </div>
        </div>
      </main>

      <Footer pageCode={t.footer.pageCodes.explore} />
    </div>
  );
}
