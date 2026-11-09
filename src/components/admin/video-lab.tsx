"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { MediaRecognitionRun, VideoRecognitionRun } from "@/lib/ai/video-recognition";

type ApiReply = { ok: true; result: MediaRecognitionRun } | { ok: false; reason: string; message?: string };
type BatchAsset = { id: string; file: File; status: "queued" | "processing" | "done" | "failed"; error?: string; run?: MediaRecognitionRun };
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const MAX_CLOUD_VIDEO_BYTES = 30 * 1024 * 1024;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export function VideoLab({ cloudRunUploadLimit = false }: { cloudRunUploadLimit?: boolean }) {
  const t = useTranslations("admin.videoLab");
  const [assets, setAssets] = useState<BatchAsset[]>([]);
  const [description, setDescription] = useState("");
  const [customerFacts, setCustomerFacts] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const pending = assets.filter((asset) => asset.status !== "done");
    if (!pending.length) { setError(t("errors.videoRequired")); return; }
    const videoLimit = cloudRunUploadLimit ? MAX_CLOUD_VIDEO_BYTES : MAX_VIDEO_BYTES;
    const oversized = pending.find(({ file }) => file.size > (file.type.startsWith("image/") ? MAX_IMAGE_BYTES : videoLimit));
    if (oversized) { setError(t(oversized.file.type.startsWith("image/") ? "errors.imageTooLarge" : cloudRunUploadLimit ? "errors.videoTooLargeCloud" : "errors.tooLarge")); return; }
    setRunning(true);
    try {
      for (const asset of pending) {
        setAssets((current) => current.map((item) => item.id === asset.id ? { ...item, status: "processing", error: undefined } : item));
        try {
          const form = new FormData();
          form.set("file", asset.file);
          form.set("description", description);
          form.set("customerFacts", customerFacts);
          const response = await fetch("/api/admin/video-recognition", { method: "POST", body: form, cache: "no-store" });
          const body = await response.json() as ApiReply;
          if (!response.ok || !body.ok) {
            const reason = body.ok ? "processingFailed" : body.reason;
            const message = t(`errors.${reason}` as never);
            setAssets((current) => current.map((item) => item.id === asset.id ? { ...item, status: "failed", error: message } : item));
            continue;
          }
          setAssets((current) => current.map((item) => item.id === asset.id ? { ...item, status: "done", run: body.result } : item));
        } catch {
          setAssets((current) => current.map((item) => item.id === asset.id ? { ...item, status: "failed", error: t("errors.network") } : item));
        }
      }
    } finally {
      setRunning(false);
    }
  }

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    const incoming = Array.from(selected);
    const supported = incoming.filter((file) => file.type.startsWith("video/") || file.type.startsWith("image/"));
    setError(supported.length !== incoming.length ? t("errors.unsupportedFormat") : "");
    setAssets((current) => {
      const existing = new Set(current.map(({ file }) => `${file.name}:${file.size}:${file.lastModified}`));
      return [...current, ...supported.filter((file) => !existing.has(`${file.name}:${file.size}:${file.lastModified}`)).map((file) => ({ id: crypto.randomUUID(), file, status: "queued" as const }))];
    });
  }

  function removeFile(id: string) {
    setAssets((current) => current.filter((asset) => asset.id !== id));
  }

  const confidenceLabel = (value: "high" | "medium" | "low") => t(`confidence.${value}` as never);
  const themeLabel = (value: VideoRecognitionRun["result"]["themeCategory"]) => t(`theme.${value}` as never);
  const potentialLabel = (value: VideoRecognitionRun["result"]["candidateGroups"][number]["contentPotential"]) => t(`potential.${value}` as never);
  const statusLabel = (value: VideoRecognitionRun["result"]["materialAssessment"]["status"]) => t(`materialStatus.${value}` as never);

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={submit} className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
        <div className="grid gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium">
            {t("mediaLabel")}
            <input
              type="file"
              multiple
              accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.m4v,.webm,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              disabled={running}
              onChange={(event) => { addFiles(event.target.files); event.currentTarget.value = ""; }}
              className="rounded-xl border bg-background px-3 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm"
            />
            <span className="font-normal text-muted-foreground">{t("mediaHelp")}</span>
            {cloudRunUploadLimit && <span className="font-normal text-amber-700">{t("uploadLimitNotice")}</span>}
          </label>

          {assets.length > 0 && <ul className="flex flex-col gap-2" aria-label={t("batchTitle")}>
            {assets.map((asset) => <li key={asset.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate"><span className="mr-2 rounded-md bg-muted px-2 py-1 text-xs">{asset.file.type.startsWith("image/") ? t("mediaType.image") : t("mediaType.video")}</span>{asset.file.name} <span className="text-xs text-muted-foreground">{(asset.file.size / 1024 / 1024).toFixed(1)} MB</span></span>
              <span className={`text-xs ${asset.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>{asset.error ?? t(`assetStatus.${asset.status}` as never)}</span>
              {!running && <button type="button" onClick={() => removeFile(asset.id)} className="text-xs text-muted-foreground underline">{t("remove")}</button>}
            </li>)}
          </ul>}

          <label className="flex flex-col gap-2 text-sm font-medium">
            {t("descriptionLabel")}
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={2} disabled={running} placeholder={t("descriptionPlaceholder")} className="rounded-xl border bg-background px-3 py-2.5 font-normal" />
            <span className="font-normal text-muted-foreground">{t("unverifiedHint")}</span>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            {t("factsLabel")}
            <textarea value={customerFacts} onChange={(event) => setCustomerFacts(event.target.value)} maxLength={6000} rows={3} disabled={running} placeholder={t("factsPlaceholder")} className="rounded-xl border bg-background px-3 py-2.5 font-normal" />
            <span className="font-normal text-muted-foreground">{t("factsHelp")}</span>
          </label>

          {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={running || assets.every((asset) => asset.status === "done")} className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-60">
              {running ? t("running") : t("startBatch", { count: assets.filter((asset) => asset.status !== "done").length })}
            </button>
          </div>
          {running && <p role="status" className="text-sm text-muted-foreground">{t("processingHint")}</p>}
        </div>
      </form>

      {assets.filter((asset) => asset.run).map((asset) => {
        const run = asset.run!;
        return <section key={asset.id} className="flex flex-col gap-5" aria-live="polite">
          <div className="rounded-2xl border bg-card p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("resultEyebrow")} · {asset.file.name}</p>
                <h2 className="mt-2 text-xl font-semibold">{themeLabel(run.result.themeCategory)}</h2>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{run.result.overview}</p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{statusLabel(run.result.materialAssessment.status)}</span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {run.mediaType === "video" && <div className="rounded-xl bg-muted/50 p-3"><dt className="text-xs text-muted-foreground">{t("metricDuration")}</dt><dd className="mt-1 font-semibold">{run.video.durationSeconds.toFixed(1)} s</dd></div>}
              <div className="rounded-xl bg-muted/50 p-3"><dt className="text-xs text-muted-foreground">{t("metricFrames")}</dt><dd className="mt-1 font-semibold">{run.sample.totalFrames} ({run.sample.initialFrames}+{run.sample.supplementalFrames})</dd></div>
              <div className="rounded-xl bg-muted/50 p-3"><dt className="text-xs text-muted-foreground">{t("metricTime")}</dt><dd className="mt-1 font-semibold">{(run.elapsedMs / 1000).toFixed(1)} s</dd></div>
              <div className="rounded-xl bg-muted/50 p-3"><dt className="text-xs text-muted-foreground">{t("metricCost")}</dt><dd className="mt-1 font-semibold">${run.usage.estimatedUsd.toFixed(5)} USD</dd></div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">{t("usageDetails", { model: run.model, input: run.usage.inputTokens, output: run.usage.outputTokens })}</p>
            {run.warnings.map((warning) => <p key={warning} className="mt-3 text-sm text-amber-700">{warning}</p>)}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border bg-card p-5">
              <h3 className="font-semibold">{t("themesTitle")}</h3>
              <p className="mt-2 text-xs text-muted-foreground">{t("coverage", { confidence: confidenceLabel(run.result.coverageConfidence) })} — {run.result.coverageNote}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {run.result.themes.map((theme, index) => <li key={`${theme.category}-${index}`} className="rounded-xl bg-muted/40 p-3"><div className="flex items-center justify-between gap-2 text-sm font-medium"><span>{theme.category}</span><span className="text-xs text-muted-foreground">{confidenceLabel(theme.confidence)}</span></div><p className="mt-1 text-sm text-muted-foreground">{theme.summary}</p></li>)}
              </ul>
            </article>

            <article className="rounded-2xl border bg-card p-5">
              <h3 className="font-semibold">{t("candidateTitle", { count: run.result.candidateGroups.length })}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {run.result.candidateGroups.map((candidate) => <li key={candidate.candidateId} className="rounded-xl bg-muted/40 p-3"><div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium"><span>{candidate.candidateId}</span><span className="text-xs text-muted-foreground">{confidenceLabel(candidate.confidence)} · {potentialLabel(candidate.contentPotential)}</span></div><p className="mt-1 text-sm text-muted-foreground">{candidate.reason}</p><p className="mt-2 text-xs text-muted-foreground">{t("candidateProminence", { prominent: candidate.individuallyProminent ? t("yes") : t("no"), frames: candidate.sampledFrameNumbers.length })}</p></li>)}
              </ul>
              {run.result.candidateGroups.length === 0 && <p className="mt-3 text-sm text-muted-foreground">{t("noCandidates")}</p>}
            </article>

            <article className="rounded-2xl border bg-card p-5">
              <h3 className="font-semibold">{t("opportunitiesTitle")}</h3>
              <ul className="mt-3 flex flex-col gap-2">{run.result.opportunities.map((item, index) => <li key={`${item.type}-${index}`} className="rounded-xl bg-muted/40 p-3 text-sm"><span className="font-medium">{item.type}</span><p className="mt-1 text-muted-foreground">{item.summary}</p><p className="mt-1 text-xs text-muted-foreground">{confidenceLabel(item.confidence)}{item.needsCustomerProductList ? ` · ${t("needsProductList")}` : ""}</p></li>)}</ul>
            </article>

            <article className="rounded-2xl border bg-card p-5">
              <h3 className="font-semibold">{t("relationshipsTitle")}</h3>
              <ul className="mt-3 flex flex-col gap-2">{run.result.relationships.map((item, index) => <li key={`${item.type}-${index}`} className="rounded-xl bg-muted/40 p-3 text-sm"><p className="font-medium">{item.type}</p><p className="mt-1 text-muted-foreground">{item.summary}</p><p className="mt-1 text-xs text-muted-foreground">{item.candidateIds.join(", ")}</p></li>)}</ul>
              {run.result.relationships.length === 0 && <p className="mt-3 text-sm text-muted-foreground">{t("noRelationships")}</p>}
            </article>
          </div>

          {run.result.materialAssessment.limitations.length > 0 && <article className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950"><h3 className="font-semibold">{t("limitationsTitle")}</h3><ul className="mt-2 list-disc pl-5">{run.result.materialAssessment.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul></article>}
          {run.result.unverifiedClaims.length > 0 && <article className="rounded-2xl border bg-card p-5"><h3 className="font-semibold">{t("unverifiedTitle")}</h3><p className="mt-1 text-xs text-muted-foreground">{t("unverifiedHelp")}</p><ul className="mt-3 flex flex-col gap-2">{run.result.unverifiedClaims.map((item, index) => <li key={`${item.kind}-${index}`} className="rounded-xl bg-muted/40 p-3 text-sm"><span className="font-medium">{item.kind}</span><p className="mt-1 text-muted-foreground">{item.claim}</p><p className="mt-1 text-xs text-muted-foreground">{item.source}</p></li>)}</ul></article>}

          {run.mediaType === "video" && run.transcript.status === "transcribed" && run.transcript.text && <details className="rounded-2xl border bg-card p-5"><summary className="cursor-pointer font-semibold">{t("transcriptTitle", { cost: run.transcript.estimatedUsd.toFixed(5) })}</summary><p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{run.transcript.text}</p></details>}
          {run.mediaType === "video" && run.transcript.status === "no_audio" && <p className="text-xs text-muted-foreground">{t("noAudio")}</p>}
        </section>;
      })}
    </div>
  );
}
