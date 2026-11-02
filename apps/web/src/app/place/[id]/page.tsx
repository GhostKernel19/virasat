"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar, Footer, Badge } from "@/components";
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

        const targetId = SLUG_TO_ID[placeId] || placeId;
        const isUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);

        let placeData: PlaceRecord | null = null;
        if (isUUID) {
          const res = await supabase.from("places").select("*").eq("id", targetId).maybeSingle();
          if (res.error) throw new Error(res.error.message);
          placeData = res.data as PlaceRecord | null;
        } else {
          const formattedName = targetId.replace(/-/g, " ");
          const res = await supabase
            .from("places")
            .select("*")
            .ilike("name", `%${formattedName}%`)
            .maybeSingle();
          if (res.error) throw new Error(res.error.message);
          placeData = res.data as PlaceRecord | null;
        }

        if (!placeData) {
          throw new Error(`Place not found for "${placeId}".`);
        }

        if (!isMounted) return;
        setPlace(placeData);

        // Fetch linked heritage items with media, OCR texts and translations (only published items appear)
        const isPreview =
          typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("preview") === "all";
        const allowedStatuses = isPreview
          ? ["in_review", "published", "verified"]
          : ["published", "verified"];

        const { data: itemsData, error: itemsError } = await supabase
          .from("heritage_items")
          .select("*, media(*, ocr_texts(*, translations(*)))")
          .eq("place_id", placeData.id)
          .in("status", allowedStatuses)
          .order("created_at", { ascending: true });

        if (itemsError) {
          throw new Error(itemsError.message);
        }

        if (isMounted) {
          setItems((itemsData as HeritageItemRecord[]) || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : "Failed to load place dossier from Supabase.";
          setError(message);
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
    const firstRecordTitle = items[0]?.title
      ? items[0].title.replace(/^\[Illustrative\]\s*/i, "")
      : "Archival Dossier";
    const todayFormatted = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const citation = `"${place.name}", "${firstRecordTitle}", Virasat atlas, ${todayFormatted}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(citation);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = citation;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-text">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 sm:px-8 lg:px-10 py-10">
        {/* Navigation Bar: Back to Explore and Cite button */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Explore</span>
          </Link>

          {place && (
            <button
              type="button"
              onClick={handleCite}
              aria-label="Copy citation"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control border border-border bg-surface hover:bg-surface-solid text-xs font-medium text-text transition-all duration-300 ease-soft shadow-soft hover:shadow-lift hover:-translate-y-0.5 cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : (
                <Quote className="w-3.5 h-3.5 text-accent" />
              )}
              <span>{copied ? "Copied citation!" : "Cite"}</span>
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center text-text-muted">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono uppercase tracking-wider">Loading place dossier...</p>
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
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control border border-border bg-surface text-xs font-medium text-text hover:border-accent transition-colors shadow-soft"
            >
              ← Back to Explore
            </Link>
          </div>
        )}

        {/* Place Details and Records */}
        {!loading && !error && place && (
          <div>
            {/* Place Metadata Card */}
            <div className="glass p-8 mb-10 shadow-soft">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {place.type && (
                  <Badge variant="terracotta" size="sm">
                    {place.type}
                  </Badge>
                )}
                {place.is_illustrative && (
                  <Badge variant="illustrative" size="sm">
                    Illustrative
                  </Badge>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-text mb-3">
                {place.name}
              </h1>

              {/* Metadata row: State, Period, Type */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-text-muted mb-4 pb-4 border-b border-border/60">
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
                  <span>{items.length} {items.length === 1 ? "record" : "records"}</span>
                </div>

                {typeof place.lat === "number" && typeof place.lng === "number" && (
                  <div className="text-text-muted/60 font-mono text-[11px]">
                    {place.lat.toFixed(4)}° N, {place.lng.toFixed(4)}° E
                  </div>
                )}
              </div>

              {/* Summary */}
              {place.summary && (
                <p className="text-sm text-text/80 leading-relaxed font-sans">
                  {place.summary.replace(/^\[Illustrative\]\s*/i, "")}
                </p>
              )}
            </div>

            {/* OCR Records Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                <h2 className="font-serif text-xl font-semibold text-text">
                  Archival Records & OCR Transcripts ({items.length})
                </h2>
              </div>

              {items.length === 0 ? (
                <div className="p-10 rounded-card border border-dashed border-border bg-surface/50 text-center text-text-muted my-4 shadow-soft">
                  <p className="text-sm font-sans font-medium text-text">No published records yet</p>
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
                      className="space-y-5 p-6.5 glass shadow-soft hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-soft"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border/70 pb-3">
                        <div>
                          <h3 className="font-serif text-base sm:text-lg font-semibold text-text">
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
                              className="border border-border rounded-control overflow-hidden bg-surface-solid/80 shadow-soft"
                            >
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-surface border-b border-border text-xs font-semibold text-text">
                                      <th className="py-2.5 px-4 w-1/2">
                                        Original Devanagari line
                                      </th>
                                      <th className="py-2.5 px-4 w-1/2">
                                        English translation line
                                      </th>
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

                                        return (
                                          <tr
                                            key={idx}
                                            className="hover:bg-surface/50 transition-colors"
                                          >
                                            <td className="py-3 px-4 align-top font-devanagari text-[15px] leading-relaxed text-text">
                                              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                                                <span>{line.text}</span>
                                                {confidenceVal && (
                                                  <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-pill bg-surface text-text-muted border border-border">
                                                    {confidenceVal}
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="py-3 px-4 align-top font-sans text-xs text-text/80 leading-relaxed">
                                              {translationLines[idx] || translationText || "—"}
                                            </td>
                                          </tr>
                                        );
                                      })
                                    ) : (
                                      <tr>
                                        <td className="py-3 px-4 align-top font-devanagari text-[15px] leading-relaxed text-text">
                                          {ocr.original_text || "—"}
                                        </td>
                                        <td className="py-3 px-4 align-top font-sans text-xs text-text/80 leading-relaxed">
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
