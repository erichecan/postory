"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export const NAILS_BG = "linear-gradient(160deg, #fdf1f5 0%, #fce3ea 55%, #fad8e3 100%)";
export const NAILS_PRIMARY = "#ec4c82";
export const NAILS_PRIMARY_DARK = "#d93d72";
export const NAILS_INK = "#2a1b22";
export const NAILS_MUTED = "#9c7b85";

export function NailsLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const title = size === "sm" ? "text-[22px]" : "text-[26px]";
  return (
    <span className="flex items-baseline gap-2">
      <span
        className={`${title} font-extrabold tracking-tight`}
        style={{ backgroundImage: "linear-gradient(95deg,#f4883a 0%,#ef5fa0 70%)", WebkitBackgroundClip: "text", color: "transparent" }}
      >
        PoStory
      </span>
      <span className="text-[15px] italic" style={{ color: NAILS_PRIMARY, fontFamily: "Georgia, 'Noto Serif SC', serif" }}>
        for Nails
      </span>
    </span>
  );
}

export function NailsTopBar({ onBack, showMenu = true }: { onBack?: boolean; showMenu?: boolean }) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-2">
      {onBack ? (
        <button type="button" onClick={() => router.back()} aria-label="返回" className="text-[22px]" style={{ color: NAILS_INK }}>
          ‹
        </button>
      ) : (
        <span className="w-6" />
      )}
      <NailsLogo size="sm" />
      {showMenu ? (
        <button type="button" aria-label="更多" className="text-[20px] tracking-widest" style={{ color: NAILS_INK }}>
          •••
        </button>
      ) : (
        <span className="w-6" />
      )}
    </div>
  );
}

const STEPS = [
  { key: "upload", label: "上传作品" },
  { key: "templates", label: "选择模板" },
  { key: "edit", label: "编辑内容" },
  { key: "preview", label: "导出成品" },
] as const;

export function NailsStepIndicator({ current }: { current: 0 | 1 | 2 | 3 }) {
  return (
    <div className="flex items-start px-5 py-3">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1" style={{ minWidth: 56 }}>
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold"
              style={
                i < current
                  ? { background: NAILS_PRIMARY, color: "#fff" }
                  : i === current
                    ? { background: NAILS_PRIMARY, color: "#fff" }
                    : { background: "#f4d9e1", color: "#c48ca0" }
              }
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span className="text-[11px] font-medium" style={{ color: i <= current ? NAILS_PRIMARY : "#c48ca0" }}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 ? (
            <div className="mt-[-14px] h-[2px] flex-1" style={{ background: i < current ? NAILS_PRIMARY : "#f4d9e1" }} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function NailsPrimaryButton({
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
  const className = "flex w-full items-center justify-center gap-2 rounded-full py-4 text-[16px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(236,76,130,0.55)] transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";
  const style = { background: disabled ? "#f0aec6" : `linear-gradient(135deg, ${NAILS_PRIMARY}, ${NAILS_PRIMARY_DARK})` };
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
