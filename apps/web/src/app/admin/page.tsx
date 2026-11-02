"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar, Footer, Badge, Button, Chip } from "@/components";
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

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-5 sm:px-8 lg:px-10 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-pill bg-accent" />
              <p className="text-[11px] font-bold tracking-widest text-accent uppercase">
                {t.routes.admin.badge}
              </p>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-text">
              {t.routes.admin.title}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-text-muted">
              {t.routes.admin.subtitle}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchItems(activeTab)}
            icon={<RefreshCw className="w-3.5 h-3.5 text-accent" />}
          >
            Refresh
          </Button>
        </div>

        {/* Filter Tabs using Chip */}
        <div className="flex items-center gap-2 border-b border-border pb-4 mb-6">
          <Chip
            active={activeTab === "in_review"}
            onClick={() => setActiveTab("in_review")}
          >
            {t.routes.admin.filterInReview}
          </Chip>
          <Chip
            active={activeTab === "published"}
            onClick={() => setActiveTab("published")}
          >
            {t.routes.admin.filterPublished}
          </Chip>
          <Chip
            active={activeTab === "all"}
            onClick={() => setActiveTab("all")}
          >
            {t.routes.admin.filterAll}
          </Chip>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-5 rounded-card border border-danger/30 bg-danger/10 text-text mb-6 flex items-start gap-3 shadow-soft">
            <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-danger">API Connection Error</p>
              <p className="text-text/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-text-muted">
            <Loader2 className="w-8 h-8 animate-spin text-accent mb-2" />
            <p className="text-xs sm:text-sm">{t.routes.admin.loading}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <div className="py-16 text-center max-w-md mx-auto p-8 glass rounded-card shadow-soft">
            <ShieldCheck className="w-10 h-10 mx-auto text-success mb-3" />
            <h3 className="font-serif text-lg font-medium text-text mb-1">
              {t.routes.admin.noItems}
            </h3>
            <p className="text-xs text-text-muted">
              All items in this status have been reviewed.
            </p>
          </div>
        )}

        {/* Simple Glass Table */}
        {!loading && items.length > 0 && (
          <div className="glass rounded-card overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface/80 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    <th className="py-3.5 px-4 sm:px-6">Record / Media</th>
                    <th className="py-3.5 px-4">Place</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">Contributor & Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {items.map((item) => {
                    const primaryMedia = item.media?.[0];
                    const ocr = primaryMedia?.ocr_texts?.[0];
                    const translation = ocr?.translations?.[0]?.text;
                    const isApproved = item.status === "published";
                    const isApproving = approvingId === item.id;

                    return (
                      <tr
                        key={item.id}
                        className="group hover:bg-accent/5 transition-colors border-l-2 border-transparent hover:border-accent"
                      >
                        {/* 1. Record / Media */}
                        <td className="py-4 px-4 sm:px-6 align-top">
                          <div className="flex gap-3.5 items-start">
                            {primaryMedia?.url && (
                              <div className="w-16 h-14 sm:w-20 sm:h-16 shrink-0 rounded-control overflow-hidden border border-border bg-surface-solid shadow-soft">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={primaryMedia.url}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className="font-serif text-sm sm:text-base font-medium text-text group-hover:text-accent transition-colors">
                                {item.title.replace(/^\[Illustrative\]\s*/i, "")}
                              </h3>
                              {ocr?.original_text && (
                                <p className="font-devanagari text-xs text-text-muted line-clamp-1 mt-1">
                                  {ocr.original_text}
                                </p>
                              )}
                              {translation && (
                                <p className="text-[11px] text-text-muted/80 italic line-clamp-1 mt-0.5">
                                  {translation}
                                </p>
                              )}
                              <div className="sm:hidden text-[11px] text-text-muted mt-1.5 flex items-center gap-2">
                                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                {item.contributor && (
                                  <span>• By {item.contributor.replace(/^\[Illustrative\]\s*/i, "")}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Place */}
                        <td className="py-4 px-4 align-top text-xs">
                          {item.places ? (
                            <div>
                              <div className="flex items-center gap-1 font-medium text-text">
                                <MapPin className="w-3 h-3 text-accent shrink-0" />
                                <span>{item.places.name}</span>
                              </div>
                              <span className="text-[11px] text-text-muted block pl-4">
                                {item.places.state}
                              </span>
                              {item.place_id && (
                                <Link
                                  href={`/place/${item.place_id}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline mt-1 pl-4"
                                >
                                  <span>{t.routes.admin.viewPlace}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                              )}
                            </div>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>

                        {/* 3. Contributor & Date */}
                        <td className="py-4 px-4 align-top text-xs text-text-muted hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-text-muted/70" />
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                          {item.contributor && (
                            <span className="text-[11px] text-text-muted/70 block mt-1 truncate max-w-[140px]">
                              {item.contributor.replace(/^\[Illustrative\]\s*/i, "")}
                            </span>
                          )}
                        </td>

                        {/* 4. Status */}
                        <td className="py-4 px-4 align-top">
                          <Badge
                            variant={isApproved ? "ocr" : "gold"}
                            size="sm"
                          >
                            {item.status}
                          </Badge>
                        </td>

                        {/* 5. Actions */}
                        <td className="py-4 px-4 sm:px-6 align-top text-right">
                          {isApproved ? (
                            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-success bg-success/10 px-3 py-1 rounded-pill border border-success/30">
                              <CheckCircle className="w-3.5 h-3.5 text-success" />
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer pageCode={t.footer.pageCodes.admin} />
    </div>
  );
}
