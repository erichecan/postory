"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const SUSHI_BG = "linear-gradient(160deg, #f8ead9 0%, #f3ddc4 55%, #efd2b2 100%)";
export const SUSHI_PRIMARY = "#d9531e";
export const SUSHI_PRIMARY_DARK = "#b84316";
export const SUSHI_INK = "#2a1f16";
export const SUSHI_MUTED = "#8a7360";

export function SushiLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const width = size === "sm" ? 108 : 150;
  return (
    <span className="flex items-baseline gap-2">
      <Image src="/brand/postory-wordmark-v2.png" alt="PoStory" width={959} height={258} unoptimized className="block h-auto shrink-0" style={{ width }} />
      <span className="text-[15px] italic" style={{ color: SUSHI_PRIMARY, fontFamily: "Georgia, 'Noto Serif SC', serif" }}>
        for Sushi
      </span>
    </span>
  );
}

export function SushiTopBar({ onBack, showMenu = true }: { onBack?: boolean; showMenu?: boolean }) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-2">
      {onBack ? (
        <button type="button" onClick={() => router.back()} aria-label="返回" className="text-[22px]" style={{ color: SUSHI_INK }}>
          ‹
        </button>
      ) : (
        <span className="w-6" />
      )}
      <SushiLogo size="sm" />
      {showMenu ? (
        <button type="button" aria-label="更多" className="text-[20px] tracking-widest" style={{ color: SUSHI_INK }}>
          ☰
        </button>
      ) : (
        <span className="w-6" />
      )}
    </div>
  );
}

const STEPS = [
  { key: "upload", label: "上传照片" },
  { key: "templates", label: "选择模板" },
  { key: "edit", label: "编辑内容" },
  { key: "preview", label: "导出图片" },
  { key: "schedule", label: "发布排程" },
] as const;

export function SushiStepIndicator({ current }: { current: 0 | 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-start px-5 py-3">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1" style={{ minWidth: 50 }}>
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold"
              style={
                i <= current
                  ? { background: SUSHI_PRIMARY, color: "#fff" }
                  : { background: "#f1ddc8", color: "#b89c82" }
              }
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span className="text-[10px] font-medium" style={{ color: i <= current ? SUSHI_PRIMARY : "#b89c82" }}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 ? (
            <div className="mt-[-14px] h-[2px] flex-1" style={{ background: i < current ? SUSHI_PRIMARY : "#f1ddc8" }} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function SushiPrimaryButton({
  children,
  onClick,
  href,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const className = "flex w-full items-center justify-center gap-2 rounded-full py-4 text-[16px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(217,83,30,0.5)] transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";
  const style = { background: disabled ? "#eab188" : `linear-gradient(135deg, ${SUSHI_PRIMARY}, ${SUSHI_PRIMARY_DARK})` };
  if (href && !disabled) {
    return (
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className} style={style}>
      {children}
    </button>
  );
}
