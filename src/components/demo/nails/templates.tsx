"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { DemoSession } from "@/lib/demo/contracts";
import { getBlob, loadSession, saveSession } from "@/lib/demo/session";
import { NAILS_CLASSIC_TEMPLATE } from "@/lib/demo/templates/descriptors";
import { NAILS_BG, NAILS_INK, NAILS_MUTED, NAILS_PRIMARY, NailsPrimaryButton, NailsStepIndicator, NailsTopBar } from "./chrome";

const CATEGORIES = ["全部", "作品展示", "作品 + 档期", "促销活动", "节日主题", "新款推荐"] as const;

const COMING_SOON = [
  { label: "作品 + 档期", bg: "linear-gradient(135deg,#f3dccb,#e8c3ab)" },
  { label: "秋日主题 · 新款推荐", bg: "linear-gradient(135deg,#d9b48f,#a9754a)" },
  { label: "新款推荐", bg: "linear-gradient(135deg,#f0d6c8,#e3b9c4)" },
  { label: "节日主题", bg: "linear-gradient(135deg,#2a2a2a,#555)" },
  { label: "促销活动", bg: "linear-gradient(135deg,#fbdfe6,#f6c3d2)" },
] as const;

export function NailsTemplates() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const [session, setSession] = useState<DemoSession | null>(null);
  const [heroUrl, setHeroUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const s = await loadSession("nails", sessionId);
      if (!s) {
        router.replace("/demo/nails/upload");
        return;
      }
      setSession(s);
      const firstId = s.assetOrder[0];
      if (firstId) {
        const blob = await getBlob(firstId);
        if (blob) setHeroUrl(URL.createObjectURL(blob));
      }
    })();
  }, [sessionId, router]);

  const confirm = async () => {
    if (!session) return;
    const updated: DemoSession = {
      ...session,
      draft: session.draft ?? {
        templateId: NAILS_CLASSIC_TEMPLATE.id,
        templateVersion: NAILS_CLASSIC_TEMPLATE.version,
        fields: {},
        bindings: session.assetOrder[0] ? [{ slotId: "hero", assetId: session.assetOrder[0], crop: { x: 0, y: 0, width: 1, height: 1 } }] : [],
        outputId: "portrait-2x3",
      },
      revision: session.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    await saveSession(updated);
    router.push(`/demo/nails/edit?session=${updated.id}`);
  };

  if (!session) return null;

  return (
    <div className="min-h-dvh" style={{ background: NAILS_BG }}>
      <div className="mx-auto max-w-[480px] px-5 pb-28">
        <NailsTopBar onBack />
        <NailsStepIndicator current={1} />

        <h1 className="mt-4 text-[26px] font-extrabold" style={{ color: NAILS_INK }}>
          选一个你喜欢的风格 💗
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: NAILS_MUTED }}>
          同一组照片,可以做出不同风格的社交媒体笔记。
        </p>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c, i) => (
            <span
              key={c}
              className="shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium"
              style={i === 0 ? { background: NAILS_PRIMARY, color: "#fff" } : { background: "#fdeaf1", color: NAILS_MUTED }}
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="relative overflow-hidden rounded-2xl border-2 bg-white" style={{ borderColor: NAILS_PRIMARY }}>
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-200">
              {heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-6 text-white">
                <p className="text-[13px] font-semibold">Nail Diary</p>
              </div>
              <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ background: NAILS_PRIMARY }}>
                ✓
              </span>
            </div>
            <div className="p-2 text-[11px]" style={{ color: NAILS_MUTED }}>
              01 温柔日常 · 作品展示
            </div>
          </div>

          {COMING_SOON.map((c, i) => (
            <div key={c.label} className="relative overflow-hidden rounded-2xl bg-white opacity-60">
              <div className="aspect-[3/4] w-full" style={{ background: c.bg }} />
              <div className="p-2 text-[11px]" style={{ color: NAILS_MUTED }}>
                {String(i + 2).padStart(2, "0")} {c.label} · 即将上线
              </div>
            </div>
          ))}
        </div>

        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px] bg-gradient-to-t from-[#fce3ea] px-5 pb-6 pt-8">
          <NailsPrimaryButton onClick={confirm}>使用这个模板 →</NailsPrimaryButton>
        </div>
      </div>
    </div>
  );
}
