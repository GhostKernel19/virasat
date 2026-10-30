"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, X, Landmark, Layers } from "lucide-react";
import { Place } from "@/types/place";
import { Badge, Button } from "@/components";
import { useLanguage } from "@/i18n";

export interface MapExplorerProps {
  places: Place[];
  selectedPlaceId: string | null;
  hoveredPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
  className?: string;
}

const FREE_LIGHT_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export function MapExplorer({
  places,
  selectedPlaceId,
  hoveredPlaceId,
  onSelectPlace,
  className = "",
}: MapExplorerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; element: HTMLElement }>>(
    new Map()
  );
  const [mapLoaded, setMapLoaded] = useState(false);
  const [panelDismissed, setPanelDismissed] = useState(false);

  const { language, t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) || null;

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: FREE_LIGHT_STYLE,
      center: [78.9629, 22.5937], // India center
      zoom: 4.4,
      minZoom: 3.5,
      maxZoom: 16,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      mapRef.current = map;
      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync Markers when places change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Remove old markers
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();

    // Create custom terracotta SVG pin markers with 40ms stagger animation
    places.forEach((place, index) => {
      const el = document.createElement("div");
      el.className = "virasat-pin-marker relative cursor-pointer select-none";
      el.style.width = "36px";
      el.style.height = "44px";
      el.style.transformOrigin = "bottom center";
      el.style.transition = "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), filter 0.25s ease";

      // Pins dropping in with 40ms stagger
      if (!shouldReduceMotion) {
        el.style.animation = `virasatPinDrop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${
          index * 40
        }ms both`;
      }

      el.innerHTML = `
        <div class="pin-inner relative w-full h-full flex flex-col items-center">
          <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-md">
            <path d="M17 1C8.716 1 2 7.716 2 16C2 26.5 17 40 17 40C17 40 32 26.5 32 16C32 7.716 25.284 1 17 1Z" fill="#C65D3B" stroke="#FAF7F2" stroke-width="2"/>
            <path d="M12 20.5V16C12 13.24 14.24 11 17 11C19.76 11 22 13.24 22 16V20.5" stroke="#FAF7F2" stroke-width="2" stroke-linecap="round"/>
            <line x1="12" y1="20.5" x2="22" y2="20.5" stroke="#FAF7F2" stroke-width="2"/>
          </svg>
          <div class="pin-halo absolute -inset-2 rounded-full pointer-events-none opacity-0 transition-opacity duration-200"></div>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectPlace(place.id);
        setPanelDismissed(false);
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([place.lng, place.lat])
        .addTo(map);

      markersRef.current.set(place.id, { marker, element: el });
    });

    // Fit map to the bounds of all visible places with padding 60 and maxZoom 6
    if (places.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      places.forEach((place) => {
        bounds.extend([place.lng, place.lat]);
      });
      map.fitBounds(bounds, { padding: 60, maxZoom: 6 });
    }
  }, [places, mapLoaded, onSelectPlace, shouldReduceMotion]);

  // Update Marker visual highlight and scale based on hovered and selected states
  useEffect(() => {
    markersRef.current.forEach(({ element }, id) => {
      const isSelected = id === selectedPlaceId;
      const isHovered = id === hoveredPlaceId;

      const svgPath = element.querySelector("path");
      const halo = element.querySelector<HTMLElement>(".pin-halo");

      if (isSelected) {
        element.style.transform = "scale(1.32) translateY(-4px)";
        element.style.zIndex = "40";
        if (svgPath) svgPath.setAttribute("fill", "#A74627"); // Deep terracotta
        if (halo) {
          halo.style.opacity = "1";
          halo.style.boxShadow = "0 0 0 7px rgba(198, 93, 59, 0.35)";
        }
      } else if (isHovered) {
        element.style.transform = "scale(1.24) translateY(-2px)";
        element.style.zIndex = "30";
        if (svgPath) svgPath.setAttribute("fill", "#D77252"); // Light terracotta highlight
        if (halo) {
          halo.style.opacity = "1";
          halo.style.boxShadow = "0 0 0 5px rgba(215, 114, 82, 0.3)";
        }
      } else {
        element.style.transform = "scale(1) translateY(0)";
        element.style.zIndex = "10";
        if (svgPath) svgPath.setAttribute("fill", "#C65D3B"); // Default terracotta
        if (halo) {
          halo.style.opacity = "0";
          halo.style.boxShadow = "none";
        }
      }
    });
  }, [selectedPlaceId, hoveredPlaceId]);

  const displaySelectedTitle =
    language === "mr" && selectedPlace?.marathiName
      ? selectedPlace.marathiName
      : selectedPlace?.name;

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-xl border border-line ${className}`}>
      {/* Map clip-path unfold animation */}
      <motion.div
        initial={
          shouldReduceMotion
            ? { opacity: 1, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }
            : { opacity: 0.8, clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }
        }
        animate={{ opacity: 1, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full"
      >
        <div ref={mapContainerRef} className="w-full h-full bg-sand-100" />
      </motion.div>

      {/* Map watermark / badge */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/85 backdrop-blur-sm border border-line text-[11px] font-medium text-ink/75 shadow-xs">
          <Layers className="w-3.5 h-3.5 text-terracotta" />
          <span>MapLibre GL · {places.length} {t.common.placesMapped}</span>
        </div>
      </div>

      {/* Selected place panel at the bottom of the map */}
      <AnimatePresence>
        {selectedPlace && !panelDismissed && (
          <motion.div
            key={selectedPlace.id}
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: "easeOut" }}
            className="absolute bottom-4 left-4 right-4 z-20"
          >
            <div className="p-4 rounded-lg border border-line bg-sand-50/95 backdrop-blur-md shadow-xl text-ink">
              {/* Panel Top Bar */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-line/70">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-terracotta animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta font-mono">
                    {t.routes.explore.selectedPlace}
                  </span>
                  <span className="text-[11px] text-ink/40 font-mono">
                    [{selectedPlace.lat.toFixed(4)}° N, {selectedPlace.lng.toFixed(4)}° E]
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setPanelDismissed(true)}
                  aria-label="Dismiss panel"
                  className="p-1 rounded text-ink/50 hover:text-ink hover:bg-black/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Panel Body */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden rounded-md border border-line bg-sand-200">
                    {selectedPlace.imageUrl ? (
                      <Image
                        src={selectedPlace.imageUrl}
                        alt={displaySelectedTitle || "Selected place"}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-ink/40 bg-sand-200 p-2">
                        <Landmark className="w-5 h-5 text-terracotta/60 mb-0.5" />
                        <span className="text-[8px] uppercase tracking-wider text-ink/50 font-mono">
                          Virasat
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-lg sm:text-xl font-semibold text-ink leading-tight truncate">
                      {displaySelectedTitle}
                    </h3>

                    <p className="text-xs text-ink/70 mt-0.5 font-sans truncate">
                      {selectedPlace.region ? `${selectedPlace.region}, ` : ""}
                      {selectedPlace.state}
                    </p>

                    <p className="text-[11px] text-ink/55 mt-0.5 font-sans truncate">
                      {selectedPlace.period ? `${selectedPlace.period} · ` : ""}
                      {selectedPlace.category}
                    </p>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {selectedPlace.hasOcr && (
                        <Badge
                          variant="ocr"
                          size="sm"
                          icon={<Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                        >
                          {t.common.hasOcr}
                        </Badge>
                      )}

                      {selectedPlace.recordsCount > 0 && (
                        <span className="text-[11px] text-ink/65 font-sans">
                          {selectedPlace.recordsCount} {t.common.records}
                        </span>
                      )}

                      {selectedPlace.isIllustrative && (
                        <Badge variant="illustrative" size="sm">
                          {t.common.illustrative}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dossier Action Button */}
                <div className="shrink-0 self-end sm:self-center">
                  <Link href={`/place/${selectedPlace.slug || selectedPlace.id}`}>
                    <Button
                      variant="primary"
                      size="sm"
                      iconRight={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {t.routes.explore.viewPlaceDossier}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global CSS keyframes for pin entrance */}
      <style jsx global>{`
        @keyframes virasatPinDrop {
          0% {
            opacity: 0;
            transform: translateY(-26px) scale(0.6);
          }
          65% {
            opacity: 1;
            transform: translateY(3px) scale(1.08);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
