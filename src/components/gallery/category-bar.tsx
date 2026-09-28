import Link from "next/link";
import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PLATFORMS, platformLabel } from "@/lib/platforms";
import { cn } from "@/lib/utils";

function hrefFor(platform?: string, q?: string) {
  const sp = new URLSearchParams();
  if (platform) sp.set("platform", platform);
  if (q) sp.set("q", q);
  const s = sp.toString();
  return `/templates${s ? `?${s}` : ""}#gallery`;
}

export async function CategoryBar({ platform, q, counts, total }: { platform?: string; q?: string; counts: Record<string, number>; total: number }) {
  const [t, tp] = await Promise.all([getTranslations("gallery"), getTranslations("platforms")]);
  const chips = [{ id: undefined as string | undefined, label: t("all"), count: total }, ...PLATFORMS.map((p) => ({ id: p.id as string, label: platformLabel(tp, p.id), count: counts[p.id] ?? 0 }))];
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
      <div className="-mx-4 flex min-w-0 flex-1 gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0">
        {chips.map((c) => (
          <Link
            key={c.label}
            href={hrefFor(c.id, q)}
            scroll={false}
            className={cn(
              "shrink-0 rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-sm text-foreground/85 transition-colors hover:bg-white/[0.07]",
              platform === c.id && "border-white/25 bg-white/[0.12] text-foreground",
            )}
          >
            {c.label}
            <span className="ml-1.5 text-xs text-muted-foreground">{c.count}</span>
          </Link>
        ))}
      </div>
      <form action="/templates" className="relative shrink-0 md:w-56">
        {platform && <input type="hidden" name="platform" value={platform} />}
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input name="q" defaultValue={q} placeholder={t("searchPlaceholder")} className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.02] pl-9 pr-3 text-sm outline-none focus:border-white/25" />
      </form>
    </div>
  );
}
