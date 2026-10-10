"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DemoSession, MediaAsset } from "@/lib/demo/contracts";
import { MediaProcessingError, normalizeImage } from "@/lib/demo/media";
import { NAILS_CONFIG } from "@/lib/demo/industries/nails";
import { createEmptySession, loadSession, putBlob, saveSession } from "@/lib/demo/session";
import { NAILS_BG, NAILS_INK, NAILS_MUTED, NAILS_PRIMARY, NailsPrimaryButton, NailsStepIndicator, NailsTopBar } from "./chrome";

const ERROR_LABEL: Record<string, string> = {
  "unsupported-mime": "暂不支持这个图片格式,请使用 JPG / PNG / WebP",
  "file-too-large": "这张照片超过 15MB,请换一张",
  "batch-too-large": "这一批照片总大小超过限制,请减少几张",
  "too-many-pixels": "这张照片分辨率过高,请换一张",
  "decode-failed": "这张照片打不开,可能已损坏",
};

export function NailsUpload() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<DemoSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    const sessionId = searchParams.get("session");
    (async () => {
      const existing = sessionId ? await loadSession("nails", sessionId) : null;
      const s = existing ?? createEmptySession("nails", NAILS_CONFIG.configVersion, "zh");
      if (!existing) await saveSession(s);
      setSession(s);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!session) return;
    let revoked: string[] = [];
    (async () => {
      const { getBlob } = await import("@/lib/demo/session");
      const entries = await Promise.all(
        session.assets.map(async (a) => {
          const blob = await getBlob(a.storageKey);
          return blob ? ([a.id, URL.createObjectURL(blob)] as const) : null;
        }),
      );
      const map: Record<string, string> = {};
      for (const e of entries) if (e) map[e[0]] = e[1];
      revoked = Object.values(map);
      setThumbs(map);
    })();
    return () => {
      for (const url of revoked) URL.revokeObjectURL(url);
    };
  }, [session]);

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || !session) return;
      setError(null);
      const remaining = NAILS_CONFIG.mediaPolicy.maxCount - session.assets.length;
      if (remaining <= 0) {
        setError(`最多只能上传 ${NAILS_CONFIG.mediaPolicy.maxCount} 张照片`);
        return;
      }
      const list = Array.from(files).slice(0, remaining);
      setProcessing(true);
      try {
        const newAssets: MediaAsset[] = [];
        for (const file of list) {
          const normalized = await normalizeImage(file);
          const id = crypto.randomUUID();
          await putBlob(id, normalized.blob);
          const now = new Date();
          newAssets.push({
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
          });
        }
        const updated: DemoSession = {
          ...session,
          assets: [...session.assets, ...newAssets],
          assetOrder: [...session.assetOrder, ...newAssets.map((a) => a.id)],
          revision: session.revision + 1,
          updatedAt: new Date().toISOString(),
        };
        await saveSession(updated);
        setSession(updated);
      } catch (err) {
        if (err instanceof MediaProcessingError) setError(ERROR_LABEL[err.detail.code] ?? "这张照片处理失败");
        else setError("这张照片处理失败,请换一张再试");
      } finally {
        setProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [session],
  );

  const removeAsset = useCallback(
    async (id: string) => {
      if (!session) return;
      const updated: DemoSession = {
        ...session,
        assets: session.assets.filter((a) => a.id !== id),
        assetOrder: session.assetOrder.filter((aid) => aid !== id),
        revision: session.revision + 1,
        updatedAt: new Date().toISOString(),
      };
      await saveSession(updated);
      setSession(updated);
    },
    [session],
  );

  const goNext = useCallback(() => {
    if (!session) return;
    router.push(`/demo/nails/templates?session=${session.id}`);
  }, [router, session]);

  if (!session) return null;
  const count = session.assets.length;
  const canAddMore = count < NAILS_CONFIG.mediaPolicy.maxCount;

  return (
    <div className="min-h-dvh" style={{ background: NAILS_BG }}>
      <div className="mx-auto max-w-[480px] px-5 pb-10">
        <NailsTopBar onBack />
        <NailsStepIndicator current={0} />

        <h1 className="mt-4 text-[26px] font-extrabold" style={{ color: NAILS_INK }}>
          先上传你的美甲作品 ✨
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: NAILS_MUTED }}>
          选择 1–6 张清晰的美甲照片,
          <br />
          让我们帮你制作精美的社交媒体笔记。
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        {canAddMore ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            className="mt-5 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed py-8"
            style={{ borderColor: "#f3b9cd", background: "#fdeef3" }}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl text-[24px]" style={{ color: NAILS_PRIMARY }}>
              🖼️
            </span>
            <span className="text-[15px] font-semibold" style={{ color: NAILS_PRIMARY }}>
              {processing ? "正在处理…" : "从手机相册选择照片"}
            </span>
            <span className="text-[12px]" style={{ color: NAILS_MUTED }}>
              支持多张照片 · JPG / PNG · 单张不超过 15MB
            </span>
          </button>
        ) : null}

        {error ? (
          <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-[13px]" style={{ color: "#c0392b" }}>
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-between">
          <span className="text-[14px] font-semibold" style={{ color: NAILS_INK }}>
            已上传 {count}/{NAILS_CONFIG.mediaPolicy.maxCount} 张
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {session.assets.map((asset, i) => (
            <div key={asset.id} className="relative aspect-square overflow-hidden rounded-2xl bg-white">
              {thumbs[asset.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbs[asset.id]} alt="" className="h-full w-full object-cover" />
              ) : null}
              <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[12px] font-semibold" style={{ color: NAILS_INK }}>
                {i + 1}
              </span>
              <button
                type="button"
                onClick={() => removeAsset(asset.id)}
                aria-label="移除"
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[12px] text-white"
              >
                ✕
              </button>
            </div>
          ))}
          {canAddMore
            ? Array.from({ length: Math.min(2, NAILS_CONFIG.mediaPolicy.maxCount - count) }).map((_, i) => (
                <button
                  key={`add-${i}`}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed"
                  style={{ borderColor: "#f3c7d6", color: NAILS_MUTED }}
                >
                  <span className="text-[22px]">+</span>
                  <span className="text-[12px]">再添加一张</span>
                </button>
              ))
            : null}
        </div>

        <div className="mt-6 rounded-2xl bg-white/60 p-4">
          <p className="text-[13px] font-semibold" style={{ color: NAILS_PRIMARY }}>
            💡 小贴士
          </p>
          <ul className="mt-2 space-y-1 text-[12px] leading-relaxed" style={{ color: NAILS_MUTED }}>
            <li>• 建议上传不同角度的照片,效果更好</li>
            <li>• 照片要清晰、光线充足,能看到美甲细节</li>
            <li>• 支持 1–6 张照片,稍后可以替换或调整顺序</li>
          </ul>
        </div>

        <div className="mt-6">
          <NailsPrimaryButton onClick={goNext} disabled={count < 1}>
            下一步 · 选择模板 →
          </NailsPrimaryButton>
        </div>
      </div>
    </div>
  );
}
