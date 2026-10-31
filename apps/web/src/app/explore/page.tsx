"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Navbar, Footer, Badge, PlaceCard } from "@/components";
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
      <div className="w-full h-full min-h-[520px] rounded-xl border border-line bg-sand-100 flex flex-col items-center justify-center text-ink/50">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta mb-2" />
        <span className="text-xs font-mono uppercase tracking-wider">Loading MapLibre GL...</span>
      </div>
    ),
  }
);

function formatNumber(num: number, language: "en" | "mr"): string {
  if (language !== "mr") return num.toString();
  const devanagariDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return num
    .toString()
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
    <div className="min-h-screen flex flex-col bg-sand text-ink">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />
            <p className="text-[11px] font-bold tracking-widest text-terracotta uppercase">
              {t.routes.explore.badge}
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal leading-tight text-ink">
                {t.routes.explore.title}
              </h1>
              <p className="mt-2 text-sm text-ink/70 max-w-2xl">
                {t.routes.explore.subtitle}
              </p>
            </div>

            {/* Total Metric */}
            <div className="flex items-center gap-6 self-start md:self-auto border-l md:border-l-0 pl-3 md:pl-0 border-line">
              <div>
                <span className="font-serif text-2xl sm:text-3xl text-terracotta font-normal block leading-none">
                  {formatNumber(filteredPlaces.length, language)}
                </span>
                <span className="text-[10px] text-ink/60 uppercase tracking-wider mt-1 block">
                  {t.common.placesMapped}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Chips Bar with Dynamic Counts */}
        <div className="flex flex-wrap items-center gap-2.5 mb-6">
          {/* All */}
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className="focus:outline-hidden"
          >
            <Badge
              variant={activeFilter === "all" ? "filterActive" : "filter"}
              className="cursor-pointer gap-2"
            >
              <span>{t.common.all}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeFilter === "all"
                    ? "bg-sand text-ink font-semibold"
                    : "bg-sand-200 text-ink/70"
                }`}
              >
                {formatNumber(filterCounts.all, language)}
              </span>
            </Badge>
          </button>

          {/* Has OCR */}
          <button
            type="button"
            onClick={() => setActiveFilter("ocr")}
            className="focus:outline-hidden"
          >
            <Badge
              variant={activeFilter === "ocr" ? "filterActive" : "filter"}
              className="cursor-pointer gap-2"
            >
              <span>{t.common.hasOcr}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeFilter === "ocr"
                    ? "bg-sand text-ink font-semibold"
                    : "bg-sand-200 text-ink/70"
                }`}
              >
                {formatNumber(filterCounts.ocr, language)}
              </span>
            </Badge>
          </button>

          {/* Stepwells */}
          <button
            type="button"
            onClick={() => setActiveFilter("stepwells")}
            className="focus:outline-hidden"
          >
            <Badge
              variant={activeFilter === "stepwells" ? "filterActive" : "filter"}
              className="cursor-pointer gap-2"
            >
              <span>{t.common.stepwells}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeFilter === "stepwells"
                    ? "bg-sand text-ink font-semibold"
                    : "bg-sand-200 text-ink/70"
                }`}
              >
                {formatNumber(filterCounts.stepwells, language)}
              </span>
            </Badge>
          </button>

          {/* Forts */}
          <button
            type="button"
            onClick={() => setActiveFilter("forts")}
            className="focus:outline-hidden"
          >
            <Badge
              variant={activeFilter === "forts" ? "filterActive" : "filter"}
              className="cursor-pointer gap-2"
            >
              <span>{t.common.forts}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeFilter === "forts"
                    ? "bg-sand text-ink font-semibold"
                    : "bg-sand-200 text-ink/70"
                }`}
              >
                {formatNumber(filterCounts.forts, language)}
              </span>
            </Badge>
          </button>
        </div>

        {/* Main Content Area: Split View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
          {/* Left Column: PlaceCard List */}
          <div className="lg:col-span-5 flex flex-col gap-3.5 order-2 lg:order-1">
            {loading ? (
              <div className="p-8 rounded-lg border border-line bg-white/50 text-center flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-terracotta mb-2" />
                <p className="text-xs text-ink/70 font-sans">
                  {t.routes.explore.loadingPlaces}
                </p>
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="p-8 rounded-lg border border-line bg-white/50 text-center">
                <p className="text-sm text-ink/70">
                  {t.routes.explore.noPlacesFound}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[720px] pr-1">
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

          {/* Right Column: MapLibre Map with Terracotta Pins & Selected Place Panel */}
          <div className="lg:col-span-7 h-[500px] lg:h-auto min-h-[500px] order-1 lg:order-2 sticky top-22">
            <MapExplorer
              places={filteredPlaces}
              selectedPlaceId={selectedPlaceId}
              hoveredPlaceId={hoveredPlaceId}
              onSelectPlace={setSelectedPlaceId}
              className="h-full min-h-[500px] shadow-sm"
            />
          </div>
        </div>
      </main>

      <Footer pageCode={t.footer.pageCodes.explore} />
    </div>
  );
}
