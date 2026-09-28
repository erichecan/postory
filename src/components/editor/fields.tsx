"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5 border-b px-4 py-4">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

const boxCls = "flex h-8 items-center gap-1.5 rounded-md border bg-input/30 px-2 text-xs focus-within:border-ring";

export function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  suffix,
  readOnly = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  suffix?: string;
  readOnly?: boolean;
}) {
  return (
    <label className={cn(boxCls, readOnly && "opacity-60")}>
      <span className="w-4 shrink-0 text-muted-foreground">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
        step={step}
        min={min}
        readOnly={readOnly}
        onChange={(e) => {
          const v = e.target.valueAsNumber;
          if (Number.isFinite(v)) onChange(min === undefined ? v : Math.max(min, v));
        }}
        className="w-full min-w-0 bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </label>
  );
}

function toHex(color: string | undefined) {
  if (!color) return "#000000";
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  if (/^#[0-9a-f]{3}$/i.test(color)) return `#${[...color.slice(1)].map((c) => c + c).join("")}`;
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (m) return `#${m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
  return "#000000";
}

export function ColorField({ label, value, onChange }: { label: string; value: string | undefined; onChange: (v: string) => void }) {
  const isGradient = value?.includes("gradient");
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className={cn(boxCls, "w-36")}>
        <input
          type="color"
          value={toHex(value)}
          onChange={(e) => onChange(e.target.value)}
          className="size-5 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
        />
        <input
          value={isGradient ? "渐变" : toHex(value).slice(1).toUpperCase()}
          readOnly={isGradient}
          onChange={(e) => /^[0-9a-f]{6}$/i.test(e.target.value) && onChange(`#${e.target.value}`)}
          className="w-full min-w-0 bg-transparent uppercase outline-none"
        />
      </div>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T | undefined; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-md border bg-input/30 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn("grid h-7 flex-1 place-items-center rounded text-xs text-muted-foreground", value === o.value && "bg-accent text-foreground")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
