"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { DemoSession, FieldValue } from "@/lib/demo/contracts";
import { getBlob, loadSession, saveSession } from "@/lib/demo/session";
import { SUSHI_CLASSIC_TEMPLATE } from "@/lib/demo/templates/descriptors";
import { TEMPLATE_COMPONENTS } from "@/lib/demo/templates/component-registry";
import { SUSHI_BG, SUSHI_INK, SUSHI_MUTED, SUSHI_PRIMARY, SushiPrimaryButton, SushiStepIndicator, SushiTopBar } from "./chrome";

type Tab = "copy" | "photo";

export function SushiEdit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const [session, setSession] = useState<DemoSession | null>(null);
  const [tab, setTab] = useState<Tab>("copy");
  const [title, setTitle] = useState("Fresh Sushi Always a Good Idea");
  const [dishName, setDishName] = useState("");
  const [shortCopy, setShortCopy] = useState("Simple ingredients, extraordinary taste.");
  const [heroAssetId, setHeroAssetId] = useState<string | null>(null);
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const s = await loadSession("sushi", sessionId);
      if (!s) {
        router.replace("/demo/sushi/upload");
        return;
      }
      setSession(s);
      const draftFields = s.draft?.fields ?? {};
      if (typeof draftFields.title === "string") setTitle(draftFields.title);
      if (typeof draftFields.dishName === "string") setDishName(draftFields.dishName);
      if (typeof draftFields.shortCopy === "string") setShortCopy(draftFields.shortCopy);
      setHeroAssetId(s.draft?.bindings[0]?.assetId ?? s.assetOrder[0] ?? null);
      const urls: Record<string, string> = {};
      for (const assetId of s.assetOrder) {
        const blob = await getBlob(assetId);
        if (blob) urls[assetId] = URL.createObjectURL(blob);
      }
      setAssetUrls(urls);
    })();
  }, [sessionId, router]);

  const titleField = SUSHI_CLASSIC_TEMPLATE.fieldSpecs.find((f) => f.id === "title");
  const dishNameField = SUSHI_CLASSIC_TEMPLATE.fieldSpecs.find((f) => f.id === "dishName");
  const shortCopyField = SUSHI_CLASSIC_TEMPLATE.fieldSpecs.find((f) => f.id === "shortCopy");

  const fields = useMemo<Record<string, FieldValue>>(() => ({ title, dishName, shortCopy }), [title, dishName, shortCopy]);
  const TemplateComponent = TEMPLATE_COMPONENTS[SUSHI_CLASSIC_TEMPLATE.id];
  const photoUrl = heroAssetId ? (assetUrls[heroAssetId] ?? null) : null;

  const saveDraft = async () => {
    if (!session) return;
    const updated: DemoSession = {
      ...session,
      draft: {
        templateId: SUSHI_CLASSIC_TEMPLATE.id,
        templateVersion: SUSHI_CLASSIC_TEMPLATE.version,
        fields: { title, dishName, shortCopy },
        bindings: heroAssetId ? [{ slotId: "hero", assetId: heroAssetId, crop: { x: 0, y: 0, width: 1, height: 1 } }] : (session.draft?.bindings ?? []),
        outputId: "portrait-2x3",
      },
      lastStep: "edit",
      revision: session.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    await saveSession(updated);
    setSession(updated);
    setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
  };

  const goPreview = async () => {
    if (!session || !heroAssetId) return;
    const updated: DemoSession = {
      ...session,
      draft: {
        templateId: SUSHI_CLASSIC_TEMPLATE.id,
        templateVersion: SUSHI_CLASSIC_TEMPLATE.version,
        fields: { title, dishName, shortCopy },
        bindings: [{ slotId: "hero", assetId: heroAssetId, crop: { x: 0, y: 0, width: 1, height: 1 } }],
        outputId: "portrait-2x3",
      },
      lastStep: "edit",
      revision: session.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    await saveSession(updated);
    router.push(`/demo/sushi/preview?session=${updated.id}`);
  };

  if (!session) return null;

  return (
    <div className="min-h-dvh" style={{ background: SUSHI_BG }}>
      <div className="mx-auto max-w-[480px] px-5 pb-10">
        <SushiTopBar onBack />
        <SushiStepIndicator current={2} />

        <div className="mt-3 overflow-hidden rounded-3xl" style={{ containerType: "inline-size" }}>
          {TemplateComponent ? <TemplateComponent photoUrl={photoUrl} fields={fields} /> : null}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="rounded-full bg-white/70 px-3 py-1 text-[12px] font-medium" style={{ color: SUSHI_MUTED }}>
            🔄 更换模板
          </span>
        </div>

        <div className="mt-4 flex gap-2 rounded-full bg-white/60 p-1">
          {([
            ["copy", "✏️ 文案内容"],
            ["photo", "🖼️ 照片替换"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className="flex-1 rounded-full py-2 text-[13px] font-semibold"
              style={tab === key ? { background: SUSHI_PRIMARY, color: "#fff" } : { color: SUSHI_MUTED }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "copy" ? (
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-[13px] font-semibold" style={{ color: SUSHI_INK }}>
                <span>标题</span>
                <span style={{ color: SUSHI_MUTED }}>
                  {title.length}/{titleField?.maxLength}
                </span>
              </div>
              <input
                value={title}
                maxLength={titleField?.maxLength}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-[14px]"
                style={{ borderColor: "#e8b98c", color: SUSHI_INK, background: "#fffaf3" }}
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-[13px] font-semibold" style={{ color: SUSHI_INK }}>
                <span>简单描述(可选)</span>
                <span style={{ color: SUSHI_MUTED }}>
                  {dishName.length}/{dishNameField?.maxLength}
                </span>
              </div>
              <input
                value={dishName}
                maxLength={dishNameField?.maxLength}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="例如:三文鱼寿司、午餐套餐…"
                className="mt-1 w-full rounded-xl border px-3 py-2 text-[14px]"
                style={{ borderColor: "#e8b98c", color: SUSHI_INK, background: "#fffaf3" }}
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-[13px] font-semibold" style={{ color: SUSHI_INK }}>
                <span>正文描述</span>
                <span style={{ color: SUSHI_MUTED }}>
                  {shortCopy.length}/{shortCopyField?.maxLength}
                </span>
              </div>
              <textarea
                value={shortCopy}
                maxLength={shortCopyField?.maxLength}
                onChange={(e) => setShortCopy(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-[14px]"
                style={{ borderColor: "#e8b98c", color: SUSHI_INK, background: "#fffaf3" }}
              />
            </div>
          </div>
        ) : null}

        {tab === "photo" ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {session.assetOrder.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setHeroAssetId(id)}
                className="relative aspect-square overflow-hidden rounded-xl"
                style={{ outline: heroAssetId === id ? `3px solid ${SUSHI_PRIMARY}` : "none" }}
              >
                {assetUrls[id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assetUrls[id]} alt="" className="h-full w-full object-cover" />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        {savedAt ? (
          <p className="mt-2 text-center text-[12px]" style={{ color: SUSHI_MUTED }}>
            草稿已保存 {savedAt}
          </p>
        ) : null}
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={saveDraft}
            className="flex-1 rounded-full border py-3 text-[14px] font-semibold"
            style={{ borderColor: "#e8b98c", color: SUSHI_MUTED }}
          >
            保存草稿
          </button>
          <div className="flex-[1.4]">
            <SushiPrimaryButton onClick={goPreview} disabled={!title || !shortCopy || !heroAssetId}>
              预览内容 →
            </SushiPrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
