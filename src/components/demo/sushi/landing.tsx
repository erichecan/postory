"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { createEmptySession, saveSession } from "@/lib/demo/session";
import { SUSHI_CONFIG } from "@/lib/demo/industries/sushi";
import { SUSHI_BG, SUSHI_INK, SUSHI_MUTED, SUSHI_PRIMARY, SushiLogo, SushiPrimaryButton } from "./chrome";

const FEATURES = [
  { icon: "🪄", title: "选择精美模板", body: "多种风格\n适合不同场景" },
  { icon: "🖼️", title: "添加照片与信息", body: "简单编辑\n立刻预览效果" },
  { icon: "⬇️", title: "导出精美图片", body: "带 PoStory 水印\n免费体验" },
  { icon: "🍣", title: "了解代运营服务", body: "连接社交平台\n我们帮你发布" },
] as const;

const PLATFORMS = [
  { name: "Instagram", note: "自动发布" },
  { name: "Facebook", note: "自动发布" },
  { name: "TikTok", note: "即将支持" },
  { name: "小红书", note: "内容制作支持" },
] as const;

export function SushiLanding() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const start = useCallback(async () => {
    setStarting(true);
    const session = createEmptySession("sushi", SUSHI_CONFIG.configVersion, "zh");
    await saveSession(session);
    router.push(`/demo/sushi/upload?session=${session.id}`);
  }, [router]);

  return (
    <div className="min-h-dvh" style={{ background: SUSHI_BG }}>
      <div className="mx-auto flex max-w-[480px] flex-col px-5 pt-6 pb-10">
        <div className="flex items-center justify-between">
          <SushiLogo />
          <button type="button" aria-label="菜单" className="text-[20px]" style={{ color: SUSHI_INK }}>
            ☰
          </button>
        </div>

        <h1 className="mt-6 text-center text-[34px] font-extrabold leading-[1.25]" style={{ color: SUSHI_INK }}>
          让好寿司,
          <br />
          吸引更多顾客
        </h1>
        <p className="mt-4 text-center text-[16px] leading-relaxed" style={{ color: SUSHI_MUTED }}>
          把你的招牌菜、午餐套餐和新品,
          <br />
          变成精美的社交媒体内容,让更多人发现你的餐馆。
        </p>

        <div className="mt-7 flex gap-3 overflow-x-auto pb-2">
          <MockCard platform="小红书" accent="#ff2442">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demo/photos/sushi-1.jpg" alt="" className="h-28 w-full rounded-t-2xl object-cover" />
            <div className="px-3 pt-2 text-[13px] font-semibold text-neutral-800">秋日限定三文鱼寿司</div>
            <div className="px-3 pb-2 text-[11px] text-neutral-500">236♥ 48★ 32💬</div>
          </MockCard>
          <MockCard platform="Instagram" accent="#d9531e">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demo/photos/sushi-1.jpg" alt="" className="h-28 w-full rounded-t-2xl object-cover" style={{ objectPosition: "60% 40%" }} />
            <div className="px-3 pt-2 text-[13px] font-semibold italic text-neutral-800">Lunch Special $16.99</div>
            <div className="px-3 pb-2 text-[11px] text-neutral-500">542♥ 28💬</div>
          </MockCard>
          <MockCard platform="Facebook" accent="#1877f2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demo/photos/sushi-1.jpg" alt="" className="h-28 w-full rounded-t-2xl object-cover" style={{ objectPosition: "30% 60%" }} />
            <div className="px-3 pt-2 text-[13px] font-semibold text-neutral-800">Party Platters</div>
            <div className="px-3 pb-2 text-[11px] text-neutral-500">128👍 12💬 8↗</div>
          </MockCard>
        </div>

        <div className="mt-6">
          <SushiPrimaryButton onClick={start} disabled={starting}>
            🖼️ 上传我的寿司照片 →
          </SushiPrimaryButton>
          <p className="mt-3 text-center text-[13px]" style={{ color: SUSHI_MUTED }}>
            无需注册 · 3 分钟生成 · 免费体验
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full text-[22px]" style={{ background: "#fbe1c6" }}>
                {f.icon}
              </div>
              <div className="mt-2 text-[14px] font-semibold" style={{ color: SUSHI_INK }}>
                {f.title}
              </div>
              <div className="whitespace-pre-line text-[12px] leading-snug" style={{ color: SUSHI_MUTED }}>
                {f.body}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-9 rounded-3xl bg-white/70 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold" style={{ color: SUSHI_INK }}>
              支持多平台发布
            </span>
            <span className="text-[12px] font-medium" style={{ color: SUSHI_PRIMARY }}>
              了解我们的代运营服务 →
            </span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {PLATFORMS.map((p) => (
              <div key={p.name} className="flex flex-col items-center gap-1">
                <span className="text-[13px] font-semibold" style={{ color: SUSHI_INK }}>
                  {p.name}
                </span>
                <span className="text-[10px]" style={{ color: SUSHI_MUTED }}>
                  {p.note}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-3xl bg-white/50 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/demo/photos/sushi-1.jpg" alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
          <div>
            <div className="text-[13px] font-semibold" style={{ color: SUSHI_PRIMARY }}>
              不想每次都自己发布?让 PoStory 帮你搞定。
            </div>
            <div className="mt-1 text-[11px] leading-snug" style={{ color: SUSHI_MUTED }}>
              你只需要上传照片,我们负责内容制作、安排发布时间,并发布到已连接的社交平台。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockCard({ platform, accent, children }: { platform: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="w-[150px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center gap-1 px-3 pt-2 text-[11px] font-semibold" style={{ color: accent }}>
        {platform}
      </div>
      {children}
    </div>
  );
}
