"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { VideoRecognitionRun } from "@/lib/ai/video-recognition";

type ApiReply = { ok: true; result: VideoRecognitionRun } | { ok: false; reason: string; message?: string };
type ProductImageReply = { message?: string } & ({ ok: true; imageDataUrl: string; provider: "codex_cli" | "openai_api" } | { ok: false; reason: string });
const MAX_BYTES = 250 * 1024 * 1024;
const MAX_VIDEOS = 5;

type VideoEntry = { id: string; file: File | null; description: string };
type VideoOutcome = { id: string; fileName: string; result?: VideoRecognitionRun; error?: string };

export function VideoLab() {
  const t = useTranslations("admin.videoLab");
  const fileInputs = useRef(new Map<string, HTMLInputElement>());
  const candidateAnchor = useRef<HTMLElement | null>(null);
  const [videos, setVideos] = useState<VideoEntry[]>([{ id: "video-1", file: null, description: "" }]);
  const [customerFacts, setCustomerFacts] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [outcomes, setOutcomes] = useState<VideoOutcome[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [optimizedImages, setOptimizedImages] = useState<Record<string, string>>({});
  const [optimizedImageProviders, setOptimizedImageProviders] = useState<Record<string, "codex_cli" | "openai_api">>({});
  const [imageStatuses, setImageStatuses] = useState<Record<string, "generating" | "failed" | "done">>({});
  const [imageRetryAttempts, setImageRetryAttempts] = useState<Record<string, number>>({});
  const [autoOptimizeKeys, setAutoOptimizeKeys] = useState<Record<string, boolean>>({});
  const [optimizationErrors, setOptimizationErrors] = useState<Record<string, string>>({});
  const [optimizingKey, setOptimizingKey] = useState<string | null>(null);
  const [imageToPreview, setImageToPreview] = useState<{ src: string; alt: string; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!running && outcomes.some((outcome) => outcome.result)) {
      requestAnimationFrame(() => candidateAnchor.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, [outcomes, running]);

  useEffect(() => {
    if (!imageToPreview) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setImageToPreview(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [imageToPreview]);

  function addFiles(slotId: string, incoming: File[]) {
    const files = incoming;
    if (!files.length) return;
    setError("");
    setOutcomes([]);
    setOptimizedImages({});
    setOptimizedImageProviders({});
    setImageStatuses({});
    setImageRetryAttempts({});
    setAutoOptimizeKeys({});
    setOptimizationErrors({});
    setCompletedCount(0);
    const slotIndex = videos.findIndex((video) => video.id === slotId);
    const roomForExtras = Math.max(0, MAX_VIDEOS - (videos.length - (slotIndex >= 0 ? 1 : 0)) - 1);
    const accepted = incoming.slice(0, roomForExtras + 1);
    if (accepted.length < incoming.length) setError(t("errors.maxVideos"));
    const extraFiles = accepted.slice(slotIndex >= 0 ? 1 : 0);
    const next = [...videos];
    if (slotIndex >= 0) next[slotIndex] = { ...next[slotIndex], file: accepted[0] };
    else if (accepted.length) next.push({ id: crypto.randomUUID(), file: accepted[0], description: "" });
    const additional = extraFiles.map((file) => ({ id: crypto.randomUUID(), file, description: "" }));
    setVideos([...next, ...additional]);
  }

  function updateDescription(id: string, description: string) {
    setVideos((current) => current.map((video) => video.id === id ? { ...video, description } : video));
  }

  async function generateProductImage(key: string, productName: string, dataUrl: string) {
    if (optimizingKey) return;
    setOptimizingKey(key);
    setImageStatuses((current) => ({ ...current, [key]: "generating" }));
    setImageRetryAttempts((current) => ({ ...current, [key]: 0 }));
    setOptimizationErrors((current) => ({ ...current, [key]: "" }));
    try {
      const image = await fetch(dataUrl).then((response) => response.blob());
      const retryableReasons = new Set(["codex_no_image"]);
      for (let attempt = 0; attempt < 3; attempt++) {
        setImageRetryAttempts((current) => ({ ...current, [key]: attempt }));
        const form = new FormData();
        form.set("image", image, `${key.replace(/[^a-z0-9_-]/gi, "_")}.jpg`);
        form.set("productName", productName);
        try {
          const response = await fetch("/api/admin/video-product-image", { method: "POST", body: form, cache: "no-store" });
          const body = await response.json() as ProductImageReply;
          if (response.ok && body.ok) {
            setOptimizedImages((current) => ({ ...current, [key]: body.imageDataUrl }));
            setOptimizedImageProviders((current) => ({ ...current, [key]: body.provider }));
            setImageStatuses((current) => ({ ...current, [key]: "done" }));
            return;
          }
          const reason = body.ok ? "imageEditFailed" : body.reason;
          if (attempt < 2 && retryableReasons.has(reason)) continue;
          const errorText = t(`errors.${reason}` as never);
          setOptimizationErrors((current) => ({ ...current, [key]: body.message ? `${errorText} (${body.message})` : errorText }));
          setImageStatuses((current) => ({ ...current, [key]: "failed" }));
          return;
        } catch {
          setOptimizationErrors((current) => ({ ...current, [key]: t("errors.imageEditFailed") }));
          setImageStatuses((current) => ({ ...current, [key]: "failed" }));
          return;
        }
      }
    } catch {
      setOptimizationErrors((current) => ({ ...current, [key]: t("errors.imageEditFailed") }));
      setImageStatuses((current) => ({ ...current, [key]: "failed" }));
    } finally {
      setOptimizingKey(null);
    }
  }

  async function optimizeCandidate(outcomeId: string, candidateId: string, productName: string, frameNumber: number) {
    const run = outcomes.find((outcome) => outcome.id === outcomeId)?.result;
    const preview = run?.framePreviews.find((frame) => frame.number === frameNumber);
    if (!preview) return;
    await generateProductImage(`${outcomeId}:${candidateId}`, productName, preview.dataUrl);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setOutcomes([]);
    setOptimizedImages({});
    setOptimizedImageProviders({});
    setImageStatuses({});
    setImageRetryAttempts({});
    setAutoOptimizeKeys({});
    setOptimizationErrors({});
    setCompletedCount(0);
    if (!videos.length) { setError(t("errors.videoRequired")); return; }
    const incomplete = videos.find((video) => !video.file);
    if (incomplete) { setError(t("errors.videoRequired")); return; }
    const readyVideos = videos as Array<VideoEntry & { file: File }>;
    setRunning(true);
    try {
      const nextOutcomes: VideoOutcome[] = [];
      for (let index = 0; index < readyVideos.length; index++) {
        const video = readyVideos[index];
        try {
          if (video.file.size > MAX_BYTES) {
            nextOutcomes.push({ id: video.id, fileName: video.file.name, error: t("errors.tooLarge", { file: video.file.name }) });
            setOutcomes([...nextOutcomes]);
            setCompletedCount(index + 1);
            continue;
          }
          const form = new FormData();
          form.set("video", video.file);
          form.set("description", video.description);
          form.set("customerFacts", customerFacts);
          const response = await fetch("/api/admin/video-recognition", { method: "POST", body: form, cache: "no-store" });
          const body = await response.json() as ApiReply;
          if (!response.ok || !body.ok) {
            const reason = body.ok ? "processingFailed" : body.reason;
            nextOutcomes.push({ id: video.id, fileName: video.file.name, error: t(`errors.${reason}` as never) });
          } else {
            nextOutcomes.push({ id: video.id, fileName: video.file.name, result: body.result });
            setOutcomes([...nextOutcomes]);
            const primaryProduct = [...body.result.result.candidateGroups]
              .filter((candidate) => candidate.contentPotential === "single_product")
              .sort((a, b) => Number(b.individuallyProminent) - Number(a.individuallyProminent) || ({ high: 0, medium: 1, low: 2 }[a.confidence] - { high: 0, medium: 1, low: 2 }[b.confidence]))[0];
            if (primaryProduct) {
              const frameNumber = primaryProduct.sampledFrameNumbers[0];
              const preview = body.result.framePreviews.find((frame) => frame.number === frameNumber);
              if (preview) {
                const imageKey = `${video.id}:${primaryProduct.candidateId}`;
                setAutoOptimizeKeys((current) => ({ ...current, [imageKey]: true }));
                await generateProductImage(imageKey, primaryProduct.displayName, preview.dataUrl);
              }
            }
          }
        } catch {
          nextOutcomes.push({ id: video.id, fileName: video.file.name, error: t("errors.network") });
        }
        setOutcomes([...nextOutcomes]);
        setCompletedCount(index + 1);
      }
    } catch {
      setError(t("errors.network"));
    } finally {
      setRunning(false);
    }
  }

  const confidenceLabel = (value: "high" | "medium" | "low") => t(`confidence.${value}` as never);
  const potentialLabel = (value: VideoRecognitionRun["result"]["candidateGroups"][number]["contentPotential"]) => t(`potential.${value}` as never);

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={submit} className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
        <div className="grid gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3">
              <div><p className="text-sm font-medium">{t("videoLabel")}</p><p className="mt-1 text-xs text-muted-foreground">{t("videoHelp")}</p></div>
              <span className="shrink-0 text-xs text-muted-foreground">{videos.length}/{MAX_VIDEOS}</span>
            </div>
            {videos.map((video, index) => (
              <div key={video.id} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] sm:p-4">
                <div className="flex min-w-0 flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{t("videoNumber", { number: index + 1 })}</span>
                  <button type="button" disabled={running} onClick={() => fileInputs.current.get(video.id)?.click()} className="inline-flex min-h-10 items-center justify-center self-start rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">
                    {video.file ? t("changeVideo") : t("selectVideo")}
                  </button>
                  <input
                    ref={(node) => { if (node) fileInputs.current.set(video.id, node); else fileInputs.current.delete(video.id); }}
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.m4v,.webm"
                    multiple={index === 0}
                    disabled={running}
                    onChange={(event) => { const selected = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ""; addFiles(video.id, selected); }}
                    className="sr-only"
                  />
                  {video.file ? <span className="truncate text-xs text-muted-foreground" title={video.file.name}>{video.file.name} · {(video.file.size / 1024 / 1024).toFixed(1)} MB</span> : <span className="text-xs text-muted-foreground">{t("chooseVideoHelp")}</span>}
                  {!running && <button type="button" onClick={() => { setVideos((current) => current.filter((item) => item.id !== video.id)); setOutcomes([]); setError(""); }} className="self-start text-xs text-muted-foreground underline">{t("removeVideo")}</button>}
                </div>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  {t("descriptionLabel")}
                  <textarea value={video.description} onChange={(event) => updateDescription(video.id, event.target.value)} maxLength={1000} rows={3} disabled={running} placeholder={t("descriptionPlaceholder")} className="h-[250px] w-full resize-y rounded-xl border bg-background px-3 py-2.5 font-normal" />
                  <span className="font-normal text-muted-foreground">{t("unverifiedHint")}</span>
                </label>
              </div>
            ))}
            {videos.length < MAX_VIDEOS && <button type="button" disabled={running} onClick={() => setVideos((current) => [...current, { id: crypto.randomUUID(), file: null, description: "" }])} className="self-start rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50">{t("addVideo")}</button>}
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium">
            {t("factsLabel")}
            <textarea value={customerFacts} onChange={(event) => setCustomerFacts(event.target.value)} maxLength={6000} rows={3} disabled={running} placeholder={t("factsPlaceholder")} className="rounded-xl border bg-background px-3 py-2.5 font-normal" />
            <span className="font-normal text-muted-foreground">{t("factsHelp")}</span>
          </label>

          {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={running} className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-60">
              {running ? t("running") : t("start")}
            </button>
          </div>
          {running && <p role="status" className="text-sm text-muted-foreground">{t("processingProgress", { completed: completedCount, total: videos.length })} {t("processingHint")}</p>}
        </div>
      </form>

      {outcomes.length > 0 && (
        <section className="flex flex-col gap-5" aria-live="polite">
          {outcomes.map((outcome) => <div key={outcome.id} className="flex flex-col gap-5">
          {outcome.error && <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"><span className="font-medium">{outcome.fileName}: </span>{outcome.error}</p>}
          {outcome.result && (() => { const run = outcome.result; return <>
          <div className="flex flex-col gap-5">
            <article ref={outcomes.findIndex((item) => item.result) === outcomes.indexOf(outcome) ? candidateAnchor : undefined} className="scroll-mt-6 rounded-2xl border bg-card p-5 sm:p-7">
              <h3 className="font-semibold">{t("candidateTitle", { count: run.result.candidateGroups.length })}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("candidateNextStep")}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {run.result.candidateGroups.map((candidate) => {
                  const frameNumber = candidate.sampledFrameNumbers[0];
                  const preview = run.framePreviews.find((item) => item.number === frameNumber);
                  const imageKey = `${outcome.id}:${candidate.candidateId}`;
                  const optimizedImage = optimizedImages[imageKey];
                  return <li key={candidate.candidateId} className="grid gap-4 rounded-xl border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:p-4">
                    <div className="min-w-0">
                      <p className="mb-2 text-sm font-semibold">{t("originalFrames")}</p>
                      {preview ? <figure className="overflow-hidden rounded-lg border bg-white">
                        <button type="button" onClick={() => setImageToPreview({ src: preview.dataUrl, alt: t("sampleFrameAlt", { number: preview.number }), width: run.video.width, height: run.video.height })} className="flex min-h-64 w-full items-center justify-center bg-white p-2" aria-label={t("openImagePreview")}>
                          <Image src={preview.dataUrl} width={run.video.width} height={run.video.height} unoptimized alt={t("sampleFrameAlt", { number: preview.number })} className="max-h-80 w-auto max-w-full object-contain" />
                        </button>
                        <figcaption className="border-t px-3 py-2 text-center text-xs text-muted-foreground">{t("clickToEnlarge")}</figcaption>
                      </figure> : <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">{t("noPreview")}</div>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{t("recognizedProduct")}</p>
                      <h4 className="mt-1 text-lg font-semibold">{candidate.displayName}</h4>
                      <p className="mt-2 text-sm text-muted-foreground">{candidate.reason}</p>
                      <p className="mt-3 text-xs text-muted-foreground">{confidenceLabel(candidate.confidence)} · {potentialLabel(candidate.contentPotential)}</p>
                      {!optimizedImage && <button type="button" disabled={optimizingKey !== null || running || !preview} onClick={() => void optimizeCandidate(outcome.id, candidate.candidateId, candidate.displayName, frameNumber)} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-60">{imageStatuses[imageKey] === "generating" ? imageRetryAttempts[imageKey] ? t("retryingProductImage", { attempt: imageRetryAttempts[imageKey] }) : t(autoOptimizeKeys[imageKey] ? "autoOptimizingProduct" : "optimizingProduct") : t("optimizeProductImage")}</button>}
                      {optimizationErrors[imageKey] && <p role="alert" className="mt-2 text-xs text-destructive">{optimizationErrors[imageKey]}</p>}
                      {optimizedImage && <figure className="mt-4 overflow-hidden rounded-lg border bg-white">
                        <p className="border-b px-3 py-2 text-sm font-semibold">{t("optimizedProductImage")}{optimizedImageProviders[imageKey] ? ` · ${t(optimizedImageProviders[imageKey] === "codex_cli" ? "localCodexImage" : "cloudOpenAiImage")}` : ""}</p>
                        <button type="button" onClick={() => setImageToPreview({ src: optimizedImage, alt: t("optimizedProductAlt", { product: candidate.displayName }), width: 1024, height: 1024 })} className="flex w-full items-center justify-center bg-white p-2" aria-label={t("openImagePreview")}>
                          <Image src={optimizedImage} width={1024} height={1024} unoptimized alt={t("optimizedProductAlt", { product: candidate.displayName })} className="max-h-80 w-full object-contain" />
                        </button>
                        <figcaption className="border-t px-3 py-2 text-center text-xs text-muted-foreground">{t("clickToEnlarge")}</figcaption>
                        <div className="grid grid-cols-2 gap-2 border-t p-3">
                          <button type="button" disabled={optimizingKey !== null || running || !preview} onClick={() => void optimizeCandidate(outcome.id, candidate.candidateId, candidate.displayName, frameNumber)} className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-60">{optimizingKey === imageKey ? t("optimizingProduct") : t("regenerateProductImage")}</button>
                          <a href={optimizedImage} download={`${candidate.displayName}-product.png`} className="inline-flex h-11 w-full items-center justify-center rounded-lg border px-3 text-center text-sm font-medium hover:bg-muted">{t("downloadProductImage")}</a>
                        </div>
                      </figure>}
                    </div>
                  </li>;
                })}
              </ul>
              {run.result.candidateGroups.length === 0 && <p className="mt-3 text-sm text-muted-foreground">{t("noCandidates")}</p>}
            </article>

          </div>

          {run.result.unverifiedClaims.length > 0 && <article className="rounded-2xl border bg-card p-5"><h3 className="font-semibold">{t("unverifiedTitle")}</h3><p className="mt-1 text-xs text-muted-foreground">{t("unverifiedHelp")}</p><ul className="mt-3 flex flex-col gap-2">{run.result.unverifiedClaims.map((item, index) => <li key={`${item.kind}-${index}`} className="rounded-xl bg-muted/40 p-3 text-sm"><span className="font-medium">{item.kind}</span><p className="mt-1 text-muted-foreground">{item.claim}</p><p className="mt-1 text-xs text-muted-foreground">{item.source}</p></li>)}</ul></article>}

          {run.transcript.status === "transcribed" && run.transcript.text && <details className="rounded-2xl border bg-card p-5"><summary className="cursor-pointer font-semibold">{t("transcriptTitle", { cost: run.transcript.estimatedUsd.toFixed(5) })}</summary><p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{run.transcript.text}</p></details>}
          {run.transcript.status === "no_audio" && <p className="text-xs text-muted-foreground">{t("noAudio")}</p>}
          {run.transcript.status === "skipped" && <p className="text-xs text-muted-foreground">{t("localTranscriptSkipped")}</p>}
          </>; })()}
          </div>)}
        </section>
      )}

      {imageToPreview && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <button type="button" className="absolute inset-0 bg-black/85" onClick={() => setImageToPreview(null)} aria-label={t("closeImagePreview")} />
        <div role="dialog" aria-modal="true" aria-label={imageToPreview.alt} className="relative z-10 flex max-h-full max-w-full flex-col items-end gap-2">
          <button type="button" onClick={() => setImageToPreview(null)} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black">{t("closeImagePreview")}</button>
          <div className="flex max-h-[85vh] max-w-[92vw] items-center justify-center overflow-hidden rounded-lg bg-white p-2">
            <Image src={imageToPreview.src} width={imageToPreview.width} height={imageToPreview.height} unoptimized alt={imageToPreview.alt} className="max-h-[82vh] max-w-[90vw] object-contain" />
          </div>
        </div>
      </div>}
    </div>
  );
}
