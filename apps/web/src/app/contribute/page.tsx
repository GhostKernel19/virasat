"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navbar, Footer, Badge, Button } from "@/components";
import { useLanguage } from "@/i18n";
import { supabase, PlaceRecord } from "@/lib/supabase";
import {
  UploadCloud,
  CheckCircle2,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  MapPin,
  ArrowRight,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Tag,
} from "lucide-react";

interface JobRow {
  id: string;
  item_id: string;
  stage: string;
  status: "pending" | "running" | "done" | "failed" | string;
  error?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at?: string;
}

interface HeritageItemResponse {
  id: string;
  title: string;
  place_id: string;
  status: string;
  media?: Array<{
    id: string;
    url: string;
    caption?: string;
    mime_type?: string;
  }>;
  ocr_lines?: Array<{
    text: string;
    confidence?: number;
  }>;
  translations?: Array<{
    id: string;
    text: string;
    language?: string;
    model?: string;
  }>;
  tags?: string[];
}

interface LinePair {
  original: string;
  translation: string;
  confidence?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STAGE_ORDER = ["ocr", "translate", "tag"] as const;

export default function ContributePage() {
  const { t } = useLanguage();

  // Form State
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [placesError, setPlacesError] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState("");

  // Submission & Pipeline State
  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [timeoutError, setTimeoutError] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [itemId, setItemId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [resultItem, setResultItem] = useState<HeritageItemResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load places from Supabase on mount
  useEffect(() => {
    let isMounted = true;

    async function loadPlaces() {
      try {
        setLoadingPlaces(true);
        const { data, error } = await supabase
          .from("places")
          .select("id, name, state, region")
          .order("name", { ascending: true });

        if (error) {
          throw new Error(error.message);
        }

        if (isMounted) {
          setPlaces((data as PlaceRecord[]) || []);
        }
      } catch (err: unknown) {
        console.error("Failed to load places:", err);
        if (isMounted) {
          setPlacesError("Could not load places from database. Please check connection.");
        }
      } finally {
        if (isMounted) {
          setLoadingPlaces(false);
        }
      }
    }

    loadPlaces();

    return () => {
      isMounted = false;
      stopPolling();
    };
  }, []);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      setFormError(null);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // Per-stage elapsed time calculation
  const getStageElapsed = (job?: JobRow): number => {
    if (!job || !job.started_at) return 0;
    const start = new Date(job.started_at).getTime();
    const end = job.finished_at ? new Date(job.finished_at).getTime() : Date.now();
    return Math.max(0, Math.round((end - start) / 1000));
  };

  const checkJobs = async (targetItemId: string, startTime: number) => {
    try {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);

      // Stop polling after 3 minutes (180 seconds)
      if (elapsed >= 180) {
        stopPolling();
        setTimeoutError(true);
        setIsProcessing(false);
        return;
      }

      const res = await fetch(`${API_URL}/jobs/${targetItemId}`);
      if (!res.ok) {
        return;
      }

      const jobsData: JobRow[] = await res.json();
      setJobs(jobsData);

      // Check if any stage failed
      const failedJob = jobsData.find((j) => j.status === "failed");
      if (failedJob) {
        stopPolling();
        setIsProcessing(false);
        return;
      }

      // Check if all 3 primary stages (ocr, translate, tag) are done
      const allDone =
        jobsData.length > 0 &&
        STAGE_ORDER.every((stageName) => {
          const found = jobsData.find((j) => j.stage === stageName);
          return found && found.status === "done";
        });

      if (allDone) {
        stopPolling();
        await fetchItemResult(targetItemId);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Error polling jobs:", err);
    }
  };

  const fetchItemResult = async (targetItemId: string) => {
    try {
      const res = await fetch(`${API_URL}/items/${targetItemId}`);
      if (res.ok) {
        const data = await res.json();
        setResultItem(data);
      }
    } catch (err) {
      console.error("Error fetching item result:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitError(null);
    setTimeoutError(false);
    setResultItem(null);
    setJobs([]);

    if (!imageFile) {
      setFormError("Please select an archival image file to upload.");
      return;
    }
    if (!title.trim()) {
      setFormError("Please enter a record title.");
      return;
    }
    if (!selectedPlaceId) {
      setFormError("Please select a place from the dropdown.");
      return;
    }

    setIsProcessing(true);
    setElapsedSeconds(0);
    const startTime = Date.now();

    // Start elapsed seconds timer
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
      if (elapsed >= 180) {
        stopPolling();
        setTimeoutError(true);
        setIsProcessing(false);
      }
    }, 1000);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("title", title.trim());
      formData.append("place_id", selectedPlaceId);

      const res = await fetch(`${API_URL}/items`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (${res.status})`);
      }

      const created = await res.json();
      setItemId(created.id);

      // Trigger first job check immediately
      await checkJobs(created.id, startTime);

      // Poll every 2 seconds
      pollIntervalRef.current = setInterval(() => {
        checkJobs(created.id, startTime);
      }, 2000);
    } catch (err: unknown) {
      stopPolling();
      setIsProcessing(false);
      let message =
        err instanceof Error ? err.message : "Failed to submit heritage record to API.";
      if (
        message === "Failed to fetch" ||
        message.toLowerCase().includes("failed to fetch") ||
        message.toLowerCase().includes("networkerror") ||
        message.toLowerCase().includes("load failed")
      ) {
        message = `Could not reach the API at ${API_URL}. Is the backend running?`;
      }
      setSubmitError(message);
    }
  };

  const handleReset = () => {
    stopPolling();
    setIsProcessing(false);
    setImageFile(null);
    setImagePreview(null);
    setTitle("");
    setSelectedPlaceId("");
    setFormError(null);
    setSubmitError(null);
    setTimeoutError(false);
    setJobs([]);
    setResultItem(null);
    setItemId(null);
    setElapsedSeconds(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Build paired lines: Original Devanagari | English Translation
  const buildLinePairs = (item: HeritageItemResponse): LinePair[] => {
    const ocrLines = item.ocr_lines || [];
    const translationText = item.translations?.[0]?.text || "";
    const translationLines = translationText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const maxCount = Math.max(ocrLines.length, translationLines.length);
    if (maxCount === 0) {
      return [
        {
          original: item.title || "No text extracted",
          translation: translationText || "No translation available",
        },
      ];
    }

    const pairs: LinePair[] = [];
    for (let i = 0; i < maxCount; i++) {
      pairs.push({
        original: ocrLines[i]?.text || (i === 0 ? item.title : "—"),
        translation:
          translationLines[i] || (ocrLines.length > 0 && i === 0 ? translationText : "—"),
        confidence: ocrLines[i]?.confidence,
      });
    }
    return pairs;
  };

  const getStageTitle = (key: string) => {
    switch (key) {
      case "ocr":
        return t.routes.contribute.stageOcr;
      case "translate":
        return t.routes.contribute.stageTranslate;
      case "tag":
        return t.routes.contribute.stageTag;
      default:
        return key;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-medium bg-accent-2/15 text-accent-2 border border-accent-2/40">
            <Loader2 className="w-3 h-3 animate-spin" />
            {t.routes.contribute.statusRunning}
          </span>
        );
      case "done":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-medium bg-success/15 text-success border border-success/40">
            <CheckCircle2 className="w-3 h-3" />
            {t.routes.contribute.statusDone}
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-medium bg-danger/15 text-danger border border-danger/40">
            <AlertCircle className="w-3 h-3" />
            {t.routes.contribute.statusFailed}
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-medium bg-surface-solid text-text-muted border border-border">
            <Clock className="w-3 h-3" />
            {t.routes.contribute.statusPending}
          </span>
        );
    }
  };

  const failedJob = jobs.find((j) => j.status === "failed");
  const completedStages = STAGE_ORDER.filter((stageKey) => {
    const job = jobs.find((j) => j.stage === stageKey);
    return job && job.status === "done";
  }).length;
  const progressPercent = Math.round((completedStages / STAGE_ORDER.length) * 100);

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
        {/* Header */}
        <div className="mb-8">
          <Badge variant="ocr" size="sm" className="mb-2">
            {t.routes.contribute.badge}
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-text mb-1.5">
            {t.routes.contribute.title}
          </h1>
          <p className="text-sm text-text-muted">
            {t.routes.contribute.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contribution Form */}
          <div className="lg:col-span-6 glass p-7 sm:p-8 rounded-card shadow-soft">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Image Upload Field */}
              <div>
                <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
                  {t.routes.contribute.imageLabel} <span className="text-accent">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  required
                  disabled={isProcessing}
                  onChange={handleImageChange}
                  className="w-full text-xs text-text file:mr-3 file:py-2 file:px-4 file:rounded-control file:border-0 file:text-xs file:font-semibold file:bg-accent/20 file:text-accent hover:file:bg-accent/30 file:cursor-pointer cursor-pointer border border-border rounded-control p-2.5 bg-surface-solid/80 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 ease-soft"
                />
                <p className="mt-1 text-[11px] text-text-muted">
                  {t.routes.contribute.imageHint}
                </p>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-3 p-4 bg-surface border border-border rounded-control flex flex-col items-center">
                    <div className="relative max-h-56 w-full flex items-center justify-center overflow-hidden rounded-control bg-surface-solid">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Upload preview"
                        className="max-h-56 w-auto object-contain rounded-control"
                      />
                    </div>
                    {imageFile && (
                      <span className="mt-2 text-[11px] text-text-muted font-mono truncate max-w-full">
                        {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
                  {t.routes.contribute.titleLabel} <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  disabled={isProcessing}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.routes.contribute.titlePlaceholder}
                  className="w-full px-4 py-2.5 text-sm bg-surface-solid/80 border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-text placeholder:text-text-muted disabled:opacity-50 transition-all duration-300 ease-soft"
                />
              </div>

              {/* Required Place Dropdown (No default selection) */}
              <div>
                <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
                  {t.routes.contribute.placeLabel} <span className="text-accent">*</span>
                </label>
                <select
                  required
                  value={selectedPlaceId}
                  disabled={isProcessing || loadingPlaces}
                  onChange={(e) => setSelectedPlaceId(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-control border border-border focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50 transition-all duration-300 ease-soft [color-scheme:dark]"
                  style={{
                    backgroundColor: "#2A1A10",
                    color: "#F5E6D3",
                    colorScheme: "dark",
                  }}
                >
                  <option
                    value=""
                    style={{
                      backgroundColor: "#2A1A10",
                      color: "rgba(245, 230, 211, 0.88)",
                    }}
                  >
                    {loadingPlaces
                      ? t.routes.contribute.loadingPlaces
                      : t.routes.contribute.selectPlacePrompt}
                  </option>
                  {places.map((place) => (
                    <option
                      key={place.id}
                      value={place.id}
                      style={{
                        backgroundColor: "#2A1A10",
                        color: "#F5E6D3",
                      }}
                    >
                      {place.name} {place.state ? `(${place.state})` : ""}
                    </option>
                  ))}
                </select>
                {placesError && (
                  <p className="mt-1 text-xs text-danger">{placesError}</p>
                )}
              </div>

              {/* Form Validation Error */}
              {formError && (
                <div className="p-4 bg-danger/10 border border-danger/30 rounded-control text-text text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* API Submit Error */}
              {submitError && (
                <div className="p-4 bg-danger/10 border border-danger/30 rounded-control text-text text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Submit Button (Disabled while processing) */}
              <div className="pt-2 flex items-center gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isProcessing || !imageFile || !title.trim() || !selectedPlaceId}
                  isLoading={isProcessing}
                  icon={!isProcessing ? <UploadCloud className="w-4 h-4" /> : undefined}
                >
                  {isProcessing
                    ? t.routes.contribute.processingBtn
                    : t.routes.contribute.submitBtn}
                </Button>

                {(itemId || resultItem || timeoutError || failedJob) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleReset}
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    {t.routes.contribute.submitAnother}
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Pipeline Status & Results Section */}
          <div className="lg:col-span-6 space-y-6">
            {/* Pipeline Stage Tracker */}
            <div className="glass p-7 sm:p-8 rounded-card shadow-soft">
              <div className="flex items-center justify-between pb-3 mb-5 border-b border-border">
                <h2 className="font-semibold text-sm text-text flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  {t.routes.contribute.pipelineTitle}
                </h2>
                <span className="text-xs font-mono text-text-muted">
                  Elapsed: <strong className="text-text">{elapsedSeconds}s</strong>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs font-mono text-text-muted mb-2">
                  <span className="uppercase tracking-wider text-[11px]">Pipeline Progress</span>
                  <span className="text-accent font-semibold">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-pill bg-surface border border-border overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-accent-strong transition-all duration-500 ease-soft shadow-glow"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Timeout Error */}
              {timeoutError && (
                <div className="mb-4 p-4 bg-accent-2/15 border border-accent-2/40 rounded-control text-text text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-accent-2" />
                  <div>
                    <strong>Pipeline Timeout:</strong> {t.routes.contribute.timeoutMessage}
                  </div>
                </div>
              )}

              {/* Stage Failure Banner */}
              {failedJob && (
                <div className="mb-4 p-4 bg-danger/15 border border-danger/40 rounded-control text-text text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-danger" />
                  <div>
                    <div className="font-semibold text-danger">
                      Stage &quot;{failedJob.stage}&quot; failed:
                    </div>
                    <div className="mt-0.5 break-words font-mono text-[11px] text-text-muted">
                      {failedJob.error || "Execution failed unexpectedly."}
                    </div>
                  </div>
                </div>
              )}

              {/* Stage List as Vertical Timeline */}
              <div className="relative pl-7 space-y-4 before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-border/60">
                {STAGE_ORDER.map((stageKey) => {
                  const job = jobs.find((j) => j.stage === stageKey);
                  const stageStatus = job ? job.status : "pending";
                  const stageSeconds = getStageElapsed(job);
                  const isDone = stageStatus === "done";
                  const isRunning = stageStatus === "running";
                  const isFailed = stageStatus === "failed";

                  return (
                    <div key={stageKey} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-7 top-3 flex items-center justify-center -translate-x-1/2">
                        {isDone ? (
                          <span className="w-6 h-6 rounded-full bg-surface-solid border border-accent flex items-center justify-center text-accent shadow-glow">
                            <Check className="w-3.5 h-3.5 text-accent drop-shadow-[0_0_8px_rgba(232,131,74,0.9)]" />
                          </span>
                        ) : isRunning ? (
                          <span className="w-6 h-6 rounded-full bg-surface-solid border-2 border-accent flex items-center justify-center shadow-glow animate-pulse">
                            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                          </span>
                        ) : isFailed ? (
                          <span className="w-6 h-6 rounded-full bg-surface-solid border border-danger flex items-center justify-center text-danger">
                            <AlertCircle className="w-3.5 h-3.5 text-danger" />
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-surface-solid border border-border flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-border" />
                          </span>
                        )}
                      </span>

                      {/* Stage Card */}
                      <div className="p-4 bg-surface-solid/80 rounded-control border border-border flex items-center justify-between gap-3 shadow-soft hover:border-accent/40 transition-colors">
                        <div>
                          <div className="text-xs font-medium text-text">
                            {getStageTitle(stageKey)}
                          </div>
                          <div className="text-[11px] text-text-muted font-mono mt-0.5">
                            stage: <span className="font-semibold text-text">{stageKey}</span> · elapsed: {stageSeconds}s
                          </div>
                        </div>

                        <div>{renderStatusBadge(stageStatus)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {isProcessing && !timeoutError && (
                <p className="mt-4 text-center text-xs text-text-muted animate-pulse">
                  Polling pipeline every 2s... (auto-timeout after 3m)
                </p>
              )}
            </div>

            {/* Results Display */}
            {resultItem && (
              <div className="glass p-7 sm:p-8 rounded-card shadow-soft space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h2 className="font-semibold text-sm text-success flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {t.routes.contribute.resultsTitle}
                  </h2>
                  <Link
                    href={`/place/${resultItem.place_id || selectedPlaceId}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-strong transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {t.routes.contribute.viewPlace}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Uploaded Image */}
                <div>
                  <span className="block text-xs font-semibold text-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-text-muted" />
                    Uploaded Archival Image
                  </span>
                  <div className="relative max-h-64 w-full flex items-center justify-center overflow-hidden rounded-control border border-border bg-surface-solid p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resultItem.media?.[0]?.url || imagePreview || ""}
                      alt={resultItem.title || "Uploaded image"}
                      className="max-h-60 w-auto object-contain rounded-control"
                    />
                  </div>
                </div>

                {/* Generated Tags */}
                <div>
                  <span className="block text-xs font-semibold text-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-text-muted" />
                    {t.routes.contribute.tagsLabel}
                  </span>
                  {resultItem.tags && resultItem.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {resultItem.tags.map((tag, idx) => (
                        <Badge key={idx} variant="terracotta" size="sm">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted italic">No tags assigned</p>
                  )}
                </div>

                {/* Original Devanagari | English Translation Table */}
                <div>
                  <span className="block text-xs font-semibold text-text uppercase tracking-wider mb-2">
                    Transcription & Translation
                  </span>
                  <div className="overflow-x-auto rounded-control border border-border bg-surface-solid/80 shadow-soft">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-surface/80 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          <th className="py-2.5 px-3.5 w-1/2">
                            {t.routes.contribute.devanagariHeader}
                          </th>
                          <th className="py-2.5 px-3.5 w-1/2">
                            {t.routes.contribute.translationHeader}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 text-sm">
                        {buildLinePairs(resultItem).map((pair, idx) => (
                          <tr
                            key={idx}
                            className="group hover:bg-accent/10 transition-colors border-l-2 border-transparent hover:border-accent"
                          >
                            <td className="py-3 px-3.5 font-devanagari text-text font-medium leading-relaxed align-top group-hover:text-accent transition-colors">
                              {pair.original}
                              {pair.confidence !== undefined && (
                                <span className="inline-block ml-2 text-[10px] font-mono px-2 py-0.5 rounded-pill bg-surface text-accent-2 border border-border">
                                  conf: {(pair.confidence * 100).toFixed(0)}%
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3.5 font-sans text-xs text-text/85 leading-relaxed align-top">
                              {pair.translation}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* View Place Link CTA */}
                <div className="pt-2 flex justify-end">
                  <Link href={`/place/${resultItem.place_id || selectedPlaceId}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<MapPin className="w-3.5 h-3.5" />}
                      iconRight={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {t.routes.contribute.viewPlace}
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer pageCode={t.footer.pageCodes.contribute} />
    </div>
  );
}
