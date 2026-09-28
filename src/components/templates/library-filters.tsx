import Link from "next/link";
import { Search } from "lucide-react";
import { PLATFORMS } from "@/lib/platforms";
import { cn } from "@/lib/utils";

function hrefFor(platform?: string, q?: string) {
  const sp = new URLSearchParams();
  if (platform) sp.set("platform", platform);
  if (q) sp.set("q", q);
  const s = sp.toString();
  return s ? `/templates?${s}` : "/templates";
}

export function LibraryFilters({ platform, q, counts, total }: { platform?: string; q?: string; counts: Record<string, number>; total: number }) {
  const chips = [{ id: undefined, label: "全部", count: total }, ...PLATFORMS.map((p) => ({ id: p.id as string, label: p.label, count: counts[p.id] ?? 0 }))];
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <Link
            key={c.label}
            href={hrefFor(c.id, q)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
              platform === c.id && "border-primary bg-primary/15 text-foreground",
            )}
          >
            {c.label}
            <span className="ml-1.5 text-xs opacity-60">{c.count}</span>
          </Link>
        ))}
      </div>
      <form action="/templates" className="relative w-full lg:w-72">
        {platform && <input type="hidden" name="platform" value={platform} />}
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          defaultValue={q}
          placeholder="搜索模板，例如 sale、coffee"
          className="h-9 w-full rounded-lg border bg-input/30 pl-9 pr-3 text-sm outline-none focus:border-ring"
        />
      </form>
    </div>
  );
}
