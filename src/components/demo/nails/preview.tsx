"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { DemoSession, FieldValue } from "@/lib/demo/contracts";
import { OUTPUT_SPECS, WATERMARK_POLICY_VERSION } from "@/lib/demo/contracts";
import { getBlob, loadSession, saveSession } from "@/lib/demo/session";
import { NAILS_CLASSIC_TEMPLATE } from "@/lib/demo/templates/descriptors";
import { TEMPLATE_COMPONENTS } from "@/lib/demo/templates/component-registry";
import { computeRenderKey, downloadFilename, RENDERER_VERSION, renderWatermarkedPng } from "@/lib/demo/render";
import { validateDraft } from "@/lib/demo/templates/adapter";
import { NAILS_BG, NAILS_INK, NAILS_MUTED, NAILS_PRIMARY, NailsPrimaryButton, NailsStepIndicator, NailsTopBar } from "./chrome";

const SIZE_OPTIONS = [
  { id: "portrait-2x3" as const, label: "小红书 / 竖版", ratio: "2:3", recommended: true, enabled: true },
  { id: "square" as const, label: "Instagram 方形", ratio: "1:1", recommended: false, enabled: false },
  { id: "portrait-4x5" as const, label: "Instagram 竖版", ratio: "4:5", recommended: false, enabled: false },
] as const;

export function NailsPreview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const previewRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<DemoSession | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [exportedSize, setExportedSize] = useState<{ width: number; height: number; bytes: number } | null>(null);
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const s = await loadSession("nails", sessionId);
      if (!s || !s.draft) {
        router.replace("/demo/nails/upload");
        return;
      }
      setSession(s);
      const assetId = s.draft.bindings[0]?.assetId;
      if (assetId) {
        const blob = await getBlob(assetId);
        if (blob) setPhotoUrl(URL.createObjectURL(blob));
      }
    })();
  }, [sessionId, router]);

  const doExport = async () => {
    if (!session?.draft) return;
    const problems = validateDraft(NAILS_CLASSIC_TEMPLATE, session.draft, session.assets);
    if (problems.length > 0) {
      setIssues(problems.map((p) => p.messageKey));
      return;
    }
    setIssues([]);
    setExporting(true);
    try {
      const node = previewRef.current;
      if (!node) return;
      const output = OUTPUT_SPECS["portrait-2x3"];
      const safeArea = NAILS_CLASSIC_TEMPLATE.watermarkSafeAreas["portrait-2x3"]!;
      const blob = await renderWatermarkedPng(node, { outputWidth: output.width, outputHeight: output.height, safeArea });
      const renderKey = await computeRenderKey({
        sessionId: session.id,
        industryId: "nails",
        configVersion: session.configVersion,
        templateId: NAILS_CLASSIC_TEMPLATE.id,
        templateVersion: NAILS_CLASSIC_TEMPLATE.version,
        rendererVersion: RENDERER_VERSION,
        assetHashes: session.assets.map((a) => a.contentHash),
        bindings: session.draft.bindings,
        fields: session.draft.fields,
        outputId: "portrait-2x3",
      });
      const url = URL.createObjectURL(blob);
      setExportedUrl(url);
      setExportedSize({ width: output.width, height: output.height, bytes: blob.size });

      const filename = downloadFilename("nails", renderKey.slice(0, 8), output.width, output.height);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      await saveSession({ ...session, lastStep: "preview", revision: session.revision + 1, updatedAt: new Date().toISOString() });
      router.push(`/demo/nails/success?session=${session.id}&file=${encodeURIComponent(filename)}`);
    } finally {
      setExporting(false);
    }
  };

  if (!session?.draft) return null;
  const fields: Record<string, FieldValue> = session.draft.fields;
  const TemplateComponent = TEMPLATE_COMPONENTS[NAILS_CLASSIC_TEMPLATE.id];

  return (
    <div className="min-h-dvh" style={{ background: NAILS_BG }}>
      <div className="mx-auto max-w-[480px] px-5 pb-10">
        <NailsTopBar onBack />
        <NailsStepIndicator current={3} />

        <h1 className="mt-4 text-[26px] font-extrabold" style={{ color: NAILS_INK }}>
          预览你的美甲笔记 ✨
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: NAILS_MUTED }}>
          已经为你生成精美的社交媒体图片,
          <br />
          现在可以免费下载啦!
        </p>

        <div ref={previewRef} className="mt-5 overflow-hidden rounded-3xl shadow-lg" style={{ containerType: "inline-size" }}>
          {TemplateComponent ? <TemplateComponent photoUrl={photoUrl} fields={fields} /> : null}
        </div>

        <p className="mt-3 text-[13px] font-semibold" style={{ color: NAILS_INK }}>
          选择导出尺寸(已为不同平台优化)
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {SIZE_OPTIONS.map((opt) => {
            const spec = OUTPUT_SPECS[opt.id];
            return (
              <div
                key={opt.id}
                className="rounded-xl border p-2 text-center"
                style={opt.enabled ? { borderColor: NAILS_PRIMARY, background: "#fdeef3" } : { borderColor: "#eee", opacity: 0.5 }}
              >
                {opt.recommended ? (
                  <span className="mb-1 inline-block rounded-full px-2 text-[10px] font-semibold text-white" style={{ background: NAILS_PRIMARY }}>
                    推荐
                  </span>
                ) : null}
                <div className="text-[12px] font-semibold" style={{ color: NAILS_INK }}>
                  {opt.label}
                </div>
                <div className="text-[11px]" style={{ color: NAILS_MUTED }}>
                  {opt.ratio} · {spec.width}×{spec.height}
                </div>
                {!opt.enabled ? (
                  <div className="text-[10px]" style={{ color: NAILS_MUTED }}>
                    即将支持
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {issues.length > 0 ? (
          <div className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-[12px]" style={{ color: "#c0392b" }}>
            {issues.join("、")}
          </div>
        ) : null}

        <p className="mt-4 rounded-xl px-3 py-2 text-[12px]" style={{ background: "#fdeef3", color: NAILS_MUTED }}>
          ℹ️ 免费下载,图片带有 PoStory 水印(策略版本 {WATERMARK_POLICY_VERSION}),仅供个人使用。
        </p>

        {exportedUrl && exportedSize ? (
          <p className="mt-2 text-center text-[12px]" style={{ color: NAILS_MUTED }}>
            已导出 {exportedSize.width}×{exportedSize.height} · {(exportedSize.bytes / 1024).toFixed(0)}KB
          </p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-full border py-3 text-[14px] font-semibold"
            style={{ borderColor: "#f3c7d6", color: NAILS_MUTED }}
          >
            ← 返回修改
          </button>
          <div className="flex-[1.4]">
            <NailsPrimaryButton onClick={doExport} disabled={exporting}>
              {exporting ? "生成中…" : "⬇️ 导出我的作品"}
            </NailsPrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
