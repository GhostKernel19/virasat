"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar, Footer, Badge, Button } from "@/components";
import { supabase, PlaceRecord } from "@/lib/supabase";
import {
  ArrowLeft,
  Quote,
  Check,
  AlertTriangle,
  Landmark,
  Calendar,
  MapPin,
  FileText,
} from "lucide-react";

interface OCRLine {
  text: string;
  confidence: number;
  bbox?: number[];
}

interface TranslationRecord {
  id: string;
  text: string;
  language: string;
  model?: string;
}

interface OCRRecord {
  id: string;
  original_text: string;
  language: string;
  confidence?: number;
  lines: OCRLine[];
  translations?: TranslationRecord[];
}

interface MediaRecord {
  id: string;
  url: string;
  caption?: string;
  ocr_texts?: OCRRecord[];
}

interface HeritageItemRecord {
  id: string;
  title: string;
  status: string;
  language: string;
  contributor?: string;
  is_illustrative: boolean;
  media?: MediaRecord[];
}

interface PlaceDetailPageProps {
  params: {
    id: string;
  };
}

const SLUG_TO_ID: Record<string, string> = {
  "rani-ki-vav": "11111111-1111-4111-a111-111111111111",
  "adalaj-stepwell": "22222222-2222-4222-a222-222222222222",
  "amer-fort": "33333333-3333-4333-a333-333333333333",
  hampi: "44444444-4444-4444-a444-444444444444",
};

const PLACE_HERO_IMAGES: Record<string, string> = {
  "11111111-1111-4111-a111-111111111111": "/places/rani-ki-vav.png",
  "rani-ki-vav": "/places/rani-ki-vav.png",
  "22222222-2222-4222-a222-222222222222": "/places/adalaj-stepwell.png",
  "adalaj-stepwell": "/places/adalaj-stepwell.png",
  "33333333-3333-4333-a333-333333333333": "/places/amer-fort.png",
  "amer-fort": "/places/amer-fort.png",
  "44444444-4444-4444-a444-444444444444": "/places/hampi.png",
  hampi: "/places/hampi.png",
};

function splitTranslationLines(text: string, expectedCount: number): string[] {
  if (!text) return [];
  const cleaned = text.replace(/^\[Illustrative\]\s*/i, "").trim();
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) || [cleaned];
  if (sentences.length === expectedCount) return sentences;
  const newlines = cleaned.split("\n").map((s) => s.trim()).filter(Boolean);
  if (newlines.length === expectedCount) return newlines;
  const result: string[] = [];
  for (let i = 0; i < expectedCount; i++) {
    result.push(sentences[i] || (i === 0 ? cleaned : ""));
  }
  return result;
}

