"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { DemoSession, FieldValue } from "@/lib/demo/contracts";
import { getBlob, loadSession } from "@/lib/demo/session";
import { SUSHI_CLASSIC_TEMPLATE } from "@/lib/demo/templates/descriptors";
import { TEMPLATE_COMPONENTS } from "@/lib/demo/templates/component-registry";
import { SUSHI_BG, SUSHI_INK, SUSHI_MUTED, SUSHI_PRIMARY, SushiPrimaryButton, SushiStepIndicator, SushiTopBar } from "./chrome";

const DATE_OPTIONS = ["今天", "明天", "后天", "自定义日期"] as const;
const TIME_OPTIONS = ["11:00 AM", "12:00 PM", "5:00 PM", "7:00 PM", "9:00 PM"] as const;
const PLATFORM_OPTIONS = [
  { key: "instagram", label: "Instagram", icon: "📷" },
  { key: "facebook", label: "Facebook", icon: "👍" },
  { key: "tiktok", label: "TikTok", icon: "🎵" },
  { key: "xhs", label: "小红书", icon: "📕" },
] as const;

export function SushiSchedule() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const filename = searchParams.get("file");
  const [session, setSession] = useState<DemoSession | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [date, setDate] = useState<string>(DATE_OPTIONS[0]);
  const [time, setTime] = useState<string>(TIME_OPTIONS[0]);
  const [platforms, setPlatforms] = useState<string[]>(["instagram", "facebook"]);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const s = await loadSession("sushi", sessionId);
      if (!s) {
        router.replace("/demo/sushi/upload");
        return;
      }
      setSession(s);
      const assetId = s.draft?.bindings[0]?.assetId;
      if (assetId) {
        const blob = await getBlob(assetId);
        if (blob) setPhotoUrl(URL.createObjectURL(blob));
      }
    })();
  }, [sessionId, router]);

  const togglePlatform = (key: string) => {
    setPlatforms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const confirm = () => {
    setShowNotice(true);
  };

  const continueToSuccess = () => {
    router.push(`/demo/sushi/success?session=${session?.id ?? ""}${filename ? `&file=${encodeURIComponent(filename)}` : ""}`);
  };

  if (!session?.draft) return null;
  const fields: Record<string, FieldValue> = session.draft.fields;
  const TemplateComponent = TEMPLATE_COMPONENTS[SUSHI_CLASSIC_TEMPLATE.id];

  return (
    <div className="min-h-dvh" style={{ background: SUSHI_BG }}>
      <div className="mx-auto max-w-[480px] px-5 pb-10">
        <SushiTopBar onBack />
        <SushiStepIndicator current={4} />

        <h1 className="mt-4 text-[26px] font-extrabold" style={{ color: SUSHI_INK }}>
          选择发布时间 🗓️
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: SUSHI_MUTED }}>
          真实服务中,我们会在选定的时间自动发布到你选择的社交平台。
          <br />
          这个免费体验版本仅供预览这个流程,不会真的帮你发布。
        </p>

        <div className="mt-5 rounded-2xl bg-white/60 p-4">
          <p className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: SUSHI_INK }}>
            📅 选择日期
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {DATE_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDate(d)}
                className="rounded-xl py-2 text-[13px] font-semibold"
                style={d === date ? { background: SUSHI_PRIMARY, color: "#fff" } : { background: "#fdf2e3", color: SUSHI_MUTED }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-white/60 p-4">
          <p className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: SUSHI_INK }}>
            🕐 选择时间
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTime(t)}
                className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
                style={t === time ? { background: SUSHI_PRIMARY, color: "#fff" } : { background: "#fdf2e3", color: SUSHI_MUTED }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-white/60 p-4">
          <p className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: SUSHI_INK }}>
            🔗 选择发布平台
          </p>
          <p className="mt-0.5 text-[11px]" style={{ color: SUSHI_MUTED }}>
            可同时发布到多个平台
          </p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {PLATFORM_OPTIONS.map((p) => {
              const active = platforms.includes(p.key);
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => togglePlatform(p.key)}
                  className="flex flex-col items-center gap-1 rounded-xl py-2"
                  style={active ? { background: "#fdf2e3", outline: `2px solid ${SUSHI_PRIMARY}` } : { background: "#fdf2e3" }}
                >
                  <span className="text-[18px]">{p.icon}</span>
                  <span className="text-[10px] font-medium" style={{ color: SUSHI_INK }}>
                    {p.label}
                  </span>
                  <span className="text-[11px]">{active ? "✅" : "☐"}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-white/60 p-3">
          <p className="text-[13px] font-semibold" style={{ color: SUSHI_INK }}>
            👁️ 预览发布内容
          </p>
          <div className="mt-2 overflow-hidden rounded-xl" style={{ containerType: "inline-size" }}>
            {TemplateComponent ? <TemplateComponent photoUrl={photoUrl} fields={fields} /> : null}
          </div>
        </div>

        {showNotice ? (
          <div className="mt-4 rounded-xl px-3 py-3 text-[12px] leading-relaxed" style={{ background: "#fdeee0", color: SUSHI_INK }}>
            ℹ️ 这是免费体验版,不会真的安排发布——图片已经在上一步下载到你的设备,
            可以手动发布到你选择的平台。真实的自动定时发布由 PoStory 代运营服务提供。
            <div className="mt-2">
              <SushiPrimaryButton onClick={continueToSuccess}>知道了,继续 →</SushiPrimaryButton>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <SushiPrimaryButton onClick={confirm}>📤 确认并安排发布 →</SushiPrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}
