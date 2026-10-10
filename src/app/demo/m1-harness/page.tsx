"use client";

import { useRef, useState } from "react";
import { createEmptySession, putBlob, saveSession } from "@/lib/demo/session";
import { normalizeImage, MediaProcessingError } from "@/lib/demo/media";
import { computeRenderKey, downloadFilename, renderWatermarkedPng, RENDERER_VERSION } from "@/lib/demo/render";
import { getTemplateDescriptor, resolveTemplateProps, validateDraft } from "@/lib/demo/templates/adapter";
import { TEMPLATE_COMPONENTS } from "@/lib/demo/templates/component-registry";
import { NAILS_CONFIG } from "@/lib/demo/industries/nails";
import { SUSHI_CONFIG } from "@/lib/demo/industries/sushi";
import type { DemoSession, IndustryId, MediaAsset } from "@/lib/demo/contracts";

/**
 * M1 proof-of-pipeline harness — not one of the 12 spec pages. Exists only to
 * exercise upload → normalize → IndexedDB session → template render → watermark
 * → PNG download end to end before M2/M3 build the real fidelity-matched pages.
 */
export default function M1Harness() {
  const [industryId, setIndustryId] = useState<IndustryId>("nails");
  const config = industryId === "nails" ? NAILS_CONFIG : SUSHI_CONFIG;
  const templateId = config.templates[0].sourceId;
  const descriptor = getTemplateDescriptor(templateId);

  const [session, setSession] = useState<DemoSession | null>(null);
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("今日作品分享");
  const [shortCopy, setShortCopy] = useState("欢迎预约,点击了解更多");
  const [dishName, setDishName] = useState("鲑鱼刺身拼盘");
  const [status, setStatus] = useState<string>("");
  const [issues, setIssues] = useState<string[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  async function handleFile(file: File) {
    setStatus("处理中...");
    try {
      const normalized = await normalizeImage(file);
      const id = crypto.randomUUID();
      await putBlob(id, normalized.blob);
      const now = new Date();
      const nextAsset: MediaAsset = {
        id,
        status: "ready",
        mime: normalized.mime,
        width: normalized.width,
        height: normalized.height,
        byteSize: normalized.byteSize,
        contentHash: normalized.contentHash,
        storageKey: id,
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      };
      const base = session ?? createEmptySession(industryId, config.configVersion, config.defaultLocale);
      const nextSession: DemoSession = {
        ...base,
        assets: [nextAsset],
        assetOrder: [id],
        lastStep: "upload",
      };
      await saveSession(nextSession);
      setSession(nextSession);
      setAsset(nextAsset);
      setPhotoUrl(URL.createObjectURL(normalized.blob));
      setStatus(`已归一化:${normalized.width}x${normalized.height},${Math.round(normalized.byteSize / 1024)}KB`);
    } catch (err) {
      if (err instanceof MediaProcessingError) {
        setStatus(`处理失败:${err.detail.code}`);
      } else {
        setStatus("处理失败:未知错误");
      }
    }
  }

  async function handleExport() {
    if (!descriptor || !asset || !session || !previewRef.current) return;
    const draft = {
      templateId: descriptor.id,
      templateVersion: descriptor.version,
      fields: { title, shortCopy, ...(industryId === "sushi" ? { dishName } : {}) },
      bindings: [{ slotId: "hero", assetId: asset.id, crop: { x: 0, y: 0, width: 1, height: 1 } }],
      outputId: "portrait-2x3" as const,
    };
    const foundIssues = validateDraft(descriptor, draft, session.assets);
    if (foundIssues.length > 0) {
      setIssues(foundIssues.map((i) => `${i.path}: ${i.code}`));
      return;
    }
    setIssues([]);

    const renderKey = await computeRenderKey({
      sessionId: session.id,
      industryId,
      configVersion: config.configVersion,
      templateId: descriptor.id,
      templateVersion: descriptor.version,
      rendererVersion: RENDERER_VERSION,
      assetHashes: [asset.contentHash],
      bindings: draft.bindings,
      fields: draft.fields,
      outputId: draft.outputId,
    });

    setStatus(`渲染中...(renderKey=${renderKey.slice(0, 12)})`);
    const safeArea = descriptor.watermarkSafeAreas["portrait-2x3"];
    if (!safeArea) {
      setStatus("模板未声明该输出的水印安全区,不能导出");
      return;
    }
    const blob = await renderWatermarkedPng(previewRef.current, {
      outputWidth: 1080,
      outputHeight: 1620,
      safeArea,
    });
    const filename = downloadFilename(industryId, session.id.slice(0, 8), 1080, 1620);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setStatus(`导出完成:${filename},${Math.round(blob.size / 1024)}KB`);
  }

  const Template = descriptor ? TEMPLATE_COMPONENTS[descriptor.id] : null;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 18, fontWeight: 700 }}>M1 管线验证台(内部用,非正式页面)</h1>
      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <button onClick={() => setIndustryId("nails")} style={{ fontWeight: industryId === "nails" ? 700 : 400 }}>
          美甲
        </button>
        <button onClick={() => setIndustryId("sushi")} style={{ fontWeight: industryId === "sushi" ? 700 : 400 }}>
          寿司
        </button>
      </div>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <p style={{ fontSize: 12, color: "#666" }}>{status}</p>

      <label style={{ display: "block", marginTop: 8, fontSize: 12 }}>标题</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%" }} />
      {industryId === "sushi" ? (
        <>
          <label style={{ display: "block", marginTop: 8, fontSize: 12 }}>菜名</label>
          <input value={dishName} onChange={(e) => setDishName(e.target.value)} style={{ width: "100%" }} />
        </>
      ) : null}
      <label style={{ display: "block", marginTop: 8, fontSize: 12 }}>短文案</label>
      <textarea value={shortCopy} onChange={(e) => setShortCopy(e.target.value)} style={{ width: "100%" }} />

      <div style={{ marginTop: 16, width: "100%", maxWidth: 360, ...({ "--demo-bg": config.themeTokens["--demo-bg"], "--demo-surface": config.themeTokens["--demo-surface"], "--demo-primary-ink": config.themeTokens["--demo-primary-ink"] } as Record<string, string>) }}>
        <div ref={previewRef}>
          {Template ? <Template photoUrl={photoUrl} fields={{ title, shortCopy, ...(industryId === "sushi" ? { dishName } : {}) }} /> : null}
        </div>
      </div>

      {issues.length > 0 ? (
        <ul style={{ color: "crimson", fontSize: 12 }}>
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}

      <button onClick={() => void handleExport()} disabled={!asset} style={{ marginTop: 16, padding: "8px 16px" }}>
        导出带水印 PNG
      </button>
    </div>
  );
}
