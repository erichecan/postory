"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { DemoSession } from "@/lib/demo/contracts";
import { getBlob, loadSession } from "@/lib/demo/session";
import { SUSHI_CLASSIC_TEMPLATE } from "@/lib/demo/templates/descriptors";
import { TEMPLATE_COMPONENTS } from "@/lib/demo/templates/component-registry";
import { SUSHI_BG, SUSHI_INK, SUSHI_MUTED, SushiPrimaryButton, SushiTopBar } from "./chrome";

const PLATFORMS = [
  { label: "Instagram", status: "支持自动发布" },
  { label: "Facebook", status: "支持自动发布" },
  { label: "TikTok", status: "计划支持" },
  { label: "小红书", status: "内容制作支持" },
] as const;

export function SushiSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const filename = searchParams.get("file");
  const [session, setSession] = useState<DemoSession | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const s = await loadSession("sushi", sessionId);
      if (!s) return;
      setSession(s);
      const assetId = s.draft?.bindings[0]?.assetId;
      if (assetId) {
        const blob = await getBlob(assetId);
        if (blob) setPhotoUrl(URL.createObjectURL(blob));
      }
    })();
  }, [sessionId]);

  const TemplateComponent = TEMPLATE_COMPONENTS[SUSHI_CLASSIC_TEMPLATE.id];
  const fields = session?.draft?.fields ?? {};

  return (
    <div className="min-h-dvh" style={{ background: SUSHI_BG }}>
      <div className="mx-auto max-w-[480px] px-5 pb-10">
        <SushiTopBar />

        <div className="mt-6 text-center">
          <p className="text-[32px]">🎉</p>
          <h1 className="mt-2 text-[26px] font-extrabold leading-snug" style={{ color: SUSHI_INK }}>
            你的寿司营销图片
            <br />
            已经生成好了!
          </h1>
          <p className="mt-2 text-[14px]" style={{ color: SUSHI_MUTED }}>
            图片已生成,点击下方按钮下载保存,
            <br />
            保存后就可以发布到你喜欢的平台啦!
          </p>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl shadow-lg" style={{ containerType: "inline-size" }}>
          {TemplateComponent ? <TemplateComponent photoUrl={photoUrl} fields={fields} /> : null}
        </div>

        <div className="mt-4 space-y-1.5 rounded-2xl bg-white/70 p-4 text-[13px]" style={{ color: SUSHI_INK }}>
          <p>✓ 已成功生成高清图片{filename ? `(${filename})` : ""}</p>
          <p>✓ 图片已生成,点击下载保存到本地</p>
          <p>✓ 下载后可手动发布到 Instagram、小红书等平台</p>
          <p>✓ 图片带有 PoStory 水印,仅供个人使用</p>
        </div>

        <div className="mt-6 rounded-2xl p-4" style={{ background: "#2a1f16" }}>
          <p className="text-[15px] font-semibold text-white">不想每次都自己发布?</p>
          <p className="mt-1 text-[13px] text-white/70">让 PoStory 帮你搞定内容制作、排期与多平台发布。</p>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {PLATFORMS.map((p) => (
              <div key={p.label} className="rounded-xl bg-white/10 p-2">
                <p className="text-[11px] font-semibold text-white">{p.label}</p>
                <p className="mt-1 text-[10px] text-white/60">{p.status}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <SushiPrimaryButton href="/demo/sushi">👑 了解 PoStory 代运营服务 →</SushiPrimaryButton>
          <button
            type="button"
            onClick={() => router.push("/demo/sushi/upload")}
            className="rounded-full border py-3 text-[14px] font-semibold"
            style={{ borderColor: "#e8b98c", color: SUSHI_MUTED }}
          >
            继续制作下一篇 →
          </button>
        </div>
      </div>
    </div>
  );
}
