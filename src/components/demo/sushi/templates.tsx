"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { DemoSession } from "@/lib/demo/contracts";
import { getBlob, loadSession, saveSession } from "@/lib/demo/session";
import { SUSHI_CLASSIC_TEMPLATE } from "@/lib/demo/templates/descriptors";
import { SUSHI_BG, SUSHI_INK, SUSHI_MUTED, SUSHI_PRIMARY, SushiPrimaryButton, SushiStepIndicator, SushiTopBar } from "./chrome";

const CATEGORIES = ["全部", "招牌菜", "午餐特惠", "新品上架", "派对拼盘", "节日主题"] as const;

const COMING_SOON = [
  { label: "午餐特惠", photo: "/demo/photos/sushi-1.jpg", position: "60% 30%" },
  { label: "新品上架", photo: "/demo/photos/sushi-1.jpg", position: "30% 70%" },
  { label: "派对拼盘", photo: "/demo/photos/sushi-1.jpg", position: "70% 60%" },
  { label: "节日主题", photo: "/demo/photos/sushi-1.jpg", position: "40% 20%" },
  { label: "店内环境", photo: "/demo/photos/sushi-1.jpg", position: "20% 50%" },
] as const;

export function SushiTemplates() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const [session, setSession] = useState<DemoSession | null>(null);
  const [heroUrl, setHeroUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const s = await loadSession("sushi", sessionId);
      if (!s) {
        router.replace("/demo/sushi/upload");
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
        templateId: SUSHI_CLASSIC_TEMPLATE.id,
        templateVersion: SUSHI_CLASSIC_TEMPLATE.version,
        fields: {},
        bindings: session.assetOrder[0] ? [{ slotId: "hero", assetId: session.assetOrder[0], crop: { x: 0, y: 0, width: 1, height: 1 } }] : [],
        outputId: "portrait-2x3",
      },
      revision: session.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    await saveSession(updated);
    router.push(`/demo/sushi/edit?session=${updated.id}`);
  };

  if (!session) return null;

  return (
    <div className="min-h-dvh" style={{ background: SUSHI_BG }}>
      <div className="mx-auto max-w-[480px] px-5 pb-28">
        <SushiTopBar onBack />
        <SushiStepIndicator current={1} />

        <h1 className="mt-4 text-[26px] font-extrabold" style={{ color: SUSHI_INK }}>
          选一个你喜欢的风格 🍣
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: SUSHI_MUTED }}>
          同一组照片,可以做出不同风格的社交媒体内容。
        </p>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c, i) => (
            <span
              key={c}
              className="shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium"
              style={i === 0 ? { background: SUSHI_PRIMARY, color: "#fff" } : { background: "#fbe1c6", color: SUSHI_MUTED }}
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="relative overflow-hidden rounded-2xl border-2 bg-white" style={{ borderColor: SUSHI_PRIMARY }}>
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-200">
              {heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-6 text-white">
                <p className="text-[13px] font-semibold">Fresh Sushi</p>
              </div>
              <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ background: SUSHI_PRIMARY }}>
                ✓
              </span>
            </div>
            <div className="p-2 text-[11px]" style={{ color: SUSHI_MUTED }}>
              01 经典招牌 · 作品展示
            </div>
          </div>

          {COMING_SOON.map((c, i) => (
            <div key={`${c.label}-${i}`} className="relative overflow-hidden rounded-2xl bg-white opacity-60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.photo} alt="" className="aspect-[3/4] w-full object-cover" style={{ objectPosition: c.position }} />
              <div className="p-2 text-[11px]" style={{ color: SUSHI_MUTED }}>
                {String(i + 2).padStart(2, "0")} {c.label} · 即将上线
              </div>
            </div>
          ))}
        </div>

        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px] bg-gradient-to-t from-[#f3ddc4] px-5 pb-6 pt-8">
          <SushiPrimaryButton onClick={confirm}>使用这个模板 →</SushiPrimaryButton>
        </div>
      </div>
    </div>
  );
}
