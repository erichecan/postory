"use client";

import Link from "next/link";
import type { Dispatch } from "react";
import { CornerDownLeft, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
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

const TEXT_FIELDS: { key: Exclude<keyof BrandFields, "logoUrl">; prefix?: "wechatValue" | "phoneValue" }[] = [
  { key: "shopName" },
  { key: "slogan" },
  { key: "activity" },
  { key: "wechat", prefix: "wechatValue" },
  { key: "phone", prefix: "phoneValue" },
  { key: "address" },
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

function newLogo(page: DesignPage, src: string, name: string): DesignElement {
  const size = Math.round(Math.min(page.width, page.height) * 0.18);
  return {
    id: newId("logo"),
    type: "image",
    name,
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
  const t = useTranslations("editor.brand");
  const filled = TEXT_FIELDS.filter((f) => brand?.[f.key]);
  const targetText = selected?.type === "text" ? selected : null;

  function apply(text: string) {
    if (targetText) dispatch({ type: "updateElement", id: targetText.id, patch: { content: text } });
    else dispatch({ type: "add", element: newText(page, text) });
  }

  if (!brand || filled.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4 text-sm text-muted-foreground">
        <p>{t("empty")}</p>
        <Link href="/profile" className="text-primary hover:underline">{t("fillProfile")}</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <p className="rounded-md bg-primary/10 px-3 py-2 text-xs leading-relaxed text-primary">
        {targetText ? t("hintSelected") : t("hintNone")}
      </p>
      {filled.map((f) => {
        const value = brand[f.key] as string;
        const text = f.prefix ? t(f.prefix, { value }) : value;
        return (
          <button key={f.key} onClick={() => apply(text)} className="group flex flex-col gap-1 rounded-lg border p-3 text-left hover:border-primary/60 hover:bg-accent">
            <span className="flex items-center justify-between text-[11px] text-muted-foreground">
              {t(`fields.${f.key}`)}
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
              : dispatch({ type: "add", element: newLogo(page, brand.logoUrl as string, t("logoName")) })
          }
          className="flex items-center gap-3 rounded-lg border p-3 text-left hover:border-primary/60 hover:bg-accent"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoUrl} alt="" className="size-10 rounded object-contain" />
          <span className="text-sm">{selected?.type === "image" && !selected.locked ? t("replaceWithLogo") : t("insertLogo")}</span>
        </button>
      )}
      <Link href="/profile" className="px-1 text-xs text-muted-foreground hover:text-foreground">{t("editProfile")}</Link>
    </div>
  );
}
