"use client";

import Link from "next/link";
import type { Dispatch } from "react";
import { CornerDownLeft, Plus } from "lucide-react";
import type { DesignElement, DesignPage } from "@/types/design";
import { newId, topZ, type EditorAction } from "./editor-state";

export type BrandFields = {
  shopName: string | null;
  wechat: string | null;
  phone: string | null;
  address: string | null;
  slogan: string | null;
  activity: string | null;
  logoUrl: string | null;
};

const TEXT_FIELDS: { key: Exclude<keyof BrandFields, "logoUrl">; label: string; format: (v: string) => string }[] = [
  { key: "shopName", label: "店名", format: (v) => v },
  { key: "slogan", label: "口号", format: (v) => v },
  { key: "activity", label: "活动内容", format: (v) => v },
  { key: "wechat", label: "微信号", format: (v) => `微信：${v}` },
  { key: "phone", label: "电话", format: (v) => `电话：${v}` },
  { key: "address", label: "地址", format: (v) => v },
];

function newText(page: DesignPage, content: string): DesignElement {
  const w = Math.round(page.width * 0.7);
  const h = Math.round(page.height * 0.08);
  return {
    id: newId("text"),
    type: "text",
    x: Math.round((page.width - w) / 2),
    y: Math.round((page.height - h) / 2),
    w,
    h,
    z: topZ(page),
    rotation: 0,
    content,
    style: {
      color: "#ffffff",
      fontSize: `${Math.round(h * 0.6)}px`,
      minFontSize: "10",
      fontFamily: "Noto Sans SC",
      fontWeight: "700",
      textAlign: "center",
      verticalAlign: "center",
      textMode: "fit",
      lineHeight: 1.2,
      backgroundColor: "rgba(0,0,0,0.45)",
      borderRadius: "12px",
    },
  };
}

function newLogo(page: DesignPage, src: string): DesignElement {
  const size = Math.round(Math.min(page.width, page.height) * 0.18);
  return {
    id: newId("logo"),
    type: "image",
    name: "店铺 Logo",
    x: Math.round(page.width * 0.05),
    y: Math.round(page.height * 0.05),
    w: size,
    h: size,
    z: topZ(page),
    rotation: 0,
    content: src,
    style: { objectFit: "contain" },
  };
}

export function BrandPanel({
  brand,
  page,
  selected,
  dispatch,
}: {
  brand: BrandFields | null;
  page: DesignPage;
  selected: DesignElement | null;
  dispatch: Dispatch<EditorAction>;
}) {
  const filled = TEXT_FIELDS.filter((f) => brand?.[f.key]);
  const targetText = selected?.type === "text" ? selected : null;

  function apply(text: string) {
    if (targetText) dispatch({ type: "updateElement", id: targetText.id, patch: { content: text } });
    else dispatch({ type: "add", element: newText(page, text) });
  }

  if (!brand || filled.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4 text-sm text-muted-foreground">
        <p>还没有填写商家资料。填好后，这里可以一键把店名、微信、活动放进模板。</p>
        <Link href="/profile" className="text-primary hover:underline">去填写商家资料 →</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <p className="rounded-md bg-primary/10 px-3 py-2 text-xs leading-relaxed text-primary">
        {targetText ? "已选中一段文字，点击下面的资料会替换它。" : "先在画布上选中一段文字再点，会直接替换；不选则新增一段文字。"}
      </p>
      {filled.map((f) => {
        const text = f.format(brand[f.key] as string);
        return (
          <button key={f.key} onClick={() => apply(text)} className="group flex flex-col gap-1 rounded-lg border p-3 text-left hover:border-primary/60 hover:bg-accent">
            <span className="flex items-center justify-between text-[11px] text-muted-foreground">
              {f.label}
              {targetText ? <CornerDownLeft className="size-3.5 opacity-0 group-hover:opacity-100" /> : <Plus className="size-3.5 opacity-0 group-hover:opacity-100" />}
            </span>
            <span className="line-clamp-3 text-sm">{text}</span>
          </button>
        );
      })}
      {brand.logoUrl && (
        <button
          onClick={() =>
            selected?.type === "image" && !selected.locked
              ? dispatch({ type: "updateElement", id: selected.id, patch: { content: brand.logoUrl ?? undefined } })
              : dispatch({ type: "add", element: newLogo(page, brand.logoUrl as string) })
          }
          className="flex items-center gap-3 rounded-lg border p-3 text-left hover:border-primary/60 hover:bg-accent"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoUrl} alt="" className="size-10 rounded object-contain" />
          <span className="text-sm">{selected?.type === "image" && !selected.locked ? "用 Logo 替换选中图片" : "放入店铺 Logo"}</span>
        </button>
      )}
      <Link href="/profile" className="px-1 text-xs text-muted-foreground hover:text-foreground">修改商家资料 →</Link>
    </div>
  );
}
