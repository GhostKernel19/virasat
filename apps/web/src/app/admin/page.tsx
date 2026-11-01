"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar, Footer, Badge, Button } from "@/components";
import { useLanguage } from "@/i18n";
import {
  ShieldCheck,
  CheckCircle,
  Loader2,
  ExternalLink,
  MapPin,
  Calendar,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface AdminPlace {
  id: string;
  name: string;
  state: string;
  type?: string;
}

interface AdminTranslation {
  id: string;
  text: string;
}

interface AdminOCR {
  id: string;
  original_text: string;
  translations?: AdminTranslation[];
}

interface AdminMedia {
  id: string;
  url: string;
  caption?: string;
  ocr_texts?: AdminOCR[];
}

interface AdminItem {
  id: string;
  title: string;
  status: string;
  language: string;
  contributor?: string;
  created_at: string;
  place_id: string;
  places?: AdminPlace;
  media?: AdminMedia[];
}

export default function AdminPage() {
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<"in_review" | "published" | "all">("in_review");
  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchItems = useCallback(async (statusFilter: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/items?status=${statusFilter}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch moderation items (${res.status})`);
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Admin fetch error:", err);
      setError(err instanceof Error ? err.message : "Error connecting to backend API.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchItems(activeTab);
  }, [activeTab, fetchItems]);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(`${API_URL}/items/${id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`Approval failed with status ${res.status}`);
      }
      // Optimistically update item status in local state
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "published" } : item))
      );
    } catch (err) {
      console.error("Approve error:", err);
      alert(`Approval error: ${err instanceof Error ? err.message : "Network error"}`);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sand text-ink">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-5 sm:px-8 lg:px-10 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-pill bg-terracotta" />
              <p className="text-[11px] font-bold tracking-widest text-terracotta uppercase">
                {t.routes.admin.badge}
              </p>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-ink">
              {t.routes.admin.title}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-ink/70">
              {t.routes.admin.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchItems(activeTab)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control border border-line bg-[#FAF7F2] hover:bg-[#FDFBF7] text-xs font-medium text-ink transition-all duration-300 ease-soft shadow-soft hover:shadow-lift hover:-translate-y-0.5 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-ink/60" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2.5 border-b border-line pb-3 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("in_review")}
            className={`px-4 py-2 rounded-control text-xs font-medium transition-all duration-300 ease-soft cursor-pointer ${
              activeTab === "in_review"
                ? "bg-terracotta text-sand shadow-soft"
                : "bg-[#FAF7F2] text-ink/70 hover:text-ink hover:bg-[#FDFBF7] border border-line shadow-xs"
            }`}
          >
            {t.routes.admin.filterInReview}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("published")}
            className={`px-4 py-2 rounded-control text-xs font-medium transition-all duration-300 ease-soft cursor-pointer ${
              activeTab === "published"
                ? "bg-indigo text-sand shadow-soft"
                : "bg-[#FAF7F2] text-ink/70 hover:text-ink hover:bg-[#FDFBF7] border border-line shadow-xs"
            }`}
          >
            {t.routes.admin.filterPublished}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-control text-xs font-medium transition-all duration-300 ease-soft cursor-pointer ${
              activeTab === "all"
                ? "bg-ink text-sand shadow-soft"
                : "bg-[#FAF7F2] text-ink/70 hover:text-ink hover:bg-[#FDFBF7] border border-line shadow-xs"
            }`}
          >
            {t.routes.admin.filterAll}
          </button>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-5 rounded-card border border-red-200 bg-red-50/90 text-red-900 mb-6 flex items-start gap-3 shadow-soft">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="font-semibold">API Connection Error</p>
              <p className="text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-ink/60">
            <Loader2 className="w-8 h-8 animate-spin text-terracotta mb-2" />
            <p className="text-xs sm:text-sm">{t.routes.admin.loading}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <div className="py-16 text-center max-w-md mx-auto p-8 rounded-card border border-line bg-[#FAF7F2] shadow-soft">
            <ShieldCheck className="w-10 h-10 mx-auto text-green mb-3" />
            <h3 className="font-serif text-lg font-medium text-ink mb-1">
              {t.routes.admin.noItems}
            </h3>
            <p className="text-xs text-ink/60">
              All items in this status have been reviewed.
            </p>
          </div>
        )}

        {/* Items List */}
        {!loading && items.length > 0 && (
          <div className="space-y-4">
            {items.map((item) => {
              const primaryMedia = item.media?.[0];
              const ocr = primaryMedia?.ocr_texts?.[0];
              const translation = ocr?.translations?.[0]?.text;
              const isApproved = item.status === "published";
              const isApproving = approvingId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-6 rounded-card border border-line bg-[#FAF7F2] hover:bg-[#FDFBF7] shadow-soft hover:shadow-lift hover:-translate-y-1 transition-all duration-300 ease-soft flex flex-col md:flex-row gap-6 items-start justify-between"
                >
                  {/* Media Thumbnail */}
                  {primaryMedia?.url && (
                    <div className="w-full md:w-44 md:h-32 shrink-0 rounded-control overflow-hidden border border-line bg-sand-100 shadow-soft">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={primaryMedia.url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-serif text-base sm:text-lg font-medium text-ink truncate">
                        {item.title.replace(/^\[Illustrative\]\s*/i, "")}
                      </h3>
                      <Badge
                        variant={isApproved ? "ocr" : "gold"}
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                    </div>

                    {/* Place info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/65 mb-3">
                      {item.places && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-terracotta" />
                          <span className="font-medium text-ink">
                            {item.places.name}
                          </span>
                          <span className="text-ink/40">({item.places.state})</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-ink/50">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      {item.contributor && (
                        <span className="text-ink/50 truncate max-w-xs">
                          By: {item.contributor.replace(/^\[Illustrative\]\s*/i, "")}
                        </span>
                      )}
                    </div>

                    {/* OCR snippet */}
                    {ocr?.original_text && (
                      <div className="p-3 rounded-control bg-sand-50/90 border border-line font-devanagari text-xs text-ink leading-relaxed mb-2 line-clamp-2">
                        {ocr.original_text}
                      </div>
                    )}

                    {/* Translation snippet */}
                    {translation && (
                      <p className="text-xs text-ink/75 italic line-clamp-2 mb-2 border-l-2 border-terracotta/40 pl-2.5">
                        {translation}
                      </p>
                    )}

                    {/* View Place Dossier Link */}
                    {item.place_id && (
                      <Link
                        href={`/place/${item.place_id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo hover:text-terracotta transition-colors mt-1"
                      >
                        <span>{t.routes.admin.viewPlace}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
                    {isApproved ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-green bg-green/10 px-3.5 py-1.5 rounded-pill border border-green/20">
                        <CheckCircle className="w-4 h-4 text-green" />
                        <span>{t.routes.admin.approvedBadge}</span>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(item.id)}
                        disabled={isApproving}
                        isLoading={isApproving}
                      >
                        {isApproving
                          ? t.routes.admin.approvingBtn
                          : t.routes.admin.approveBtn}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer pageCode={t.footer.pageCodes.admin} />
    </div>
  );
}
