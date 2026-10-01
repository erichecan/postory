import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { AiDraftTemplate } from "@/lib/db/admin-templates";
import { ToggleTemplateStatusButton } from "./toggle-template-status-button";

export async function AiDraftTable({ items }: { items: AiDraftTemplate[] }) {
  const t = await getTranslations("admin.aiDrafts");
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{t("empty")}</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-3 rounded-xl border p-3">
          <Link href={`/templates/${item.id}`} target="_blank" className="block aspect-square overflow-hidden rounded-lg bg-muted">
            {item.thumbnails[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.thumbnails[0]} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">{t("noThumbnail")}</div>
            )}
          </Link>
          <div className="flex flex-col gap-1">
            <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {item.categories.map((c) => (
                <span key={c} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{c}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className={item.status === "draft" ? "text-xs text-amber-400" : "text-xs text-emerald-400"}>
              {t(item.status === "draft" ? "status.draft" : "status.published")}
            </span>
            <div className="flex items-center gap-2">
              <Link href={`/templates/${item.id}`} target="_blank" className="rounded-md border px-2.5 py-1 text-xs hover:bg-accent">{t("preview")}</Link>
              <ToggleTemplateStatusButton id={item.id} status={item.status} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
