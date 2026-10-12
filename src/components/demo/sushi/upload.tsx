"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DemoSession, MediaAsset } from "@/lib/demo/contracts";
import { MediaProcessingError, normalizeImage } from "@/lib/demo/media";
import { SUSHI_CONFIG } from "@/lib/demo/industries/sushi";
import { createEmptySession, loadSession, putBlob, saveSession } from "@/lib/demo/session";
import { SUSHI_BG, SUSHI_INK, SUSHI_MUTED, SUSHI_PRIMARY, SushiPrimaryButton, SushiStepIndicator, SushiTopBar } from "./chrome";

const ERROR_LABEL: Record<string, string> = {
  "unsupported-mime": "暂不支持这个图片格式,请使用 JPG / PNG / WebP",
  "file-too-large": "这张照片超过 15MB,请换一张",
  "batch-too-large": "这一批照片总大小超过限制,请减少几张",
  "too-many-pixels": "这张照片分辨率过高,请换一张",
  "decode-failed": "这张照片打不开,可能已损坏",
};

const DISH_NAME_MAX = 50;

export function SushiUpload() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<DemoSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [dishName, setDishName] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("session");
    (async () => {
      const existing = sessionId ? await loadSession("sushi", sessionId) : null;
      const s = existing ?? createEmptySession("sushi", SUSHI_CONFIG.configVersion, "zh");
      if (!existing) await saveSession(s);
      setSession(s);
      const draftDishName = s.draft?.fields.dishName;
      if (typeof draftDishName === "string") setDishName(draftDishName);
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
      const remaining = SUSHI_CONFIG.mediaPolicy.maxCount - session.assets.length;
      if (remaining <= 0) {
        setError(`最多只能上传 ${SUSHI_CONFIG.mediaPolicy.maxCount} 张照片`);
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

  const goNext = useCallback(async () => {
    if (!session) return;
    const updated: DemoSession = {
      ...session,
      draft: {
        templateId: session.draft?.templateId ?? "",
        templateVersion: session.draft?.templateVersion ?? "",
        fields: { ...session.draft?.fields, dishName },
        bindings: session.draft?.bindings ?? [],
        outputId: "portrait-2x3",
      },
      revision: session.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    await saveSession(updated);
    router.push(`/demo/sushi/templates?session=${updated.id}`);
  }, [router, session, dishName]);

  if (!session) return null;
  const count = session.assets.length;
  const canAddMore = count < SUSHI_CONFIG.mediaPolicy.maxCount;

  return (
    <div className="min-h-dvh" style={{ background: SUSHI_BG }}>
      <div className="mx-auto max-w-[480px] px-5 pb-10">
        <SushiTopBar onBack />
        <SushiStepIndicator current={0} />

        <h1 className="mt-4 text-[26px] font-extrabold" style={{ color: SUSHI_INK }}>
          上传你的寿司照片 📸
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: SUSHI_MUTED }}>
          选择 1–6 张清晰的招牌菜、套餐或拼盘照片,
          <br />
          让我们帮你制作精美的社交媒体营销内容。
        </p>

        <div className="mt-4 rounded-2xl bg-white/60 p-4">
          <p className="text-[13px] font-semibold" style={{ color: SUSHI_PRIMARY }}>
            💡 小提示
          </p>
          <p className="mt-1 text-[12px] leading-relaxed" style={{ color: SUSHI_MUTED }}>
            可以上传招牌寿司、午餐套餐、拼盘或店内环境照片,我们会根据你的照片推荐合适的模板。
          </p>
        </div>

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
            style={{ borderColor: "#e8b98c", background: "#fdf2e3" }}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl text-[24px]" style={{ color: SUSHI_PRIMARY }}>
              🖼️
            </span>
            <span className="text-[15px] font-semibold" style={{ color: SUSHI_PRIMARY }}>
              {processing ? "正在处理…" : "点击上传寿司照片"}
            </span>
            <span className="text-[12px]" style={{ color: SUSHI_MUTED }}>
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
          <span className="text-[14px] font-semibold" style={{ color: SUSHI_INK }}>
            已上传 {count}/{SUSHI_CONFIG.mediaPolicy.maxCount} 张
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {session.assets.map((asset, i) => (
            <div key={asset.id} className="relative aspect-square overflow-hidden rounded-2xl bg-white">
              {thumbs[asset.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbs[asset.id]} alt="" className="h-full w-full object-cover" />
              ) : null}
              <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[12px] font-semibold" style={{ color: SUSHI_INK }}>
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
            ? Array.from({ length: Math.min(2, SUSHI_CONFIG.mediaPolicy.maxCount - count) }).map((_, i) => (
                <button
                  key={`add-${i}`}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed"
                  style={{ borderColor: "#e8b98c", color: SUSHI_MUTED }}
                >
                  <span className="text-[22px]">+</span>
                  <span className="text-[12px]">再添加一张</span>
                </button>
              ))
            : null}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-[13px] font-semibold" style={{ color: SUSHI_INK }}>
            <span>简单描述(可选)</span>
            <span style={{ color: SUSHI_MUTED }}>
              {dishName.length}/{DISH_NAME_MAX}
            </span>
          </div>
          <input
            value={dishName}
            maxLength={DISH_NAME_MAX}
            onChange={(e) => setDishName(e.target.value)}
            placeholder="例如:三文鱼寿司、午餐套餐、派对拼盘…"
            className="mt-1 w-full rounded-xl border px-3 py-2 text-[14px]"
            style={{ borderColor: "#e8b98c", color: SUSHI_INK, background: "#fffaf3" }}
          />
        </div>

        <div className="mt-6">
          <SushiPrimaryButton onClick={goNext} disabled={count < 1}>
            下一步:选择模板 →
          </SushiPrimaryButton>
        </div>
      </div>
    </div>
  );
}