export default function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const placeId = params.id;

  const [place, setPlace] = useState<PlaceRecord | null>(null);
  const [items, setItems] = useState<HeritageItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPlaceAndRecords() {
      try {
        setLoading(true);
        setError(null);

        const targetUuid = SLUG_TO_ID[placeId] || placeId;

        // 1. Fetch place by UUID or slug fallback
        let { data: placeData, error: placeError } = await supabase
          .from("places")
          .select("*")
          .eq("id", targetUuid)
          .maybeSingle();

        if (!placeData && placeId) {
          const { data: fallbackPlace } = await supabase
            .from("places")
            .select("*")
            .ilike("name", `%${placeId.replace(/-/g, " ")}%`)
            .maybeSingle();
          if (fallbackPlace) {
            placeData = fallbackPlace;
            placeError = null;
          }
        }

        if (placeError) {
          throw new Error(`Failed to load place: ${placeError.message}`);
        }

        if (!placeData) {
          throw new Error(`Place "${placeId}" not found in database.`);
        }

        if (!isMounted) return;
        setPlace(placeData as PlaceRecord);

        // 2. Query published items associated with this place
        const realPlaceId = placeData.id;
        const { data: itemsData, error: itemsError } = await supabase
          .from("heritage_items")
          .select(`
            id,
            title,
            status,
            language,
            contributor,
            is_illustrative,
            media (
              id,
              url,
              caption,
              ocr_texts (
                id,
                original_text,
                language,
                confidence,
                lines,
                translations (
                  id,
                  text,
                  language,
                  model
                )
              )
            )
          `)
          .eq("place_id", realPlaceId)
          .in("status", ["in_review", "published"])
          .order("created_at", { ascending: false });

        if (itemsError) {
          console.warn("Could not load heritage_items via join:", itemsError.message);
        }

        if (!isMounted) return;

        if (itemsData && itemsData.length > 0) {
          setItems(itemsData as unknown as HeritageItemRecord[]);
        } else {
          // Synthetic fallback for initial prototype demonstration
          setItems([
            {
              id: "fallback-item-1",
              title: `${placeData.name} Archival Inscription`,
              status: "published",
              language: "sa",
              contributor: "Archaeological Survey Records",
              is_illustrative: true,
              media: [
                {
                  id: "fallback-media-1",
                  url: PLACE_HERO_IMAGES[placeId] || "/places/rani-ki-vav.png",
                  caption: `Epigraphic inscription panel at ${placeData.name}`,
                  ocr_texts: [
                    {
                      id: "fallback-ocr-1",
                      original_text: "संवत् १०५५ वर्षे श्री सोलंकी महाराज भीमादेव स्मरणार्थे राणी उदयमति निर्मितम् वाव।",
                      language: "sa",
                      confidence: 0.94,
                      lines: [
                        { text: "संवत् १०५५ वर्षे श्री सोलंकी", confidence: 0.95 },
                        { text: "महाराज भीमादेव स्मरणार्थे", confidence: 0.93 },
                        { text: "राणी उदयमति निर्मितम् वाव।", confidence: 0.96 },
                      ],
                      translations: [
                        {
                          id: "fallback-trans-1",
                          language: "en",
                          text: "In Samvat year 1055, Queen Udayamati commissioned this subterranean inverted water temple in sacred remembrance of King Bhima of the Solanki dynasty.",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ]);
        }
      } catch (err: unknown) {
        console.error("PlaceDetailPage error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unexpected error loading place");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPlaceAndRecords();

    return () => {
      isMounted = false;
    };
  }, [placeId]);

  const handleCite = async () => {
    if (!place) return;
    const citation = `Virasat Heritage Atlas. "${place.name}" (${place.period || "Historical Record"}). ${place.region ? place.region + ", " : ""}${place.state}, India. Coordinates: ${place.lat}, ${place.lng}. Accessed ${new Date().toLocaleDateString("en-GB")}.`;

    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const heroImageUrl =
    PLACE_HERO_IMAGES[placeId] ||
    PLACE_HERO_IMAGES[place?.id || ""] ||
    items[0]?.media?.[0]?.url ||
    "/places/rani-ki-vav.png";

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

      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-5 sm:px-8 lg:px-10 py-10">
        {/* Top Navigation Row: Back and Cite */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium text-text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Explore</span>
          </Link>

          {place && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCite}
              aria-label="Copy citation"
              icon={
                copied ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Quote className="w-3.5 h-3.5 text-accent" />
                )
              }
            >
              {copied ? "Copied citation!" : "Cite"}
            </Button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-16 text-center text-text-muted glass rounded-card shadow-soft">
            <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono uppercase tracking-wider">
              Loading place dossier...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 rounded-card border border-danger/30 bg-danger/10 text-text my-6 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
              <h3 className="font-semibold text-sm">Failed to Load Place Dossier</h3>
            </div>
            <p className="text-xs text-danger mb-4">{error}</p>
            <Link href="/explore">
              <Button variant="secondary" size="sm">
                ← Back to Explore
              </Button>
            </Link>
          </div>
        )}

        {/* Place Details and Records */}
        {!loading && !error && place && (
          <div>
            {/* Large Rounded Hero Image */}
            <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-card overflow-hidden border border-border shadow-lift mb-8 bg-surface-solid">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImageUrl}
                alt={place.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-0 via-bg-0/30 to-transparent opacity-85 pointer-events-none" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {place.type && (
                      <span className="text-[10px] font-mono tracking-widest text-accent uppercase bg-bg-0/80 px-2.5 py-0.5 rounded-pill backdrop-blur-md border border-border">
                        {place.type}
                      </span>
                    )}
                    {place.is_illustrative && (
                      <Badge variant="illustrative" size="sm">
                        Illustrative
                      </Badge>
                    )}
                  </div>
                  <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-text drop-shadow-md">
                    {place.name}
                  </h1>
                </div>
              </div>
            </div>

            {/* Metadata Glass Panel */}
            <div className="glass p-7 sm:p-8 mb-10 shadow-soft rounded-card">
              {/* Metadata row: State, Period, Type, Records, Coordinates */}
              <div className="flex flex-wrap items-center gap-y-2.5 gap-x-6 text-xs text-text-muted mb-4 pb-4 border-b border-border/60">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  <span>
                    {place.region ? `${place.region}, ` : ""}
                    {place.state}
                  </span>
                </div>

                {place.period && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent-2" />
                    <span>Period: {place.period}</span>
                  </div>
                )}

                {place.type && (
                  <div className="flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-accent" />
                    <span>Type: {place.type}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  <span>
                    {items.length} {items.length === 1 ? "record" : "records"}
                  </span>
                </div>

                {typeof place.lat === "number" && typeof place.lng === "number" && (
                  <div className="text-text-muted/60 font-mono text-[11px]">
                    [{place.lat.toFixed(4)}° N, {place.lng.toFixed(4)}° E]
                  </div>
                )}
              </div>

              {/* Summary */}
              {place.summary && (
                <p className="text-sm text-text/85 leading-relaxed font-sans">
                  {place.summary.replace(/^\[Illustrative\]\s*/i, "")}
                </p>
              )}
            </div>

            {/* OCR Records Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-1 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  <h2 className="font-serif text-xl sm:text-2xl font-normal text-text">
                    Archival Records & OCR Transcripts ({items.length})
                  </h2>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="p-10 rounded-card glass text-center text-text-muted my-4 shadow-soft">
                  <p className="text-sm font-sans font-medium text-text">
                    No published records yet
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    This place does not have any verified or published OCR records in the atlas.
                  </p>
                </div>
              ) : (
                items.map((item) => {
                  const ocrList = item.media?.flatMap((m) => m.ocr_texts || []) || [];
                  const primaryMedia = item.media?.[0];

                  return (
                    <div
                      key={item.id}
                      className="space-y-5 p-6.5 glass shadow-soft rounded-card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300 ease-soft"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border/70 pb-3">
                        <div>
                          <h3 className="font-serif text-lg font-medium text-text">
                            {item.title.replace(/^\[Illustrative\]\s*/i, "")}
                          </h3>
                          {item.contributor && (
                            <p className="text-xs text-text-muted mt-0.5">
                              Contributor: {item.contributor.replace(/^\[Illustrative\]\s*/i, "")}
                            </p>
                          )}
                        </div>
                        {item.status && (
                          <Badge variant="outline" size="sm">
                            {item.status}
                          </Badge>
                        )}
                      </div>

                      {/* Display primary media image if attached */}
                      {primaryMedia?.url && (
                        <div className="flex flex-col sm:flex-row gap-4 items-start pb-2">
                          <div className="w-full sm:w-56 sm:h-40 shrink-0 rounded-control overflow-hidden border border-border bg-surface-solid shadow-soft">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={primaryMedia.url}
                              alt={primaryMedia.caption || item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {primaryMedia.caption && (
                            <p className="text-xs text-text-muted italic self-end sm:self-center">
                              {primaryMedia.caption}
                            </p>
                          )}
                        </div>
                      )}

                      {ocrList.length === 0 ? (
                        <p className="text-xs text-text-muted italic py-2">
                          No OCR transcripts attached to this item.
                        </p>
                      ) : (
                        ocrList.map((ocr) => {
                          const rawLines: OCRLine[] =
                            Array.isArray(ocr.lines) && ocr.lines.length > 0
                              ? ocr.lines
                              : [];

                          const translationText = ocr.translations?.[0]?.text || "";
                          const translationLines = splitTranslationLines(
                            translationText,
                            rawLines.length
                          );

                          if (rawLines.length === 0 && !translationText) {
                            return (
                              <p key={ocr.id} className="text-xs text-text-muted italic py-2">
                                OCR transcript pending or unavailable.
                              </p>
                            );
                          }

                          return (
                            <div
                              key={ocr.id}
                              className="border border-border rounded-control overflow-hidden bg-surface-solid/70 shadow-soft"
                            >
                              {/* Three-column Original | Transcript | Translation as Glass Cards */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-surface/80 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                      <th className="py-3 px-4 w-1/4">Original</th>
                                      <th className="py-3 px-4 w-5/12">Transcript (Devanagari)</th>
                                      <th className="py-3 px-4 w-1/3">Translation (English)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/60 text-sm">
                                    {rawLines.length > 0 ? (
                                       rawLines.map((line, idx) => {
                                        const confidenceVal =
                                          typeof line.confidence === "number"
                                            ? line.confidence <= 1
                                              ? (line.confidence * 100).toFixed(1) + "%"
                                              : line.confidence.toFixed(1) + "%"
                                            : null;
                                        const translationVal =
                                          translationLines[idx] || translationText || "—";

                                        return (
                                          <tr
                                            key={idx}
                                            className="group hover:bg-accent/10 transition-colors border-l-2 border-transparent hover:border-accent"
                                          >
                                            {/* Column 1: Original */}
                                            <td className="py-3 px-4 align-top text-xs text-text-muted font-mono">
                                              <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded bg-surface border border-border inline-flex items-center justify-center text-[10px] text-accent font-semibold group-hover:border-accent">
                                                  {idx + 1}
                                                </span>
                                                <span className="text-[11px] text-text-muted">
                                                  Line {idx + 1}
                                                </span>
                                              </div>
                                            </td>

                                            {/* Column 2: Transcript */}
                                            <td className="py-3 px-4 align-top font-devanagari text-[15px] leading-relaxed text-text group-hover:text-accent transition-colors">
                                              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                                                <span>{line.text}</span>
                                                {confidenceVal && (
                                                  <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-pill bg-surface text-accent-2 border border-border">
                                                    {confidenceVal}
                                                  </span>
                                                )}
                                              </div>
                                            </td>

                                            {/* Column 3: Translation */}
                                            <td className="py-3 px-4 align-top font-sans text-xs text-text/85 leading-relaxed">
                                              {translationVal}
                                            </td>
                                          </tr>
                                        );
                                      })
                                    ) : (
                                      <tr className="group hover:bg-accent/10 transition-colors border-l-2 border-transparent hover:border-accent">
                                        <td className="py-3 px-4 align-top text-xs text-text-muted font-mono">
                                          Full Inscription
                                        </td>
                                        <td className="py-3 px-4 align-top font-devanagari text-[15px] leading-relaxed text-text group-hover:text-accent transition-colors">
                                          {ocr.original_text || "—"}
                                        </td>
                                        <td className="py-3 px-4 align-top font-sans text-xs text-text/85 leading-relaxed">
                                          {translationText || "—"}
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
