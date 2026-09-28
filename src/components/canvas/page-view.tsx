"use client";

import { forwardRef } from "react";
import type { DesignPage } from "@/types/design";
import { ElementView } from "./element-view";

export const PageView = forwardRef<HTMLDivElement, { page: DesignPage }>(function PageView({ page }, ref) {
  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: page.width,
        height: page.height,
        background: page.background,
        overflow: "hidden",
      }}
    >
      {page.elements
        .filter((el) => !el.hidden)
        .map((el) => (
          <ElementView key={el.id} el={el} />
        ))}
    </div>
  );
});

export function ScaledPage({ page, width }: { page: DesignPage; width: number }) {
  const scale = width / page.width;
  return (
    <div style={{ width, height: page.height * scale, overflow: "hidden" }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <PageView page={page} />
      </div>
    </div>
  );
}
