"use client";

import { useState } from "react";

export function BeforeAfter({ src, before, after }: { src: string; before: string; after: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative aspect-square w-full max-w-[520px] select-none overflow-hidden rounded-2xl border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={after} className="absolute inset-0 size-full object-cover [filter:saturate(1.15)_contrast(1.05)_brightness(1.05)]" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={before} className="absolute inset-0 size-full scale-[1.04] rotate-[-1.5deg] object-cover [filter:saturate(0.55)_brightness(0.72)_contrast(0.85)_sepia(0.15)_blur(0.6px)]" />
      </div>
      <span className="absolute top-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white">{before}</span>
      <span className="absolute top-3 right-3 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">{after}</span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-xs text-black shadow">↔</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`${before} / ${after}`}
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
