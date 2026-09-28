"use client";

import { useEffect, useRef, useState } from "react";
import type { DesignPage } from "@/types/design";
import { PageView } from "./page-view";

export function FitPreview({ page, padding = 12 }: { page: DesignPage; padding?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min((width - padding * 2) / page.width, (height - padding * 2) / page.height));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [page.width, page.height, padding]);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {scale > 0 && (
        <div style={{ width: page.width * scale, height: page.height * scale, overflow: "hidden" }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <PageView page={page} />
          </div>
        </div>
      )}
    </div>
  );
}
