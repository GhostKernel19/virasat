"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
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

const STORAGE_KEY = "virasat_explore_state";

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

  const onSelectPlaceRef = useRef(onSelectPlace);
  onSelectPlaceRef.current = onSelectPlace;

  const selectedPlaceIdRef = useRef(selectedPlaceId);
  selectedPlaceIdRef.current = selectedPlaceId;

  const hoveredPlaceIdRef = useRef(hoveredPlaceId);
  hoveredPlaceIdRef.current = hoveredPlaceId;

  const initialFitDoneRef = useRef(false);
  const prevPlacesRef = useRef<Place[] | null>(null);

  const { language, t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) || null;

  // Helper to update marker styles without recreating them
  const updateMarkerStyles = useCallback(
    (selectedId: string | null, hoveredId: string | null) => {
      markersRef.current.forEach(({ element }, id) => {
        const isSelected = id === selectedId;
        const isHovered = id === hoveredId;

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
    },
    []
  );

  // Initialize MapLibre ONCE (empty dependency array)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let initialCenter: [number, number] = [78.9629, 22.5937]; // India center
    let initialZoom = 4.4;

    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed.center) &&
          parsed.center.length === 2 &&
          typeof parsed.center[0] === "number" &&
          typeof parsed.center[1] === "number" &&
          typeof parsed.zoom === "number"
        ) {
          initialCenter = [parsed.center[0], parsed.center[1]];
          initialZoom = parsed.zoom;
          initialFitDoneRef.current = true;
        }
      }
    } catch {
      // Ignore sessionStorage read errors
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: FREE_LIGHT_STYLE,
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 3.5,
      maxZoom: 16,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      mapRef.current = map;
      setMapLoaded(true);
    });

    // Save map centre and zoom in sessionStorage on every moveend
    map.on("moveend", () => {
      try {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const saved = sessionStorage.getItem(STORAGE_KEY);
        const state = saved ? JSON.parse(saved) : {};
        state.center = [center.lng, center.lat];
        state.zoom = zoom;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Ignore sessionStorage write errors
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync Markers when filtered places change (NOT when selectedPlaceId changes)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Remove old markers
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();

    // Create custom terracotta SVG pin markers with stagger animation
    places.forEach((place, index) => {
      const el = document.createElement("div");
      el.className = "virasat-pin-marker relative cursor-pointer select-none";
      el.style.width = "36px";
      el.style.height = "44px";
      el.style.transformOrigin = "bottom center";
      el.style.transition = "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), filter 0.25s ease";

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
        onSelectPlaceRef.current(place.id);
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

    // Update marker highlight styles on newly created markers
    updateMarkerStyles(selectedPlaceIdRef.current, hoveredPlaceIdRef.current);

    // Call fitBounds only once on initial load (if not restored from storage) and when filter changes
    const isFilterChange = prevPlacesRef.current !== null && prevPlacesRef.current !== places;
    const needsInitialFit = !initialFitDoneRef.current;

    if ((needsInitialFit || isFilterChange) && places.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      places.forEach((place) => {
        bounds.extend([place.lng, place.lat]);
      });
      map.fitBounds(bounds, { padding: 60, maxZoom: 6 });
      initialFitDoneRef.current = true;
    }

    prevPlacesRef.current = places;
  }, [places, mapLoaded, shouldReduceMotion, updateMarkerStyles]);

  // Handle place selection: update marker styles and easeTo selected place without changing zoom
  useEffect(() => {
    updateMarkerStyles(selectedPlaceId, hoveredPlaceId);

    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedPlaceId) return;

    const place = places.find((p) => p.id === selectedPlaceId);
    if (place) {
      map.easeTo({
        center: [place.lng, place.lat],
        duration: 600,
      });
    }
  }, [selectedPlaceId, hoveredPlaceId, places, mapLoaded, updateMarkerStyles]);

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

              {/* Panel Content Body */}
              <div className="flex items-start gap-3.5">
                <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden border border-line bg-sand-200">
                  {selectedPlace.imageUrl ? (
                    <Image
                      src={selectedPlace.imageUrl}
                      alt={displaySelectedTitle || selectedPlace.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink/40">
                      <Landmark className="w-6 h-6 text-terracotta/60" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-base font-semibold text-ink truncate">
                      {displaySelectedTitle}
                    </h3>
                    {selectedPlace.hasOcr && (
                      <Badge
                        variant="ocr"
                        size="sm"
                        icon={<Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                      >
                        {t.common.hasOcr}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-ink/70 mt-0.5 truncate">
                    {selectedPlace.region ? `${selectedPlace.region}, ` : ""}
                    {selectedPlace.state} · {selectedPlace.period} · {selectedPlace.category}
                  </p>

                  <p className="text-xs text-ink/80 mt-1 line-clamp-2 leading-relaxed">
                    {selectedPlace.summary}
                  </p>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-3 pt-2.5 border-t border-line/60 flex items-center justify-between">
                <span className="text-[11px] text-ink/60">
                  {selectedPlace.recordsCount} {t.common.records}
                </span>

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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
