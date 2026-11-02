"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar, Footer, Badge } from "@/components";
import { useLanguage } from "@/i18n";
import { Search, Loader2, ArrowRight, X, AlertCircle } from "lucide-react";

interface SearchPlace {
  id: string;
  name: string;
  state: string;
  period: string;
  type: string;
  summary: string;
}

interface SearchPassage {
  ocr_id: string;
  place_id: string;
  place_name: string;
  item_title: string;
  original_text: string;
  translation_text: string;
  matched_field: "original_text" | "translation_text";
}

interface SearchResponse {
  places: SearchPlace[];
  passages: SearchPassage[];
}

/**
 * Helper to highlight matched query terms using <mark> tags.
 * Supports multi-word matching case-insensitively with Unicode awareness.
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!text || !query || !query.trim()) return text;

  const terms = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (terms.length === 0) return text;

  try {
    const regex = new RegExp(`(${terms.join("|")})`, "giu");
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <mark
            key={index}
            className="bg-accent-2/25 text-accent-2 font-semibold rounded px-1 py-0.5"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  } catch {
    return text;
  }
}

/**
 * Helper to determine if a type filter represents "All" / unconstrained.
 */
function isAllTypes(val?: string | null): boolean {
  if (!val) return true;
  const s = val.trim().toLowerCase();
  return (
    s === "" ||
    s === "all" ||
    s === "all types" ||
    s === "all_types" ||
    s === "alltypes" ||
    s === "सर्व प्रकार"
  );
}

/**
 * Builds the search request URL per requirements:
 * - Uses process.env.NEXT_PUBLIC_API_URL (fallback: http://localhost:8000)
 * - Encodes q with encodeURIComponent
 * - Omit type parameter completely when All Types or empty is selected
 */
function buildSearchUrl(searchTerm: string, typeFilter?: string | null): string {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
  let url = `${baseUrl}/search?q=${encodeURIComponent(searchTerm.trim())}`;
  if (typeFilter && !isAllTypes(typeFilter)) {
    url += `&type=${encodeURIComponent(typeFilter.trim())}`;
  }
  return url;
}

function SearchContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlQuery = searchParams.get("q") || "";
  const rawUrlType = searchParams.get("type") || "";
  const urlType = isAllTypes(rawUrlType) ? "" : rawUrlType;

  const [query, setQuery] = useState(urlQuery);
  const [selectedType, setSelectedType] = useState<string>(urlType);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(Boolean(urlQuery.trim()));

  // Track the last successfully fetched search key to avoid duplicate/redundant fetches
  const lastFetchedKeyRef = useRef<string>("");

  // Perform search call to backend API
  const performSearch = useCallback(
    async (searchTerm: string, typeFilter: string) => {
      const trimmed = searchTerm.trim();
      if (!trimmed) {
        setResults(null);
        setLoading(false);
        setHasSearched(false);
        setErrorMessage(null);
        lastFetchedKeyRef.current = "";
        return;
      }

      const activeType = isAllTypes(typeFilter) ? "" : typeFilter.trim();
      const searchKey = `${trimmed}:::${activeType}`;

      setLoading(true);
      setHasSearched(true);
      setErrorMessage(null);

      const requestUrl = buildSearchUrl(trimmed, activeType);
      console.log("Search request URL:", requestUrl);

      try {
        const res = await fetch(requestUrl);
        if (!res.ok) {
          const errorBody = await res.text().catch(() => "");
          const errorMsg = `Search request failed with status ${res.status}: ${errorBody || res.statusText}`;
          console.error("Search request failed:", errorMsg);
          setErrorMessage(errorMsg);
          setResults({ places: [], passages: [] });
          return;
        }

        const data: SearchResponse = await res.json();
        console.log("Search response:", data);

        // Read data.places and data.passages exactly as returned
        const places = Array.isArray(data?.places) ? data.places : [];
        const passages = Array.isArray(data?.passages) ? data.passages : [];

        setResults({
          places,
          passages,
        });
        setErrorMessage(null);
        lastFetchedKeyRef.current = searchKey;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const fullErr = `Failed to connect to search API: ${msg}. URL: ${requestUrl}`;
        console.error("Search API error:", err);
        setErrorMessage(fullErr);
        setResults({ places: [], passages: [] });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Synchronize state with URL parameters (supports direct navigation e.g. /search?q=hampi)
  useEffect(() => {
    const qParam = searchParams.get("q") || "";
    const tParam = searchParams.get("type") || "";
    const cleanType = isAllTypes(tParam) ? "" : tParam;

    setQuery(qParam);
    setSelectedType(cleanType);

    if (qParam.trim()) {
      const searchKey = `${qParam.trim()}:::${cleanType}`;
      if (lastFetchedKeyRef.current !== searchKey) {
        performSearch(qParam, cleanType);
      }
    } else {
      setResults(null);
      setHasSearched(false);
      setErrorMessage(null);
      lastFetchedKeyRef.current = "";
    }
  }, [searchParams, performSearch]);

  // Debounced search on typing (300ms) for user interaction in input
  useEffect(() => {
    if (!query.trim()) {
      if (lastFetchedKeyRef.current !== "") {
        setResults(null);
        setHasSearched(false);
        setErrorMessage(null);
        lastFetchedKeyRef.current = "";
        window.history.replaceState(null, "", "/search");
      }
      return;
    }

    const timer = setTimeout(() => {
      const activeType = isAllTypes(selectedType) ? "" : selectedType.trim();
      const searchKey = `${query.trim()}:::${activeType}`;

      // Skip if URL sync already performed this exact query
      if (lastFetchedKeyRef.current === searchKey) {
        return;
      }

      // Update URL quietly to reflect user input
      const params = new URLSearchParams();
      params.set("q", query.trim());
      if (activeType) {
        params.set("type", activeType);
      }
      window.history.replaceState(null, "", `/search?${params.toString()}`);

      performSearch(query, activeType);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedType, performSearch]);

  // Handle immediate form submission on Enter
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const activeType = isAllTypes(selectedType) ? "" : selectedType.trim();
      const params = new URLSearchParams();
      params.set("q", query.trim());
      if (activeType) {
        params.set("type", activeType);
      }
      router.replace(`/search?${params.toString()}`);
      performSearch(query, activeType);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSelectedType("");
    setResults(null);
    setHasSearched(false);
    setErrorMessage(null);
    lastFetchedKeyRef.current = "";
    window.history.replaceState(null, "", "/search");
  };

  const places = results?.places || [];
  const passages = results?.passages || [];

  return (
    <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-5 sm:px-8 lg:px-10 py-10">
      {/* Header Badge & Title */}
      <div className="mb-6">
        <p className="text-[11px] font-bold tracking-widest text-accent uppercase mb-1">
          {t.routes.search.badge}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-text">
          {t.routes.search.title}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-text-muted">
          {t.routes.search.subtitle}
        </p>
      </div>

      {/* Large Glass Search Field & Pill Filter Dropdown */}
      <div className="p-4 sm:p-5 glass rounded-card shadow-soft mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Large glass input container */}
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.routes.search.placeholder}
              className="w-full pl-11 pr-10 py-3.5 rounded-control border border-border bg-surface-solid/80 text-sm sm:text-base text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 ease-soft shadow-soft"
            />
            <Search className="w-5 h-5 text-accent absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent transition-colors p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Place Type Filter Dropdown - Pill Shape */}
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="place-type" className="text-xs text-text-muted shrink-0 sr-only sm:not-sr-only">
              {t.routes.search.typeFilterLabel}
            </label>
            <select
              id="place-type"
              value={isAllTypes(selectedType) ? "" : selectedType}
              onChange={(e) => {
                const val = e.target.value;
                const newType = isAllTypes(val) ? "" : val;
                setSelectedType(newType);
              }}
              className="px-4 py-3 rounded-pill border border-border bg-surface-solid/80 text-xs sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent cursor-pointer transition-all duration-300 ease-soft"
            >
              <option value="">{t.routes.search.allTypes}</option>
              <option value="Stepwell">Stepwell</option>
              <option value="Hill Fort">Hill Fort</option>
              <option value="Temple Complex">Temple Complex</option>
            </select>
          </div>
        </form>
      </div>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="mb-6 p-5 rounded-card border border-danger/40 bg-danger/10 text-text shadow-soft">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-danger uppercase tracking-wider mb-0.5">
                Search Request Error
              </p>
              <p className="text-xs sm:text-sm text-text/85 font-mono break-all">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center text-text-muted">
          <Loader2 className="w-7 h-7 animate-spin text-accent mb-2" />
          <p className="text-xs sm:text-sm">{t.routes.search.loading}</p>
        </div>
      )}

      {/* Empty State: Query Executed, No Error, but BOTH Places and Passages are Empty */}
      {!loading && !errorMessage && hasSearched && places.length === 0 && passages.length === 0 && (
        <div className="py-16 text-center max-w-md mx-auto p-8 glass rounded-card shadow-soft">
          <div className="w-10 h-10 rounded-pill bg-surface-solid text-text-muted flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-base sm:text-lg font-medium text-text mb-1">
            {t.routes.search.noResults}
          </h3>
          <p className="text-xs text-text-muted">
            {t.routes.search.noResultsSubtitle}
          </p>
        </div>
      )}

      {/* Initial Hint: Search Box Empty */}
      {!loading && !hasSearched && (
        <div className="py-16 text-center max-w-lg mx-auto text-text-muted">
          <Search className="w-8 h-8 mx-auto text-accent/40 mb-3" />
          <p className="text-xs sm:text-sm leading-relaxed">
            {t.routes.search.initialPrompt}
          </p>
        </div>
      )}

      {/* Results Content: Render if places OR passages exist */}
      {!loading && hasSearched && (places.length > 0 || passages.length > 0) && (
        <div className="space-y-10">
          {/* 1. Places Section: Renders even when passages is empty */}
          {places.length > 0 && (
            <section aria-labelledby="section-places">
              <div className="flex items-center justify-between border-b border-border pb-2.5 mb-4">
                <h2
                  id="section-places"
                  className="font-serif text-xl sm:text-2xl font-normal text-text flex items-center gap-2"
                >
                  <span>{t.routes.search.placesTitle}</span>
                  <span className="text-xs text-text-muted font-sans">
                    ({places.length})
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {places.map((place) => (
                  <Link
                    key={place.id}
                    href={`/place/${place.id}`}
                    className="p-6 glass rounded-card hover:bg-surface-solid/80 hover:border-accent shadow-soft hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-soft flex flex-col justify-between group no-underline text-text"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-serif text-base sm:text-lg font-normal text-text group-hover:text-accent transition-colors">
                          {highlightMatch(place.name, query)}
                        </h3>
                        {place.type && (
                          <Badge variant="filter" size="sm">
                            {place.type}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-text-muted mb-2.5">
                        <span>{highlightMatch(place.state, query)}</span>
                        {place.period && (
                          <>
                            <span className="text-border">•</span>
                            <span>{place.period}</span>
                          </>
                        )}
                      </div>

                      {place.summary && (
                        <p className="text-xs text-text/80 line-clamp-3 leading-relaxed mb-3">
                          {highlightMatch(place.summary, query)}
                        </p>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-xs font-medium text-accent">
                      <span>{t.routes.search.viewPlace}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 2. Passages Section */}
          {passages.length > 0 && (
            <section aria-labelledby="section-passages">
              <div className="flex items-center justify-between border-b border-border pb-2.5 mb-4">
                <h2
                  id="section-passages"
                  className="font-serif text-xl sm:text-2xl font-normal text-text flex items-center gap-2"
                >
                  <span>{t.routes.search.passagesTitle}</span>
                  <span className="text-xs text-text-muted font-sans">
                    ({passages.length})
                  </span>
                </h2>
              </div>

              <div className="space-y-5">
                {passages.map((passage) => (
                  <div
                    key={passage.ocr_id}
                    className="p-6 glass rounded-card hover:bg-surface-solid/80 shadow-soft hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-soft flex flex-col gap-3.5"
                  >
                    {/* Header: Place name & matched field badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/place/${passage.place_id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline group"
                      >
                        <span>{passage.place_name}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      <div className="flex items-center gap-2">
                        {passage.item_title && (
                          <span className="text-[11px] text-text-muted italic truncate max-w-xs sm:max-w-md">
                            {highlightMatch(passage.item_title, query)}
                          </span>
                        )}
                        <Badge
                          variant={passage.matched_field === "original_text" ? "filterActive" : "gold"}
                          size="sm"
                        >
                          {passage.matched_field === "original_text"
                            ? "देवनागरी / Inscription"
                            : "Translation"}
                        </Badge>
                      </div>
                    </div>

                    {/* Original Devanagari Line */}
                    {passage.original_text && (
                      <div className="p-3.5 rounded-control bg-surface-solid/90 border border-border/70 font-devanagari text-xs sm:text-sm text-text leading-relaxed whitespace-pre-line">
                        {highlightMatch(passage.original_text, query)}
                      </div>
                    )}

                    {/* English Translation */}
                    {passage.translation_text && (
                      <div className="text-xs sm:text-sm text-text/80 italic leading-relaxed border-l-2 border-accent/40 pl-3">
                        {highlightMatch(passage.translation_text, query)}
                      </div>
                    )}

                    {/* Bottom link to place dossier */}
                    <div className="pt-1 flex justify-end">
                      <Link
                        href={`/place/${passage.place_id}`}
                        className="text-xs font-medium text-accent hover:text-accent-strong flex items-center gap-1"
                      >
                        <span>{t.routes.search.viewPlace}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

export default function SearchPage() {
  const { t } = useLanguage();

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
      <Suspense
        fallback={
          <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-text-muted">
            <Loader2 className="w-7 h-7 animate-spin text-accent mb-2" />
            <p className="text-xs sm:text-sm">{t.routes.search.loading}</p>
          </div>
        }
      >
        <SearchContent />
      </Suspense>
      <Footer pageCode={t.footer.pageCodes.search} />
    </div>
  );
}
